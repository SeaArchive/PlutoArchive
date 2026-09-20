# Desktop ↔ Web handoff

## Start here

Repository: https://github.com/SeaArchive/PlutoArchive
Working branch: `codex/platform-foundation`.
Read `AGENTS.md` and `docs/master-development-prompt.md`. README.md is protected and unchanged.
The user's latest instruction is to keep progress accessible from both desktop and web environments through GitHub.

## Current delivery: Foundation milestone

Implemented: Next.js/React/TypeScript pnpm workspace, Public/Workspace/Admin route boundaries and design tokens, real existing-gallery read adapter and detail pages, explicit empty/error states, Google OAuth server handlers, server-only HttpOnly sessions, existing administrator RPC guard, Notes/Tasks/Timer session previews, command palette, shared domain/block/app contracts, responsive layouts and reduced motion.

Not yet implemented: normalized CMS schema and migrations, editor role, content editing/publishing, block renderer/editor, categories/tags/navigation/settings admin, media variants/upload UI, persistent notes/tasks, draggable/resizable windows, app installation/settings, Code/Files/Reference/Music/Cloud apps, Google incremental grants, performance benchmarks, native client. These remain required in the master prompt. Do not describe this milestone as a completed platform.

Existing cloud database has site_admins (1 row), gallery_items (1 row), and gallery storage. No cloud records, policies, buckets or auth settings were changed in this milestone. Keep old data intact when introducing the new schema.

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

1. Reinspect remote branch and live Supabase schema/policies.
2. Add versioned migration for profiles/roles, contents, content_blocks, taxonomies, media, settings and per-user workspace tables, with explicit grants and RLS.
3. Copy existing gallery metadata and preserve storage paths; compare record counts and public visibility.
4. Add admin CRUD, Draft → Preview → Publish, versioned block renderer/editor and media upload with rollback handling.
5. Replace transitional gallery adapter only after real RLS and migration regression tests.
6. Add persistent app data and separate responsive window layouts. Continue the remaining master phases.

## Deployment

Not deployed or merged to main. Historical GitHub Pages is static hosting and cannot run this Next.js server application. Choose a Node-capable host, configure environment/OAuth, test production origin, and only then cut over. Existing public main remains untouched while this branch is reviewed.
