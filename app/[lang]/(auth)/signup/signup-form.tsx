"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Divider, Field } from "@/components/ui";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import { MIN_PASSWORD } from "@/lib/auth/errors";
import { useI18n } from "@/lib/i18n/client";
import { fmt, localePath } from "@/lib/i18n/config";
import { GoogleButton } from "../login/google-button";

export function SignupForm({ initialEmail }: { initialEmail: string }) {
  const { locale, t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {
    email: initialEmail,
  });

  if (state.checkEmail) {
    return <Alert tone="success">{fmt(t.signup.checkEmail, { email: state.email ?? "" })}</Alert>;
  }

  const loginHref =
    localePath(locale, "/login") +
    (state.email ? `?email=${encodeURIComponent(state.email)}` : "");
  const ltrField = locale === "he" ? "text-right" : "";

  return (
    <div className="flex flex-col gap-7">
      <GoogleButton />
      <Divider>{t.auth.or}</Divider>

      <form action={action} className="flex flex-col gap-[18px]">
        <input type="hidden" name="lang" value={locale} />
        <Field
          id="name"
          name="name"
          label={t.auth.name}
          autoComplete="name"
          required
          defaultValue={state.name}
        />
        <Field
          id="email"
          name="email"
          type="email"
          label={t.auth.email}
          dir="ltr"
          autoComplete="email"
          placeholder="name@gmail.com"
          required
          defaultValue={state.email}
          invalid={state.alreadyRegistered}
          className={ltrField}
        />
        <Field
          id="password"
          name="password"
          type="password"
          label={t.auth.password}
          hint={fmt(t.auth.passwordHint, { min: MIN_PASSWORD })}
          dir="ltr"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
          className={ltrField}
        />

        {state.error && (
          <Alert>
            {fmt(t.authErrors[state.error], { min: MIN_PASSWORD })}{" "}
            {state.alreadyRegistered && (
              <Link href={loginHref} className="font-semibold underline underline-offset-4">
                {t.signup.toLogin}
              </Link>
            )}
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? t.signup.submitting : t.signup.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        {t.signup.hasAccount}{" "}
        <Link
          href={loginHref}
          className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          {t.signup.toLogin}
        </Link>
      </p>
    </div>
  );
}
