// Google login (and the confirmation email, if turned on) lands here.
// Supabase adds ?code=..., which we exchange for a login session (cookies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // "next" already includes the language (/he/...); proxy.ts adds one if not
  const next = safeNext(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback error:", error.code, error.message);
  }

  // No code, an expired link, or the link was opened in a different browser
  return NextResponse.redirect(`${origin}/login?error=link`);
}
