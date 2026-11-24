// Which language is this text written in? Counts Hebrew vs English letters.
// Used for recipes and cookbooks instead of asking her to choose.
// No letters at all (e.g. still empty) -> `fallback`.
import type { Locale } from "./config";

export function detectLanguage(texts: string[], fallback: Locale): Locale {
  let he = 0;
  let en = 0;
  for (const text of texts) {
    for (const ch of text) {
      if (ch >= "א" && ch <= "ת") he++;
      else if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) en++;
    }
  }
  if (he === 0 && en === 0) return fallback;
  return he >= en ? "he" : "en";
}
