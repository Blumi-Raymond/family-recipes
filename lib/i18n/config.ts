// Languages of the site's interface. Safe to import anywhere
// (server, client, proxy).
export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

// Remembers the last language she chose (set by proxy.ts).
export const LOCALE_COOKIE = "lang";

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

// "/he/books" -> "he"; "/books" -> undefined
export function localeFromPath(pathname: string): Locale | undefined {
  const first = pathname.split("/")[1];
  return hasLocale(first) ? first : undefined;
}

// Build a link inside the site: localePath("en", "/books") -> "/en/books"
export function localePath(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

// "/he/books?x=1" -> "/en/books?x=1"
export function switchLocalePath(pathname: string, to: Locale): string {
  const current = localeFromPath(pathname);
  const rest = current ? pathname.slice(current.length + 1) : pathname;
  return localePath(to, rest || "/");
}

// Fill {placeholders}: fmt("Hello {name}", { name: "Dina" })
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
