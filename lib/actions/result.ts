// What every save action returns to its form.
import type { FieldErrors, FormErrorKey } from "@/lib/validation";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: FormErrorKey; fieldErrors?: FieldErrors };
