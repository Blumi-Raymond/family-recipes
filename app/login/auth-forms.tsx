"use client";
// The two forms (login / sign-up) with a switch between them.
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

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

export function AuthForms({
  next,
  linkError,
}: {
  next: string;
  linkError: boolean;
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

      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        {tab("login", "התחברות")}
        {tab("signup", "הרשמה")}
      </div>

      {mode === "login" ? <LoginForm next={next} /> : <SignUpForm />}
    </div>
  );
}
