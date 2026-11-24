// Rules for a recipe, exactly as it is sent to the database function
// save_recipe() (see supabase/migrations/20261124200000_recipe_form.sql).
// Checked in the browser before saving, and again on the server.
import * as z from "zod";
import {
  contentLanguage,
  imagePath,
  optionalInt,
  optionalText,
  requiredText,
  uuid,
} from "@/lib/validation";

export const MAX_INGREDIENTS = 150;
export const MAX_STEPS = 80;
export const MAX_PHOTOS = 12;

const positiveAmount = z.number({ error: "quantity" }).positive({ error: "quantity" }).nullable();

export const ingredientSchema = z
  .object({
    section: optionalText(200),
    quantity: positiveAmount,
    quantity_max: positiveAmount,
    unit: optionalText(50),
    name: z.string().trim().min(1, { error: "ingredientName" }).max(300, { error: "tooLong" }),
    note: optionalText(300),
    is_optional: z.boolean(),
    original_text: optionalText(500),
  })
  .refine(
    (i) => i.quantity_max === null || (i.quantity !== null && i.quantity_max >= i.quantity),
    { error: "quantity", path: ["quantity"] },
  );

export const stepSchema = z.object({
  section: optionalText(200),
  instruction: z.string().trim().min(1, { error: "stepText" }).max(5000, { error: "tooLong" }),
});

export const recipeSchema = z.object({
  id: uuid.nullable(),
  title: requiredText(200),
  description: optionalText(2000),
  language: contentLanguage,
  kosher_type: z.enum(["meat", "dairy", "pareve"], { error: "kosherRequired" }),
  yield_text: optionalText(200),
  servings: optionalInt(1),
  prep_minutes: optionalInt(0),
  cook_minutes: optionalInt(0),
  total_minutes: optionalInt(0),
  notes: optionalText(5000),
  cookbook_id: uuid.nullable(),
  page_number: optionalInt(1),
  source_note: optionalText(300),
  ingredients: z.array(ingredientSchema).max(MAX_INGREDIENTS, { error: "tooMany" }),
  steps: z.array(stepSchema).max(MAX_STEPS, { error: "tooMany" }),
  tag_ids: z.array(uuid).max(50, { error: "tooMany" }),
  photos: z
    .array(z.object({ path: imagePath("dishes"), is_cover: z.boolean() }))
    .max(MAX_PHOTOS, { error: "tooMany" }),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
export type KosherType = RecipeInput["kosher_type"];
