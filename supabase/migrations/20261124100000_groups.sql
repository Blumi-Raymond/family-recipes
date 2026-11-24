-- =====================================================================
-- Family Recipes — groups instead of "approved family members"
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste → Run
-- (run once, after the two earlier migration files)
--
-- What changes:
--   * New tables: groups, group_members.
--   * Every user gets a PERSONAL group automatically ("My kitchen").
--     Today each user sees only her own recipes. Sharing later =
--     adding members to a group — no further schema change needed.
--   * cookbooks, source_pages, recipes get group_id (who owns the data).
--     Ingredients, steps, photos, tags-links follow their recipe.
--   * No more manual approval: profiles.is_approved and
--     is_family_member() are removed.
--   * login_methods(email): lets the login screen say "this email is
--     not registered" / "this account uses Google".
--   * Image files: stored under "<group_id>/..." in the bucket.
-- =====================================================================


-- =====================================================================
-- 1. Tables
-- =====================================================================

create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  is_personal  boolean not null default false,   -- the user's private group
  created_by   uuid references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- One personal group per user
create unique index groups_one_personal_per_user
  on public.groups (created_by) where is_personal;

create type public.group_role as enum ('owner', 'member');

create table public.group_members (
  group_id    uuid not null references public.groups (id)   on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.group_role not null default 'member',
  created_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);


-- =====================================================================
-- 2. Helper functions
-- SECURITY DEFINER so they can read group_members without tripping RLS.
-- =====================================================================

-- Is the logged-in user a member of this group?
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- The logged-in user's personal group (used as a column default)
create or replace function public.personal_group_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.groups
  where created_by = auth.uid() and is_personal
  limit 1;
$$;

-- Do the logged-in user and this user share at least one group?
create or replace function public.shares_group_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = p_user_id
  );
$$;

-- Storage: is this file path inside one of my groups' folders?
-- Path convention: "<group_id>/pages/...", "<group_id>/dishes/..." etc.
create or replace function public.can_access_image(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text := split_part(p_path, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_group_member(folder::uuid);
end;
$$;

-- Login screen helper: which ways can this email log in?
--   null            -> not registered
--   {email}         -> password
--   {google}        -> Google only
--   {email,google}  -> both
-- Callable without logging in (that's the point). It reveals only
-- whether an email is registered — acceptable for this app.
create or replace function public.login_methods(p_email text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select array(
    select distinct i.provider
    from auth.identities i
    where i.user_id = u.id
    order by i.provider
  )
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.login_methods(text) from public;
grant execute on function public.login_methods(text) to anon, authenticated;


-- =====================================================================
-- 3. New users: profile + personal group + membership
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_group_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',   -- Google / our sign-up form
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );

  insert into public.groups (name, is_personal, created_by)
  values ('המטבח שלי', true, new.id)
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'owner');

  return new;
end;
$$;
-- (the trigger on_auth_user_created already exists and now uses this version)

-- Users who signed up before this migration: give them a personal group too
insert into public.groups (name, is_personal, created_by)
select 'המטבח שלי', true, p.id
from public.profiles p
where not exists (
  select 1 from public.groups g where g.created_by = p.id and g.is_personal
);

insert into public.group_members (group_id, user_id, role)
select g.id, g.created_by, 'owner'
from public.groups g
where g.is_personal
on conflict do nothing;


-- =====================================================================
-- 4. group_id on the data tables
-- Existing rows (if any) go to their creator's personal group.
-- =====================================================================

alter table public.cookbooks    add column group_id uuid references public.groups (id) on delete cascade;
alter table public.source_pages add column group_id uuid references public.groups (id) on delete cascade;
alter table public.recipes      add column group_id uuid references public.groups (id) on delete cascade;

update public.cookbooks c set group_id = g.id
  from public.groups g where g.is_personal and g.created_by = c.created_by and c.group_id is null;
update public.source_pages s set group_id = g.id
  from public.groups g where g.is_personal and g.created_by = s.uploaded_by and s.group_id is null;
update public.recipes r set group_id = g.id
  from public.groups g where g.is_personal and g.created_by = r.created_by and r.group_id is null;

-- Rows with no known creator can't be assigned to anyone: remove them
delete from public.cookbooks    where group_id is null;
delete from public.source_pages where group_id is null;
delete from public.recipes      where group_id is null;

alter table public.cookbooks    alter column group_id set not null, alter column group_id set default public.personal_group_id();
alter table public.source_pages alter column group_id set not null, alter column group_id set default public.personal_group_id();
alter table public.recipes      alter column group_id set not null, alter column group_id set default public.personal_group_id();

create index cookbooks_group_idx    on public.cookbooks (group_id);
create index source_pages_group_idx on public.source_pages (group_id);
create index recipes_group_idx      on public.recipes (group_id);

-- A recipe / page may point only at a cookbook of the SAME group
create or replace function public.check_same_group_cookbook()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cookbook_id is not null and not exists (
    select 1 from public.cookbooks c
    where c.id = new.cookbook_id and c.group_id = new.group_id
  ) then
    raise exception 'cookbook belongs to a different group';
  end if;
  return new;
end;
$$;

create trigger recipes_same_group_cookbook
  before insert or update of cookbook_id, group_id on public.recipes
  for each row execute function public.check_same_group_cookbook();
create trigger source_pages_same_group_cookbook
  before insert or update of cookbook_id, group_id on public.source_pages
  for each row execute function public.check_same_group_cookbook();


-- =====================================================================
-- 5. Row Level Security — replace "approved member" with "group member"
-- =====================================================================

drop policy "profiles: read"   on public.profiles;
drop policy "recipes: read"    on public.recipes;
drop policy "recipes: insert"  on public.recipes;
drop policy "recipes: update"  on public.recipes;
drop policy "family: all"      on public.cookbooks;
drop policy "family: all"      on public.source_pages;
drop policy "family: all"      on public.recipe_source_pages;
drop policy "family: all"      on public.recipe_ingredients;
drop policy "family: all"      on public.recipe_steps;
drop policy "family: all"      on public.recipe_photos;
drop policy "family: all"      on public.tags;
drop policy "family: all"      on public.recipe_tags;

drop policy "recipe-images: read"   on storage.objects;
drop policy "recipe-images: upload" on storage.objects;
drop policy "recipe-images: update" on storage.objects;
drop policy "recipe-images: delete" on storage.objects;

alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

-- profiles: see yourself and people you share a group with
create policy "profiles: read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

-- groups / members: visible to members. Changes come later (invitations).
create policy "groups: read" on public.groups for select to authenticated
  using (public.is_group_member(id));
create policy "group_members: read" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));

-- Tables that carry group_id
create policy "group: all" on public.cookbooks for all to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
create policy "group: all" on public.source_pages for all to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- recipes: read / add / edit. NO hard delete from the app (trash = deleted_at).
create policy "recipes: read"   on public.recipes for select to authenticated
  using (public.is_group_member(group_id));
create policy "recipes: insert" on public.recipes for insert to authenticated
  with check (public.is_group_member(group_id));
create policy "recipes: update" on public.recipes for update to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- Child tables: allowed if you may access the parent recipe
create or replace function public.can_access_recipe(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id and public.is_group_member(r.group_id)
  );
$$;

create policy "recipe child: all" on public.recipe_ingredients for all to authenticated
  using (public.can_access_recipe(recipe_id)) with check (public.can_access_recipe(recipe_id));
create policy "recipe child: all" on public.recipe_steps for all to authenticated
  using (public.can_access_recipe(recipe_id)) with check (public.can_access_recipe(recipe_id));
create policy "recipe child: all" on public.recipe_photos for all to authenticated
  using (public.can_access_recipe(recipe_id)) with check (public.can_access_recipe(recipe_id));
create policy "recipe child: all" on public.recipe_tags for all to authenticated
  using (public.can_access_recipe(recipe_id)) with check (public.can_access_recipe(recipe_id));

-- recipe <-> page link: both sides must be in the same group as you
create policy "recipe pages: all" on public.recipe_source_pages for all to authenticated
  using (
    public.can_access_recipe(recipe_id)
    and exists (select 1 from public.source_pages p
                where p.id = page_id and public.is_group_member(p.group_id))
  )
  with check (
    exists (
      select 1 from public.recipes r
      join public.source_pages p on p.id = page_id
      where r.id = recipe_id
        and p.group_id = r.group_id
        and public.is_group_member(r.group_id)
    )
  );

-- tags: one shared list, readable by every logged-in user.
-- Edited only from the Supabase dashboard for now.
create policy "tags: read" on public.tags for select to authenticated
  using (true);

-- Images: only inside your groups' folders
create policy "recipe-images: read"   on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images' and public.can_access_image(name));
create policy "recipe-images: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and public.can_access_image(name));
create policy "recipe-images: update" on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and public.can_access_image(name));
create policy "recipe-images: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and public.can_access_image(name));


-- =====================================================================
-- 6. Remove the old approval system
-- =====================================================================

drop function public.is_family_member();
alter table public.profiles drop column is_approved;
