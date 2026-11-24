-- =====================================================================
-- Stage 2 — AI scanning: permission, daily quota, scan log, and
-- linking saved recipes to their page photos.
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste → Run
-- (run once, after 20261124200000_recipe_form.sql)
--
-- What it adds:
--   1. scan_allowances — who may use the AI scan, and how much.
--      Built as a "balance" so payment can be added later without a
--      rebuild: daily_limit (free scans per day) + scan_credits (bought
--      scans, used only after the daily scans run out).
--      Nobody has an allowance after this file runs — grant it with
--      one INSERT (see the instructions that came with this file).
--   2. scans — a log row for every AI call: who, when, model, pages,
--      tokens in/out, estimated cost, status, and the AI's answer
--      (so a paid answer is never lost if the page is closed).
--   3. start_scan() — checks the quota AND writes the log row in one
--      locked step, so two requests at the same moment can't both slip
--      past the limit. finish_scan() records the result.
--      my_scan_quota() — what's left today (for the screen).
--   4. source_pages: a page photo must live in its group's "pages/"
--      folder.
--   5. save_recipe(): accepts "source_pages" (page ids, in order) and
--      links them in recipe_source_pages. A NEW recipe with pages is
--      saved as source_type = 'scan'.
--
-- Security model (no service-role key in the app):
--   * Users can READ their own allowance and scans, never write them.
--   * Writes happen only through start_scan / finish_scan
--     (SECURITY DEFINER, always for auth.uid()).
--   * Every started scan counts toward the quota — even if it later
--     fails. A user can't "refund" herself by faking a failure.
--
-- The whole file runs as ONE transaction: if anything fails, nothing
-- is changed and it's safe to fix and run again.
-- =====================================================================

begin;


-- =====================================================================
-- 1. scan_allowances — permission + quota (one row per allowed user)
-- =====================================================================

create table public.scan_allowances (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  daily_limit   int  not null default 0 check (daily_limit  >= 0),  -- free scans per day (Israel time)
  scan_credits  int  not null default 0 check (scan_credits >= 0),  -- bought scans (future), used after daily_limit
  note          text,                                               -- e.g. "owner", "paid 2027-01"
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.scan_allowances is
  'Who may use the AI scan. No row = no scanning. Edit from the dashboard only.';

create trigger scan_allowances_set_updated_at before update on public.scan_allowances
  for each row execute function public.set_updated_at();


-- =====================================================================
-- 2. scans — log of every AI call
-- =====================================================================

create table public.scans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  group_id       uuid not null references public.groups (id)   on delete cascade,
  page_ids       uuid[] not null
                 check (cardinality(page_ids) between 1 and 4),  -- in reading order
  method         text not null default 'direct'
                 check (method in ('direct', 'batch')),          -- 'batch' = stage 2B
  model          text not null check (length(trim(model)) > 0),
  status         text not null default 'pending'
                 check (status in ('pending', 'succeeded', 'failed')),
  used_credit    boolean not null default false,                 -- paid from scan_credits
  error_code     text,      -- 'truncated', 'refused', 'overloaded', 'timeout', 'invalid_response', ...
  stop_reason    text,      -- as returned by the API
  input_tokens   int check (input_tokens  >= 0),
  output_tokens  int check (output_tokens >= 0),
  cost_usd       numeric(10, 6) check (cost_usd >= 0),           -- estimated, from the price list in the code
  duration_ms    int check (duration_ms >= 0),
  result         jsonb,     -- the AI's answer (validated in the app before the review screen)
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

create index scans_user_created_idx on public.scans (user_id, created_at desc);


-- =====================================================================
-- 3. Functions
-- =====================================================================

-- "Today" for the quota = the calendar day in Israel
create or replace function public.scan_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'Asia/Jerusalem') at time zone 'Asia/Jerusalem';
$$;

-- ---------------------------------------------------------------------
-- start_scan(page_ids, model) → the new scan's id
--
-- Errors (error.code in the app):
--   SC001  no scan permission (no scan_allowances row)
--   SC002  quota used up (today's scans + no credits left)
--   SC003  pages: 1–4, no repeats, all mine, all in one group
-- ---------------------------------------------------------------------
create or replace function public.start_scan(p_page_ids uuid[], p_model text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user       uuid := auth.uid();
  v_allowance  public.scan_allowances;
  v_used       int;
  v_group      uuid;
  v_groups     int;
  v_found      int;
  v_credit     boolean := false;
  v_id         uuid;
begin
  if v_user is null then
    raise exception 'not logged in' using errcode = 'SC001';
  end if;

  if p_model is null or length(trim(p_model)) = 0 then
    raise exception 'model is required';
  end if;

  -- Pages: 1–4, no repeats
  if p_page_ids is null
     or cardinality(p_page_ids) not between 1 and 4
     or cardinality(p_page_ids) <> (select count(distinct x) from unnest(p_page_ids) as x)
  then
    raise exception 'scan needs 1-4 different pages' using errcode = 'SC003';
  end if;

  -- Pages: must exist, be in my groups, and all in ONE group
  select count(*), count(distinct p.group_id), min(p.group_id::text)::uuid
    into v_found, v_groups, v_group
  from public.source_pages p
  where p.id = any (p_page_ids)
    and public.is_group_member(p.group_id);

  if v_found <> cardinality(p_page_ids) or v_groups <> 1 then
    raise exception 'pages not found' using errcode = 'SC003';
  end if;

  -- Lock MY allowance row: a second request waits here until the first
  -- one has written its scan row, so the count below is always correct.
  select * into v_allowance
  from public.scan_allowances
  where user_id = v_user
  for update;

  if not found then
    raise exception 'no scan permission' using errcode = 'SC001';
  end if;

  select count(*) into v_used
  from public.scans
  where user_id = v_user
    and not used_credit
    and created_at >= public.scan_day_start();

  if v_used >= v_allowance.daily_limit then
    if v_allowance.scan_credits > 0 then
      update public.scan_allowances
        set scan_credits = scan_credits - 1
        where user_id = v_user;
      v_credit := true;
    else
      raise exception 'scan quota used up' using errcode = 'SC002';
    end if;
  end if;

  insert into public.scans (user_id, group_id, page_ids, model, used_credit)
  values (v_user, v_group, p_page_ids, trim(p_model), v_credit)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- finish_scan(...) — record how a scan ended. Once only (pending → final).
-- Returns false if the scan isn't mine or was already finished.
-- ---------------------------------------------------------------------
create or replace function public.finish_scan(
  p_scan_id        uuid,
  p_status         text,
  p_error_code     text    default null,
  p_stop_reason    text    default null,
  p_input_tokens   int     default null,
  p_output_tokens  int     default null,
  p_cost_usd       numeric default null,
  p_duration_ms    int     default null,
  p_result         jsonb   default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('succeeded', 'failed') then
    raise exception 'status must be succeeded or failed';
  end if;

  update public.scans set
    status        = p_status,
    error_code    = nullif(trim(p_error_code), ''),
    stop_reason   = nullif(trim(p_stop_reason), ''),
    input_tokens  = p_input_tokens,
    output_tokens = p_output_tokens,
    cost_usd      = p_cost_usd,
    duration_ms   = p_duration_ms,
    result        = p_result,
    finished_at   = now()
  where id = p_scan_id
    and user_id = auth.uid()
    and status = 'pending';

  return found;
end;
$$;

-- ---------------------------------------------------------------------
-- my_scan_quota() — for the screen: may I scan, and how many are left?
-- No row = not allowed (allowed = false, all numbers 0).
-- ---------------------------------------------------------------------
create or replace function public.my_scan_quota()
returns table (allowed boolean, daily_limit int, used_today int, credits int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.user_id is not null,
    coalesce(a.daily_limit, 0),
    (select count(*)::int from public.scans s
      where s.user_id = auth.uid()
        and not s.used_credit
        and s.created_at >= public.scan_day_start()),
    coalesce(a.scan_credits, 0)
  from (select auth.uid() as uid) me
  left join public.scan_allowances a on a.user_id = me.uid;
$$;

revoke all on function public.start_scan(uuid[], text) from public, anon;
revoke all on function public.finish_scan(uuid, text, text, text, int, int, numeric, int, jsonb) from public, anon;
revoke all on function public.my_scan_quota() from public, anon;
revoke all on function public.scan_day_start() from public, anon;
grant execute on function public.start_scan(uuid[], text) to authenticated;
grant execute on function public.finish_scan(uuid, text, text, text, int, int, numeric, int, jsonb) to authenticated;
grant execute on function public.my_scan_quota() to authenticated;
grant execute on function public.scan_day_start() to authenticated;


-- =====================================================================
-- 4. Row Level Security — read your own rows; no direct writes
-- =====================================================================

alter table public.scan_allowances enable row level security;
alter table public.scans           enable row level security;

create policy "scan_allowances: read own" on public.scan_allowances
  for select to authenticated using (user_id = auth.uid());
create policy "scans: read own" on public.scans
  for select to authenticated using (user_id = auth.uid());

-- Read-only for users. "revoke all" also removes TRUNCATE, which RLS
-- does not cover.
revoke all on public.scan_allowances from anon, authenticated;
revoke all on public.scans           from anon, authenticated;
grant select on public.scan_allowances to authenticated;
grant select on public.scans           to authenticated;


-- =====================================================================
-- 5. source_pages — the photo must be in "<group_id>/pages/..."
-- NOT VALID = checks new and changed rows only (older rows, if any,
-- are left alone).
-- =====================================================================

alter table public.source_pages
  add constraint source_pages_image_in_group_folder
  check (image_path like group_id::text || '/pages/%') not valid;


-- =====================================================================
-- 6. save_recipe() — now also links page photos
--
-- New optional key in p_recipe:
--   "source_pages": ["<page uuid>", ...]   -- in reading order
--     * key missing / null → page links are left as they are
--       (editing a scanned recipe doesn't lose its pages)
--     * an array          → the recipe's page links become exactly this list
-- A NEW recipe with at least one page is saved with source_type = 'scan'.
-- source_type is never taken from the client and never changes on edit.
-- Pages must be in the recipe's group (checked here + by RLS).
-- Everything else is unchanged from 20261124200000_recipe_form.sql.
-- =====================================================================

create or replace function public.save_recipe(p_recipe jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id     uuid := nullif(p_recipe ->> 'id', '')::uuid;
  v_group  uuid;
  v_cover  text;
  v_pages  jsonb := p_recipe -> 'source_pages';
begin
  if v_pages is not null and jsonb_typeof(v_pages) = 'null' then
    v_pages := null;
  end if;
  if v_pages is not null and jsonb_typeof(v_pages) <> 'array' then
    raise exception 'source_pages must be an array';
  end if;

  -- ---- the recipe row ----
  if v_id is null then
    insert into public.recipes (
      title, description, language, kosher_type,
      yield_text, servings, prep_minutes, cook_minutes, total_minutes,
      notes, cookbook_id, page_number, source_note, source_type
    ) values (
      trim(p_recipe ->> 'title'),
      nullif(trim(p_recipe ->> 'description'), ''),
      (p_recipe ->> 'language')::public.content_language,
      (p_recipe ->> 'kosher_type')::public.kosher_type,
      nullif(trim(p_recipe ->> 'yield_text'), ''),
      (p_recipe ->> 'servings')::int,
      (p_recipe ->> 'prep_minutes')::int,
      (p_recipe ->> 'cook_minutes')::int,
      (p_recipe ->> 'total_minutes')::int,
      nullif(trim(p_recipe ->> 'notes'), ''),
      nullif(p_recipe ->> 'cookbook_id', '')::uuid,
      (p_recipe ->> 'page_number')::int,
      nullif(trim(p_recipe ->> 'source_note'), ''),
      case when jsonb_array_length(coalesce(v_pages, '[]'::jsonb)) > 0
           then 'scan' else 'manual' end::public.recipe_source_type
    )
    returning id, group_id into v_id, v_group;
  else
    update public.recipes set
      title         = trim(p_recipe ->> 'title'),
      description   = nullif(trim(p_recipe ->> 'description'), ''),
      language      = (p_recipe ->> 'language')::public.content_language,
      kosher_type   = (p_recipe ->> 'kosher_type')::public.kosher_type,
      yield_text    = nullif(trim(p_recipe ->> 'yield_text'), ''),
      servings      = (p_recipe ->> 'servings')::int,
      prep_minutes  = (p_recipe ->> 'prep_minutes')::int,
      cook_minutes  = (p_recipe ->> 'cook_minutes')::int,
      total_minutes = (p_recipe ->> 'total_minutes')::int,
      notes         = nullif(trim(p_recipe ->> 'notes'), ''),
      cookbook_id   = nullif(p_recipe ->> 'cookbook_id', '')::uuid,
      page_number   = (p_recipe ->> 'page_number')::int,
      source_note   = nullif(trim(p_recipe ->> 'source_note'), '')
    where id = v_id and deleted_at is null
    returning group_id into v_group;

    -- Not found, in the trash, or not in one of my groups (RLS hides it)
    if not found then
      raise exception 'recipe not found' using errcode = 'P0002';
    end if;
  end if;

  -- ---- ingredients: replace the whole list ----
  delete from public.recipe_ingredients where recipe_id = v_id;
  insert into public.recipe_ingredients (
    recipe_id, position, section, quantity, quantity_max, unit,
    name, note, is_optional, original_text
  )
  select
    v_id,
    (e.ord - 1)::int,
    nullif(trim(e.item ->> 'section'), ''),
    (e.item ->> 'quantity')::numeric,
    (e.item ->> 'quantity_max')::numeric,
    nullif(trim(e.item ->> 'unit'), ''),
    trim(e.item ->> 'name'),
    nullif(trim(e.item ->> 'note'), ''),
    coalesce((e.item ->> 'is_optional')::boolean, false),
    nullif(trim(e.item ->> 'original_text'), '')
  from jsonb_array_elements(coalesce(p_recipe -> 'ingredients', '[]'::jsonb))
       with ordinality as e(item, ord);

  -- ---- steps: replace the whole list ----
  delete from public.recipe_steps where recipe_id = v_id;
  insert into public.recipe_steps (recipe_id, position, section, instruction)
  select
    v_id,
    (e.ord - 1)::int,
    nullif(trim(e.item ->> 'section'), ''),
    trim(e.item ->> 'instruction')
  from jsonb_array_elements(coalesce(p_recipe -> 'steps', '[]'::jsonb))
       with ordinality as e(item, ord);

  -- ---- tags: replace the whole set ----
  delete from public.recipe_tags where recipe_id = v_id;
  insert into public.recipe_tags (recipe_id, tag_id)
  select distinct v_id, t.tag_id::uuid
  from jsonb_array_elements_text(coalesce(p_recipe -> 'tag_ids', '[]'::jsonb)) as t(tag_id);

  -- ---- photos ----
  -- Every file must be inside this recipe's group folder
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_recipe -> 'photos', '[]'::jsonb)) as p(item)
    where split_part(p.item ->> 'path', '/', 1) <> v_group::text
  ) then
    raise exception 'photo is outside the recipe''s group folder';
  end if;

  -- Keep existing rows (and their upload info); remove the ones taken out
  delete from public.recipe_photos ph
  where ph.recipe_id = v_id
    and ph.image_path not in (
      select p.item ->> 'path'
      from jsonb_array_elements(coalesce(p_recipe -> 'photos', '[]'::jsonb)) as p(item)
    );

  insert into public.recipe_photos (recipe_id, image_path)
  select v_id, p.item ->> 'path'
  from jsonb_array_elements(coalesce(p_recipe -> 'photos', '[]'::jsonb))
       with ordinality as p(item, ord)
  where not exists (
    select 1 from public.recipe_photos ph
    where ph.recipe_id = v_id and ph.image_path = p.item ->> 'path'
  )
  order by p.ord;

  -- Exactly one cover (the one marked, otherwise the first photo).
  -- Clear the old cover first: there is a unique index on the cover.
  select coalesce(
    (select p.item ->> 'path'
       from jsonb_array_elements(coalesce(p_recipe -> 'photos', '[]'::jsonb)) as p(item)
      where coalesce((p.item ->> 'is_cover')::boolean, false)
      limit 1),
    (p_recipe -> 'photos' -> 0 ->> 'path')
  ) into v_cover;

  update public.recipe_photos set is_cover = false
  where recipe_id = v_id and is_cover and image_path is distinct from v_cover;
  update public.recipe_photos set is_cover = true
  where recipe_id = v_id and image_path = v_cover and not is_cover;

  -- ---- page photos (only when the key was sent) ----
  if v_pages is not null then
    -- Each page once, all in the recipe's group (clear message instead
    -- of a generic RLS error)
    if (select count(*) from jsonb_array_elements_text(v_pages))
       <> (select count(distinct x) from jsonb_array_elements_text(v_pages) as x)
    then
      raise exception 'a page appears twice';
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(v_pages) as x(page_id)
      left join public.source_pages p on p.id = x.page_id::uuid
      where p.id is null or p.group_id <> v_group
    ) then
      raise exception 'page not found in the recipe''s group';
    end if;

    delete from public.recipe_source_pages where recipe_id = v_id;
    insert into public.recipe_source_pages (recipe_id, page_id, position)
    select v_id, x.page_id::uuid, (x.ord - 1)::int
    from jsonb_array_elements_text(v_pages) with ordinality as x(page_id, ord);
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb) to authenticated;

commit;
