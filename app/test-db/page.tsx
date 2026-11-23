// Temporary page to check the Supabase connection. Delete before launch.
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TestDbPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const loggedIn = Boolean(claims?.claims);

  const { data: tags, error } = await supabase
    .from("tags")
    .select("slug, name_he, name_en, category")
    .order("category")
    .order("name_en");

  return (
    <main dir="rtl" className="mx-auto max-w-xl p-8 font-sans">
      <h1 className="mb-6 text-2xl font-bold">בדיקת חיבור למסד הנתונים</h1>

      <ul className="mb-6 space-y-2">
        <li>{error ? "❌" : "✅"} החיבור ל-Supabase {error ? "נכשל" : "עובד"}</li>
        <li>{loggedIn ? "✅ מחוברת" : "⚪ לא מחוברת (עדיין אין מסך התחברות)"}</li>
        <li>תוויות שנקראו: {tags?.length ?? 0}</li>
      </ul>

      {error && (
        <p className="rounded bg-red-100 p-3 text-red-900" dir="ltr">
          {error.message}
        </p>
      )}

      {!error && tags?.length === 0 && (
        <p className="rounded bg-amber-100 p-3 text-amber-900">
          0 תוויות זה תקין בשלב הזה. מסד הנתונים מוגן: רק משתמשת מחוברת
          ומאושרת רואה נתונים. אחרי שנבנה את מסך ההתחברות, כאן יופיעו 15
          התוויות.
        </p>
      )}

      {tags && tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.slug} className="rounded-full bg-gray-200 px-3 py-1">
              {t.name_he} / {t.name_en}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
