// Home page — temporary until stage 1ה (books, recipe list, etc.).
// Only approved users reach this page (proxy.ts takes care of that).
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/sign-out-button";

async function Welcome() {
  const user = await getCurrentUser();
  return <p className="text-lg text-stone-700">שלום {user.displayName} 👋</p>;
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">מתכונים משפחתיים</h1>
        <SignOutButton />
      </header>

      <Suspense fallback={<p className="h-7" />}>
        <Welcome />
      </Suspense>

      <p className="mt-4 text-stone-600">
        כאן יופיעו בקרוב ספרי הבישול והמתכונים.
      </p>

      <Link
        href="/test-db"
        className="mt-8 inline-block text-sm text-amber-800 underline"
      >
        בדיקת חיבור למסד הנתונים
      </Link>
    </main>
  );
}
