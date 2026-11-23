// "Waiting for approval" screen — for users who logged in but whose
// profiles.is_approved is still false. proxy.ts sends them here.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "ממתינה לאישור · מתכונים משפחתיים" };

async function Greeting() {
  const user = await getCurrentUser();
  return (
    <>
      <h1 className="mb-3 text-2xl font-bold text-stone-900">
        שלום {user.displayName}!
      </h1>
      <p className="text-sm text-stone-500" dir="ltr">
        {user.email}
      </p>
    </>
  );
}

export default function PendingPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-amber-50/60 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="mb-4 text-5xl" aria-hidden>
          ⏳
        </div>
        <Suspense fallback={<div className="h-16" />}>
          <Greeting />
        </Suspense>
        <p className="mt-5 leading-relaxed text-stone-700">
          החשבון נוצר בהצלחה וממתין לאישור.
          <br />
          ברגע שהחשבון יאושר, אפשר יהיה לראות את המתכונים ולהוסיף חדשים.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            אושרתי? לבדיקה
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
