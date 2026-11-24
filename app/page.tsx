// Home page — temporary until stage 1ה (books, recipe list, etc.).
// Only logged-in users reach this page (proxy.ts takes care of that).
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/ui";

async function Welcome() {
  const user = await getCurrentUser();
  return (
    <h1 className="text-[34px] font-bold leading-tight tracking-tight">
      שלום {user.displayName}
    </h1>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Logo />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Suspense fallback={<div className="h-11" />}>
          <Welcome />
        </Suspense>
        <p className="mt-2 text-[15px] text-ink-soft">כאן יופיעו בקרוב ספרי הבישול והמתכונים שלך.</p>

        <div className="mt-10 rounded-2xl bg-brand-tint p-8">
          <p className="text-sm font-semibold text-brand">בקרוב</p>
          <p className="mt-2 max-w-md text-ink-soft">
            הוספת ספרי בישול ומתכונים, חיפוש וסינון לפי חלבי, בשרי ופרווה.
          </p>
        </div>

        <Link
          href="/test-db"
          className="mt-8 inline-block text-sm text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          בדיקת חיבור למסד הנתונים
        </Link>
      </main>
    </div>
  );
}
