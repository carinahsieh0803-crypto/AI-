Stack: TypeScript (Strict), Next.js (App Router), Tailwind CSS, Supabase (Auth, PostgreSQL, Realtime), Vercel AI SDK.
Structure: Routes in app/, raw UI in components/ui/, feature components in components/features/, scheduling and AI logic in lib/.
Localization: All UI text must be Traditional Chinese (zh-TW) with Taiwan phrasing (使用者 not 用戶, 行程 not 日程, 類別 not 分類, 小組模式 not 團隊模式).
Supabase Boundary: Client SDK for frontend (lib/supabase/client.ts); Server/Admin client for server only (lib/supabase/server.ts); enforce strict RLS.
UI & Style: Use shadcn/ui; merge styles with cn(); stick strictly to CSS variables in globals.css.
Logic & Deps: Keep UI presentational; extract AI tool definitions, conflict resolution, and group busy-matrix to lib/; no npm packages without approval.
Testing: For every code change, add or update relevant unit tests with Vitest and end-to-end tests with Playwright (tests/e2e/*.spec.ts). Run both `npm run test:unit` and `npx playwright test` before reporting the change complete; also run `npm run lint` before opening a PR. If a required test cannot run because the script, dependency, or environment is unavailable, state the blocker and do not report the tests as passing.
Git Commits: Follow Conventional Commits (feat:, fix:, refactor:, test:); keep changes atomic.
Safety: Never commit service keys or .env* files; strictly protect member privacy (busy-only masking) in Group Mode; no destructive git commands.
