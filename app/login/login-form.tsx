"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Divider, Field } from "@/components/ui";
import { signIn, type AuthFormState } from "./actions";
import { GoogleButton } from "./google-button";

export function LoginForm({
  next,
  initialEmail,
  notice,
}: {
  next: string;
  initialEmail: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {
    email: initialEmail,
  });

  const signupHref = `/signup${state.email ? `?email=${encodeURIComponent(state.email)}` : ""}`;

  return (
    <div className="flex flex-col gap-7">
      {notice && <Alert>{notice}</Alert>}

      <GoogleButton next={next} />
      <Divider>או</Divider>

      <form action={action} className="flex flex-col gap-[18px]">
        <input type="hidden" name="next" value={next} />
        <Field
          id="email"
          name="email"
          type="email"
          label="אימייל"
          dir="ltr"
          autoComplete="email"
          placeholder="name@gmail.com"
          required
          defaultValue={state.email}
          invalid={state.notRegistered}
          className="text-right"
        />
        <Field
          id="password"
          name="password"
          type="password"
          label="סיסמה"
          dir="ltr"
          autoComplete="current-password"
          required
          className="text-right"
        />

        {state.error && (
          <Alert>
            {state.error}{" "}
            {state.notRegistered && (
              <Link href={signupHref} className="font-semibold underline underline-offset-4">
                להרשמה
              </Link>
            )}
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "מתחברת..." : "התחברות"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        עוד אין לך חשבון?{" "}
        <Link
          href={signupHref}
          className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          להרשמה
        </Link>
      </p>
    </div>
  );
}
