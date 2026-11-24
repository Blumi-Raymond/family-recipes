// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formToInput, initialFormState, type RecipeFormState } from "../lib/recipes/form-state";
import { detectLanguage } from "../lib/i18n/detect";
import type { RecipeDetails } from "../lib/data/recipes";

const G = "b9dea35a-2f94-4e22-8fd9-1a772b9a3216";
const item = (key: string, quantity: string, name: string, note = "") =>
  ({ key, kind: "item", quantity, unit: "", name, note, optional: false, original: "" }) as const;
const heading = (key: string, text: string) => ({ key, kind: "heading", text }) as const;

function valid(extra: Partial<RecipeFormState> = {}): RecipeFormState {
  return { ...initialFormState(null, "he"), title: "עוגה", kosher: "dairy", ...extra };
}

test("empty form: title and meat/dairy/pareve are required", () => {
  const r = formToInput(initialFormState(null, "he"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.errors, { title: "required", kosher_type: "kosherRequired" });
});

test("headings apply to the rows below; empty rows are skipped", () => {
  const r = formToInput(
    valid({
      ingredients: [heading("h", "לבצק"), item("a", "1½", "קמח"), item("b", "", ""), heading("h2", "לציפוי"), item("c", "", "סוכר", "לפי הטעם")],
      steps: [{ key: "s", kind: "item", text: "לערבב" }, { key: "x", kind: "item", text: "   " }],
    }),
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(
    r.input.ingredients.map((i) => [i.section, i.quantity, i.name]),
    [["לבצק", 1.5, "קמח"], ["לציפוי", null, "סוכר"]],
  );
  assert.equal(r.input.steps.length, 1);
});

test("row errors point at the right row", () => {
  const r = formToInput(valid({ servings: "abc", ingredients: [item("a", "x", "קמח"), item("b", "2", "")] }));
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.errors["ingredient.a.quantity"], "quantity");
    assert.equal(r.errors["ingredient.b.name"], "ingredientName");
    assert.equal(r.errors.servings, "wholeNumber");
  }
});

test("with a book: page must be positive, other source is dropped", () => {
  const bad = formToInput(valid({ bookId: G, page: "0", sourceNote: "סבתא" }));
  assert.equal(bad.ok, false);
  const ok = formToInput(valid({ bookId: G, page: "12", sourceNote: "סבתא" }));
  assert.ok(ok.ok && ok.input.page_number === 12 && ok.input.source_note === "");
});

test("loading and saving again keeps headings (including back to 'no heading')", () => {
  const ing = (name: string, section: string | null) => ({
    section, quantity: 1, quantity_max: null, unit: null, name, note: null, is_optional: false, original_text: `orig ${name}`,
  });
  const recipe: RecipeDetails = {
    id: G, group_id: G, title: "Cake", description: null, language: "en", kosher_type: "pareve",
    yield_text: null, servings: null, prep_minutes: null, cook_minutes: null, total_minutes: null,
    notes: null, cookbook_id: null, page_number: null, source_note: null, book: null,
    ingredients: [ing("a", null), ing("b", "Dough"), ing("c", "Dough"), ing("d", null), ing("e", "Top")],
    steps: [{ section: "S1", instruction: "x" }, { section: null, instruction: "y" }],
    tagIds: [], photos: [],
  };
  const r = formToInput(initialFormState(recipe, "he"));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.input.ingredients.map((i) => [i.name, i.section || null, i.original_text]), [
    ["a", null, "orig a"], ["b", "Dough", "orig b"], ["c", "Dough", "orig c"], ["d", null, "orig d"], ["e", "Top", "orig e"],
  ]);
  assert.deepEqual(r.input.steps.map((s) => s.section || null), ["S1", null]);
  assert.equal(r.input.language, "en");
});

test("language is detected from the text", () => {
  assert.equal(detectLanguage(["עוגת שוקולד", "2 cups"], "en"), "he");
  assert.equal(detectLanguage(["Chocolate cake", "קמח"], "he"), "en");
  assert.equal(detectLanguage(["", "123"], "en"), "en");
});
