// One recipe. The interface follows the site's language; the recipe's own
// text follows the recipe's language (an English recipe reads left-to-right).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RecipeGallery, type GalleryItem } from "@/components/recipe-gallery";
import { Badge, LinkButton } from "@/components/ui";
import { getTags } from "@/lib/data/common";
import { getRecipe, type RecipeDetails } from "@/lib/data/recipes";
import { dirOf, fmt, localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMinutes } from "@/lib/recipes/format";
import { formatQuantity } from "@/lib/recipes/quantity";
import { TrashButton } from "./trash-button";

export async function generateMetadata({ params }: PageProps<"/[lang]/recipes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);
  return { title: recipe?.title };
}

// Items with the same heading, in order: [{ section, items }]
function bySection<T extends { section: string | null }>(items: T[]) {
  const groups: { section: string | null; items: T[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return groups;
}

async function RecipeView({ params }: PageProps<"/[lang]/recipes/[id]">) {
  const { id } = await params;
  const [{ locale, t }, recipe, tags] = await Promise.all([getI18n(), getRecipe(id), getTags()]);
  if (!recipe) notFound();

  const dir = dirOf(recipe.language);
  const content = { lang: recipe.language, dir };
  const tagNames = tags
    .filter((tag) => recipe.tagIds.includes(tag.id))
    .map((tag) => ({ id: tag.id, name: locale === "he" ? tag.name_he : tag.name_en }));
  // Dish photos first (main photo first), then the cookbook pages it was scanned from
  const gallery: GalleryItem[] = [
    ...recipe.photos.map((p) => ({ key: p.path, kind: "dish" as const, url: p.url, thumbUrl: p.thumbUrl })),
    ...recipe.sourcePages.map((p) => ({ key: p.id, kind: "page" as const, url: p.url, thumbUrl: p.thumbUrl })),
  ];

  const times = [
    { label: t.recipe.prep, value: recipe.prep_minutes },
    { label: t.recipe.cook, value: recipe.cook_minutes },
    { label: t.recipe.total, value: recipe.total_minutes },
  ].filter((x): x is { label: string; value: number } => x.value !== null);

  const body = (
    // @container: ingredients and method sit side by side when the column is wide enough
    <article className="@container flex min-w-0 flex-col gap-8">
      {/* ---- Title, labels, source ---- */}
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <Badge tone="brand">{t.kosher[recipe.kosher_type]}</Badge>
            {tagNames.map((tag) => (
              <Link key={tag.id} href={`${localePath(locale)}?tags=${tag.id}`} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <Badge>{tag.name}</Badge>
              </Link>
            ))}
          </div>
          <LinkButton href={localePath(locale, `/recipes/${recipe.id}/edit`)} variant="secondary">
            <PencilIcon />
            {t.common.edit}
          </LinkButton>
        </div>
        <h1 {...content} className="text-[34px] font-bold leading-tight tracking-tight @2xl:text-[40px]">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p {...content} className="text-[17px] leading-relaxed text-ink-soft">
            {recipe.description}
          </p>
        )}
        <SourceText recipe={recipe} />
      </header>

      {/* ---- Amount and time ---- */}
      {(recipe.yield_text || recipe.servings || times.length > 0) && (
        <dl className="flex flex-wrap gap-x-7 gap-y-4 border-y border-line py-4 sm:gap-x-10">
          {(recipe.yield_text || recipe.servings) && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-ink-soft">{t.recipe.amount}</dt>
              {/* "As written" in the recipe's language; servings in the site's */}
              <dd className="text-[17px] font-semibold">
                {recipe.yield_text && <bdi {...content}>{recipe.yield_text}</bdi>}
                {recipe.yield_text && recipe.servings && " · "}
                {recipe.servings && <bdi>{plural(recipe.servings, t.recipe.servingsOne, t.recipe.servingsOther)}</bdi>}
              </dd>
            </div>
          )}
          {times.map((time) => (
            <div key={time.label} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-ink-soft">{time.label}</dt>
              <dd className="text-[17px] font-semibold">{formatMinutes(time.value, t.time)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* ---- Ingredients + method ---- */}
      {(recipe.ingredients.length > 0 || recipe.steps.length > 0) && (
        <div
          {...content}
          className={
            "grid items-start gap-8 @2xl:gap-10 " +
            (recipe.ingredients.length > 0 && recipe.steps.length > 0
              ? "@2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              : "")
          }
        >
        {recipe.ingredients.length > 0 && (
          <section className="flex flex-col gap-4 rounded-2xl bg-brand-tint p-6">
            <h2 lang={locale} dir={dirOf(locale)} className="flex items-baseline justify-between gap-3 text-[20px] font-bold tracking-tight">
              {t.recipeForm.sectionIngredients}
              <span className="text-[13px] font-normal text-ink-soft">
                {fmt(t.recipe.ingredientsCount, { n: recipe.ingredients.length })}
              </span>
            </h2>
            {bySection(recipe.ingredients).map((group, gi) => (
              <div key={gi} className="flex flex-col gap-1">
                {group.section && <h3 className="pt-2 text-[15px] font-semibold text-brand">{group.section}</h3>}
                <ul className="flex flex-col">
                  {group.items.map((ing, i) => {
                    const qty = formatQuantity(ing.quantity, ing.quantity_max);
                    return (
                      <li key={i} className="border-b border-line py-2.5 text-[15px] leading-snug last:border-0">
                        {(qty || ing.unit) && (
                          <span className="font-semibold">
                            <bdi>{qty}</bdi>
                            {ing.unit ? ` ${ing.unit}` : ""}{" "}
                          </span>
                        )}
                        {ing.name}
                        {ing.note && <span className="text-ink-soft">, {ing.note}</span>}
                        {ing.is_optional && (
                          <span lang={locale} className="text-ink-faint"> ({t.recipe.optional})</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section className="flex flex-col gap-5 @2xl:pt-6">
            <h2 lang={locale} dir={dirOf(locale)} className="text-[20px] font-bold tracking-tight">
              {t.recipeForm.sectionSteps}
            </h2>
            <StepsList steps={recipe.steps} />
          </section>
        )}
      </div>
      )}

      {/* ---- Notes ---- */}
      {recipe.notes && (
        <section className="flex flex-col gap-2 rounded-2xl border border-line p-6">
          <h2 className="text-[17px] font-bold tracking-tight">{t.recipeForm.sectionNotes}</h2>
          <p {...content} className="whitespace-pre-line text-[15px] leading-relaxed">
            {recipe.notes}
          </p>
        </section>
      )}

      {/* ---- Rarely needed: at the end, out of the way ---- */}
      <div className="flex border-t border-line pt-6">
        <TrashButton id={recipe.id} />
      </div>
    </article>
  );

  if (gallery.length === 0) return body;

  // Photos beside the recipe on wide screens: the recipe on the start side
  // (right in Hebrew, left in English), the photos on the end side, staying in
  // view while scrolling. Narrower: the photos on top, then the recipe.
  return (
    <div data-wide className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
      {body}
      <aside aria-label={t.recipe.photos} className="order-first min-w-0 lg:sticky lg:top-6 lg:order-none">
        <RecipeGallery items={gallery} title={recipe.title} />
      </aside>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}

// Numbered steps; numbering continues across headings
function StepsList({ steps }: { steps: RecipeDetails["steps"] }) {
  const numbered = steps.map((step, i) => ({ ...step, n: i + 1 }));
  return (
    <div className="flex flex-col gap-5">
      {bySection(numbered).map((group, gi) => (
        <div key={gi} className="flex flex-col gap-3">
          {group.section && <h3 className="text-[15px] font-semibold text-brand">{group.section}</h3>}
          <ol className="flex flex-col gap-4">
            {group.items.map((step) => (
              <li key={step.n} value={step.n} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand-dark"
                >
                  {step.n}
                </span>
                <p className="whitespace-pre-line pt-0.5 text-[15px] leading-relaxed">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

async function SourceText({ recipe }: { recipe: RecipeDetails }) {
  const { locale, t } = await getI18n();
  if (recipe.book) {
    return (
      <p className="text-[15px] text-ink-soft">
        <Link
          href={`${localePath(locale)}?book=${recipe.book.id}`}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {fmt(t.recipe.fromBook, { book: recipe.book.title })}
        </Link>
        {recipe.page_number && <> · {fmt(t.recipe.page, { n: recipe.page_number })}</>}
      </p>
    );
  }
  if (recipe.source_note) {
    return (
      <p lang={recipe.language} dir={dirOf(recipe.language)} className="text-[15px] text-ink-soft">
        {recipe.source_note}
      </p>
    );
  }
  return null;
}

function RecipeSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-7 w-24 animate-pulse rounded-full bg-brand-tint" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-brand-tint" />
      <div className="aspect-[4/3] max-w-3xl animate-pulse rounded-2xl bg-brand-tint" />
    </div>
  );
}

export default function RecipePage(props: PageProps<"/[lang]/recipes/[id]">) {
  return (
    <Suspense fallback={<RecipeSkeleton />}>
      <RecipeView {...props} />
    </Suspense>
  );
}
