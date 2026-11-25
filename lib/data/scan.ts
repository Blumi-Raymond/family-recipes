// Page photos of a scan and stored answers, for the scan screens.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/images/server";
import { detectLanguage } from "@/lib/i18n/detect";
import type { ScanAnswer } from "@/lib/scan/answer";
import { inOrder, pageIdsParam } from "@/lib/scan/pages";
import { checkScanAnswer } from "@/lib/scan/parse";
import { readSaved, unsavedIndexes } from "@/lib/scan/review";
import { fail } from "./common";

export type ScanPage = {
  id: string;
  imagePath: string;
  url: string | null; // full size, link valid for 1 hour
};

export type ScanPages = {
  pages: ScanPage[]; // in reading order
  cookbook: { id: string; title: string } | null;
};

// ids come from parsePageIds(). null = any page missing or not mine
// (RLS hides other groups' pages), so the screen shows "not found".
export async function getScanPages(ids: string[]): Promise<ScanPages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("source_pages")
    .select("id, image_path, cookbook_id")
    .in("id", ids);
  if (error) fail("getScanPages", error);

  const rows = inOrder(data, (row) => row.id, ids);
  if (!rows) return null;

  // Pages created together share one cookbook; the first page decides
  const cookbookId = rows[0].cookbook_id;
  const [urls, book] = await Promise.all([
    signImageUrls(
      rows.map((row) => row.image_path),
      "full",
    ),
    cookbookId
      ? supabase.from("cookbooks").select("id, title").eq("id", cookbookId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (book.error) fail("getScanPages.cookbook", book.error);

  return {
    pages: rows.map((row) => ({
      id: row.id,
      imagePath: row.image_path,
      url: urls.get(row.image_path) ?? null,
    })),
    cookbook: book.data,
  };
}

// ---------------------------------------------------------------------
// Answers waiting for review (scan_drafts)
// ---------------------------------------------------------------------
export type StoredScanDraft = {
  id: string;
  answer: ScanAnswer;
  saved: Record<string, string>; // recipe position -> id, only recipes that still exist (not in the trash)
};

// The stored answer for these pages (same pages in the same order), or null
export async function getScanDraft(pageIds: string[]): Promise<StoredScanDraft | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_drafts")
    .select("id, answer, saved")
    .filter("page_ids", "eq", `{${pageIds.join(",")}}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (draftsMissing(error)) return null;
    fail("getScanDraft", error);
  }
  if (!data) return null;

  // Checked again: the rules may have changed since it was stored
  const checked = checkScanAnswer(data.answer);
  if (!checked.ok) return null;
  const saved = readSaved(data.saved, checked.answer.recipes.length);
  const active = await activeRecipeIds(Object.values(saved));
  return { id: data.id, answer: checked.answer, saved: onlyActive(saved, active) };
}

export type OpenScan = {
  id: string;
  pagesParam: string; // for /scan/review?pages=
  unsavedTitles: { title: string; language: "he" | "en" }[];
  bookTitle: string | null;
  updatedAt: string;
};

// "Continue where you stopped": stored answers with recipes not saved yet
// (newest first). A recipe moved to the trash counts as not saved.
export async function listOpenScans(max = 10): Promise<OpenScan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_drafts")
    .select("id, page_ids, answer, saved, updated_at")
    .is("dismissed_at", null)
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) {
    if (draftsMissing(error)) return [];
    fail("listOpenScans", error);
  }

  const drafts = data.flatMap((row) => {
    const checked = checkScanAnswer(row.answer);
    if (!checked.ok || checked.answer.status !== "ok") return [];
    const recipes = checked.answer.recipes;
    return [{ row, recipes, saved: readSaved(row.saved, recipes.length) }];
  });

  const active = await activeRecipeIds(drafts.flatMap((d) => Object.values(d.saved)));
  const open = drafts
    .map((d) => ({ ...d, left: unsavedIndexes(d.recipes.length, onlyActive(d.saved, active)) }))
    .filter((d) => d.left.length > 0)
    .slice(0, max);
  if (open.length === 0) return [];

  // The cookbook: from the first page of each scan
  const firstPages = open.map((d) => d.row.page_ids[0]);
  const pages = await supabase.from("source_pages").select("id, cookbook_id").in("id", firstPages);
  if (pages.error) fail("listOpenScans.pages", pages.error);
  const bookIds = [...new Set(pages.data.map((p) => p.cookbook_id).filter((id): id is string => !!id))];
  const books = bookIds.length
    ? await supabase.from("cookbooks").select("id, title").in("id", bookIds)
    : { data: [], error: null };
  if (books.error) fail("listOpenScans.books", books.error);
  const bookOfPage = new Map(pages.data.map((p) => [p.id, p.cookbook_id]));
  const titleOfBook = new Map((books.data ?? []).map((b) => [b.id, b.title]));

  return open.map((d) => {
    const bookId = bookOfPage.get(d.row.page_ids[0]);
    return {
      id: d.row.id,
      pagesParam: pageIdsParam(d.row.page_ids),
      unsavedTitles: d.left.map((i) => {
        const title = d.recipes[i].title;
        return { title, language: detectLanguage([title], "he") };
      }),
      bookTitle: bookId ? (titleOfBook.get(bookId) ?? null) : null,
      updatedAt: d.row.updated_at,
    };
  });
}

// Before migration 20261125100000_scan_drafts.sql runs, the table doesn't
// exist yet: the screens work without stored answers instead of failing.
// (PGRST205 = PostgREST can't find the table; 42P01 = Postgres "no such table")
function draftsMissing(error: { code?: string }): boolean {
  if (error.code !== "PGRST205" && error.code !== "42P01") return false;
  console.warn("scan_drafts is missing: run supabase/migrations/20261125100000_scan_drafts.sql");
  return true;
}

async function activeRecipeIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase.from("active_recipes").select("id").in("id", [...new Set(ids)]);
  if (error) fail("activeRecipeIds", error);
  return new Set(data.map((r) => r.id));
}

function onlyActive(saved: Record<string, string>, active: Set<string>): Record<string, string> {
  return Object.fromEntries(Object.entries(saved).filter(([, id]) => active.has(id)));
}
