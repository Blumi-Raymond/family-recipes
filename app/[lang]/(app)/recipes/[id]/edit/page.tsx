import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/ui";
import { getTags } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { getRecipe } from "@/lib/data/recipes";
import { getI18n } from "@/lib/i18n/server";
import { RecipeForm } from "../../recipe-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.recipeForm.metaEdit };
}

async function EditRecipe({ params }: PageProps<"/[lang]/recipes/[id]/edit">) {
  const { id } = await params;
  const [recipe, books, tags] = await Promise.all([getRecipe(id), listCookbookOptions(), getTags()]);
  if (!recipe) notFound();
  return <RecipeForm recipe={recipe} groupId={recipe.group_id} books={books} tags={tags} />;
}

export default async function EditRecipePage(props: PageProps<"/[lang]/recipes/[id]/edit">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.recipeForm.titleEdit} />
      <Suspense fallback={<FormSkeleton />}>
        <EditRecipe {...props} />
      </Suspense>
    </>
  );
}
