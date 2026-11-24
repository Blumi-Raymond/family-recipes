"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { restoreRecipe } from "@/lib/actions/recipes";
import { useI18n } from "@/lib/i18n/client";

// The list refreshes by itself after restoring (the action refreshes pages)
export function RestoreButton({ id }: { id: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        block={false}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await restoreRecipe(id);
            setFailed(!result.ok);
          })
        }
      >
        {pending ? t.trash.restoring : t.trash.restore}
      </Button>
      {failed && (
        <p role="alert" className="text-xs font-medium text-danger">
          {t.formErrors.generic}
        </p>
      )}
    </div>
  );
}
