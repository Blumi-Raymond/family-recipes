-- =====================================================================
-- Stage 2C — scan answers waiting for review (scan_drafts)
--
-- A pasted answer (free path) is kept in the database, per set of page
-- photos, so she can come back to recipes she hasn't saved yet — from the
-- scan screen ("continue where you stopped") or from a scanned recipe's
-- page. Later the direct path (stage 2D) will put its answers here too.
--
--   1. scan_drafts — one row per set of pages (same pages = same row):
--        page_ids   the page photos, in reading order
--        answer     the AI's answer, already checked by the app
--        saved      which recipe of the answer was saved: {"0": "<recipe id>"}
--        dismissed_at  she removed it from the "continue" list
--      Permissions: members of the group (RLS). No delete from the app.
--   2. save_scan_draft(page_ids, answer) — new answer for these pages
--      (replaces the old one and starts "saved" from scratch).
--   3. mark_scan_recipe_saved(draft_id, index, recipe_id) — one recipe of
--      the answer was saved. One UPDATE: two saves at once can't lose
--      each other's mark.
--
-- Runs as ONE transaction: if anything fails, nothing changes.
-- Running it a second time by mistake stops at the start, without harm.
-- =====================================================================

begin;

do $$
begin
  if to_regclass('public.scan_drafts') is not null then
    raise exception 'This migration already ran (scan_drafts exists). Nothing was changed.';
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------
create table public.scan_drafts (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null default public.personal_group_id()
                references public.groups (id) on delete cascade,
  page_ids      uuid[] not null
                check (cardinality(page_ids) between 1 and 4),        -- in reading order
  answer        jsonb not null
                check (jsonb_typeof(answer) = 'object' and octet_length(answer::text) < 300000),
  saved         jsonb not null default '{}'::jsonb
                check (jsonb_typeof(saved) = 'object'),
  dismissed_at  timestamptz,
  created_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (group_id, page_ids)
);

comment on table public.scan_drafts is
  'AI answers for page photos, waiting for review. Recipes are saved only when she approves them.';

create index scan_drafts_group_updated_idx on public.scan_drafts (group_id, updated_at desc);

create trigger scan_drafts_set_updated_at before update on public.scan_drafts
  for each row execute function public.set_updated_at();

alter table public.scan_drafts enable row level security;

create policy "scan drafts: read"   on public.scan_drafts for select to authenticated
  using (public.is_group_member(group_id));
create policy "scan drafts: insert" on public.scan_drafts for insert to authenticated
  with check (public.is_group_member(group_id));
create policy "scan drafts: update" on public.scan_drafts for update to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

revoke all on public.scan_drafts from anon;
revoke truncate, references, trigger on public.scan_drafts from authenticated;


-- ---------------------------------------------------------------------
-- 2. A new answer for a set of pages
-- ---------------------------------------------------------------------
create or replace function public.save_scan_draft(p_page_ids uuid[], p_answer jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_page_ids is null
     or cardinality(p_page_ids) not between 1 and 4
     or (select count(distinct x) from unnest(p_page_ids) as x) <> cardinality(p_page_ids)
  then
    raise exception 'pages must be 1-4 different ids';
  end if;

  -- The pages must be mine (RLS hides other groups' pages)
  if (select count(*) from public.source_pages where id = any (p_page_ids)) <> cardinality(p_page_ids) then
    raise exception 'page not found';
  end if;

  insert into public.scan_drafts (page_ids, answer)
  values (p_page_ids, p_answer)
  on conflict (group_id, page_ids) do update
    set answer = excluded.answer,
        saved = '{}'::jsonb,
        dismissed_at = null
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.save_scan_draft(uuid[], jsonb) from public, anon;
grant execute on function public.save_scan_draft(uuid[], jsonb) to authenticated;


-- ---------------------------------------------------------------------
-- 3. One recipe of the answer was saved
-- ---------------------------------------------------------------------
create or replace function public.mark_scan_recipe_saved(p_draft_id uuid, p_index int, p_recipe_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_index is null or p_index not between 0 and 9 or p_recipe_id is null then
    raise exception 'bad recipe index';
  end if;

  update public.scan_drafts
     set saved = saved || jsonb_build_object(p_index::text, p_recipe_id)
   where id = p_draft_id;

  if not found then
    raise exception 'scan draft not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.mark_scan_recipe_saved(uuid, int, uuid) from public, anon;
grant execute on function public.mark_scan_recipe_saved(uuid, int, uuid) to authenticated;

commit;
