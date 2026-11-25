// Page photos of a scan, for the review screen.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { signImageUrls } from "@/lib/images/server";
import { inOrder } from "@/lib/scan/pages";
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
