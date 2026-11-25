// One scanned recipe -> the recipe form's state (the same form used to add a
// recipe by hand), plus what the review screen shows next to it:
// "check this" marks, the reason for meat/dairy/pareve, handwritten changes.
//
// Marks use the same keys as the form's errors (lib/recipes/form-state.ts):
//   "title", "servings", "kosher_type", ...   top fields
//   "ingredient.<rowKey>" / "ingredient.<rowKey>.quantity"   a row / a field in it
//   "step.<rowKey>"                            a step
//   "general"                                   the recipe as a whole
//
// Safe to import anywhere (browser, server, tests).
import type { Locale } from "@/lib/i18n/config";
import { detectLanguage } from "@/lib/i18n/detect";
import {
  emptyIngredient,
  emptyStep,
  type IngredientRow,
  type RecipeFormState,
  type StepRow,
} from "@/lib/recipes/form-state";
import { parseQuantity } from "@/lib/recipes/quantity";
import type { CheckField, ScannedRecipe } from "./answer";

// Reasons found by the code (the screen turns them into text)
export type ReviewCode =
  | "quantity" // amount not understood
  | "number" // servings / minutes / page not a whole number
  | "kosherMissing" // no meat/dairy/pareve suggestion
  | "titleMissing"
  | "titleSuggested" // no name was printed; this one is a suggestion
  | "ingredientName" // a line with no ingredient name
  | "empty"; // no ingredients and no steps

export type ReviewCheck = {
  target: string;
  reason: { kind: "ai"; text: string } | { kind: "code"; code: ReviewCode };
};

export type ScanReview = {
  checks: ReviewCheck[];
  kosherReason: string;
  handwritten: Record<string, string>; // row key -> the printed text it replaced
  handwrittenPage: boolean;
  continuesOnNextPage: boolean;
  droppedTags: string[]; // suggested tags that don't exist (not used)
};

export type ToFormContext = {
  locale: Locale; // the site's language (fallback for the recipe's language)
  bookId: string; // chosen on the scan screen; "" = not from a book
  tags: { id: string; slug: string }[];
  handwrittenSource: string; // "בכתב יד" — source for a handwritten sheet with no book
};

const DIGITS = /^\d+$/;
const TOP_FIELDS: Partial<Record<CheckField, string>> = {
  title: "title",
  yield_text: "yield_text",
  servings: "servings",
  prep_minutes: "prep_minutes",
  cook_minutes: "cook_minutes",
  total_minutes: "total_minutes",
  page_number: "page_number",
  kosher_type: "kosher_type",
  tags: "tags",
  notes: "notes",
};

// "3-2" (a Hebrew range written right-to-left) -> "2-3". Anything the
// shared amount rules (lib/recipes/quantity.ts) accept is kept as is.
// Returns null when the amount can't be understood.
export function normalizeQuantity(text: string): string | null {
  const s = text.trim();
  if (parseQuantity(s)) return s;
  const range = s.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (range) {
    const swapped = `${range[2].trim()}-${range[1].trim()}`;
    if (parseQuantity(swapped)) return swapped;
  }
  return null;
}

export function scannedRecipeToForm(
  recipe: ScannedRecipe,
  ctx: ToFormContext,
): { form: RecipeFormState; review: ScanReview } {
  const checks: ReviewCheck[] = [];
  const code = (target: string, c: ReviewCode) => checks.push({ target, reason: { kind: "code", code: c } });
  const handwritten: Record<string, string> = {};

  // ---- ingredients: a heading row whenever the section changes ----
  const ingredients: IngredientRow[] = [];
  const ingredientKey: string[] = []; // position in the answer -> row key
  let section = "";
  recipe.ingredients.forEach((ing, i) => {
    if (ing.section !== section) {
      ingredients.push({ key: `sih${i}`, kind: "heading", text: ing.section });
      section = ing.section;
    }
    const key = `si${i}`;
    ingredientKey.push(key);
    const quantity = normalizeQuantity(ing.quantity);
    if (quantity === null) code(`ingredient.${key}.quantity`, "quantity");
    if (!ing.name) code(`ingredient.${key}.name`, "ingredientName");
    if (ing.handwritten) handwritten[key] = ing.handwritten;
    ingredients.push({
      key,
      kind: "item",
      quantity: quantity ?? ing.quantity, // not understood: shown as is, marked
      unit: ing.unit,
      name: ing.name,
      note: ing.note,
      optional: ing.optional,
      original: ing.original_text,
    });
  });

  // ---- steps ----
  const steps: StepRow[] = [];
  const stepKey: string[] = [];
  section = "";
  recipe.steps.forEach((step, i) => {
    if (step.section !== section) {
      steps.push({ key: `ssh${i}`, kind: "heading", text: step.section });
      section = step.section;
    }
    const key = `ss${i}`;
    stepKey.push(key);
    if (step.handwritten) handwritten[key] = step.handwritten;
    steps.push({ key, kind: "item", text: step.text });
  });

  if (recipe.ingredients.length === 0 && recipe.steps.length === 0) code("general", "empty");

  // ---- numbers: digits only; anything else is kept and marked ----
  const numbers = {
    servings: recipe.servings,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    total_minutes: recipe.total_minutes,
    page_number: recipe.page_number,
  };
  for (const [field, value] of Object.entries(numbers)) {
    if (value && !DIGITS.test(value)) code(field, "number");
  }

  // ---- title, meat/dairy/pareve ----
  if (!recipe.title) code("title", "titleMissing");
  else if (recipe.title_suggested) code("title", "titleSuggested");
  if (!recipe.kosher_type) code("kosher_type", "kosherMissing");

  // ---- the AI's own marks, moved onto the form's rows ----
  for (const c of recipe.checks) {
    if (!c.reason) continue;
    let target = "general";
    if (c.field === "ingredient") {
      const key = ingredientKey[c.index];
      if (key) target = `ingredient.${key}`;
    } else if (c.field === "step") {
      const key = stepKey[c.index];
      if (key) target = `step.${key}`;
    } else {
      target = TOP_FIELDS[c.field] ?? "general";
    }
    checks.push({ target, reason: { kind: "ai", text: c.reason } });
  }

  // ---- tags: only ones that exist (anything else is dropped here) ----
  const bySlug = new Map(ctx.tags.map((t) => [t.slug, t.id]));
  const tagIds = [...new Set(recipe.tags.map((slug) => bySlug.get(slug)).filter((id): id is string => !!id))];
  const droppedTags = recipe.tags.filter((slug) => !bySlug.has(slug));

  // A handwritten sheet with no book chosen: source "handwritten" (editable)
  const sourceNote = !ctx.bookId && recipe.handwritten_page ? ctx.handwrittenSource : "";

  const texts = [recipe.title, ...recipe.ingredients.map((i) => i.name), ...recipe.steps.map((s) => s.text)];

  const form: RecipeFormState = {
    id: null,
    title: recipe.title,
    description: "",
    language: detectLanguage(texts, ctx.locale),
    kosher: recipe.kosher_type,
    yieldText: recipe.yield_text,
    servings: recipe.servings,
    prep: recipe.prep_minutes,
    cook: recipe.cook_minutes,
    total: recipe.total_minutes,
    notes: recipe.notes,
    bookId: ctx.bookId,
    page: recipe.page_number,
    sourceNote,
    ingredients: ingredients.length ? ingredients : [emptyIngredient("si0")],
    steps: steps.length ? steps : [emptyStep("ss0")],
    tagIds,
    photos: [],
  };

  return {
    form,
    review: {
      checks,
      kosherReason: recipe.kosher_reason,
      handwritten,
      handwrittenPage: recipe.handwritten_page,
      continuesOnNextPage: recipe.continues_on_next_page,
      droppedTags,
    },
  };
}
