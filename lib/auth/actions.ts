"use server";
// Server Actions for login / sign-up / Google / logout.
// Errors are returned as keys (authErrors in lib/i18n/dictionaries),
// so the form shows them in the page's language.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionLocale } from "@/lib/i18n/action-locale";
import { localePath } from "@/lib/i18n/config";
import { MIN_PASSWORD, authErrorKey, type AuthErrorKey } from "./errors";
import { safeNext } from "./safe-next";

export type AuthFormState = {
  error?: AuthErrorKey;
  notRegistered?: boolean; // login: show "go to sign-up" link
  alreadyRegistered?: boolean; // sign-up: show "go to login" link
  checkEmail?: boolean; // sign-up: "we sent you an email" (only if Confirm email is on)
  email?: string; // keep what she typed, so the field isn't emptied
  name?: string;
};


function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

// Which ways can this email log in? null = not registered, undefined = unknown.
async function loginMethods(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("login_methods", { p_email: email });
  if (error) {
    console.error("login_methods error:", error.message);
    return undefined; // unknown — fall back to a general message
  }
  return data;
}

// ---------------------------------------------------------------------
// Log in with email + password
// ---------------------------------------------------------------------
export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = await actionLocale(formData);
  const email = text(formData, "email").toLowerCase();
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: "missingLogin", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.code === "invalid_credentials") {
    // Find out WHY: unknown email, Google-only account, or wrong password
    const methods = await loginMethods(email);
    if (methods === null) return { error: "notRegistered", notRegistered: true, email };
    if (methods && !methods.includes("email") && methods.includes("google")) {
      return { error: "googleOnlyLogin", email };
    }
    if (methods) return { error: "wrongPassword", email };
  }
  if (error) return { error: authErrorKey(error), email };

  redirect(safeNext(formData.get("next"), localePath(locale)));
}

// ---------------------------------------------------------------------
// Create a new account
// ---------------------------------------------------------------------
export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = await actionLocale(formData);
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = formData.get("password");

  if (!name || !email || typeof password !== "string" || !password) {
    return { error: "missingSignup", email, name };
  }
  if (password.length < MIN_PASSWORD) {
    return { error: "passwordTooShort", email, name };
  }

  const methods = await loginMethods(email);
  if (methods) {
    return methods.includes("email")
      ? { error: "alreadyRegistered", alreadyRegistered: true, email, name }
      : { error: "googleOnlySignup", email, name };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(localePath(locale))}`,
      // The database trigger handle_new_user() copies this into profiles.display_name
      data: { full_name: name },
    },
  });
  if (error) return { error: authErrorKey(error), email, name };

  // "Confirm email" is OFF in Supabase -> she is logged in already
  if (data.session) redirect(localePath(locale));

  // "Confirm email" is still ON in Supabase -> an email was sent
  return { checkEmail: true, email };
}

// ---------------------------------------------------------------------
// Log in (or sign up) with Google
// ---------------------------------------------------------------------
export async function signInWithGoogle(formData: FormData) {
  const locale = await actionLocale(formData);
  const next = safeNext(formData.get("next"), localePath(locale));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    console.error("Google sign-in error:", error?.code, error?.message);
    redirect(`${localePath(locale, "/login")}?error=google`);
  }
  redirect(data.url);
}

// ---------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------
export async function signOut(formData: FormData) {
  const locale = await actionLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localePath(locale, "/login"));
}
