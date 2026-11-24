// Login screen. The frame is static (loads instantly); the part that
// reads the URL (?next=, ?email=, ?error=) sits inside <Suspense>,
// as Cache Components requires.
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { safeNext } from "@/lib/auth/safe-next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "התחברות · מתכונים משפחתיים" };

const NOTICES: Record<string, string> = {
  link: "הקישור לא תקין או שפג תוקפו. אפשר פשוט להתחבר.",
  google: "ההתחברות עם Google לא הצליחה. אפשר לנסות שוב.",
};

async function LoginPanel({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  return (
    <LoginForm
      next={safeNext(params.next)}
      initialEmail={str(params.email)}
      notice={NOTICES[str(params.error)]}
    />
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthShell title="שמחים שחזרת" subtitle="התחברי כדי לראות את המתכונים שלך">
      <Suspense fallback={<div className="h-[380px]" />}>
        <LoginPanel {...props} />
      </Suspense>
    </AuthShell>
  );
}
