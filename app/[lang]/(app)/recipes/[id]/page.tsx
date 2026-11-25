// One recipe. The interface follows the site's language; the recipe's own
// text follows the recipe's language (an English recipe reads left-to-right).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Photo } from "@/components/photo";
import { Badge, LinkButton } from "@/components/ui";
import { getTags } from "@/lib/data/common";
import { getRecipe, type RecipeDetails } from "@/lib/data/recipes";
import { dirOf, fmt, localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatMinutes } from "@/lib/recipes/format";
import { formatQuantity } from "@/lib/recipes/quantity";
import { pageIdsParam } from "@/lib/scan/pages";
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
  const [cover, ...more] = recipe.photos;

  const times = [
    { label: t.recipe.prep, value: recipe.prep_minutes },
    { label: t.recipe.cook, value: recipe.cook_minutes },
    { label: t.recipe.total, value: recipe.total_minutes },
  ].filter((x): x is { label: string; value: number } => x.value !== null);

  return (
    <article className="flex flex-col gap-8">
      {/* ---- Title and labels ---- */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{t.kosher[recipe.kosher_type]}</Badge>
          {tagNames.map((tag) => (
            <Link key={tag.id} href={`${localePath(locale)}?tags=${tag.id}`}>
              <Badge>{tag.name}</Badge>
            </Link>
          ))}
        </div>
        <h1 {...content} className="text-[34px] font-bold leading-tight tracking-tight">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p {...content} className="max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            {recipe.description}
          </p>
        )}
        <SourceLine recipe={recipe} />
      </header>

      {/* ---- Photos ---- */}
      {cover && (
        <div className="flex flex-col gap-3">
          <a href={cover.url ?? undefined} target="_blank" rel="noopener" className="block max-w-3xl">
            <Photo
              src={cover.url}
              alt={recipe.title}
              eager
              className="aspect-[4/3] w-full rounded-2xl border border-line"
            />
          </a>
          {more.length > 0 && (
            <ul className="flex flex-wrap gap-3">
              {more.map((p, i) => (
                <li key={p.path}>
                  <a href={p.url ?? undefined} target="_blank" rel="noopener" className="block">
                    <Photo
                      src={p.thumbUrl}
                      alt={fmt(t.recipe.photo, { n: i + 2 })}
                      className="size-24 rounded-xl border border-line"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---- Amount and time ---- */}
      {(recipe.yield_text || recipe.servings || times.length > 0) && (
        <dl className="flex flex-wrap gap-x-8 gap-y-3 rounded-2xl bg-brand-tint px-6 py-4 text-[15px]">
          {recipe.yield_text && (
            <div {...content}>
              <dt className="sr-only">{t.recipeForm.yield}</dt>
              <dd className="font-semibold">{recipe.yield_text}</dd>
            </div>
          )}
          {recipe.servings && (
            <div>
              <dt className="sr-only">{t.recipeForm.servings}</dt>
              <dd className="font-semibold">
                {plural(recipe.servings, t.recipe.servingsOne, t.recipe.servingsOther)}
              </dd>
            </div>
          )}
          {times.map((time) => (
            <div key={time.label} className="flex gap-1.5">
              <dt className="text-ink-soft">{time.label}</dt>
              <dd className="font-semibold">{formatMinutes(time.value, t.time)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* ---- Ingredients + method ---- */}
      <div {...content} className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {recipe.ingredients.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 lang={locale} dir={dirOf(locale)} className="text-[20px] font-bold tracking-tight">
              {t.recipeForm.sectionIngredients}
            </h2>
            {bySection(recipe.ingredients).map((group, gi) => (
              <div key={gi} className="flex flex-col gap-2">
                {group.section && <h3 className="text-[15px] font-semibold text-brand">{group.section}</h3>}
                <ul className="flex flex-col">
                  {group.items.map((ing, i) => {
                    const amount = formatQuantity(ing.quantity, ing.quantity_max);
                    return (
                      <li key={i} className="border-b border-line py-2.5 text-[15px] leading-snug last:border-0">
                        {(amount || ing.unit) && (
                          <span className="font-semibold">
                            <bdi>{amount}</bdi>
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
          <section className="flex flex-col gap-4">
            <h2 lang={locale} dir={dirOf(locale)} className="text-[20px] font-bold tracking-tight">
              {t.recipeForm.sectionSteps}
            </h2>
            <StepsList steps={recipe.steps} />
          </section>
        )}
      </div>

      {/* ---- Notes ---- */}
      {recipe.notes && (
        <section className="flex flex-col gap-2 rounded-2xl border border-line p-6">
          <h2 className="text-[17px] font-bold tracking-tight">{t.recipeForm.sectionNotes}</h2>
          <p {...content} className="whitespace-pre-line text-[15px] leading-relaxed">
            {recipe.notes}
          </p>
        </section>
      )}

      {/* ---- Actions ---- */}
      <div className="flex flex-wrap items-start gap-3 border-t border-line pt-6">
        <LinkButton href={localePath(locale, `/recipes/${recipe.id}/edit`)}>{t.common.edit}</LinkButton>
        <TrashButton id={recipe.id} />
      </div>
    </article>
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

async function SourceLine({ recipe }: { recipe: RecipeDetails }) {
  const { locale, t } = await getI18n();
  const source = <SourceText recipe={recipe} />;
  if (recipe.sourcePageIds.length === 0) return source;
  // Scanned: back to its page photos (and any recipe from them not saved yet)
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {source}
      <Link
        href={`${localePath(locale, "/scan/review")}?pages=${pageIdsParam(recipe.sourcePageIds)}`}
        className="text-[15px] font-medium text-brand underline-offset-4 hover:underline"
      >
        {t.recipe.scanPages}
      </Link>
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
