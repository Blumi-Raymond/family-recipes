// Turns Supabase Auth error codes into message keys (texts: authErrors in
// lib/i18n/dictionaries). Codes: https://supabase.com/docs/guides/auth/debugging/error-codes
import type { Dictionary } from "@/lib/i18n/dictionaries/he";

// Minimum password length (checked in the form and again on the server)
export const MIN_PASSWORD = 8;

export type AuthErrorKey = keyof Dictionary["authErrors"];

const KEYS: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "alreadyRegistered",
  email_exists: "alreadyRegistered",
  weak_password: "weakPassword",
  email_address_invalid: "invalidEmail",
  signup_disabled: "signupDisabled",
  over_email_send_rate_limit: "tooManyEmails",
  over_request_rate_limit: "tooManyRequests",
};

export function authErrorKey(error: { code?: string; message: string }): AuthErrorKey {
  if (error.code && KEYS[error.code]) return KEYS[error.code];
  // Unknown error: log the original (visible in the terminal / Vercel logs)
  console.error("Supabase auth error:", error.code, error.message);
  return "unknown";
}
