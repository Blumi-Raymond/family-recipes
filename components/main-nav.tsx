"use client";
// The site's main links. Client component only to mark the current page.
// The current address is known only at request time, so the marked version
// is filled in inside <Suspense> (until then: the same links, none marked).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function MainNav() {
  return (
    <Suspense fallback={<NavLinks pathname={null} />}>
      <CurrentNav />
    </Suspense>
  );
}

function CurrentNav() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  const { locale, t } = useI18n();

  const home = localePath(locale);
  const items = [
    { href: home, label: t.nav.recipes },
    { href: localePath(locale, "/books"), label: t.nav.books },
    { href: localePath(locale, "/trash"), label: t.nav.trash },
  ];
  const newRecipe = localePath(locale, "/recipes/new");

  // "Recipes" is active on the list and on any single recipe page
  const isActive = (href: string) =>
    pathname === null
      ? false
      : href === home
      ? pathname === home || (pathname.startsWith(`${home}/recipes/`) && pathname !== newRecipe)
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label={t.nav.main} className="flex items-center gap-0.5 overflow-x-auto lg:gap-1">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex h-10 shrink-0 items-center rounded-field px-2.5 text-[15px] transition-colors max-[440px]:px-2 lg:px-3 " +
              "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
              (active
                ? "bg-brand-tint font-semibold text-brand-dark"
                : "font-medium text-ink-soft hover:bg-brand-tint hover:text-ink")
            }
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href={newRecipe}
        aria-current={pathname === newRecipe ? "page" : undefined}
        className={
          "ms-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-field bg-brand px-3 text-sm font-semibold text-white max-[440px]:px-2.5 lg:ms-2 lg:px-4 " +
          "transition-colors hover:bg-brand-dark outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {/* Small phones: the "+" alone (the text is still read out) */}
        <span className="max-[440px]:sr-only">{t.nav.addRecipe}</span>
      </Link>
    </nav>
  );
}
