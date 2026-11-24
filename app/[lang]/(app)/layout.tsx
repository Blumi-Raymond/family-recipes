// Frame for every page of the logged-in site: header with logo, links,
// language switch and sign-out. (proxy.ts already sent logged-out visitors
// to /login, and the database decides what each user may see.)
import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { MainNav } from "@/components/main-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/ui";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export default async function AppLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href={localePath(locale)} className="rounded-field outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <Logo name={t.meta.siteName} />
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <MainNav />
          </div>
          <div className="ms-auto flex items-center gap-2 sm:ms-0">
            <LanguageSwitch />
            <SignOutButton locale={locale} label={t.nav.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
