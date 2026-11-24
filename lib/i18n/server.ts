// Interface text for Server Components.
// The language comes from the URL (/he/... or /en/...), via next/root-params.
import "server-only";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import he, { type Dictionary } from "./dictionaries/he";
import en from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { he, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// The current page's language. Unknown value -> 404 (proxy.ts normally
// prevents that, this is a second line of defense).
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

// Language + its texts, in one call
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
