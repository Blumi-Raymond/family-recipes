"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Divider, Field } from "@/components/ui";
import { signUp, type AuthFormState } from "@/app/login/actions";
import { GoogleButton } from "@/app/login/google-button";

export function SignupForm({ initialEmail }: { initialEmail: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {
    email: initialEmail,
  });

  if (state.message) return <Alert tone="success">{state.message}</Alert>;

  const loginHref = `/login${state.email ? `?email=${encodeURIComponent(state.email)}` : ""}`;

  return (
    <div className="flex flex-col gap-7">
      <GoogleButton />
      <Divider>או</Divider>

      <form action={action} className="flex flex-col gap-[18px]">
        <Field
          id="name"
          name="name"
          label="שם"
          autoComplete="name"
          required
          defaultValue={state.name}
        />
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
          invalid={state.alreadyRegistered}
          className="text-right"
        />
        <Field
          id="password"
          name="password"
          type="password"
          label="סיסמה"
          hint="לפחות 8 תווים"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          required
          className="text-right"
        />

        {state.error && (
          <Alert>
            {state.error}{" "}
            {state.alreadyRegistered && (
              <Link href={loginHref} className="font-semibold underline underline-offset-4">
                להתחברות
              </Link>
            )}
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "יוצרת חשבון..." : "יצירת חשבון"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        כבר יש לך חשבון?{" "}
        <Link
          href={loginHref}
          className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          להתחברות
        </Link>
      </p>
    </div>
  );
}
