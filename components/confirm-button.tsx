"use client";
// A button that asks "are you sure?" in place before doing something
// (no browser pop-ups). Escape or "No" cancels.
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Alert, Button } from "./ui";

export function ConfirmButton({
  label,
  question,
  note,
  onConfirm,
  variant = "danger",
}: {
  label: string;
  question: string;
  note?: string;
  onConfirm: () => Promise<string | null>; // returns an error message, or null
  variant?: "danger" | "secondary";
}) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!asking) {
    return (
      <Button variant={variant} size="sm" block={false} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={question}
      className="flex flex-col gap-3 rounded-2xl border border-line p-4"
      onKeyDown={(e) => e.key === "Escape" && !pending && setAsking(false)}
    >
      <p className="text-[15px] font-medium">{question}</p>
      {note && <p className="text-sm text-ink-soft">{note}</p>}
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <Button
          variant={variant}
          size="sm"
          block={false}
          disabled={pending}
          autoFocus
          onClick={() =>
            startTransition(async () => {
              const message = await onConfirm();
              if (message) setError(message);
            })
          }
        >
          {t.confirm.yes}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          block={false}
          disabled={pending}
          onClick={() => {
            setAsking(false);
            setError(null);
          }}
        >
          {t.confirm.no}
        </Button>
      </div>
    </div>
  );
}
