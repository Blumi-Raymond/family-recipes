// Login screen. The frame is static (loads instantly); the part that
// reads the URL (?next=, ?email=, ?error=) sits inside <Suspense>,
// as Cache Components requires.
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { safeNext } from "@/lib/auth/safe-next";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.login.metaTitle };
}

async function LoginPanel({ searchParams }: PageProps<"/[lang]/login">) {
  const params = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const error = str(params.error);
  return (
    <LoginForm
      next={safeNext(params.next, "")}
      initialEmail={str(params.email)}
      notice={error === "link" || error === "google" ? error : undefined}
    />
  );
}

export default async function LoginPage(props: PageProps<"/[lang]/login">) {
  const { t } = await getI18n();
  return (
    <AuthShell title={t.login.title} subtitle={t.login.subtitle}>
      <Suspense fallback={<div className="h-[380px]" />}>
        <LoginPanel {...props} />
      </Suspense>
    </AuthShell>
  );
}
