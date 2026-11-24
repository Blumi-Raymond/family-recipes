"use server";
// Server Actions for login / sign-up / Google / logout.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/safe-next";

export type AuthFormState = {
  error?: string;
  notRegistered?: boolean; // login: show "go to sign-up" link
  alreadyRegistered?: boolean; // sign-up: show "go to login" link
  message?: string; // success message (e.g. "check your email")
  email?: string; // keep what she typed, so the field isn't emptied
  name?: string;
};

const MIN_PASSWORD = 8;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

// Which ways can this email log in? null = not registered.
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
  const email = text(formData, "email").toLowerCase();
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: "צריך למלא אימייל וסיסמה.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.code === "invalid_credentials") {
    // Find out WHY: unknown email, Google-only account, or wrong password
    const methods = await loginMethods(email);
    if (methods === null) {
      return { error: "האימייל הזה לא רשום.", notRegistered: true, email };
    }
    if (methods && !methods.includes("email") && methods.includes("google")) {
      return {
        error: "החשבון הזה נרשם עם Google. אפשר להתחבר בכפתור Google למעלה.",
        email,
      };
    }
    if (methods) return { error: "הסיסמה שגויה.", email };
  }
  if (error) return { error: authErrorMessage(error), email };

  redirect(safeNext(formData.get("next")));
}

// ---------------------------------------------------------------------
// Create a new account
// ---------------------------------------------------------------------
export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = formData.get("password");

  if (!name || !email || typeof password !== "string" || !password) {
    return { error: "צריך למלא שם, אימייל וסיסמה.", email, name };
  }
  if (password.length < MIN_PASSWORD) {
    return { error: `הסיסמה צריכה להיות לפחות ${MIN_PASSWORD} תווים.`, email, name };
  }

  const methods = await loginMethods(email);
  if (methods) {
    return methods.includes("email")
      ? { error: "כבר יש חשבון עם האימייל הזה.", alreadyRegistered: true, email, name }
      : {
          error: "האימייל הזה כבר רשום דרך Google. אפשר להתחבר בכפתור Google למעלה.",
          email,
          name,
        };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      // The database trigger handle_new_user() copies this into profiles.display_name
      data: { full_name: name },
    },
  });
  if (error) return { error: authErrorMessage(error), email, name };

  // "Confirm email" is OFF in Supabase -> she is logged in already
  if (data.session) redirect("/");

  // "Confirm email" is still ON in Supabase -> an email was sent
  return {
    message: `שלחנו מייל אל ${email}. לחצי על הקישור שבמייל כדי להיכנס.`,
  };
}

// ---------------------------------------------------------------------
// Log in (or sign up) with Google
// ---------------------------------------------------------------------
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    console.error("Google sign-in error:", error?.code, error?.message);
    redirect("/login?error=google");
  }
  redirect(data.url);
}

// ---------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
