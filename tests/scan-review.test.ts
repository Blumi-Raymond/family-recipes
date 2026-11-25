// Run: npm test
// The review screen's logic: the "check this" summary, marks under fields,
// which stored recipes were saved, and comparing titles (same recipe saved twice).
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScannedRecipe } from "../lib/scan/answer";
import { scannedRecipeToForm, type ToFormContext } from "../lib/scan/to-form";
import {
  marksByPlace,
  normalizeTitle,
  readSaved,
  reasonText,
  sameTitle,
  summarizeChecks,
  unsavedIndexes,
} from "../lib/scan/review";
import he from "../lib/i18n/dictionaries/he";

const ctx: ToFormContext = { locale: "he", bookId: "", tags: [], handwrittenSource: "בכתב יד" };

const ing = (over: Partial<ScannedRecipe["ingredients"][number]>) => ({
  section: "",
  original_text: "",
  quantity: "1",
  unit: "",
  name: "x",
  note: "",
  optional: false,
  handwritten: "",
  ...over,
});

function recipe(over: Partial<ScannedRecipe> = {}): ScannedRecipe {
  return {
    title: "עוגה",
    title_suggested: false,
    page_number: "",
    yield_text: "",
    servings: "",
    prep_minutes: "",
    cook_minutes: "",
    total_minutes: "",
    ingredients: [],
    steps: [],
    notes: "",
    kosher_type: "dairy",
    kosher_reason: "חלבי בגלל: חמאה",
    tags: [],
    handwritten_page: false,
    continues_on_next_page: false,
    checks: [],
    ...over,
  };
}

const draft = () =>
  scannedRecipeToForm(
    recipe({
      title: "",
      servings: "4-6",
      ingredients: [
        ing({ section: "לבצק", name: "קמח", quantity: "כוס וחצי" }),
        ing({ section: "לבצק", name: "סוכר", handwritten: "1 כוס" }),
        ing({ name: "חמאה" }),
      ],
      steps: [
        { section: "", text: "מערבבים", handwritten: "" },
        { section: "", text: "אופים", handwritten: "" },
      ],
      checks: [
        { field: "general", index: -1, reason: "הדף מקומט" },
        { field: "step", index: 1, reason: "זמן האפייה לא ברור" },
        { field: "ingredient", index: 2, reason: "חמאה או מרגרינה" },
        { field: "kosher_type", index: -1, reason: "תלוי במרגרינה" },
        { field: "notes", index: -1, reason: "הערה בשוליים" },
        { field: "page_number", index: -1, reason: "לא מודפס" },
      ],
    }),
    ctx,
  );

test("summary: in the order of the form, each pointing at its input", () => {
  const { form, review } = draft();
  const items = summarizeChecks(review.checks, form);
  assert.deepEqual(
    items.map((i) => [i.place.kind === "field" ? i.place.field : i.place.kind, i.focusId]),
    [
      ["kosher_type", "kosher"],
      ["title", "title"], // no name found (code)
      ["page_number", "book"], // no book chosen: move to the book
      ["servings", "servings"], // "4-6" is not a whole number (code)
      ["ingredient", "ing-si0-quantity"], // "כוס וחצי" not understood (code)
      ["ingredient", "ing-si2-quantity"],
      ["step", "step-ss1"],
      ["notes", "notes"],
      ["general", null],
    ],
  );
  // Ingredients and steps are numbered without headings, with the name
  const third = items.find((i) => i.focusId === "ing-si2-quantity")!;
  assert.deepEqual(third.place, { kind: "ingredient", n: 3, name: "חמאה" });
  const step = items.find((i) => i.place.kind === "step")!;
  assert.deepEqual(step.place, { kind: "step", n: 2 });
});

test("summary follows the form: a removed row's marks go, a moved row is renumbered", () => {
  const { form, review } = draft();
  const withBook = { ...form, bookId: "b", ingredients: form.ingredients.filter((r) => r.key !== "si0") };
  const items = summarizeChecks(review.checks, withBook);
  assert.equal(items.some((i) => i.focusId === "ing-si0-quantity"), false);
  assert.deepEqual(items.find((i) => i.focusId === "ing-si2-quantity")!.place, {
    kind: "ingredient",
    n: 2,
    name: "חמאה",
  });
  assert.equal(items.find((i) => i.place.kind === "field" && i.place.field === "page_number")!.focusId, "page");
});

test("marks under fields: grouped by field / row; general only in the summary", () => {
  const { review } = draft();
  const marks = marksByPlace(review.checks);
  assert.equal(marks.get("ingredient.si0")?.length, 1); // the quantity mark sits on the row
  assert.equal(marks.get("ingredient.si2")?.length, 1);
  assert.equal(marks.get("step.ss1")?.length, 1);
  assert.equal(marks.get("kosher_type")?.length, 1);
  assert.equal(marks.has("general"), false);
  assert.equal(review.handwritten.si1, "1 כוס");
  // Text: the AI's words, or ours
  assert.equal(reasonText(marks.get("step.ss1")![0], he.scanReview.reasons), "זמן האפייה לא ברור");
  assert.equal(reasonText(marks.get("ingredient.si0")![0], he.scanReview.reasons), he.scanReview.reasons.quantity);
});

test("saved recipes of a stored answer: read safely from the database", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
  // positions beyond the answer, non-ids and odd keys are ignored
  assert.deepEqual(readSaved({ "0": id, "1": id.toUpperCase(), "5": id, x: id, "2": 7, "3": "abc" }, 4), {
    "0": id,
    "1": id,
  });
  assert.deepEqual(readSaved(null, 3), {});
  assert.deepEqual(readSaved([id], 3), {});
  assert.deepEqual(readSaved("x", 3), {});
  assert.deepEqual(unsavedIndexes(3, { "1": id }), [0, 2]);
  assert.deepEqual(unsavedIndexes(2, { "0": id, "1": id }), []);
  assert.deepEqual(unsavedIndexes(0, {}), []);
});

test("same title: case, spaces, quotes and dashes don't matter; empty never matches", () => {
  assert.ok(sameTitle("עוגת  שמרים", "עוגת שמרים"));
  assert.ok(sameTitle('עוגת "סבתא"', "עוגת סבתא"));
  assert.ok(sameTitle("קרם פטיסייר — מהיר", "קרם פטיסייר מהיר"));
  assert.ok(sameTitle("Apple Pie", "apple pie."));
  assert.ok(sameTitle("צ׳ולנט", "צ'ולנט"));
  assert.equal(sameTitle("עוגת גבינה", "עוגת שמרים"), false);
  assert.equal(sameTitle("", ""), false);
  assert.equal(sameTitle("--", "."), false);
  assert.equal(normalizeTitle("  A  b "), "a b");
});
