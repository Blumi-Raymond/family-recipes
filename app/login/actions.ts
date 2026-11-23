"use server";
// Server Actions for login / sign-up / logout.
// They run on the server, so the password never passes through our own code
// on the client beyond the form itself.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/safe-next";

export type AuthFormState = {
  error?: string;
  message?: string;
  email?: string; // keep what she typed, so the field isn't emptied on error
  name?: string;
};

const MIN_PASSWORD = 8;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
  if (error) return { error: authErrorMessage(error), email };

  // proxy.ts will send an unapproved user on to /pending
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
  const confirm = formData.get("confirm");

  if (!name || !email || typeof password !== "string" || !password) {
    return { error: "צריך למלא שם, אימייל וסיסמה.", email, name };
  }
  if (password.length < MIN_PASSWORD) {
    return {
      error: `הסיסמה צריכה להיות לפחות ${MIN_PASSWORD} תווים.`,
      email,
      name,
    };
  }
  if (password !== confirm) {
    return { error: "שתי הסיסמאות לא זהות.", email, name };
  }

  // The link in the confirmation email comes back to this site
  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // The database trigger handle_new_user() copies this into profiles.display_name
      data: { full_name: name },
    },
  });
  if (error) return { error: authErrorMessage(error), email, name };

  // If email confirmation is turned off in Supabase, she is logged in already
  if (data.session) redirect("/pending");

  // Usual case: Supabase sent a confirmation email.
  // (For privacy, Supabase gives the same answer when the email is already
  // registered, so the message is worded to fit both cases.)
  return {
    message:
      "כמעט סיימנו! שלחנו מייל אל " +
      email +
      ". לחצי על הקישור שבמייל כדי לאשר את הכתובת. אם לא הגיע תוך כמה דקות, כדאי לבדוק בתיקיית הספאם.",
  };
}

// ---------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
