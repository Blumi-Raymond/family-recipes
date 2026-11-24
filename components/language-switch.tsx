"use client";
// "English" / "עברית" button: opens the same page in the other language.
// A plain <a> (full page load) on purpose: <html lang dir> changes too.
//
// The current address is known only when the page is requested, so the
// link is filled in inside <Suspense>; until then it points to the other
// language's home page.
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { localePath, switchLocalePath } from "@/lib/i18n/config";

function SwitchLink({ href }: { href?: string }) {
  const { locale, t } = useI18n();
  const other = locale === "he" ? "en" : "he";
  return (
    <a
      href={href ?? localePath(other)}
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

// Same page, other language; keeps ?next=... etc.
function CurrentPageSwitch() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const other = locale === "he" ? "en" : "he";
  return <SwitchLink href={switchLocalePath(pathname, other) + (search ? `?${search}` : "")} />;
}

export function LanguageSwitch() {
  return (
    <Suspense fallback={<SwitchLink />}>
      <CurrentPageSwitch />
    </Suspense>
  );
}
