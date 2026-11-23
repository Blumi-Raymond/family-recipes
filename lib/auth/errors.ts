// Turns Supabase Auth error codes into Hebrew messages for the screen.
// Codes: https://supabase.com/docs/guides/auth/debugging/error-codes
const MESSAGES: Record<string, string> = {
  invalid_credentials: "האימייל או הסיסמה לא נכונים.",
  email_not_confirmed:
    "עדיין לא אישרת את כתובת האימייל. חפשי אצלך בתיבה מייל מהמערכת ולחצי על הקישור שבו.",
  user_already_exists: "כבר יש חשבון עם האימייל הזה. אפשר להתחבר.",
  email_exists: "כבר יש חשבון עם האימייל הזה. אפשר להתחבר.",
  weak_password: "הסיסמה חלשה מדי. כדאי לבחור סיסמה ארוכה יותר.",
  email_address_invalid: "כתובת האימייל לא תקינה.",
  signup_disabled: "ההרשמה סגורה כרגע.",
  over_email_send_rate_limit:
    "נשלחו יותר מדי מיילים בזמן קצר. כדאי לחכות כמה דקות ולנסות שוב.",
  over_request_rate_limit: "יותר מדי ניסיונות. כדאי לחכות כמה דקות ולנסות שוב.",
};

export function authErrorMessage(error: { code?: string; message: string }) {
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  // Unknown error: log the original (visible in the terminal / Vercel logs)
  console.error("Supabase auth error:", error.code, error.message);
  return "משהו השתבש. כדאי לנסות שוב בעוד רגע.";
}
