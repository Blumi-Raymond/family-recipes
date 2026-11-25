// The shape of the AI's answer to a scan — ONE definition, used twice:
//   1. ANSWER_JSON_SCHEMA is sent to the API (output_config.format) and is
//      written into the copy-paste instructions (free path).
//   2. scanAnswerSchema (zod) checks every answer before it reaches the form,
//      whichever path it came by.
// tests/scan-answer.test.ts checks that the two stay identical, and that the
// JSON schema keeps the API's rules: every object closed
// (additionalProperties: false), every field required, no min/max keywords.
// So "no value" is an empty string "" (never null) — see the scan plan.
//
// Safe to import anywhere (browser, server, tests).
import * as z from "zod";

export const MAX_RECIPES_PER_SCAN = 10;
const MAX_INGREDIENTS = 150;
const MAX_STEPS = 80;
const MAX_CHECKS = 200;
const MAX_TAGS = 4;

export const CHECK_FIELDS = [
  "title",
  "yield_text",
  "servings",
  "prep_minutes",
  "cook_minutes",
  "total_minutes",
  "page_number",
  "kosher_type",
  "tags",
  "notes",
  "ingredient",
  "step",
  "general",
] as const;
export type CheckField = (typeof CHECK_FIELDS)[number];

// ---------------------------------------------------------------------
// 1. JSON schema (for the API and the copy-paste instructions)
// ---------------------------------------------------------------------
const str = (description: string) => ({ type: "string", description });
const bool = (description: string) => ({ type: "boolean", description });
const closed = (description: string, properties: Record<string, unknown>) => ({
  type: "object",
  description,
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const ANSWER_JSON_SCHEMA = closed("The result of reading the page photos.", {
  status: {
    type: "string",
    enum: ["ok", "not_recipe", "unreadable"],
    description: "ok = at least one recipe found. not_recipe / unreadable = no recipe could be taken from the photos.",
  },
  message: str('When status is not "ok": a short, clear explanation for the user. Otherwise "".'),
  unreadable_parts: str('What exactly could not be read (e.g. "the bottom of the ingredient list is cut off"). "" if everything was readable.'),
  recipes: {
    type: "array",
    description: "Every recipe found in the photos, in the order they appear. Empty when status is not ok.",
    items: closed("One recipe.", {
      title: str("The recipe's name, exactly as printed. If there is no name, a short suggested name."),
      title_suggested: bool("true if the title is a suggestion (no name was written)."),
      page_number: str('The PRINTED page number where the recipe starts, digits only. "" if no number is printed.'),
      yield_text: str('Amount as written: "a 26 cm pan", "24 cookies". "" if not written.'),
      servings: str('Number of servings, digits only, only if written ("serves 6" -> "6"). "" otherwise.'),
      prep_minutes: str('Preparation time in minutes, digits only, only if written. "" otherwise.'),
      cook_minutes: str('Cooking/baking time in minutes, digits only, only if written. "" otherwise.'),
      total_minutes: str('Total time in minutes, digits only, only if written. "" otherwise.'),
      ingredients: {
        type: "array",
        description: "Every ingredient line, in order.",
        items: closed("One ingredient line.", {
          section: str('The heading this line is under ("For the dough"), exactly as written. "" if none.'),
          original_text: str("The full line exactly as printed (the printed text, even if corrected by hand)."),
          quantity: str('Amount as digits: "2", "1.5", "1/2", "1 1/2", "2-3" (range: smaller first). "" if no amount.'),
          unit: str('Unit as written ("cups", "כוס", "g"). "" if none.'),
          name: str("The ingredient's name."),
          note: str('The rest of the line ("sifted", "to taste", "a pinch"). "" if nothing.'),
          optional: bool('true only if marked optional ("optional", "לא חובה").'),
          handwritten: str('If changed by hand: the PRINTED text that was replaced, e.g. "1 cup". "" otherwise.'),
        }),
      },
      steps: {
        type: "array",
        description: "Every instruction step, in order.",
        items: closed("One step.", {
          section: str('The heading this step is under. "" if none.'),
          text: str("The step's text, exactly as written (without the step number)."),
          handwritten: str('If changed by hand: the PRINTED text that was replaced. "" otherwise.'),
        }),
      },
      notes: str('Tips and notes printed with the recipe, and handwritten margin notes (start those with "Handwritten note:"). "" if none.'),
      kosher_type: {
        type: "string",
        enum: ["meat", "dairy", "pareve"],
        description: "Suggested meat / dairy / pareve, by the rules in the instructions.",
      },
      kosher_reason: str("Why, naming the ingredients, in the user's language (the instructions say which): e.g. dairy because of: butter, cream. For pareve: that there are no meat or dairy ingredients."),
      tags: {
        type: "array",
        description: "Up to 4 tag ids from the given list, only when clearly right.",
        items: { type: "string" },
      },
      handwritten_page: bool("true if the whole recipe is handwritten (not printed)."),
      continues_on_next_page: bool("true if the recipe is cut off and continues on a page that was not given."),
      checks: {
        type: "array",
        description: "Everything the user should check. Better too many than a silent guess.",
        items: closed("One thing to check.", {
          field: { type: "string", enum: [...CHECK_FIELDS], description: "Which field." },
          index: {
            type: "integer",
            description: 'For "ingredient" / "step": position in that list, counting from 0. Otherwise -1.',
          },
          reason: str("What to check and why, in the user's language."),
        }),
      },
    }),
  },
});

// ---------------------------------------------------------------------
// 2. zod — checks an answer. Forgiving about small slips that happen when
//    an answer is pasted from a chat (a number instead of text, a missing
//    field): those become "" / false / [] and the form shows a "check" mark.
//    Wrong shapes (not an object, recipes not a list) still fail.
// ---------------------------------------------------------------------
const text = z.preprocess(
  (v) => (v === null || v === undefined ? "" : typeof v === "number" ? String(v) : v),
  z.string().max(10000).transform((s) => s.trim()),
);
const flag = z.boolean().catch(false);
// "Dairy" / " dairy " -> "dairy" (fixed-choice fields)
const choice = <T extends string>(values: readonly [T, ...T[]]) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.enum(values));
const list = <T extends z.ZodType>(item: T, max: number) =>
  z.preprocess((v) => (v === null || v === undefined ? [] : v), z.array(item).max(max));

const ingredient = z.object({
  section: text,
  original_text: text,
  quantity: text,
  unit: text,
  name: text,
  note: text,
  optional: flag,
  handwritten: text,
});

const step = z.object({ section: text, text, handwritten: text });

const check = z.object({
  field: choice(CHECK_FIELDS).catch("general"),
  index: z.number().int().catch(-1),
  reason: text,
});

const recipe = z.object({
  title: text,
  title_suggested: flag,
  page_number: text,
  yield_text: text,
  servings: text,
  prep_minutes: text,
  cook_minutes: text,
  total_minutes: text,
  ingredients: list(ingredient, MAX_INGREDIENTS),
  steps: list(step, MAX_STEPS),
  notes: text,
  // "" = no (valid) suggestion -> the review screen asks her to choose
  kosher_type: choice(["meat", "dairy", "pareve"])
    .or(z.literal(""))
    .catch("" as const),
  kosher_reason: text,
  tags: list(text, 20).transform((tags) => tags.filter(Boolean).slice(0, MAX_TAGS)),
  handwritten_page: flag,
  continues_on_next_page: flag,
  checks: list(check, MAX_CHECKS),
});

export const scanAnswerSchema = z.object({
  status: choice(["ok", "not_recipe", "unreadable"]).catch("ok"),
  message: text,
  unreadable_parts: text,
  recipes: list(recipe, MAX_RECIPES_PER_SCAN),
});

export type ScanAnswer = z.infer<typeof scanAnswerSchema>;
export type ScannedRecipe = ScanAnswer["recipes"][number];
export type ScannedIngredient = ScannedRecipe["ingredients"][number];
export type ScanCheck = ScannedRecipe["checks"][number];
