"use client";
// Shown when a page fails to load (e.g. the database didn't answer).
// Used by the error.tsx files.
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "./ui";

export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-10">
      <h1 className="text-[34px] font-bold tracking-tight">{t.errorPage.title}</h1>
      <p className="text-[15px] text-ink-soft">{t.errorPage.text}</p>
      <Button block={false} className="mt-2" onClick={() => retry()}>
        {t.errorPage.retry}
      </Button>
    </div>
  );
}
