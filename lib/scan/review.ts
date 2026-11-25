// The review screen's logic, kept apart from the screen so it can be tested:
//   - the "check this" marks, in the order of the form, each with where it
//     points (a field / ingredient N / step N) and which input to jump to
//   - the marks to show under each field or row
//   - the saved state of a pasted answer (kept in the browser's session, so
//     going back or reloading doesn't lose an answer that took a chat to get)
//   - comparing recipe titles (warning about a recipe saved twice)
//
// Marks follow the CURRENT form: if she removes a row, its marks go too.
// Safe to import anywhere (browser, server, tests).
import type { Dictionary } from "@/lib/i18n/dictionaries/he";
import type { IngredientRow, RecipeFormState, StepRow } from "@/lib/recipes/form-state";
import type { ReviewCheck } from "./to-form";

export type MarkReason = ReviewCheck["reason"];

// The text of a mark: the AI's own words, or ours for what the code found
export function reasonText(reason: MarkReason, texts: Dictionary["scanReview"]["reasons"]): string {
  return reason.kind === "ai" ? reason.text : texts[reason.code];
}

// Top fields that can carry a mark, in the order they appear in the form
export const MARK_FIELDS = [
  "kosher_type",
  "title",
  "page_number",
  "yield_text",
  "servings",
  "prep_minutes",
  "cook_minutes",
  "total_minutes",
] as const;
const AFTER_STEPS = ["notes", "tags"] as const;
export type MarkField = (typeof MARK_FIELDS)[number] | (typeof AFTER_STEPS)[number];

export type MarkPlace =
  | { kind: "field"; field: MarkField }
  | { kind: "ingredient"; n: number; name: string } // n counts items only, from 1
  | { kind: "step"; n: number }
  | { kind: "general" };

export type SummaryItem = {
  key: string; // unique, for React
  place: MarkPlace;
  reason: MarkReason;
  focusId: string | null; // id of the input to move to (null = nothing to move to)
};

// Ids of the form's inputs (app/[lang]/(app)/recipes/recipe-form.tsx)
const FIELD_INPUT: Record<MarkField, string> = {
  kosher_type: "kosher",
  title: "title",
  page_number: "page",
  yield_text: "yield",
  servings: "servings",
  prep_minutes: "prep",
  cook_minutes: "cook",
  total_minutes: "total",
  notes: "notes",
  tags: "tags",
};
export const ingredientInputId = (key: string, field: "quantity" | "name") => `ing-${key}-${field}`;
export const stepInputId = (key: string) => `step-${key}`;

const isField = (s: string): s is MarkField =>
  (MARK_FIELDS as readonly string[]).includes(s) || (AFTER_STEPS as readonly string[]).includes(s);

// Items of a list, numbered 1, 2, 3... (headings are skipped)
function numberItems(rows: (IngredientRow | StepRow)[]): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const row of rows) if (row.kind === "item") numbers.set(row.key, numbers.size + 1);
  return numbers;
}

// "ingredient.<key>" / "ingredient.<key>.quantity" -> ["ingredient", key, "quantity"]
function splitTarget(target: string): [string, string, string] {
  const [list, key = "", field = ""] = target.split(".");
  return [list, key, field];
}

// All marks, in the order of the form. A mark on a row she removed is dropped.
export function summarizeChecks(checks: ReviewCheck[], form: RecipeFormState): SummaryItem[] {
  const ingredientNo = numberItems(form.ingredients);
  const stepNo = numberItems(form.steps);
  const ingredientName = new Map(
    form.ingredients.flatMap((r) => (r.kind === "item" ? [[r.key, r.name.trim()] as const] : [])),
  );

  const placed: { order: number; item: SummaryItem }[] = [];
  checks.forEach((check, i) => {
    const [list, key, field] = splitTarget(check.target);
    const base = { key: `${i}`, reason: check.reason };

    if (list === "ingredient") {
      const n = ingredientNo.get(key);
      if (n === undefined) return; // the row was removed
      placed.push({
        order: 100 + n,
        item: {
          ...base,
          place: { kind: "ingredient", n, name: ingredientName.get(key) ?? "" },
          focusId: ingredientInputId(key, field === "name" ? "name" : "quantity"),
        },
      });
    } else if (list === "step") {
      const n = stepNo.get(key);
      if (n === undefined) return;
      placed.push({ order: 1000 + n, item: { ...base, place: { kind: "step", n }, focusId: stepInputId(key) } });
    } else if (isField(list)) {
      // Page number exists only when a book is chosen; otherwise move to the book
      const focusId = list === "page_number" && !form.bookId ? "book" : FIELD_INPUT[list];
      const before = (MARK_FIELDS as readonly string[]).indexOf(list);
      const order = before >= 0 ? before : 10000 + (AFTER_STEPS as readonly string[]).indexOf(list);
      placed.push({ order, item: { ...base, place: { kind: "field", field: list }, focusId } });
    } else {
      placed.push({ order: 100000, item: { ...base, place: { kind: "general" }, focusId: null } });
    }
  });

  // Stable sort: marks on the same place keep their order
  return placed
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map((p) => p.item);
}

// Marks to show under a field or a row, by place:
//   "title", "notes", ...    a top field
//   "ingredient.<key>"       everything about that row (its fields included)
//   "step.<key>"
// ("general" marks appear only in the summary.)
export function marksByPlace(checks: ReviewCheck[]): Map<string, MarkReason[]> {
  const map = new Map<string, MarkReason[]>();
  for (const check of checks) {
    const [list, key] = splitTarget(check.target);
    const place = list === "ingredient" || list === "step" ? `${list}.${key}` : isField(list) ? list : null;
    if (!place) continue;
    map.set(place, [...(map.get(place) ?? []), check.reason]);
  }
  return map;
}

// ---------------------------------------------------------------------
// A pasted answer, kept for this browser tab (sessionStorage)
// ---------------------------------------------------------------------
export type StoredAnswer = {
  text: string; // the pasted answer, as pasted
  saved: Record<string, string>; // recipe position in the answer -> saved recipe id
};

export const answerStorageKey = (pageIds: string[]) => `scan-answer:${pageIds.join(",")}`;

export function readStoredAnswer(raw: string | null): StoredAnswer | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { text, saved } = data as Record<string, unknown>;
    if (typeof text !== "string") return null;
    const clean: Record<string, string> = {};
    if (typeof saved === "object" && saved !== null) {
      for (const [k, v] of Object.entries(saved)) {
        if (/^\d+$/.test(k) && typeof v === "string") clean[k] = v;
      }
    }
    return { text, saved: clean };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Same recipe twice? Titles are compared loosely: case, spaces, quotes,
// Hebrew geresh/gershayim and dashes don't matter.
// ---------------------------------------------------------------------
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/["'`׳״“”‘’\-–—.,:;!?()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sameTitle(a: string, b: string): boolean {
  const x = normalizeTitle(a);
  return x !== "" && x === normalizeTitle(b);
}
