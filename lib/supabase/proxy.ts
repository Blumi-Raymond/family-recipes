// Runs on every request (called from the root proxy.ts). Two jobs:
// 1. Keep the login session fresh (refresh the cookies when needed).
// 2. Not logged in -> /login. Logged in -> not back to /login or /signup.
//
// Who sees WHICH data is decided in the database (RLS + groups),
// not here: every user sees only her own groups' recipes.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// Pages anyone can open, logged in or not
function isPublicPath(path: string) {
  return path === "/login" || path === "/signup" || path.startsWith("/auth/");
}

export async function updateSession(request: NextRequest) {
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
    if (isPublicPath(path)) return response;
    const next = path === "/" ? undefined : path + request.nextUrl.search;
    return redirectTo("/login", next);
  }

  // --- Logged in ---
  if (path === "/login" || path === "/signup") return redirectTo("/");

  return response;
}
