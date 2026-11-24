-- =====================================================================
-- Stage 1E — recipe form support
--
-- 1. recipes.page_number: the page in the cookbook (for manual recipes;
--    scanned recipes also link to source_pages).
-- 2. active_recipes: re-created so it includes the newer columns
--    (group_id, page_number). A view made with "select *" keeps the
--    column list it had when it was created.
-- 3. save_recipe(): saves a whole recipe (details, ingredients, steps,
--    tags, photos) in ONE transaction — all of it is saved, or nothing.
--
-- Safe to run once in the Supabase SQL Editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Page number in the cookbook
-- ---------------------------------------------------------------------
alter table public.recipes
  add column page_number int check (page_number > 0);


-- ---------------------------------------------------------------------
-- 2. Recipes that are not in the trash (now with group_id, page_number)
-- ---------------------------------------------------------------------
create or replace view public.active_recipes
with (security_invoker = true) as
  select * from public.recipes
  where deleted_at is null;


-- ---------------------------------------------------------------------
-- 3. Save a recipe
--
-- p_recipe (JSON):
-- {
--   "id": null | "<uuid>",            -- null = new recipe
--   "title", "description", "language", "kosher_type",
--   "yield_text", "servings", "prep_minutes", "cook_minutes", "total_minutes",
--   "notes", "cookbook_id", "page_number", "source_note",
--   "ingredients": [{ "section", "quantity", "quantity_max", "unit",
--                     "name", "note", "is_optional", "original_text" }],
--   "steps":       [{ "section", "instruction" }],
--   "tag_ids":     ["<uuid>", ...],
--   "photos":      [{ "path", "is_cover" }]
-- }
-- Order in the arrays = order on screen.
--
-- SECURITY INVOKER: runs with the logged-in user's permissions, so all
-- the usual RLS rules (group membership) still apply.
-- ---------------------------------------------------------------------
create or replace function public.save_recipe(p_recipe jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id    uuid := nullif(p_recipe ->> 'id', '')::uuid;
  v_group uuid;
  v_cover text;
begin
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
      'manual'
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

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb) to authenticated;
