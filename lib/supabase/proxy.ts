// Runs on every request (called from the root proxy.ts). Two jobs:
// 1. Keep the login session fresh (refresh the cookies when needed).
// 2. Send people to the right place:
//    - not logged in            -> /login
//    - logged in, not approved  -> /pending ("waiting for approval")
//    - approved                 -> anywhere (but not back to /login or /pending)
//
// This is a convenience for the screens. The real protection is in the
// database (RLS): an unapproved user gets no data even if she reaches a page.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// Pages anyone can open, logged in or not
function isPublicPath(path: string) {
  return path === "/login" || path.startsWith("/auth/");
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

  // --- Logged in: is she approved? ---
  // The auth callback must be allowed to finish no matter what.
  if (path.startsWith("/auth/")) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", userId)
    .maybeSingle();
  const approved = profile?.is_approved === true;

  if (!approved) {
    return path === "/pending" ? response : redirectTo("/pending");
  }

  if (path === "/login" || path === "/pending") {
    return redirectTo("/");
  }

  return response;
}
