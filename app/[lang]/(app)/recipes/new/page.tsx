import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/ui";
import { getPersonalGroupId, getTags } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { getI18n } from "@/lib/i18n/server";
import { RecipeForm } from "../recipe-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.recipeForm.metaNew };
}

// ?book=<id> opens the form with that cookbook already chosen
async function NewRecipe({ searchParams }: PageProps<"/[lang]/recipes/new">) {
  const [{ book }, groupId, books, tags] = await Promise.all([
    searchParams,
    getPersonalGroupId(),
    listCookbookOptions(),
    getTags(),
  ]);
  return (
    <RecipeForm
      recipe={null}
      groupId={groupId}
      books={books}
      tags={tags}
      initialBookId={typeof book === "string" ? book : undefined}
    />
  );
}

export default async function NewRecipePage(props: PageProps<"/[lang]/recipes/new">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.recipeForm.titleNew} />
      <Suspense fallback={<FormSkeleton />}>
        <NewRecipe {...props} />
      </Suspense>
    </>
  );
}
