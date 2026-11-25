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
  const { data, error } = await supabase
    .from("source_pages")
    .insert(paths.map((image_path) => ({ image_path, cookbook_id })))
    .select("id, image_path");

  if (error) {
    console.error("createScanPages error:", error.code, error.message);
    return { ok: false, error: "generic" };
  }

  // One insert = one transaction: either all rows exist or none
  const ordered = inOrder(data, (row) => row.image_path, paths);
  if (!ordered) {
    console.error("createScanPages: rows missing after insert");
    return { ok: false, error: "generic" };
  }
  return { ok: true, pageIds: ordered.map((row) => row.id) };
}
