"use client";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { trashRecipe } from "@/lib/actions/recipes";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function TrashButton({ id }: { id: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  return (
    <ConfirmButton
      label={t.recipe.moveToTrash}
      question={t.recipe.trashConfirm}
      note={t.recipe.trashNote}
      onConfirm={async () => {
        const result = await trashRecipe(id);
        if (!result.ok) return t.formErrors.generic;
        router.push(localePath(locale));
        return null;
      }}
    />
  );
}
