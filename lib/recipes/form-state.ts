// The recipe form's state (what she types) and how it turns into a
// RecipeInput (what is saved). Kept apart from the screen so it's easy to
// reason about and to test.
//
// Ingredients and steps are lists of rows. A row is either an item or a
// heading ("For the dough"); a heading applies to the items below it.
import type { Locale } from "@/lib/i18n/config";
import { detectLanguage } from "@/lib/i18n/detect";
import { numberOrNull, toFieldErrors, type FieldErrors } from "@/lib/validation";
import type { RecipeDetails } from "@/lib/data/recipes";
import type { PickedPhoto } from "@/components/photo-picker";
import { parseQuantity, quantityToText } from "./quantity";
import { recipeSchema, type KosherType, type RecipeInput } from "./schema";

export type IngredientRow =
  | {
      key: string;
      kind: "item";
      quantity: string;
      unit: string;
      name: string;
      note: string;
      optional: boolean;
      original: string; // line from a scanned book (kept as is)
    }
  | { key: string; kind: "heading"; text: string };

export type StepRow =
  | { key: string; kind: "item"; text: string }
  | { key: string; kind: "heading"; text: string };

export type RecipeFormState = {
  id: string | null;
  title: string;
  description: string;
  language: Locale; // starting guess only; the saved language is detected from the text
  kosher: KosherType | "";
  yieldText: string;
  servings: string;
  prep: string;
  cook: string;
  total: string;
  notes: string;
  bookId: string; // "" = no book
  page: string;
  sourceNote: string;
  ingredients: IngredientRow[];
  steps: StepRow[];
  tagIds: string[];
  photos: PickedPhoto[];
};

// Row keys. Rows that exist when the page loads get keys from their position
// (same on server and browser); rows added later get new ones.
let counter = 0;
export const newKey = () => `n${++counter}`;

export const emptyIngredient = (key: string): IngredientRow => ({
  key,
  kind: "item",
  quantity: "",
  unit: "",
  name: "",
  note: "",
  optional: false,
  original: "",
});

export const emptyStep = (key: string): StepRow => ({ key, kind: "item", text: "" });

const numText = (n: number | null) => (n === null ? "" : String(n));

export function initialFormState(recipe: RecipeDetails | null, locale: Locale): RecipeFormState {
  if (!recipe) {
    return {
      id: null,
      title: "",
      description: "",
      language: locale,
      kosher: "",
      yieldText: "",
      servings: "",
      prep: "",
      cook: "",
      total: "",
      notes: "",
      bookId: "",
      page: "",
      sourceNote: "",
      ingredients: [emptyIngredient("i0"), emptyIngredient("i1"), emptyIngredient("i2")],
      steps: [emptyStep("s0"), emptyStep("s1")],
      tagIds: [],
      photos: [],
    };
  }

  // Lists in the database carry their heading on every item; on screen the
  // heading appears once, above its items.
  const ingredients: IngredientRow[] = [];
  let section: string | null = null;
  // A change of heading adds a heading row. Going back to "no heading"
  // (possible in scanned recipes) adds an empty heading row, so saving the
  // form again keeps those items without a heading.
  recipe.ingredients.forEach((ing, i) => {
    if (ing.section !== section && (ing.section || section)) {
      ingredients.push({ key: `ih${i}`, kind: "heading", text: ing.section ?? "" });
    }
    section = ing.section;
    ingredients.push({
      key: `i${i}`,
      kind: "item",
      quantity: quantityToText(ing.quantity, ing.quantity_max),
      unit: ing.unit ?? "",
      name: ing.name,
      note: ing.note ?? "",
      optional: ing.is_optional,
      original: ing.original_text ?? "",
    });
  });

  const steps: StepRow[] = [];
  section = null;
  recipe.steps.forEach((step, i) => {
    if (step.section !== section && (step.section || section)) {
      steps.push({ key: `sh${i}`, kind: "heading", text: step.section ?? "" });
    }
    section = step.section;
    steps.push({ key: `s${i}`, kind: "item", text: step.instruction });
  });

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description ?? "",
    language: recipe.language,
    kosher: recipe.kosher_type,
    yieldText: recipe.yield_text ?? "",
    servings: numText(recipe.servings),
    prep: numText(recipe.prep_minutes),
    cook: numText(recipe.cook_minutes),
    total: numText(recipe.total_minutes),
    notes: recipe.notes ?? "",
    bookId: recipe.cookbook_id ?? "",
    page: numText(recipe.page_number),
    sourceNote: recipe.source_note ?? "",
    ingredients: ingredients.length ? ingredients : [emptyIngredient("i0")],
    steps: steps.length ? steps : [emptyStep("s0")],
    tagIds: recipe.tagIds,
    photos: recipe.photos.map((p) => ({ path: p.path, previewUrl: p.thumbUrl, is_cover: p.is_cover })),
  };
}

// The recipe's language, from what she typed (title, ingredients, steps)
export function recipeLanguage(form: RecipeFormState): Locale {
  const texts = [form.title, form.description];
  for (const r of form.ingredients) texts.push(r.kind === "item" ? r.name : r.text);
  for (const r of form.steps) texts.push(r.text);
  return detectLanguage(texts, form.language);
}

// Form -> what is saved, plus errors keyed for the screen:
//   "title", "kosher_type", ...       top fields
//   "ingredient.<rowKey>.quantity"     a field in a row
//   "ingredients", "steps", "photos"   the whole list (e.g. too many)
export function formToInput(
  form: RecipeFormState,
): { ok: true; input: RecipeInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  // Ingredients: skip empty rows; headings set the section of the rows below
  const ingredientKeys: string[] = [];
  const ingredients: RecipeInput["ingredients"] = [];
  let section = "";
  for (const row of form.ingredients) {
    if (row.kind === "heading") {
      section = row.text.trim();
      continue;
    }
    const isEmpty = !row.quantity.trim() && !row.unit.trim() && !row.name.trim() && !row.note.trim();
    if (isEmpty) continue;
    const amount = parseQuantity(row.quantity);
    if (!amount) errors[`ingredient.${row.key}.quantity`] = "quantity";
    ingredientKeys.push(row.key);
    ingredients.push({
      section,
      quantity: amount?.quantity ?? null,
      quantity_max: amount?.quantityMax ?? null,
      unit: row.unit,
      name: row.name,
      note: row.note,
      is_optional: row.optional,
      original_text: row.original,
    });
  }

  const stepKeys: string[] = [];
  const steps: RecipeInput["steps"] = [];
  section = "";
  for (const row of form.steps) {
    if (row.kind === "heading") {
      section = row.text.trim();
      continue;
    }
    if (!row.text.trim()) continue;
    stepKeys.push(row.key);
    steps.push({ section, instruction: row.text });
  }

  // With a book: page number and no "other source"; without: the opposite
  const hasBook = form.bookId !== "";
  const input: RecipeInput = {
    id: form.id,
    title: form.title,
    description: form.description,
    language: recipeLanguage(form),
    kosher_type: form.kosher as KosherType, // "" fails the rules below
    yield_text: form.yieldText,
    servings: numberOrNull(form.servings),
    prep_minutes: numberOrNull(form.prep),
    cook_minutes: numberOrNull(form.cook),
    total_minutes: numberOrNull(form.total),
    notes: form.notes,
    cookbook_id: hasBook ? form.bookId : null,
    page_number: hasBook ? numberOrNull(form.page) : null,
    source_note: hasBook ? "" : form.sourceNote,
    ingredients,
    steps,
    tag_ids: form.tagIds,
    photos: form.photos.map((p) => ({ path: p.path, is_cover: p.is_cover })),
  };

  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    for (const [path, key] of Object.entries(toFieldErrors(parsed.error))) {
      const [list, index, field] = path.split(".");
      if (list === "ingredients" && index !== undefined && field) {
        const name = `ingredient.${ingredientKeys[Number(index)]}.${field}`;
        if (!(name in errors)) errors[name] = key;
      } else if (list === "steps" && index !== undefined && field) {
        errors[`step.${stepKeys[Number(index)]}`] = key;
      } else if (!(list in errors)) {
        errors[list] = key;
      }
    }
  }

  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, errors };
  return { ok: true, input: parsed.data };
}
