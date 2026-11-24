import { signOut } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n/config";

export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={signOut}>
      <input type="hidden" name="lang" value={locale} />
      <button
        type="submit"
        className="h-10 rounded-field border border-line px-4 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {label}
      </button>
    </form>
  );
}
