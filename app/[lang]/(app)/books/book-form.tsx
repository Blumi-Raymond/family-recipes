"use client";
// Add / edit a cookbook.
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { PhotoPicker, type PickedPhoto } from "@/components/photo-picker";
import { Alert, Button, Field, LinkButton, TextArea } from "@/components/ui";
import { deleteCookbook, saveCookbook } from "@/lib/actions/books";
import { cookbookSchema, type CookbookInput } from "@/lib/books/schema";
import { useI18n } from "@/lib/i18n/client";
import { localePath, type Locale } from "@/lib/i18n/config";
import { detectLanguage } from "@/lib/i18n/detect";
import { toFieldErrors, type FieldErrors, type FormErrorKey } from "@/lib/validation";

export type BookFormInitial = {
  id: string;
  title: string;
  author: string | null;
  language: Locale;
  notes: string | null;
  cover_image_path: string | null;
  coverUrl: string | null;
};

export function BookForm({ initial, groupId }: { initial: BookFormInitial | null; groupId: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [cover, setCover] = useState<PickedPhoto[]>(
    initial?.cover_image_path
      ? [{ path: initial.cover_image_path, previewUrl: initial.coverUrl, is_cover: true }]
      : [],
  );
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  const booksPath = localePath(locale, "/books");
  const fieldError = (key: string) => (errors[key] ? t.formErrors[errors[key]] : undefined);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (uploading) return;

    const input: CookbookInput = {
      title,
      author,
      // Detected from what she typed; no need to ask
      language: detectLanguage([title, author, notes], initial?.language ?? locale),
      notes,
      cover_image_path: cover[0]?.path ?? null,
    };
    const parsed = cookbookSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      setFormError("summary");
      return;
    }
    setErrors({});
    setFormError(null);

    startTransition(async () => {
      let result;
      try {
        result = await saveCookbook(initial?.id ?? null, parsed.data);
      } catch {
        setFormError("generic");
        return;
      }
      if (result.ok) {
        router.push(booksPath);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-[480px] flex-col gap-[18px]">
      <Field
        id="title"
        label={t.books.fieldTitle}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldError("title")}
        dir="auto"
        maxLength={200}
        required
      />
      <Field
        id="author"
        label={t.books.fieldAuthor}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        error={fieldError("author")}
        dir="auto"
        maxLength={200}
      />
      <TextArea
        id="notes"
        label={t.books.fieldNotes}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={fieldError("notes")}
        dir="auto"
      />
      <PhotoPicker
        label={t.books.fieldCover}
        groupId={groupId}
        folder="covers"
        photos={cover}
        setPhotos={setCover}
        max={1}
        onBusyChange={setUploading}
      />

      {formError && <Alert>{t.formErrors[formError]}</Alert>}
      {uploading && <p className="text-sm text-ink-soft">{t.images.waitForUpload}</p>}

      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="submit" block={false} disabled={pending || uploading}>
          {pending ? t.common.saving : t.books.save}
        </Button>
        <LinkButton href={booksPath} variant="secondary" size="md">
          {t.common.cancel}
        </LinkButton>
      </div>

      {initial && (
        <div className="mt-6 border-t border-line pt-6">
          <ConfirmButton
            label={t.books.delete}
            question={t.books.deleteConfirm}
            onConfirm={async () => {
              const result = await deleteCookbook(initial.id);
              if (result.ok) {
                router.push(booksPath);
                return null;
              }
              return result.error === "inUse" ? t.books.deleteBlocked : t.formErrors.generic;
            }}
          />
        </div>
      )}
    </form>
  );
}
