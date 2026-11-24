"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Divider, Field } from "@/components/ui";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import { MIN_PASSWORD } from "@/lib/auth/errors";
import { useI18n } from "@/lib/i18n/client";
import { fmt, localePath } from "@/lib/i18n/config";
import { GoogleButton } from "./google-button";

export function LoginForm({
  next,
  initialEmail,
  notice,
}: {
  next: string;
  initialEmail: string;
  notice?: "link" | "google";
}) {
  const { locale, t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {
    email: initialEmail,
  });

  const signupHref =
    localePath(locale, "/signup") +
    (state.email ? `?email=${encodeURIComponent(state.email)}` : "");
  // Email/password are typed left-to-right; in Hebrew keep them aligned right
  const ltrField = locale === "he" ? "text-right" : "";

  return (
    <div className="flex flex-col gap-7">
      {notice && <Alert>{notice === "link" ? t.login.noticeLink : t.login.noticeGoogle}</Alert>}

      <GoogleButton next={next} />
      <Divider>{t.auth.or}</Divider>

      <form action={action} className="flex flex-col gap-[18px]">
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="next" value={next} />
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
          invalid={state.notRegistered}
          className={ltrField}
        />
        <Field
          id="password"
          name="password"
          type="password"
          label={t.auth.password}
          dir="ltr"
          autoComplete="current-password"
          required
          className={ltrField}
        />

        {state.error && (
          <Alert>
            {fmt(t.authErrors[state.error], { min: MIN_PASSWORD })}{" "}
            {state.notRegistered && (
              <Link href={signupHref} className="font-semibold underline underline-offset-4">
                {t.login.toSignup}
              </Link>
            )}
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? t.login.submitting : t.login.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        {t.login.noAccount}{" "}
        <Link
          href={signupHref}
          className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          {t.login.toSignup}
        </Link>
      </p>
    </div>
  );
}
