// The language inside a Server Action (actions have no URL params).
// Forms send it in a hidden <input name="lang">; if it's missing,
// fall back to the language cookie, then to Hebrew.
import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, hasLocale, type Locale } from "./config";

export async function actionLocale(formData?: FormData): Promise<Locale> {
  const fromForm = formData?.get("lang");
  if (hasLocale(fromForm)) return fromForm;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return hasLocale(fromCookie) ? fromCookie : defaultLocale;
}
