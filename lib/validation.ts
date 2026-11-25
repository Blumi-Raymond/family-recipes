// Building blocks for the form rules (zod). Used by the forms in the browser
// AND again by the Server Actions — the same rules on both sides.
// Every error message is a key of `formErrors` in lib/i18n/dictionaries.
import * as z from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries/he";

export type FormErrorKey = keyof Dictionary["formErrors"];

// Field errors: "title" -> "required", "ingredients.3.name" -> "ingredientName"
export type FieldErrors = Record<string, FormErrorKey>;

const err = (key: FormErrorKey) => ({ error: key });

export const requiredText = (max: number) =>
  z.string(err("required")).trim().min(1, err("required")).max(max, err("tooLong"));

export const optionalText = (max: number) => z.string(err("required")).trim().max(max, err("tooLong"));

// Whole number or nothing. "" in the form becomes null before validation.
export const optionalInt = (min: number) =>
  z
    .number(err("wholeNumber"))
    .int(err("wholeNumber"))
    .min(min, err(min > 0 ? "positive" : "wholeNumber"))
    .max(100000, err("wholeNumber"))
    .nullable();

export const contentLanguage = z.enum(["he", "en"]);

export const uuid = z.uuid();

// "<group uuid>/<folder>/<uuid>.webp" (or .jpg) — the only paths the app creates
export const imagePath = (folder: "dishes" | "covers" | "pages") =>
  z
    .string()
    .regex(
      new RegExp(`^[0-9a-f-]{36}/${folder}/[0-9a-f-]{36}\\.(webp|jpg)$`),
      err("generic"),
    );

// Form number field ("" -> null, "12" -> 12, "abc" -> NaN so the rule fails)
export function numberOrNull(text: string): number | null {
  const s = text.trim();
  if (!s) return null;
  return /^\d+$/.test(s) ? Number(s) : Number.NaN;
}

// zod result -> { "ingredients.3.name": "ingredientName", ... }
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = (issue.message as FormErrorKey) || "generic";
  }
  return out;
}

// Is this text a database id? (Checked before using ids from URLs/actions,
// so a bad link shows "not found" instead of a database error.)
export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
