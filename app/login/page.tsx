// Login / sign-up screen.
// The frame is static (loads instantly); the part that reads the URL
// (?next=..., ?error=...) is inside <Suspense>, as Cache Components requires.
import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNext } from "@/lib/auth/safe-next";
import { AuthForms } from "./auth-forms";

export const metadata: Metadata = { title: "התחברות · מתכונים משפחתיים" };

async function LoginPanel({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return (
    <AuthForms
      next={safeNext(params.next)}
      linkError={params.error === "link"}
    />
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-amber-50/60 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1 className="mb-1 text-center text-2xl font-bold text-stone-900">
          מתכונים משפחתיים
        </h1>
        <p className="mb-6 text-center text-sm text-stone-500">
          ספר המתכונים של המשפחה
        </p>
        <Suspense fallback={<div className="h-72" />}>
          <LoginPanel {...props} />
        </Suspense>
      </div>
    </main>
  );
}
