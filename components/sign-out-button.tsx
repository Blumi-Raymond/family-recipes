import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="h-10 rounded-field border border-line px-4 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-tint hover:text-ink"
      >
        יציאה
      </button>
    </form>
  );
}
