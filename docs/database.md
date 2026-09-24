# Database: Phase 02 CMS foundation

Verified 2026-09-23. Project: `ytpoqdhujdhfwijevsuz` (Seoul, PostgreSQL 17).
The existing gallery adapter and Pages snapshot are still the public source. CMS cutover is a separate milestone.

## Applied schema

| Table | Responsibility |
| --- | --- |
| profiles | Identity display name and trusted user/editor/admin assignment |
| contents | Shared artwork/project/process/page metadata, publication state, visibility, feature ordering |
| content_blocks | Ordered versioned block data/settings; unique position within each content |
| media | File metadata, original bucket/path, nullable unknown dimensions and MIME information |
| content_media | Normalized content attachments; future block writers must maintain these links atomically |
| categories / tags | Editable public taxonomy definitions |
| content_categories / content_tags | Relationships visible only with their published public parent |

All nine tables enable RLS and explicitly revoke inherited client grants before granting required operations. No client has TRUNCATE access. Foreign-key lookup columns have indexes. Updated timestamps are maintained by a fixed-search-path trigger.

Content and block types are extensible identifiers. The UI/block registry validates supported block types and per-version payloads; the DB currently validates version numbers, positions and JSON object shape. Payload validation and rendering remain Phase 05 work.

## Roles and publication

| Principal | Access |
| --- | --- |
| anon | Published + public + publication time reached; linked blocks/media; public taxonomy definitions |
| authenticated user | Same public CMS reads; own profile read/display-name update and own default-user profile creation |
| editor | CMS metadata CRUD, including drafts; own profile |
| admin | CMS metadata CRUD; all profile reads/display-name updates |
| trusted DB operator | Role assignment; clients cannot write the role column |

`public.current_app_role()` is an authenticated SECURITY INVOKER RPC. It delegates to `pluto_private.current_role()`, the single SECURITY DEFINER helper for protected role lookup. The helper checks `auth.uid()`, accepts no target user ID, has an empty search path and explicit execute grants, and lives outside the exposed public schema. Do not add `pluto_private` to exposed API schemas.

Legacy `site_admins` membership remains authoritative for the original administrator. Other role assignments come from profiles, never user-editable JWT metadata. Role changes are visible on the next SQL statement rather than waiting for token refresh. Existing server `/admin` still uses `is_admin()`; editor routing/guards will be connected with CMS UI in the next milestone.

Existing Auth users are backfilled. New users can insert their own profile with the default user role. There is deliberately no Auth signup trigger; `requireUser` now creates a missing profile at the authenticated server boundary and cannot set the role.

Unlisted is currently denied to public clients. A later narrowly scoped detail endpoint must implement unlisted links without making them enumerable. It must not broaden the list RLS policy.

## Legacy copy and deployment boundaries

The foundation migration copies existing gallery metadata into media/contents, preserves IDs/slugs, title, description, creator, creation/publication timestamps and exact `gallery` bucket paths, and aborts if comparisons fail. All Auth users receive profiles. It does not update/delete gallery or administrator records, move Storage objects or change bucket/policy configuration.

Live verification: 1 original gallery row, 1 original administrator, 1 matching copied content/media row, 2 profiles. No fabricated portfolio content is persisted.

The old `gallery` bucket and gallery table remain public. Changing a copied CMS row to private **does not** revoke existing image URLs or hide its old gallery representation. Do not enable CMS publishing/unpublishing UI until the public reader, legacy API exposure and Pages snapshot invalidation are deliberately handled. Cached/deployed static pages also require regeneration to reflect publication changes. Future private originals must use private buckets and authorized delivery.

New schema creation does not provision new Storage buckets or uploads. Draft media metadata is hidden; actual object confidentiality still depends on Storage policy and bucket privacy.

## Migration history and local testing

The repository's new migration filenames match the versions actually recorded by Supabase. Already-applied migrations are immutable; follow-up changes use a new migration.

These migrations upgrade the existing Pluto deployment. Its three earlier migrations (`create_single_owner_auth`, `harden_admin_check_function`, `create_gallery`) predate the repository migration directory and are still in remote history. **Do not run a blanket `db push`, reset or repair against production.** Before CLI history synchronization or a fresh full Supabase deployment, retrieve/reconcile those historical migrations and bootstrap the legacy prerequisite schema. `supabase/tests/legacy-fixture.sql` is a disposable test stand-in, not a production baseline.

```sh
pnpm install --frozen-lockfile
pnpm test:database
pnpm typecheck
pnpm build
```

`test:database` uses pinned PGlite as a dev-only dependency to execute the real SQL migrations and role-switched PostgreSQL queries. It runs without cloud credentials or Docker. CI runs it on every change. Tests cover copying, profiles, roles, grants, every CMS table's CRUD boundaries, future/draft/private/unlisted/archived filtering, related media/blocks/taxonomies, unpublishing and immediate editor revocation. Supabase Auth/Storage HTTP services are not emulated.

`supabase/tests/cms-live-smoke.sql` was also executed on the real project: original administrator recognition, temporary draft/block creation, public/user isolation and privilege-escalation rejection passed. Its transaction rolls back every test write. The smoke requires an existing ordinary profile and legacy admin; it never creates test Auth identities.

## Advisors and outstanding work

- No new schema security findings. The existing Auth configuration has leaked-password protection disabled: [Supabase remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No Auth settings were changed.
- New overlapping SELECT policies were consolidated in a second migration; access semantics are unchanged.
- The legacy `gallery_items.created_by` foreign key lacks an index ([advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)); one row currently exists. It is outside the additive CMS migration scope.
- Newly created lookup indexes can be reported as unused until CMS traffic exists; retain them for foreign keys and planned queries.
- Music storage: `20260924135127_workspace_music_links` adds owner-only links with RLS, column-scoped insert, URL/title constraints, unique owner/URL, serialized 50-link limit, and cascading user deletion. Applied to the live project; isolated PostgreSQL checks cover owner/other/admin/anon, limit and deletion. There is no service-role bypass in the web API.
- Notes/Tasks storage: `20260924140233_workspace_notes_tasks` adds separate personal tables for note body/color/pin and task title/status/priority/due date. Ownership checks apply to every CRUD operation; `user_id` and `id` cannot be reassigned by clients. App window positions are stored separately in `workspace_layouts`. Applied to the live project with rollback-only RLS smoke; no personal rows remained.
- Window layout: `20260924143603_workspace_window_layout` stores a small bounded array of open window placements per owner and device (`desktop`, `tablet`, `mobile`). App content remains in its own tables. The API revalidates known app IDs and numeric bounds, checks `getUser()` and write Origin; DB RLS restricts all operations to the owner. Live owner/other checks used a rollback transaction; no layout rows remained.
- Pending: editor route guards, CMS CRUD + publish transactions, private media upload/delivery, legacy/public reader cutover, other workspace tables, settings/navigation schema, OAuth end-to-end verification.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PGlite](https://pglite.dev/docs/). Supabase changelog reviewed 2026-09-23; no relevant API break affects this SQL-only change.
