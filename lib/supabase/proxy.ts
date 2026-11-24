// Runs on every page request (called from the root proxy.ts). Two jobs:
// 1. Keep the login session fresh (refresh the cookies when needed).
// 2. Not logged in -> /login. Logged in -> not back to /login or /signup.
//
// Who sees WHICH data is decided in the database (RLS + groups),
// not here: every user sees only her own groups' recipes.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { Database } from "./database.types";

// `locale` is the URL's language; null for /auth/* (no language in the URL).
export async function updateSession(request: NextRequest, locale: Locale | null) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  // This call validates the session and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const path = request.nextUrl.pathname;
  const lang = locale ?? defaultLocale;
  const loginPath = localePath(lang, "/login");
  const signupPath = localePath(lang, "/signup");
  // Pages anyone can open, logged in or not
  const isPublic = path === loginPath || path === signupPath || locale === null;

  // A redirect that keeps any refreshed session cookies
  const redirectTo = (pathname: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  // --- Not logged in ---
  if (!userId) {
    if (isPublic) return response;
    const next = path === localePath(lang) ? undefined : path + request.nextUrl.search;
    return redirectTo(loginPath, next);
  }

  // --- Logged in ---
  if (path === loginPath || path === signupPath) return redirectTo(localePath(lang));

  return response;
}
