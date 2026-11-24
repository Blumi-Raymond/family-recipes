// Shared helpers for the data layer (lib/data/*).
// Everything here runs on the server with the logged-in user's session,
// so the database (RLS) decides what she may see.
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Tag = {
  id: string;
  slug: string;
  name_he: string;
  name_en: string;
  category: "protein" | "dish" | "occasion" | "other";
};

// A database error we didn't expect: log it and show the error page
export function fail(where: string, error: { message: string }): never {
  console.error(`${where}:`, error.message);
  throw new Error(`Database error in ${where}`);
}

// The logged-in user's personal group ("My kitchen") — where new items go
export const getPersonalGroupId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("personal_group_id");
  if (error) fail("getPersonalGroupId", error);
  if (!data) throw new Error("No personal group for this user");
  return data;
});

export const getTags = cache(async (): Promise<Tag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name_he, name_en, category")
    .order("category")
    .order("name_he");
  if (error) fail("getTags", error);
  return data;
});
