"use server";
// Scan screen: after the page photos are uploaded, create one source_pages
// row per photo (in reading order). The database checks the rest:
// RLS (my group), the photo is in my group's "pages/" folder, and the
// cookbook is in the same group.
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { inOrder, MAX_SCAN_PAGES, scanPagesSchema, type ScanPagesInput } from "@/lib/scan/pages";
import { normalizeTitle, sameTitle } from "@/lib/scan/review";
import { uuid } from "@/lib/validation";

export type CreatePagesResult = { ok: true; pageIds: string[] } | { ok: false; error: "generic" };

export async function createScanPages(input: ScanPagesInput): Promise<CreatePagesResult> {
  const parsed = scanPagesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const { cookbook_id, paths } = parsed.data;
  const supabase = await createClient();

  // Safe to send again: if the connection dropped AFTER the rows were saved,
  // "Continue" again finds them instead of creating the same pages twice.
  // (Every photo has its own new file name, so a path = one page.)
  const existing = await supabase
    .from("source_pages")
    .select("id, image_path, cookbook_id")
    .in("image_path", paths);
  if (existing.error) {
    console.error("createScanPages select error:", existing.error.code, existing.error.message);
    return { ok: false, error: "generic" };
  }

  // She may have changed the book before trying again: the pages follow it
  const otherBook = existing.data.filter((row) => row.cookbook_id !== cookbook_id).map((row) => row.id);
  if (otherBook.length > 0) {
    const { error } = await supabase.from("source_pages").update({ cookbook_id }).in("id", otherBook);
    if (error) {
      console.error("createScanPages update error:", error.code, error.message);
      return { ok: false, error: "generic" };
    }
  }

  const known = new Set(existing.data.map((row) => row.image_path));
  const missing = paths.filter((path) => !known.has(path));
  let created: { id: string; image_path: string }[] = [];

  if (missing.length > 0) {
    // One insert = one transaction: either all these rows exist or none
    const { data, error } = await supabase
      .from("source_pages")
      .insert(missing.map((image_path) => ({ image_path, cookbook_id })))
      .select("id, image_path");
    if (error) {
      console.error("createScanPages error:", error.code, error.message);
      return { ok: false, error: "generic" };
    }
    created = data;
  }

  const ordered = inOrder([...existing.data, ...created], (row) => row.image_path, paths);
  if (!ordered) {
    console.error("createScanPages: rows missing after insert");
    return { ok: false, error: "generic" };
  }
  return { ok: true, pageIds: ordered.map((row) => row.id) };
}

// ---------------------------------------------------------------------
// Before saving a scanned recipe: is it already saved?
// Same title (compared loosely) AND the same source: the same book + page,
// or the same page photos (e.g. the same answer pasted again).
// A failed check never blocks saving — it only skips the warning.
// ---------------------------------------------------------------------
const duplicateQuery = z.object({
  title: z.string().max(300),
  cookbook_id: uuid.nullable(),
  page_number: z.number().int().positive().nullable(),
  source_pages: z.array(uuid).max(MAX_SCAN_PAGES),
});

export type DuplicateQuery = z.infer<typeof duplicateQuery>;
export type Duplicate = { id: string; title: string };

export async function findDuplicateRecipe(input: DuplicateQuery): Promise<Duplicate | null> {
  const parsed = duplicateQuery.safeParse(input);
  if (!parsed.success || !normalizeTitle(parsed.data.title)) return null;
  const { title, cookbook_id, page_number, source_pages } = parsed.data;
  const supabase = await createClient();

  const fromBook = async (): Promise<Duplicate[]> => {
    if (!cookbook_id) return [];
    const query = supabase.from("active_recipes").select("id, title").eq("cookbook_id", cookbook_id);
    const { data, error } = await (page_number === null
      ? query.is("page_number", null)
      : query.eq("page_number", page_number));
    if (error) {
      console.error("findDuplicateRecipe book error:", error.code, error.message);
      return [];
    }
    return data;
  };

  const fromPages = async (): Promise<Duplicate[]> => {
    if (source_pages.length === 0) return [];
    const links = await supabase.from("recipe_source_pages").select("recipe_id").in("page_id", source_pages);
    if (links.error) {
      console.error("findDuplicateRecipe pages error:", links.error.code, links.error.message);
      return [];
    }
    const ids = [...new Set(links.data.map((l) => l.recipe_id))];
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("active_recipes").select("id, title").in("id", ids);
    if (error) {
      console.error("findDuplicateRecipe recipes error:", error.code, error.message);
      return [];
    }
    return data;
  };

  const [a, b] = await Promise.all([fromBook(), fromPages()]);
  return [...a, ...b].find((r) => sameTitle(r.title, title)) ?? null;
}
