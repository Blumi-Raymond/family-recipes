import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "הרשמה · מתכונים משפחתיים" };

async function SignupPanel({ searchParams }: PageProps<"/signup">) {
  const { email } = await searchParams;
  return <SignupForm initialEmail={typeof email === "string" ? email : ""} />;
}

export default function SignupPage(props: PageProps<"/signup">) {
  return (
    <AuthShell title="יוצרים חשבון" subtitle="שתי דקות, ואפשר להתחיל לשמור מתכונים">
      <Suspense fallback={<div className="h-[460px]" />}>
        <SignupPanel {...props} />
      </Suspense>
    </AuthShell>
  );
}
