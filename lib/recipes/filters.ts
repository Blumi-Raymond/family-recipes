// The recipe list's search and filters live in the URL, so a filtered list
// can be bookmarked, shared, and survives "back":
//   /he?q=עוגה&kosher=dairy&tags=<id>,<id>&book=<id>
import { isUuid } from "@/lib/validation";
import type { KosherType } from "./schema";

export type Filters = {
  q: string;
  kosher: KosherType | null;
  tagIds: string[];
  bookId: string | null;
};

type Params = Record<string, string | string[] | undefined>;

const KOSHER = ["meat", "dairy", "pareve"] as const;

export function parseFilters(params: Params): Filters {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : "";
  };
  const kosher = one("kosher");
  return {
    q: one("q").trim().slice(0, 100),
    kosher: (KOSHER as readonly string[]).includes(kosher) ? (kosher as KosherType) : null,
    tagIds: [...new Set(one("tags").split(",").filter(isUuid))].slice(0, 20),
    bookId: isUuid(one("book")) ? one("book") : null,
  };
}

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.kosher) params.set("kosher", f.kosher);
  if (f.tagIds.length) params.set("tags", f.tagIds.join(","));
  if (f.bookId) params.set("book", f.bookId);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const hasFilters = (f: Filters) =>
  Boolean(f.q || f.kosher || f.tagIds.length || f.bookId);
