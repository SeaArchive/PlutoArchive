# Desktop ↔ Web handoff

**최신 우선순위 (2026-09-24): Workspace 완성이 주 목표이며 Music(YouTube 음악 재생 앱)을 최우선으로 개발한다.**

## Start here

Repository: https://github.com/SeaArchive/PlutoArchive
Working branch: `codex/platform-foundation`.
Read `AGENTS.md` and `docs/master-development-prompt.md`. README.md is protected and unchanged.
The user's latest instruction (2026-09-23): set the home background to #000817 and make **Workspace completion the primary goal of the next work session**. Keep progress accessible through GitHub. See `docs/workspace-roadmap.md`.

## Current delivery: Phase 02 CMS database foundation

Latest source of truth: `docs/progress.md` and `docs/database.md`. On 2026-09-23 nine CMS/identity tables, role-based RLS, legacy gallery metadata copy, and two versioned migrations were applied and verified on Supabase. The original gallery/admin/Storage records remain untouched. `pnpm test:database` runs 173 PostgreSQL checks; live RLS smoke also passed with rollback. CMS editing/publishing UI, server editor-role routing and public-reader cutover are still pending. The attached updated master prompt is now the repository master prompt.

### Prior Foundation delivery

Implemented: Next.js/React/TypeScript pnpm workspace, Public/Workspace/Admin route boundaries and design tokens, real existing-gallery read adapter and detail pages, explicit empty/error states, Google OAuth server handlers, server-only HttpOnly sessions, existing administrator RPC guard, Notes/Tasks/Timer session previews, command palette, shared domain/block/app contracts, responsive layouts and reduced motion.

Not yet implemented: server editor-role guards/profile onboarding, content editing/publishing, block renderer/editor, categories/tags/navigation/settings admin, media variants/upload UI, persistent notes/tasks, draggable/resizable windows, app installation/settings, Code/Files/Reference/Cloud apps and Music account integration/persistence, Google incremental grants, performance benchmarks, native client. These remain required in the master prompt. Do not describe this milestone as a completed platform.

The Foundation originally contained site_admins (1 row), gallery_items (1 row), and gallery storage. The latest additive migration now also contains profiles (2), contents (1), media (1), content_media (1), and empty CMS block/taxonomy tables. No old records, Storage policies/buckets or Auth settings were modified.

## Run in a web coding environment or Codespaces

```sh
git checkout codex/platform-foundation
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
# Populate publishable key from the connected Supabase project, never a service key.
pnpm dev
```

Use the forwarded port 3000 preview. `.devcontainer/devcontainer.json` supports Codespaces. There is no dependency on a desktop absolute path. The same Git branch is the synchronization boundary; push after a completed milestone and pull before continuing elsewhere.

`SITE_URL` must be the actual preview/deployment origin. Configure Google provider in Supabase and allow `<SITE_URL>/auth/callback` in its redirect URLs before testing Google login. Register Supabase's Google callback with Google. This step requires the operator's OAuth application configuration; do not assume the code enables the provider automatically.

```sh
pnpm typecheck
pnpm build
pnpm --filter @pluto/web start
```

Unauthenticated `/admin` and `/workspace` must redirect to `/login`. `/workspace/preview` is intentionally public and only contains ephemeral demonstration state. Authenticated content must never be statically cached.

## Next concrete milestone

1. Read progress/workspace-roadmap/database docs and inspect the current Workspace registry, shell and preview apps.
2. Establish authenticated Workspace prerequisites: Node hosting/OAuth configuration, server profile initialization, per-user schema/RLS and authorization.
3. Replace Notes/Tasks preview-only state with persistent CRUD and reload/relogin verification.
4. Complete window move/resize/focus/minimize/restore, per-device saved layouts and mobile app launcher.
5. Complete shared command/notification/settings services and required core apps in the master prompt; implement Google integration with separate grants.
6. Verify error handling, permissions, responsive/keyboard behavior and real persistence against the roadmap's completion criteria.
7. Resume CMS CRUD/publishing and legacy public-reader migration after Workspace, unless a shared prerequisite is required earlier.

Run `pnpm test:database` before TypeScript/build. Earlier remote migrations are not yet in the repo: reconcile history before CLI push/reset/repair. Do not run the legacy test fixture on production.

## Deployment

The user selected GitHub Pages from `codex/platform-foundation` at `/(root)`. The branch now includes a static export of public pages and the Workspace preview at its root. See `docs/github-pages.md` for `pnpm build:pages`, `pnpm refresh:pages`, validation and push instructions. The editable server application remains in `apps/web`; OAuth and private admin operations still require a Node-capable host. Check `docs/progress.md` for the latest deployment verification. Main remains unchanged.


## Music-first handoff (2026-09-24)

Music now supports official YouTube video/playlist URLs in both Workspace and public preview, with native visible player, custom transport/volume, session link list, compact mode, retry/errors and teardown. See `docs/music.md` and the latest delivery section in `docs/progress.md`. No account data access or persistence has been added; no DB migration. Start with Music live playback validation and per-user persistence/auth prerequisites, then continue the remaining Workspace roadmap. `pnpm test:music` is a CI gate. Do not claim full Workspace or Google account integration completion.

### Follow-up: personal Music links

The authenticated Node Workspace now persists up to 50 Music links per user through `/api/music/links` and `public.music_links` owner RLS. Profile initialization runs at the server's `requireUser` boundary. The public Pages preview still holds ephemeral links and strips the private API at export time. Migration `20260924135127_workspace_music_links` was applied to Supabase; local migration filename matches remote history. Run `pnpm test:database` (186 checks), `pnpm test:music`, `pnpm typecheck`, `pnpm build`, `pnpm build:pages`, `pnpm check:pages`. Google sign-in and persistence need a configured Node deployment for an end-to-end browser verification; GitHub Pages cannot provide that. Next: Node/OAuth deployment and actual playback/relogin verification, then Notes/Tasks persistence and window manager. See latest `docs/progress.md`.

### Follow-up: Notes and Tasks

The personal Workspace also has Notes/Tasks CRUD at `/api/workspace/notes` and `/api/workspace/tasks`. Migration `20260924140233_workspace_notes_tasks` is applied to Supabase; both tables have owner-only RLS. Notes have explicit Save for body changes, plus color/pin/search; Tasks have completion, priority, due date, Today/Completed filters. Preview stays session-only. Local PostgreSQL checks now number 210; remote smoke used a transaction rollback, and no test rows remained. Window positions and app layout are still future work. Recheck the current latest `docs/progress.md` before continuing.

### Follow-up: window layout and mobile navigation

The window manager now handles move/resize/focus/minimize/restore/close and a Dock on desktop/tablet, with keyboard adjustments on the title/resize control. Mobile uses Home/Apps/Search/Notifications/Settings navigation and one app screen at a time. Open windows and placements save separately for desktop/tablet/mobile through `/api/workspace/layout`; the Pages preview remains ephemeral. Migration `20260924143603_workspace_window_layout` is applied remotely with owner-only RLS. Local PGlite checks: 222. `pnpm test:layout` checks device thresholds, hostile stored layouts, closed-all state and viewport fitting. Live browser/relogin interactions still need a Node deployment and configured Google login. Next milestone: shared commands/notifications/settings, then remaining core apps; see `docs/progress.md`.
