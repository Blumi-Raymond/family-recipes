// Temporary links to images (the bucket is private).
// One request for many images; links work for 1 hour.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_BUCKET, thumbPath } from "./paths";

const ONE_HOUR = 60 * 60;

// path -> signed URL. Missing/failed paths are simply absent.
export async function signImageUrls(
  paths: (string | null | undefined)[],
  size: "thumb" | "full",
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const result = new Map<string, string>();
  if (unique.length === 0) return result;

  const files = size === "thumb" ? unique.map(thumbPath) : unique;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(files, ONE_HOUR);
  if (error) {
    console.error("createSignedUrls error:", error.message);
    return result;
  }
  data.forEach((item, i) => {
    if (item.signedUrl) result.set(unique[i], item.signedUrl);
  });
  return result;
}
