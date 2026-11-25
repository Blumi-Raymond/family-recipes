"use server";
// Save a recipe / move it to the trash / restore it.
// Saving goes through the database function save_recipe(): one transaction,
// so a recipe is never half-saved.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recipeSchema, type RecipeInput } from "@/lib/recipes/schema";
import { isUuid, toFieldErrors } from "@/lib/validation";
import type { ActionResult } from "./result";

function refreshAll() {
  revalidatePath("/[lang]", "layout");
}

export async function saveRecipe(input: RecipeInput): Promise<ActionResult> {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "summary", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_recipe", { p_recipe: parsed.data });
  if (error) {
    console.error("save_recipe error:", error.code, error.message);
    // P0002 = "recipe not found" (deleted, in the trash, or not hers)
    return { ok: false, error: error.code === "P0002" ? "notFound" : "generic" };
  }

  // Scanned recipe: the printed page number belongs to the first page photo
  // (where the recipe starts). Only filled when still empty, so a number
  // set before is never overwritten. Not part of the recipe — a failure
  // here is logged and the save still counts.
  const pages = parsed.data.source_pages;
  if (pages?.length && parsed.data.page_number !== null) {
    const { error: pageError } = await supabase
      .from("source_pages")
      .update({ page_number: parsed.data.page_number })
      .eq("id", pages[0])
      .is("page_number", null);
    if (pageError) console.error("save_recipe page number error:", pageError.code, pageError.message);
  }

  refreshAll();
  return { ok: true, id: data };
}

export type SimpleResult = { ok: boolean };

async function setTrashed(id: string, trashed: boolean): Promise<SimpleResult> {
  if (!isUuid(id)) return { ok: false };
  const supabase = await createClient();
  const query = supabase
    .from("recipes")
    .update({ deleted_at: trashed ? new Date().toISOString() : null })
    .eq("id", id);
  const { data, error } = await (trashed
    ? query.is("deleted_at", null)
    : query.not("deleted_at", "is", null)
  )
    .select("id")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("setTrashed error:", error.code, error.message);
    return { ok: false };
  }
  refreshAll();
  return { ok: true };
}

export async function trashRecipe(id: string) {
  return setTrashed(id, true);
}

export async function restoreRecipe(id: string) {
  return setTrashed(id, false);
}
