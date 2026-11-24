// Runs before every page request. Two jobs, in this order:
// 1. Language: every page lives under /he/... or /en/...
//    A URL without a language is sent to the last language she used
//    (remembered in a cookie), or to Hebrew the first time.
// 2. Login: keeps the session fresh and sends logged-out visitors to /login
//    (see lib/supabase/proxy.ts).
import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  defaultLocale,
  hasLocale,
  localeFromPath,
  localePath,
} from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The Google login callback is a route without a language
  if (pathname.startsWith("/auth/")) return updateSession(request, null);

  const locale = localeFromPath(pathname);
  if (!locale) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const url = request.nextUrl.clone();
    url.pathname = localePath(hasLocale(saved) ? saved : defaultLocale, pathname);
    return NextResponse.redirect(url);
  }

  const response = await updateSession(request, locale);
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // All pages, except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
