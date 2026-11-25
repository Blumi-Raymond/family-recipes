import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/images/server";
import { trashDaysLeft } from "@/lib/recipes/format";
import type { KosherType } from "@/lib/recipes/schema";
import { isUuid } from "@/lib/validation";
import { fail } from "./common";

// ---------------------------------------------------------------------
// List with search and filters (home page)
// ---------------------------------------------------------------------
export type RecipeFilters = {
  q: string; // part of the title
  kosher: KosherType | null;
  tagIds: string[]; // recipe must have ALL of them
  bookId: string | null;
};

export type RecipeCard = {
  id: string;
  title: string;
  language: "he" | "en";
  kosher_type: KosherType;
  bookTitle: string | null;
  thumbUrl: string | null;
};

// Characters with a special meaning in LIKE patterns / PostgREST filters
function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listRecipes(filters: RecipeFilters): Promise<RecipeCard[]> {
  const supabase = await createClient();

  // Tags: find the recipes that have every selected tag
  let idsWithTags: string[] | null = null;
  if (filters.tagIds.length > 0) {
    const { data, error } = await supabase
      .from("recipe_tags")
      .select("recipe_id, tag_id")
      .in("tag_id", filters.tagIds);
    if (error) fail("listRecipes.tags", error);
    const found = new Map<string, Set<string>>();
    for (const row of data) {
      if (!found.has(row.recipe_id)) found.set(row.recipe_id, new Set());
      found.get(row.recipe_id)!.add(row.tag_id);
    }
    idsWithTags = [...found].filter(([, tags]) => tags.size === filters.tagIds.length).map(([id]) => id);
    if (idsWithTags.length === 0) return [];
  }

  let query = supabase
    .from("active_recipes")
    .select("id, title, language, kosher_type, cookbook_id")
    .order("created_at", { ascending: false });
  if (filters.q) query = query.ilike("title", likePattern(filters.q));
  if (filters.kosher) query = query.eq("kosher_type", filters.kosher);
  if (filters.bookId) query = query.eq("cookbook_id", filters.bookId);

  // Covers and book titles: fetched whole (RLS keeps it to her groups) rather
  // than "where id in (...hundreds of ids)", which can make the request URL
  // too long once there are many recipes.
  const [found, covers, books] = await Promise.all([
    query,
    supabase.from("recipe_photos").select("recipe_id, image_path").eq("is_cover", true),
    supabase.from("cookbooks").select("id, title"),
  ]);
  if (found.error) fail("listRecipes", found.error);
  if (covers.error) fail("listRecipes.covers", covers.error);
  if (books.error) fail("listRecipes.books", books.error);

  const withTags = idsWithTags ? new Set(idsWithTags) : null;
  const recipes = withTags ? found.data.filter((r) => withTags.has(r.id)) : found.data;
  if (recipes.length === 0) return [];

  const shown = new Set(recipes.map((r) => r.id));
  const coverOf = new Map(
    covers.data.filter((c) => shown.has(c.recipe_id)).map((c) => [c.recipe_id, c.image_path]),
  );
  const bookTitle = new Map(books.data.map((b) => [b.id, b.title]));
  const urls = await signImageUrls([...coverOf.values()], "thumb");

  return recipes.map((r) => {
    const cover = coverOf.get(r.id);
    return {
      id: r.id,
      title: r.title,
      language: r.language,
      kosher_type: r.kosher_type,
      bookTitle: r.cookbook_id ? (bookTitle.get(r.cookbook_id) ?? null) : null,
      thumbUrl: cover ? (urls.get(cover) ?? null) : null,
    };
  });
}

// ---------------------------------------------------------------------
// One recipe, with everything (recipe page + edit form)
// ---------------------------------------------------------------------
export type RecipeDetails = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  language: "he" | "en";
  kosher_type: KosherType;
  yield_text: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  notes: string | null;
  cookbook_id: string | null;
  page_number: number | null;
  source_note: string | null;
  book: { id: string; title: string } | null;
  ingredients: {
    section: string | null;
    quantity: number | null;
    quantity_max: number | null;
    unit: string | null;
    name: string;
    note: string | null;
    is_optional: boolean;
    original_text: string | null;
  }[];
  steps: { section: string | null; instruction: string }[];
  tagIds: string[];
  photos: { path: string; is_cover: boolean; url: string | null; thumbUrl: string | null }[];
  sourcePageIds: string[]; // page photos it was scanned from, in reading order ([] = typed by hand)
};

// null = not found, in the trash, or not hers.
// cache(): the page and its title ask for the same recipe -> one database read.
export const getRecipe = cache(async (id: string): Promise<RecipeDetails | null> => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const [recipe, ingredients, steps, tags, photos, pages] = await Promise.all([
    supabase
      .from("active_recipes")
      .select(
        "id, group_id, title, description, language, kosher_type, yield_text, servings, prep_minutes, cook_minutes, total_minutes, notes, cookbook_id, page_number, source_note",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipe_ingredients")
      .select("section, quantity, quantity_max, unit, name, note, is_optional, original_text")
      .eq("recipe_id", id)
      .order("position"),
    supabase.from("recipe_steps").select("section, instruction").eq("recipe_id", id).order("position"),
    supabase.from("recipe_tags").select("tag_id").eq("recipe_id", id),
    supabase
      .from("recipe_photos")
      .select("image_path, is_cover")
      .eq("recipe_id", id)
      .order("created_at"),
    supabase.from("recipe_source_pages").select("page_id").eq("recipe_id", id).order("position"),
  ]);
  for (const r of [recipe, ingredients, steps, tags, photos, pages]) {
    if (r.error) fail("getRecipe", r.error);
  }
  const row = recipe.data;
  if (!row) return null;

  let book: RecipeDetails["book"] = null;
  if (row.cookbook_id) {
    const { data, error } = await supabase
      .from("cookbooks")
      .select("id, title")
      .eq("id", row.cookbook_id)
      .maybeSingle();
    if (error) fail("getRecipe.book", error);
    book = data;
  }

  // Cover first, then the rest in upload order
  const photoRows = [...(photos.data ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover));
  const paths = photoRows.map((p) => p.image_path);
  const [full, thumbs] = await Promise.all([
    signImageUrls(paths, "full"),
    signImageUrls(paths, "thumb"),
  ]);

  return {
    ...row,
    book,
    ingredients: (ingredients.data ?? []).map((i) => ({
      ...i,
      quantity: i.quantity === null ? null : Number(i.quantity),
      quantity_max: i.quantity_max === null ? null : Number(i.quantity_max),
    })),
    steps: steps.data ?? [],
    tagIds: (tags.data ?? []).map((t) => t.tag_id),
    photos: photoRows.map((p) => ({
      path: p.image_path,
      is_cover: p.is_cover,
      url: full.get(p.image_path) ?? null,
      thumbUrl: thumbs.get(p.image_path) ?? null,
    })),
    sourcePageIds: (pages.data ?? []).map((p) => p.page_id),
  };
});

// ---------------------------------------------------------------------
// Trash
// ---------------------------------------------------------------------
export type TrashedRecipe = {
  id: string;
  title: string;
  language: "he" | "en";
  daysLeft: number; // before it is deleted for good
};

export async function listTrash(): Promise<TrashedRecipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, language, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) fail("listTrash", error);
  const now = Date.now();
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    language: r.language,
    daysLeft: trashDaysLeft(r.deleted_at as string, now),
  }));
}
