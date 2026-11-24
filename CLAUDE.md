@AGENTS.md

# Family Recipes — rules for Claude

## Working style
- Talk to the owner in Hebrew, short and clear. She is a junior developer — explain new concepts briefly, without lecturing.
- Before building something big or changing the plan: give a short plan and wait for approval.
- Work efficiently: read only the files you need, avoid repeating long explanations, no unnecessary tool calls.
- When something needs a manual step (Supabase dashboard, Vercel, Google Cloud), give exact click-by-click steps.
- Keep `docs/roadmap-and-status.md` (the claude.ai Project doc) up to date when a stage changes.

## Tech
- Next.js 16 with `cacheComponents: true`: no `export const dynamic`; anything reading cookies/searchParams/the DB goes inside `<Suspense>`. Middleware is `proxy.ts`. Read `node_modules/next/dist/docs/` before using an unfamiliar API.
- Supabase via `@supabase/ssr`: `lib/supabase/server.ts` (server), `lib/supabase/client.ts` (browser).
- Data access is per **group**: every user has a personal group; `cookbooks`, `source_pages`, `recipes` carry `group_id` (defaults to the personal group). Permissions live in RLS — never rely on the UI for security.
- Schema changes = a new file in `supabase/migrations/` (the owner runs it in the SQL Editor) + update `lib/supabase/database.types.ts` by hand.
- Before every push: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
- Logic that is easy to get wrong (amounts, form <-> saved data, scanning answers) gets tests in `tests/`.

## Design
- Follow `docs/design.md` on every screen. Use the tokens in `app/globals.css` and the components in `components/ui.tsx` — no new colors or one-off styles.
- Hebrew RTL; feminine forms in UI text.
