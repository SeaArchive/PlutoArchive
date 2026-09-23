# Desktop ↔ Web handoff

## Start here

Repository: https://github.com/SeaArchive/PlutoArchive
Working branch: `codex/platform-foundation`.
Read `AGENTS.md` and `docs/master-development-prompt.md`. README.md is protected and unchanged.
The user's latest instruction (2026-09-23): set the home background to #000817 and make **Workspace completion the primary goal of the next work session**. Keep progress accessible through GitHub. See `docs/workspace-roadmap.md`.

## Current delivery: Phase 02 CMS database foundation

Latest source of truth: `docs/progress.md` and `docs/database.md`. On 2026-09-23 nine CMS/identity tables, role-based RLS, legacy gallery metadata copy, and two versioned migrations were applied and verified on Supabase. The original gallery/admin/Storage records remain untouched. `pnpm test:database` runs 173 PostgreSQL checks; live RLS smoke also passed with rollback. CMS editing/publishing UI, server editor-role routing and public-reader cutover are still pending. The attached updated master prompt is now the repository master prompt.

### Prior Foundation delivery

Implemented: Next.js/React/TypeScript pnpm workspace, Public/Workspace/Admin route boundaries and design tokens, real existing-gallery read adapter and detail pages, explicit empty/error states, Google OAuth server handlers, server-only HttpOnly sessions, existing administrator RPC guard, Notes/Tasks/Timer session previews, command palette, shared domain/block/app contracts, responsive layouts and reduced motion.

Not yet implemented: server editor-role guards/profile onboarding, content editing/publishing, block renderer/editor, categories/tags/navigation/settings admin, media variants/upload UI, persistent notes/tasks, draggable/resizable windows, app installation/settings, Code/Files/Reference/Music/Cloud apps, Google incremental grants, performance benchmarks, native client. These remain required in the master prompt. Do not describe this milestone as a completed platform.

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
