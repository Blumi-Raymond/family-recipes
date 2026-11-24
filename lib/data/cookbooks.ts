import "server-only";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/images/server";
import { isUuid } from "@/lib/validation";
import { fail } from "./common";

export type CookbookSummary = {
  id: string;
  title: string;
  author: string | null;
  language: "he" | "en";
  coverUrl: string | null;
  recipeCount: number; // recipes not in the trash
};

export type Cookbook = {
  id: string;
  group_id: string;
  title: string;
  author: string | null;
  language: "he" | "en";
  notes: string | null;
  cover_image_path: string | null;
};

// For dropdowns (recipe form, filters)
export async function listCookbookOptions(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cookbooks").select("id, title").order("title");
  if (error) fail("listCookbookOptions", error);
  return data;
}

export async function listCookbooks(): Promise<CookbookSummary[]> {
  const supabase = await createClient();
  const [books, recipes] = await Promise.all([
    supabase.from("cookbooks").select("id, title, author, language, cover_image_path").order("title"),
    supabase.from("active_recipes").select("cookbook_id").not("cookbook_id", "is", null),
  ]);
  if (books.error) fail("listCookbooks", books.error);
  if (recipes.error) fail("listCookbooks.count", recipes.error);

  const counts = new Map<string, number>();
  for (const r of recipes.data) {
    if (r.cookbook_id) counts.set(r.cookbook_id, (counts.get(r.cookbook_id) ?? 0) + 1);
  }
  const urls = await signImageUrls(books.data.map((b) => b.cover_image_path), "thumb");

  return books.data.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    language: b.language,
    coverUrl: b.cover_image_path ? (urls.get(b.cover_image_path) ?? null) : null,
    recipeCount: counts.get(b.id) ?? 0,
  }));
}

// null = not found (or not hers)
export async function getCookbook(id: string): Promise<(Cookbook & { coverUrl: string | null }) | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cookbooks")
    .select("id, group_id, title, author, language, notes, cover_image_path")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getCookbook", error);
  if (!data) return null;
  const urls = await signImageUrls([data.cover_image_path], "thumb");
  return { ...data, coverUrl: data.cover_image_path ? (urls.get(data.cover_image_path) ?? null) : null };
}
