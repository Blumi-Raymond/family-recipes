"use client";
import { useFormStatus } from "react-dom";
import { Button, GoogleIcon } from "@/components/ui";
import { signInWithGoogle } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/client";

function Submit() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} className="font-medium">
      <GoogleIcon />
      {pending ? t.auth.googleRedirecting : t.auth.google}
    </Button>
  );
}

// `next` = where to go after login (empty = home page)
export function GoogleButton({ next = "" }: { next?: string }) {
  const { locale } = useI18n();
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="next" value={next} />
      <Submit />
    </form>
  );
}
