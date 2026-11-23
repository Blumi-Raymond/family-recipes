-- =====================================================================
-- Trash cleanup — permanently delete recipes that have been in the
-- trash for more than 30 days. Runs every night at 03:00 (UTC).
--
-- BEFORE running this file: enable the pg_cron extension in the
-- Supabase dashboard (Database → Extensions → search "pg_cron" → Enable).
--
-- Deleting a recipe also deletes its ingredients, steps, tags, photo rows
-- and page links (ON DELETE CASCADE).
-- NOTE: the image FILES in Storage are not removed by this job —
-- a storage cleanup will be added in a later migration.
-- =====================================================================

select cron.schedule(
  'purge-deleted-recipes',
  '0 3 * * *',
  $$ delete from public.recipes
     where deleted_at is not null
       and deleted_at < now() - interval '30 days' $$
);
