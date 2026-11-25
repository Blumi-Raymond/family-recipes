"use client";
// Error on pages outside the logged-in frame (login / sign-up).
import { ErrorView } from "@/components/error-view";

export default function LangError(props: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6">
      <ErrorView {...props} />
    </main>
  );
}
