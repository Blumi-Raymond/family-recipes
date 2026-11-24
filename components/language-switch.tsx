"use client";
// "English" / "עברית" button: opens the same page in the other language.
// A plain <a> (full page load) on purpose: <html lang dir> changes too.
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { switchLocalePath } from "@/lib/i18n/config";

function SwitchLink({ search }: { search: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const other = locale === "he" ? "en" : "he";
  return (
    <a
      href={switchLocalePath(pathname, other) + (search ? `?${search}` : "")}
      hrefLang={other}
      lang={other}
      aria-label={t.language.switchLabel}
      className={
        "inline-flex h-10 items-center rounded-field px-3 text-sm font-medium text-ink-soft " +
        "transition-colors hover:bg-brand-tint hover:text-ink " +
        "outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      }
    >
      {t.language.switchTo}
    </a>
  );
}

// Keeps ?next=... etc. when switching. Reading the query needs <Suspense>.
function SwitchLinkWithQuery() {
  return <SwitchLink search={useSearchParams().toString()} />;
}

export function LanguageSwitch() {
  return (
    <Suspense fallback={<SwitchLink search="" />}>
      <SwitchLinkWithQuery />
    </Suspense>
  );
}
