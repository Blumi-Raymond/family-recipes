// Page photos for a scan: the rules for creating them, and how their ids
// travel in the address of the next screen (/scan/review?pages=a,b).
// Safe to import anywhere (browser, server, tests).
import * as z from "zod";
import { MAX_SOURCE_PAGES } from "@/lib/recipes/schema";
import { imagePath, isUuid, uuid } from "@/lib/validation";

export const MAX_SCAN_PAGES = MAX_SOURCE_PAGES; // one recipe can span up to 4 pages

// What the scan screen sends to the server: the book (or none) and the
// uploaded page photos, in reading order.
export const scanPagesSchema = z.object({
  cookbook_id: uuid.nullable(),
  paths: z
    .array(imagePath("pages"))
    .min(1, { error: "required" })
    .max(MAX_SCAN_PAGES, { error: "tooMany" })
    .refine((paths) => new Set(paths).size === paths.length, { error: "generic" }),
});

export type ScanPagesInput = z.infer<typeof scanPagesSchema>;

// ids -> "a,b,c" for the address
export function pageIdsParam(ids: string[]): string {
  return ids.join(",");
}

// "a,b,c" from the address -> ids in order, or null if anything is off
// (not ids, repeated, too many, missing). A bad link then shows "not found".
export function parsePageIds(param: string | string[] | undefined): string[] | null {
  if (typeof param !== "string" || param === "") return null;
  const ids = param.split(",").map((id) => id.trim().toLowerCase());
  if (ids.length > MAX_SCAN_PAGES) return null;
  if (!ids.every(isUuid)) return null;
  if (new Set(ids).size !== ids.length) return null;
  return ids;
}

// Rows from the database come back in no guaranteed order:
// put them in the order of `keys` (the order she chose).
// Returns null if any key is missing.
export function inOrder<T>(rows: T[], keyOf: (row: T) => string, keys: string[]): T[] | null {
  const byKey = new Map(rows.map((row) => [keyOf(row), row]));
  const ordered: T[] = [];
  for (const key of keys) {
    const row = byKey.get(key);
    if (!row) return null;
    ordered.push(row);
  }
  return ordered;
}
