// Frame for every page of the logged-in site: header with logo, links,
// language switch and sign-out. One width for every page, so the header never
// moves when going from page to page. (proxy.ts already sent logged-out visitors
// to /login, and the database decides what each user may see.)
import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { MainNav } from "@/components/main-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/ui";
import { countWaitingRecipes } from "@/lib/data/scan";
import { fmt, localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-6 sm:px-6">
          <Link href={localePath(locale)} className="rounded-field outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <Logo name={t.meta.siteName} />
          </Link>
          <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
            <MainNav
              scanBadge={
                <Suspense fallback={null}>
                  <WaitingBadge />
                </Suspense>
              }
            />
          </div>
          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <LanguageSwitch />
            <SignOutButton locale={locale} label={t.nav.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

// How many scanned recipes wait for review (nothing when none)
async function WaitingBadge() {
  const [{ t }, count] = await Promise.all([getI18n(), countWaitingRecipes()]);
  if (count === 0) return null;
  return (
    <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white max-[440px]:ms-0.5">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{fmt(t.waiting.navCount, { n: count })}</span>
    </span>
  );
}
