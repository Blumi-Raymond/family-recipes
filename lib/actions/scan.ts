"use server";
// Scan screens:
//   createScanPages   after the page photos are uploaded, one source_pages row
//                     per photo (in reading order). The database checks the
//                     rest: RLS (my group), the photo is in my group's "pages/"
//                     folder, and the cookbook is in the same group.
//   findDuplicateRecipe   before saving a scanned recipe
//   saveScanDraft / markScanRecipeSaved / dismissScanDraft   stored answers
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_RECIPES_PER_SCAN, scanAnswerSchema, type ScanAnswer } from "@/lib/scan/answer";
import { MAX_PASTE_LENGTH } from "@/lib/scan/parse";
import { inOrder, MAX_SCAN_PAGES, scanPagesSchema, type ScanPagesInput } from "@/lib/scan/pages";
import { normalizeTitle, sameTitle } from "@/lib/scan/review";
import { isUuid, uuid } from "@/lib/validation";

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

// ---------------------------------------------------------------------
// Answers waiting for review (scan_drafts)
// ---------------------------------------------------------------------
const pageIdList = z
  .array(uuid)
  .min(1)
  .max(MAX_SCAN_PAGES)
  .refine((ids) => new Set(ids).size === ids.length);

// The whole site: the menu shows how many recipes are waiting for review
function refreshScanScreens() {
  revalidatePath("/[lang]", "layout");
}

// A new answer for these pages (replaces an earlier one). Checked again here.
export async function saveScanDraft(
  pageIds: string[],
  answer: ScanAnswer,
): Promise<{ ok: true; id: string } | { ok: false }> {
  const ids = pageIdList.safeParse(pageIds);
  const checked = scanAnswerSchema.safeParse(answer);
  if (!ids.success || !checked.success || JSON.stringify(checked.data).length > MAX_PASTE_LENGTH) {
    return { ok: false };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_scan_draft", {
    p_page_ids: ids.data,
    p_answer: checked.data,
  });
  if (error) {
    console.error("save_scan_draft error:", error.code, error.message);
    return { ok: false };
  }
  refreshScanScreens();
  return { ok: true, id: data };
}

// Recipe number `index` of the stored answer was saved as `recipeId`
export async function markScanRecipeSaved(draftId: string, index: number, recipeId: string): Promise<{ ok: boolean }> {
  if (!isUuid(draftId) || !isUuid(recipeId) || !Number.isInteger(index) || index < 0 || index >= MAX_RECIPES_PER_SCAN) {
    return { ok: false };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_scan_recipe_saved", {
    p_draft_id: draftId,
    p_index: index,
    p_recipe_id: recipeId,
  });
  if (error) {
    console.error("mark_scan_recipe_saved error:", error.code, error.message);
    return { ok: false };
  }
  refreshScanScreens();
  return { ok: true };
}

// "Remove from the list" (the answer stays in the database, but the scan is no longer waiting)
export async function dismissScanDraft(draftId: string): Promise<{ ok: boolean }> {
  if (!isUuid(draftId)) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_drafts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", draftId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("dismissScanDraft error:", error.code, error.message);
    return { ok: false };
  }
  refreshScanScreens();
  return { ok: true };
}
