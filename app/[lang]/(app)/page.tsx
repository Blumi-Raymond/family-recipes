// Home page: all recipes, with search and filters (kept in the URL).
import Link from "next/link";
import { Suspense } from "react";
import { Photo } from "@/components/photo";
import { CardsSkeleton } from "@/components/skeletons";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getTags } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { listRecipes } from "@/lib/data/recipes";
import { dirOf, localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { hasFilters, parseFilters } from "@/lib/recipes/filters";
import { RecipeBrowser } from "./recipe-browser";

async function Recipes({ searchParams }: PageProps<"/[lang]">) {
  const filters = parseFilters(await searchParams);
  const [{ locale, t }, recipes, tags, books] = await Promise.all([
    getI18n(),
    listRecipes(filters),
    getTags(),
    listCookbookOptions(),
  ]);

  // Nothing saved yet: invite her to add the first recipe (no filters to show)
  if (recipes.length === 0 && !hasFilters(filters)) {
    return (
      <EmptyState
        title={t.list.emptyTitle}
        text={t.list.emptyText}
        action={<LinkButton href={localePath(locale, "/recipes/new")}>{t.nav.addRecipe}</LinkButton>}
      />
    );
  }

  return (
    <RecipeBrowser filters={filters} tags={tags} books={books}>
      {recipes.length === 0 ? (
        <EmptyState title={t.list.noResultsTitle} text={t.list.noResultsText} />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft" role="status">
            {plural(recipes.length, t.list.countOne, t.list.countOther)}
          </p>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {recipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={localePath(locale, `/recipes/${r.id}`)}
                  className="group flex flex-col gap-2.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <Photo
                    src={r.thumbUrl}
                    alt=""
                    className="aspect-[4/3] w-full rounded-2xl border border-line transition-opacity group-hover:opacity-90"
                  />
                  <span
                    lang={r.language}
                    dir={dirOf(r.language)}
                    className="font-semibold leading-snug group-hover:text-brand"
                  >
                    {r.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-ink-faint">
                    <Badge>{t.kosher[r.kosher_type]}</Badge>
                    {r.bookTitle && <span className="truncate">{r.bookTitle}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </RecipeBrowser>
  );
}

export default async function Home(props: PageProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.list.title}
        actions={
          <LinkButton href={localePath(locale, "/recipes/new")} variant="secondary">
            {t.nav.addRecipe}
          </LinkButton>
        }
      />
      <Suspense fallback={<CardsSkeleton />}>
        <Recipes {...props} />
      </Suspense>
    </>
  );
}
