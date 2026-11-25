"use server";
// Scan screen: after the page photos are uploaded, create one source_pages
// row per photo (in reading order). The database checks the rest:
// RLS (my group), the photo is in my group's "pages/" folder, and the
// cookbook is in the same group.
import { createClient } from "@/lib/supabase/server";
import { inOrder, scanPagesSchema, type ScanPagesInput } from "@/lib/scan/pages";

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
