// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANSWER_JSON_SCHEMA, scanAnswerSchema, type ScannedRecipe } from "../lib/scan/answer";
import { parseScanAnswer } from "../lib/scan/parse";
import { buildScanPrompt } from "../lib/scan/prompt";
import { normalizeQuantity, scannedRecipeToForm, type ToFormContext } from "../lib/scan/to-form";
import { formToInput } from "../lib/recipes/form-state";

// ---------------------------------------------------------------------
// The JSON schema (sent to the API) and zod (checks answers) must agree,
// and the JSON schema must keep the API's rules.
// ---------------------------------------------------------------------
type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  enum?: string[];
  [key: string]: unknown;
};

const FORBIDDEN = ["minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "pattern", "default", "anyOf", "oneOf"];

function walk(schema: Schema, path: string, visit: (s: Schema, path: string) => void) {
  visit(schema, path);
  for (const [k, v] of Object.entries(schema.properties ?? {})) walk(v, `${path}.${k}`, visit);
  if (schema.items) walk(schema.items, `${path}[]`, visit);
}

test("JSON schema keeps the API's rules: closed objects, all required, no limits", () => {
  walk(ANSWER_JSON_SCHEMA as Schema, "answer", (s, path) => {
    for (const key of FORBIDDEN) assert.equal(key in s, false, `${path} uses "${key}"`);
    if (s.type === "object") {
      assert.equal(s.additionalProperties, false, `${path} must be closed`);
      assert.deepEqual([...(s.required ?? [])].sort(), Object.keys(s.properties ?? {}).sort(), `${path}: all required`);
    }
  });
});

// A full answer built from the JSON schema itself (every field present)
function sampleFrom(s: Schema): unknown {
  if (s.type === "object") return Object.fromEntries(Object.entries(s.properties ?? {}).map(([k, v]) => [k, sampleFrom(v)]));
  if (s.type === "array") return [sampleFrom(s.items as Schema)];
  if (s.enum) return s.enum[0];
  if (s.type === "boolean") return true;
  if (s.type === "integer") return 0;
  return "x";
}

function keysOf(value: unknown, path = "answer", out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, `${path}[]`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.push(`${path}.${k}`);
      keysOf(v, `${path}.${k}`, out);
    }
  }
  return out;
}

test("zod accepts exactly the fields the JSON schema defines (no more, no less)", () => {
  const sample = sampleFrom(ANSWER_JSON_SCHEMA as Schema);
  const parsed = scanAnswerSchema.parse(sample);
  assert.deepEqual(keysOf(parsed).sort(), keysOf(sample).sort());
});

// ---------------------------------------------------------------------
// Reading a pasted answer
// ---------------------------------------------------------------------
const minimal = { status: "ok", message: "", unreadable_parts: "", recipes: [] };

test("paste: plain JSON, ```json fences and text around it are all fine", () => {
  const json = JSON.stringify(minimal);
  for (const pasted of [json, "```json\n" + json + "\n```", `Here is the result:\n${json}\nGood luck!`, `﻿  ${json}  `]) {
    const r = parseScanAnswer(pasted);
    assert.equal(r.ok, true, pasted.slice(0, 30));
  }
});

test("paste: empty, not JSON, broken JSON, wrong shape", () => {
  assert.deepEqual(parseScanAnswer("   "), { ok: false, error: "empty" });
  assert.deepEqual(parseScanAnswer("I could not read the photo."), { ok: false, error: "notJson" });
  assert.deepEqual(parseScanAnswer('{"status": "ok", "recipes": [}'), { ok: false, error: "notJson" });
  assert.deepEqual(parseScanAnswer('{"recipes": "none"}'), { ok: false, error: "wrongShape" });
  assert.deepEqual(parseScanAnswer('{"recipes": [{"ingredients": {"a": 1}}]}'), { ok: false, error: "wrongShape" });
  assert.deepEqual(parseScanAnswer("x".repeat(300_001)), { ok: false, error: "tooLong" });
});

test("paste: small slips are forgiven (numbers, nulls, missing fields, extra fields)", () => {
  const r = parseScanAnswer(
    JSON.stringify({
      status: "ok",
      extra: "ignored",
      recipes: [
        {
          title: "  עוגה  ",
          servings: 6,
          prep_minutes: null,
          kosher_type: "both",
          tags: ["cake", "", "cookies", "dessert", "shabbat", "pesach"],
          ingredients: [{ name: "קמח", quantity: 2 }],
          checks: [{ field: "weird", reason: "בדקי" }],
        },
      ],
    }),
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const recipe = r.answer.recipes[0];
  assert.equal(recipe.title, "עוגה"); // trimmed
  assert.equal(recipe.servings, "6");
  assert.equal(recipe.prep_minutes, "");
  assert.equal(recipe.kosher_type, ""); // unknown value -> must be checked
  assert.deepEqual(recipe.tags, ["cake", "cookies", "dessert", "shabbat"]); // max 4, no empty
  assert.equal(recipe.ingredients[0].quantity, "2");
  assert.equal(recipe.ingredients[0].unit, "");
  assert.equal(recipe.ingredients[0].optional, false);
  assert.deepEqual(recipe.steps, []);
  assert.deepEqual(recipe.checks[0], { field: "general", index: -1, reason: "בדקי" });
  assert.equal("extra" in r.answer, false);
});

// ---------------------------------------------------------------------
// The instructions
// ---------------------------------------------------------------------
const tags = [
  { id: "7c1f8a52-0000-4000-8000-00000000ca4e", slug: "cake", name_he: "עוגות", name_en: "Cakes" },
  { id: "7c1f8a52-0000-4000-8000-0000005ab0a7", slug: "shabbat", name_he: "שבת", name_en: "Shabbat" },
];

test("prompt: the paste version carries the answer's shape; the API version doesn't need it", () => {
  const paste = buildScanPrompt({ mode: "paste", pageCount: 2, locale: "he", tags });
  const api = buildScanPrompt({ mode: "api", pageCount: 1, locale: "en", tags });
  assert.ok(paste.includes(JSON.stringify(ANSWER_JSON_SCHEMA)));
  assert.ok(!api.includes('"additionalProperties"'));
  assert.ok(paste.includes("2 photos") && api.includes("ONE photo"));
  assert.ok(paste.includes("in Hebrew") && api.includes("in English"));
  assert.ok(paste.includes("- cake: עוגות / Cakes") && paste.includes("- shabbat: שבת / Shabbat"));
});

// ---------------------------------------------------------------------
// Answer -> recipe form
// ---------------------------------------------------------------------
const ctx: ToFormContext = {
  locale: "he",
  bookId: "",
  tags,
  handwrittenSource: "בכתב יד",
};

const ing = (over: Partial<ScannedRecipe["ingredients"][number]>) => ({
  section: "",
  original_text: "",
  quantity: "",
  unit: "",
  name: "x",
  note: "",
  optional: false,
  handwritten: "",
  ...over,
});

function recipe(over: Partial<ScannedRecipe> = {}): ScannedRecipe {
  return {
    title: "עוגת דבש",
    title_suggested: false,
    page_number: "45",
    yield_text: "תבנית 26",
    servings: "",
    prep_minutes: "",
    cook_minutes: "50",
    total_minutes: "",
    ingredients: [],
    steps: [],
    notes: "",
    kosher_type: "pareve",
    kosher_reason: "אין מרכיבים בשריים או חלביים",
    tags: [],
    handwritten_page: false,
    continues_on_next_page: false,
    checks: [],
    ...over,
  };
}

test("amounts: Hebrew ranges turn around; good amounts stay; nonsense is null", () => {
  assert.equal(normalizeQuantity("3-2"), "2-3");
  assert.equal(normalizeQuantity("3 - 2"), "2-3");
  assert.equal(normalizeQuantity("2-3"), "2-3");
  assert.equal(normalizeQuantity("1 1/2"), "1 1/2");
  assert.equal(normalizeQuantity("½"), "½");
  assert.equal(normalizeQuantity(""), "");
  assert.equal(normalizeQuantity("כוס וחצי"), null);
  assert.equal(normalizeQuantity("0"), null);
});

test("a full scanned recipe becomes a form that saves as is", () => {
  const { form, review } = scannedRecipeToForm(
    recipe({
      ingredients: [
        ing({ section: "לבצק", original_text: "3 ביצים", quantity: "3", unit: "", name: "ביצים" }),
        ing({ section: "לבצק", original_text: "3-2 כוסות קמח", quantity: "3-2", unit: "כוסות", name: "קמח" }),
        ing({ section: "לבצק", original_text: "קורט מלח", name: "מלח", note: "קורט" }),
        ing({ section: "לציפוי", original_text: "מעט אבקת סוכר (לא חובה)", name: "אבקת סוכר", note: "מעט", optional: true }),
      ],
      steps: [
        { section: "", text: "מחממים תנור ל-170 מעלות.", handwritten: "" },
        { section: "", text: "אופים כ-50 דקות.", handwritten: "" },
      ],
      tags: ["cake", "shabbat", "no-such-tag"],
    }),
    ctx,
  );

  // Headings appear once, above their items
  assert.deepEqual(
    form.ingredients.map((r) => (r.kind === "heading" ? `# ${r.text}` : `${r.quantity}|${r.unit}|${r.name}|${r.note}`)),
    ["# לבצק", "3||ביצים|", "2-3|כוסות|קמח|", "||מלח|קורט", "# לציפוי", "||אבקת סוכר|מעט"],
  );
  assert.equal(form.language, "he");
  assert.deepEqual(form.tagIds, [tags[0].id, tags[1].id]);
  assert.deepEqual(review.droppedTags, ["no-such-tag"]);
  assert.deepEqual(review.checks, []);
  assert.equal(review.kosherReason, "אין מרכיבים בשריים או חלביים");

  // Same rules as saving by hand: everything passes
  const saved = formToInput(form);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.input.cook_minutes, 50);
  assert.equal(saved.input.page_number, null); // no book chosen -> no page
  assert.deepEqual(
    saved.input.ingredients.map((i) => [i.section, i.quantity, i.quantity_max, i.original_text, i.is_optional]),
    [
      ["לבצק", 3, null, "3 ביצים", false],
      ["לבצק", 2, 3, "3-2 כוסות קמח", false],
      ["לבצק", null, null, "קורט מלח", false],
      ["לציפוי", null, null, "מעט אבקת סוכר (לא חובה)", true],
    ],
  );
});

test("with a book: the printed page number is kept", () => {
  const { form } = scannedRecipeToForm(
    recipe({ ingredients: [ing({ name: "קמח" })] }),
    { ...ctx, bookId: "4b2c3f6a-1111-4111-8111-111111111111" },
  );
  const saved = formToInput(form);
  assert.equal(saved.ok, true);
  if (saved.ok) assert.equal(saved.input.page_number, 45);
});

test("going back to 'no heading' adds an empty heading (like the edit form)", () => {
  const { form } = scannedRecipeToForm(
    recipe({ ingredients: [ing({ section: "לבצק", name: "קמח" }), ing({ section: "", name: "מלח" })] }),
    ctx,
  );
  assert.deepEqual(
    form.ingredients.map((r) => (r.kind === "heading" ? `# ${r.text}` : r.kind)),
    ["# לבצק", "item", "# ", "item"],
  );
  const saved = formToInput(form);
  assert.ok(saved.ok && saved.input.ingredients[1].section === "");
});

test("anything doubtful is marked, nothing is guessed", () => {
  const { form, review } = scannedRecipeToForm(
    recipe({
      title: "עוגה",
      title_suggested: true,
      kosher_type: "",
      servings: "6-8",
      ingredients: [ing({ quantity: "כוס וחצי", name: "סוכר" }), ing({ quantity: "1", name: "" })],
      steps: [{ section: "", text: "לערבב", handwritten: "" }],
      checks: [
        { field: "ingredient", index: 1, reason: "כף או כפית?" },
        { field: "step", index: 0, reason: "לא ברור" },
        { field: "ingredient", index: 9, reason: "שורה שלא קיימת" },
        { field: "kosher_type", index: -1, reason: "שוקולד — תלוי במוצר" },
        { field: "general", index: -1, reason: "" }, // empty reason: ignored
      ],
    }),
    ctx,
  );
  const marks = review.checks.map((c) => `${c.target}: ${c.reason.kind === "ai" ? c.reason.text : c.reason.code}`);
  assert.deepEqual(marks, [
    "ingredient.si0.quantity: quantity",
    "ingredient.si1.name: ingredientName",
    "servings: number",
    "title: titleSuggested",
    "kosher_type: kosherMissing",
    "ingredient.si1: כף או כפית?",
    "step.ss0: לא ברור",
    "general: שורה שלא קיימת",
    "kosher_type: שוקולד — תלוי במוצר",
  ]);
  // The text is kept as written, so she can fix it in the form
  assert.equal(form.ingredients[0].kind === "item" && form.ingredients[0].quantity, "כוס וחצי");
  assert.equal(form.servings, "6-8");
  assert.equal(formToInput(form).ok, false);
});

test("handwriting: corrections are remembered per row; a handwritten sheet gets a source", () => {
  const { form, review } = scannedRecipeToForm(
    recipe({
      handwritten_page: true,
      continues_on_next_page: true,
      ingredients: [ing({ original_text: "1 כוס סוכר", quantity: "3/4", unit: "כוס", name: "סוכר", handwritten: "1 כוס" })],
      steps: [{ section: "", text: "לאפות 40 דקות", handwritten: "30 דקות" }],
    }),
    ctx,
  );
  assert.deepEqual(review.handwritten, { si0: "1 כוס", ss0: "30 דקות" });
  assert.equal(form.sourceNote, "בכתב יד");
  assert.equal(review.continuesOnNextPage, true);
  // With a book chosen, the book stays the source
  const inBook = scannedRecipeToForm(recipe({ handwritten_page: true }), { ...ctx, bookId: "b" });
  assert.equal(inBook.form.sourceNote, "");
});

test("an English recipe stays English; an empty recipe is marked", () => {
  const { form } = scannedRecipeToForm(
    recipe({ title: "Oat Cookies", kosher_type: "dairy", ingredients: [ing({ name: "butter", quantity: "1", unit: "cup" })] }),
    ctx,
  );
  assert.equal(form.language, "en");
  const empty = scannedRecipeToForm(recipe(), ctx);
  assert.deepEqual(empty.review.checks.map((c) => c.target), ["general"]);
  assert.equal(empty.form.ingredients.length, 1); // one empty row to start typing
});

// ---------------------------------------------------------------------
// Edge cases found in review (25.11)
// ---------------------------------------------------------------------
test("paste: braces in the chat's text around a ```json block don't break it", () => {
  const json = JSON.stringify(minimal);
  const pasted = `Notes {see below}:\n\`\`\`json\n${json}\n\`\`\`\nTip: use {curly} braces carefully.`;
  assert.equal(parseScanAnswer(pasted).ok, true);
  // A broken block but good JSON outside it: the whole text is tried too
  assert.equal(parseScanAnswer("```\nnot json\n```\n" + json).ok, true);
});

test("fixed choices ignore case and spaces", () => {
  const r = parseScanAnswer(
    JSON.stringify({
      status: " OK ",
      recipes: [{ title: "x", kosher_type: "Dairy ", checks: [{ field: "Title", index: -1, reason: "r" }] }],
    }),
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.answer.status, "ok");
  assert.equal(r.answer.recipes[0].kosher_type, "dairy");
  assert.equal(r.answer.recipes[0].checks[0].field, "title");
});

test("tags: an id, or the Hebrew / English name, all work; others are dropped", () => {
  const { form, review } = scannedRecipeToForm(recipe({ tags: ["CAKE", "שבת", "Cakes", "unknown"] }), ctx);
  assert.deepEqual(form.tagIds, [tags[0].id, tags[1].id]);
  assert.deepEqual(review.droppedTags, ["unknown"]);
});

// ---------------------------------------------------------------------
// A real answer pasted from a chat (25.11): plain " inside Hebrew texts
// (ק"ג, "3-2", ("10 דקות")) — invalid JSON as is, read after repair.
// ---------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { escapeInnerQuotes } from "../lib/scan/parse";

test("paste: plain quotes inside Hebrew texts are repaired (real answer)", () => {
  const pasted = readFileSync(new URL("./fixtures/paste-hebrew-quotes.txt", import.meta.url), "utf8");
  assert.throws(() => JSON.parse(pasted)); // really broken as pasted
  const result = parseScanAnswer(pasted);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const [cake, salad] = result.answer.recipes;
  assert.equal(cake.title, "עוגת דבש של שבת");
  assert.equal(cake.ingredients.length, 12);
  assert.equal(cake.checks[1].reason, 'בספר כתוב "3-2". נשמר כטווח 2-3 כוסות.');
  assert.equal(salad.ingredients[0].original_text, '1 ק"ג גזר, חתוך לפרוסות');
  assert.equal(salad.ingredients[0].unit, 'ק"ג');
  assert.equal(salad.checks[0].reason, 'זמן הבישול נלקח מתוך שלב ההכנה ("10 דקות").');
});

test("quote repair: valid JSON is never changed; tricky spots", () => {
  const valid = JSON.stringify({ a: 'x "q" y', b: ["1", "2"], c: { d: "" }, e: 3, f: true });
  assert.equal(escapeInnerQuotes(valid), valid);
  // a quote right before a comma inside a text (followed by more words)
  const tricky = '{"a": "he said "hi", then left", "b": "ק"ג"}';
  assert.deepEqual(JSON.parse(escapeInnerQuotes(tricky)), { a: 'he said "hi", then left', b: 'ק"ג' });
  // in a list, at the end, before a closing brace
  assert.deepEqual(JSON.parse(escapeInnerQuotes('{"t": ["עמ"ש", "x"]}')), { t: ['עמ"ש', "x"] });
});

test("prompt: tells the chat how to write quotes inside texts", () => {
  const prompt = buildScanPrompt({ mode: "paste", pageCount: 1, locale: "he", tags: [] });
  assert.ok(prompt.includes("ק״ג"));
  assert.ok(prompt.includes('as \\".'));
});
