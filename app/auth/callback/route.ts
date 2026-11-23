// The link in the confirmation email lands here (later: Google login too).
// Supabase adds ?code=..., which we exchange for a login session (cookies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // proxy.ts will send an unapproved user on to /pending
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback error:", error.code, error.message);
  }

  // No code, an expired link, or the link was opened in a different browser
  return NextResponse.redirect(`${origin}/login?error=link`);
}
