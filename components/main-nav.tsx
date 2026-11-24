"use client";
// The site's main links. Client component only to mark the current page.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function MainNav() {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const home = localePath(locale);
  const items = [
    { href: home, label: t.nav.recipes },
    { href: localePath(locale, "/books"), label: t.nav.books },
    { href: localePath(locale, "/trash"), label: t.nav.trash },
  ];
  const newRecipe = localePath(locale, "/recipes/new");

  // "Recipes" is active on the list and on any single recipe page
  const isActive = (href: string) =>
    href === home
      ? pathname === home || (pathname.startsWith(`${home}/recipes/`) && pathname !== newRecipe)
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label={t.nav.main} className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex h-10 shrink-0 items-center rounded-field px-3 text-[15px] transition-colors " +
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
          "ms-2 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-field bg-brand px-4 text-sm font-semibold text-white " +
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
        {t.nav.addRecipe}
      </Link>
    </nav>
  );
}
