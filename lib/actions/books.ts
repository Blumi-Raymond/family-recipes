"use server";
// Save / delete a cookbook. The database (RLS) checks she may do it;
// the rules below repeat the form's checks (never trust the browser).
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cookbookSchema, type CookbookInput } from "@/lib/books/schema";
import { isUuid, toFieldErrors } from "@/lib/validation";
import type { ActionResult } from "./result";

// After any change: drop cached pages so lists show the new data
function refreshAll() {
  revalidatePath("/[lang]", "layout");
}

// id = null -> new cookbook
export async function saveCookbook(id: string | null, input: CookbookInput): Promise<ActionResult> {
  if (id !== null && !isUuid(id)) return { ok: false, error: "notFound" };
  const parsed = cookbookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "summary", fieldErrors: toFieldErrors(parsed.error) };
  }
  const values = {
    title: parsed.data.title,
    author: parsed.data.author || null,
    language: parsed.data.language,
    notes: parsed.data.notes || null,
    cover_image_path: parsed.data.cover_image_path,
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("cookbooks").update(values).eq("id", id).select("id").maybeSingle()
    : await supabase.from("cookbooks").insert(values).select("id").single();

  if (error) {
    console.error("saveCookbook error:", error.code, error.message);
    return { ok: false, error: "generic" };
  }
  if (!data) return { ok: false, error: "notFound" };

  refreshAll();
  return { ok: true, id: data.id };
}

export type DeleteResult = { ok: true } | { ok: false; error: "inUse" | "generic" };

// Only a cookbook with no recipes at all (trash included) may be deleted,
// so no recipe silently loses its book.
export async function deleteCookbook(id: string): Promise<DeleteResult> {
  if (!isUuid(id)) return { ok: false, error: "generic" };
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("cookbook_id", id);
  if (countError) {
    console.error("deleteCookbook count error:", countError.message);
    return { ok: false, error: "generic" };
  }
  if (count) return { ok: false, error: "inUse" };

  const { error } = await supabase.from("cookbooks").delete().eq("id", id);
  if (error) {
    console.error("deleteCookbook error:", error.code, error.message);
    return { ok: false, error: "generic" };
  }
  refreshAll();
  return { ok: true };
}
