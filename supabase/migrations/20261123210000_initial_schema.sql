-- =====================================================================
-- Family Recipes — initial schema (version 1)
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste → Run
-- Keep this file in the repo at: supabase/migrations/
--
-- Contents:
--   1. Extensions & enums
--   2. Helper functions
--   3. Tables
--   4. Triggers
--   5. Views
--   6. Row Level Security (permissions)
--   7. Storage (images)
--   8. Seed data (starter tags)
-- =====================================================================


-- =====================================================================
-- 1. Extensions & enums
-- =====================================================================

-- pg_trgm: fast "contains" search on recipe titles (works for Hebrew too)
create extension if not exists pg_trgm with schema extensions;

create type public.content_language   as enum ('he', 'en');
create type public.kosher_type        as enum ('dairy', 'meat', 'pareve');
create type public.recipe_source_type as enum ('manual', 'scan', 'import');


-- =====================================================================
-- 2. Helper functions
-- =====================================================================

-- Keeps updated_at current on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =====================================================================
-- 3. Tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles — family members. One row per login (Supabase Auth user).
-- New users start as NOT approved and see nothing until approved.
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '',
  ui_language   public.content_language not null default 'he',
  is_approved   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.profiles.is_approved is
  'Only approved members can see or change data. Approve manually in the dashboard.';

-- Returns true if the logged-in user is an approved family member.
-- SECURITY DEFINER so it can read profiles without tripping over RLS.
create or replace function public.is_family_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_approved
  );
$$;

-- ---------------------------------------------------------------------
-- cookbooks — the physical books on the shelf
-- ---------------------------------------------------------------------
create table public.cookbooks (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (length(trim(title)) > 0),
  author            text,
  language          public.content_language not null default 'en',
  cover_image_path  text,
  notes             text,
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- source_pages — a photo of one page (from a book, or a loose card).
-- One page can hold several recipes; one recipe can span several pages
-- (see recipe_source_pages). Stage 2 (AI) will add scan-status columns here.
-- ---------------------------------------------------------------------
create table public.source_pages (
  id           uuid primary key default gen_random_uuid(),
  cookbook_id  uuid references public.cookbooks (id) on delete set null,
  page_number  int check (page_number > 0),
  image_path   text not null,
  uploaded_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index source_pages_cookbook_idx on public.source_pages (cookbook_id);

-- ---------------------------------------------------------------------
-- recipes — the core table
-- ---------------------------------------------------------------------
create table public.recipes (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (length(trim(title)) > 0),
  description    text,
  language       public.content_language not null default 'en',
  kosher_type    public.kosher_type not null,               -- no default on purpose: always chosen
  yield_text     text,                                      -- as printed: "24 cookies", "one 9-inch pan"
  servings       int check (servings > 0),                  -- number, for scaling later
  prep_minutes   int check (prep_minutes  >= 0),
  cook_minutes   int check (cook_minutes  >= 0),
  total_minutes  int check (total_minutes >= 0),            -- some books give only a total
  notes          text,                                      -- tips printed with the recipe
  cookbook_id    uuid references public.cookbooks (id) on delete set null,  -- null = not from a book
  source_note    text,                                      -- e.g. "Grandma's", for non-book recipes
  source_type    public.recipe_source_type not null default 'manual',
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  updated_by     uuid references public.profiles (id) on delete set null,   -- set by trigger
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,                               -- trash: null = active
  deleted_by     uuid references public.profiles (id) on delete set null    -- set by trigger
);

create index recipes_kosher_idx    on public.recipes (kosher_type);
create index recipes_cookbook_idx  on public.recipes (cookbook_id);
create index recipes_deleted_idx   on public.recipes (deleted_at);
create index recipes_title_trgm    on public.recipes using gin (title extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- recipe_source_pages — links recipes <-> page photos (many-to-many)
-- ---------------------------------------------------------------------
create table public.recipe_source_pages (
  recipe_id  uuid not null references public.recipes (id)      on delete cascade,
  page_id    uuid not null references public.source_pages (id) on delete cascade,
  position   int  not null default 0 check (position >= 0),    -- page order within the recipe
  primary key (recipe_id, page_id)
);

create index recipe_source_pages_page_idx on public.recipe_source_pages (page_id);

-- ---------------------------------------------------------------------
-- recipe_ingredients — one row per ingredient line
-- Keeps the original printed line AND the parsed parts.
-- ---------------------------------------------------------------------
create table public.recipe_ingredients (
  id             uuid primary key default gen_random_uuid(),
  recipe_id      uuid not null references public.recipes (id) on delete cascade,
  position       int  not null check (position >= 0),
  section        text,                          -- group, e.g. "For the dough"
  original_text  text,                          -- exact line from the book (filled by scans)
  quantity       numeric check (quantity > 0),  -- 1.5  (displayed as 1½)
  quantity_max   numeric,                       -- for ranges: "2–3 eggs"
  unit           text,                          -- cup, tbsp, tsp, g, ml, oz, lb ...
  name           text not null check (length(trim(name)) > 0),
  note           text,                          -- "sifted", "room temperature"
  is_optional    boolean not null default false,
  check (quantity_max is null or (quantity is not null and quantity_max >= quantity))
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id, position);

-- ---------------------------------------------------------------------
-- recipe_steps — one row per instruction step
-- ---------------------------------------------------------------------
create table public.recipe_steps (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references public.recipes (id) on delete cascade,
  position     int  not null check (position >= 0),
  section      text,                            -- group, e.g. "For the filling"
  instruction  text not null check (length(trim(instruction)) > 0)
);

create index recipe_steps_recipe_idx on public.recipe_steps (recipe_id, position);

-- ---------------------------------------------------------------------
-- recipe_photos — photos of the finished dish (several per recipe)
-- ---------------------------------------------------------------------
create table public.recipe_photos (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references public.recipes (id) on delete cascade,
  image_path   text not null,
  is_cover     boolean not null default false,
  uploaded_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index recipe_photos_recipe_idx on public.recipe_photos (recipe_id);

-- At most ONE cover photo per recipe
create unique index recipe_photos_one_cover
  on public.recipe_photos (recipe_id) where is_cover;

-- ---------------------------------------------------------------------
-- tags — flexible filters (chicken, desserts, Shabbat...). Add anytime.
-- Kosher type is NOT a tag — it's a required column on recipes.
-- ---------------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_he     text not null check (length(trim(name_he)) > 0),
  name_en     text not null check (length(trim(name_en)) > 0),
  category    text not null default 'other'
              check (category in ('protein', 'dish', 'occasion', 'other')),
  created_at  timestamptz not null default now()
);

create table public.recipe_tags (
  recipe_id  uuid not null references public.recipes (id) on delete cascade,
  tag_id     uuid not null references public.tags (id)    on delete cascade,
  primary key (recipe_id, tag_id)
);

create index recipe_tags_tag_idx on public.recipe_tags (tag_id);


-- =====================================================================
-- 4. Triggers
-- =====================================================================

-- updated_at on every table that has it
create trigger profiles_set_updated_at  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger cookbooks_set_updated_at before update on public.cookbooks
  for each row execute function public.set_updated_at();
create trigger recipes_set_updated_at   before update on public.recipes
  for each row execute function public.set_updated_at();

-- recipes: record who edited / who moved to trash (can't be faked by the client)
create or replace function public.recipes_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := auth.uid();

  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_by := auth.uid();          -- moved to trash
  elsif new.deleted_at is null then
    new.deleted_by := null;                -- restored from trash
  end if;

  return new;
end;
$$;

create trigger recipes_audit before update on public.recipes
  for each row execute function public.recipes_audit();

-- Create a profile automatically for every new login (Google or password)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',   -- Google
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)             -- password sign-up
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- 5. Views
-- =====================================================================

-- Recipes that are NOT in the trash. The app reads from here by default.
-- security_invoker = permissions are checked as the logged-in user.
create view public.active_recipes
with (security_invoker = true) as
  select * from public.recipes
  where deleted_at is null;


-- =====================================================================
-- 6. Row Level Security
-- Rule: only APPROVED family members can see or change anything.
-- Strangers who log in with Google get a profile but see nothing.
-- =====================================================================

alter table public.profiles             enable row level security;
alter table public.cookbooks            enable row level security;
alter table public.source_pages         enable row level security;
alter table public.recipes              enable row level security;
alter table public.recipe_source_pages  enable row level security;
alter table public.recipe_ingredients   enable row level security;
alter table public.recipe_steps         enable row level security;
alter table public.recipe_photos        enable row level security;
alter table public.tags                 enable row level security;
alter table public.recipe_tags          enable row level security;

-- profiles: see yourself always, see the family if approved; edit only yourself
create policy "profiles: read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_family_member());

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users may change only their name and language — never is_approved
revoke update on public.profiles from authenticated, anon;
grant  update (display_name, ui_language) on public.profiles to authenticated;

-- recipes: read / add / edit for family. NO hard delete from the app —
-- "delete" = set deleted_at (trash). Final delete happens automatically after 30 days.
create policy "recipes: read"   on public.recipes for select to authenticated
  using (public.is_family_member());
create policy "recipes: insert" on public.recipes for insert to authenticated
  with check (public.is_family_member());
create policy "recipes: update" on public.recipes for update to authenticated
  using (public.is_family_member()) with check (public.is_family_member());

-- All other shared tables: full access for approved family members
create policy "family: all" on public.cookbooks           for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.source_pages        for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.recipe_source_pages for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.recipe_ingredients  for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.recipe_steps        for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.recipe_photos       for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.tags                for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());
create policy "family: all" on public.recipe_tags         for all to authenticated
  using (public.is_family_member()) with check (public.is_family_member());


-- =====================================================================
-- 7. Storage — one private bucket for all images
-- Folder convention inside the bucket:
--   pages/   page photos       covers/  cookbook covers       dishes/  dish photos
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', false)
on conflict (id) do nothing;

create policy "recipe-images: read"   on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images' and public.is_family_member());
create policy "recipe-images: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and public.is_family_member());
create policy "recipe-images: update" on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and public.is_family_member());
create policy "recipe-images: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and public.is_family_member());


-- =====================================================================
-- 8. Seed data — starter tags (edit or add freely later)
-- =====================================================================

insert into public.tags (slug, name_he, name_en, category) values
  ('chicken',     'עוף',            'Chicken',      'protein'),
  ('beef',        'בקר',            'Beef',         'protein'),
  ('fish',        'דגים',           'Fish',         'protein'),
  ('eggs',        'ביצים',          'Eggs',         'protein'),
  ('soup',        'מרקים',          'Soups',        'dish'),
  ('salad',       'סלטים',          'Salads',       'dish'),
  ('main',        'מנות עיקריות',   'Main dishes',  'dish'),
  ('side',        'תוספות',         'Side dishes',  'dish'),
  ('bread',       'לחמים',          'Breads',       'dish'),
  ('cake',        'עוגות',          'Cakes',        'dish'),
  ('cookies',     'עוגיות',         'Cookies',      'dish'),
  ('dessert',     'קינוחים',        'Desserts',     'dish'),
  ('shabbat',     'שבת',            'Shabbat',      'occasion'),
  ('pesach',      'פסח',            'Pesach',       'occasion'),
  ('yom-tov',     'חגים',           'Yom Tov',      'occasion')
on conflict (slug) do nothing;
