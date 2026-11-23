"use client";
// The two forms (login / sign-up) with a switch between them.
import { useActionState, useState } from "react";
import {
  signIn,
  signInWithGoogle,
  signUp,
  type AuthFormState,
} from "./actions";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 " +
  "focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";
const buttonClass =
  "w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white " +
  "hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60";

function ErrorBox({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
      {text}
    </p>
  );
}

function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="login-email" className={labelClass}>
          אימייל
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>
          סיסמה
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <ErrorBox text={state.error} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "מתחברת..." : "התחברות"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUp,
    {},
  );

  if (state.message) {
    return (
      <div
        role="status"
        className="rounded-lg bg-green-50 p-4 leading-relaxed text-green-900"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className={labelClass}>
          שם (כפי שיופיע במערכת)
        </label>
        <input
          id="signup-name"
          name="name"
          autoComplete="name"
          required
          defaultValue={state.name}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-email" className={labelClass}>
          אימייל
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className={labelClass}>
          סיסמה (לפחות 8 תווים)
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-confirm" className={labelClass}>
          הסיסמה שוב
        </label>
        <input
          id="signup-confirm"
          name="confirm"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>
      <ErrorBox text={state.error} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "יוצרת חשבון..." : "יצירת חשבון"}
      </button>
      <p className="text-center text-xs text-stone-500">
        אחרי ההרשמה החשבון ימתין לאישור לפני שאפשר לראות את המתכונים.
      </p>
    </form>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-semibold text-stone-800 hover:bg-stone-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
        </svg>
        המשך עם Google
      </button>
    </form>
  );
}

export function AuthForms({
  next,
  linkError,
  googleError,
}: {
  next: string;
  linkError: boolean;
  googleError: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const tab = (value: "login" | "signup", label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={
        "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors " +
        (mode === value
          ? "bg-white text-amber-800 shadow-sm"
          : "text-stone-600 hover:text-stone-900")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {linkError && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          הקישור מהמייל לא תקין או שפג תוקפו. אפשר פשוט להתחבר עם האימייל
          והסיסמה. אם הכתובת עדיין לא אושרה, כדאי לפתוח את הקישור באותו דפדפן
          שבו נרשמת.
        </p>
      )}

      {googleError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          ההתחברות עם Google לא הצליחה. אפשר לנסות שוב, או להתחבר עם אימייל
          וסיסמה.
        </p>
      )}

      <GoogleButton next={next} />

      <div className="flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        או עם אימייל
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        {tab("login", "התחברות")}
        {tab("signup", "הרשמה")}
      </div>

      {mode === "login" ? <LoginForm next={next} /> : <SignUpForm />}
    </div>
  );
}
