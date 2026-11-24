// Where to send the user after login. Only allows paths inside this site
// (e.g. "/he/recipes/5"), so a link like /login?next=https://evil.com can't
// redirect someone to another website.
export function safeNext(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
