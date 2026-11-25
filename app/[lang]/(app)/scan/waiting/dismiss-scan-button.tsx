"use client";
// "Remove from the list" for a scan in "continue where you stopped".
// The list refreshes by itself (the action refreshes the page).
import { ConfirmButton } from "@/components/confirm-button";
import { dismissScanDraft } from "@/lib/actions/scan";
import { useI18n } from "@/lib/i18n/client";

export function DismissScanButton({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <ConfirmButton
      label={t.scan.openDismiss}
      question={t.scan.openDismissQuestion}
      variant="secondary"
      onConfirm={async () => ((await dismissScanDraft(id)).ok ? null : t.scan.openDismissError)}
    />
  );
}
