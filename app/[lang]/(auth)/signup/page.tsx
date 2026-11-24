import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { getI18n } from "@/lib/i18n/server";
import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.signup.metaTitle };
}

async function SignupPanel({ searchParams }: PageProps<"/[lang]/signup">) {
  const { email } = await searchParams;
  return <SignupForm initialEmail={typeof email === "string" ? email : ""} />;
}

export default async function SignupPage(props: PageProps<"/[lang]/signup">) {
  const { t } = await getI18n();
  return (
    <AuthShell title={t.signup.title} subtitle={t.signup.subtitle}>
      <Suspense fallback={<div className="h-[460px]" />}>
        <SignupPanel {...props} />
      </Suspense>
    </AuthShell>
  );
}
