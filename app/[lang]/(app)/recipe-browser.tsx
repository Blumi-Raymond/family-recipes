"use client";
// Search box and filters above the recipe list. Every change updates the URL;
// the server then sends the matching recipes (the list below dims meanwhile).
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Chip, Select } from "@/components/ui";
import type { Tag } from "@/lib/data/common";
import { useI18n } from "@/lib/i18n/client";
import { filtersToQuery, hasFilters, type Filters } from "@/lib/recipes/filters";

export function RecipeBrowser({
  filters,
  tags,
  books,
  children,
}: {
  filters: Filters; // from the URL
  tags: Tag[];
  books: { id: string; title: string }[];
  children: ReactNode; // the list (server-rendered)
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const [showTags, setShowTags] = useState(filters.tagIds.length > 0);

  // The search text we last sent to the URL, and the URL's text we last saw.
  // If the URL's text changes for another reason (Back button, a tag link),
  // the box shows the URL's text; our own updates don't overwrite her typing.
  const [sentQ, setSentQ] = useState(filters.q);
  const [seenQ, setSeenQ] = useState(filters.q);
  if (filters.q !== seenQ) {
    setSeenQ(filters.q);
    if (filters.q !== sentQ) {
      setQ(filters.q);
      setSentQ(filters.q);
    }
  }

  const go = (next: Filters) => {
    setSentQ(next.q);
    startTransition(() => router.replace(pathname + filtersToQuery(next), { scroll: false }));
  };

  // Search while typing, after a short pause. While another change is still
  // loading, wait for it (so we build on the newest filters, not old ones).
  useEffect(() => {
    const text = q.trim();
    if (pending || text === filters.q) return;
    const timer = setTimeout(() => {
      setSentQ(text);
      startTransition(() =>
        router.replace(pathname + filtersToQuery({ ...filters, q: text }), { scroll: false }),
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [q, filters, pending, pathname, router]);

  const toggleTag = (id: string) =>
    go({
      ...filters,
      tagIds: filters.tagIds.includes(id)
        ? filters.tagIds.filter((x) => x !== id)
        : [...filters.tagIds, id],
    });

  const kosherOptions = [
    { value: null, label: t.list.all },
    { value: "meat" as const, label: t.kosher.meat },
    { value: "dairy" as const, label: t.kosher.dairy },
    { value: "pareve" as const, label: t.kosher.pareve },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:p-5">
        {/* Search */}
        <div className="relative">
          <label htmlFor="search" className="sr-only">
            {t.list.search}
          </label>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                go({ ...filters, q: q.trim() });
              }
            }}
            placeholder={t.list.searchPlaceholder}
            dir="auto"
            className={
              "h-12 w-full rounded-field border border-line bg-surface ps-10 pe-3.5 text-[15px] text-ink " +
              "placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            }
          />
        </div>

        {/* Meat / dairy / pareve + book */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div role="group" aria-label={t.kosher.label} className="flex flex-wrap gap-2">
            {kosherOptions.map((o) => (
              <Chip
                key={o.label}
                selected={filters.kosher === o.value}
                onClick={() => go({ ...filters, kosher: o.value })}
              >
                {o.label}
              </Chip>
            ))}
            {tags.length > 0 && (
              <Chip
                selected={showTags || filters.tagIds.length > 0}
                aria-expanded={showTags}
                onClick={() => setShowTags((s) => !s)}
              >
                {t.list.tags}
                {filters.tagIds.length > 0 && ` (${filters.tagIds.length})`}
              </Chip>
            )}
          </div>
          {books.length > 0 && (
            <div className="w-full sm:w-64">
              <Select
                id="book-filter"
                label={t.list.book}
                value={filters.bookId ?? ""}
                onChange={(e) => go({ ...filters, bookId: e.target.value || null })}
              >
                <option value="">{t.list.allBooks}</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Tags */}
        {showTags && (
          <div role="group" aria-label={t.list.tags} className="flex flex-wrap gap-2 border-t border-line pt-4">
            {tags.map((tag) => (
              <Chip key={tag.id} selected={filters.tagIds.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
                {locale === "he" ? tag.name_he : tag.name_en}
              </Chip>
            ))}
          </div>
        )}

        {hasFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              go({ q: "", kosher: null, tagIds: [], bookId: null });
            }}
            className="self-start text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            {t.list.clear}
          </button>
        )}
      </div>

      <div aria-busy={pending} className={`transition-opacity ${pending ? "opacity-50" : ""}`}>
        {children}
      </div>
    </div>
  );
}
