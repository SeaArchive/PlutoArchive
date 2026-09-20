# Architecture and repository review

Baseline: `4a85b835d13a8dc4cd62f294fcc2c6c3898638fb`.

1. Previous structure: root HTML, css/, js/, pages/, audio/, img/; no package manager, typed build, or migration history.
2. Existing features: animated space landing, gallery upload/delete, Supabase password login and is_admin RPC, games and WebGL experiments.
3. Missing: shared domain model, Next routing, Google OAuth, CMS, block versioning, normalized workspace storage, migrations, CI and mobile shell.
4. Conflicts: per-page global scripts and DOM state, heavy decorative rendering, browser session persistence; several empty HTML pages.
5. Reusable: identity concept, existing gallery_items and site_admins records, gallery bucket, public archive identity. Root README remains unchanged; removed source stays in Git history.
6. Recommended architecture: apps/web uses Next App Router and server components. packages/types describes domain entities; packages/block-system owns versioned validation; packages/app-sdk defines platform-independent app contracts. No empty native app.
7. Phases: foundation → database/auth/RLS → public → CMS → block editor → workspace runtime → core apps → Google integrations → measured optimization → native clients.
8. First implementation: reproducible build, route/theme boundaries, existing-gallery adapter, server-only authentication, typed contracts, responsive workspace preview and cross-environment handoff.

## Improvement Proposal: incremental database transition

Instead of replacing existing gallery tables immediately, keep them and read through a server adapter. This avoids data loss while establishing the new content model. The temporary cost is a second model until the CMS migration. New schema must copy records, preserve original object paths, validate counts and permissions, then switch the adapter. Remove old tables only after verified cutover.

## Boundaries

Public reads use a fresh anonymous Supabase client and RLS. Public pages can revalidate every 60 seconds. Workspace/admin use server cookies, getUser and no-store responses. Admin also verifies the existing is_admin RPC. No browser Supabase client or provider token storage is introduced.

The current registry launches dynamically imported React apps. They are session-only previews. The shared Window contract exists; movement, resizing and device-specific persistence are not implemented yet. App lifecycle currently follows React mount/unmount.

Next.js server features require a Node-capable host. GitHub Pages now has a separate static-export build profile derived from shared source. It publishes public pages and Workspace previews at the branch root; private routes show a static preparation screen. OAuth handlers and private data remain only in the server application. See `docs/github-pages.md`.
