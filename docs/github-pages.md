# GitHub Pages publication

URL: https://seaarchive.github.io/PlutoArchive/ (forwards to the live Node site)
GitHub Pages source: `codex/platform-foundation`, `/(root)` (Deploy from a branch).

The branch contains both editable source and generated static HTML at its root. `.nojekyll` ensures `_next` assets are served. `basePath=/PlutoArchive` and trailing directory URLs support project Pages links and direct page refreshes. Exported HTML now forwards the same route, query, and fragment to `https://pluto-archive.onrender.com`, so new uploads and Admin edits use live data. With JavaScript unavailable, the HTML redirects to the corresponding Node route via `noscript`.

## Publish an update

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm build:pages
pnpm check:pages
git add .
git commit -m "Update Pages publication"
git push origin codex/platform-foundation
```

Use `pnpm refresh:pages` instead of `pnpm build:pages` when fetching new public gallery metadata. The refresh requires the existing Supabase URL and **publishable** key in `apps/web/.env.local` or environment variables. It uses an anonymous client subject to RLS, rejects server keys, and saves only public artwork fields in `apps/web/src/config/public-gallery.json`. Ordinary builds use this checked-in snapshot without credentials or network database access.

`scripts/build-pages.mjs` copies shared source to ignored `.pages-build/`, uses static-only route entry points for private spaces, enumerates artwork URLs and runs Next's static export. It copies the successful output into branch root, tracks generated files in `pages-artifact-manifest.json`, removes only obsolete listed assets, and checks that README bytes stayed unchanged. Do not manually edit exported HTML or `_next`; edit `apps/web` and rebuild.

CI validates both the server application and static export. Publication follows a user/agent push to the configured branch. CI does not push generated commits with `GITHUB_TOKEN`, since those pushes do not trigger branch-based Pages builds.

## Available on Pages

- Public home, works, artwork detail, projects/process/about/contact pages.
- Workspace session-only preview, Notes/Tasks/Timer, command palette, responsive layout.
- Login/admin preparation screens, with no private records or authentication forms.

GitHub Pages cannot execute the existing Next server's HttpOnly OAuth/session routes, protected admin data loading or image optimization service. The Node application in `apps/web` now serves the live site. Static gallery data remains an export fallback; refreshing the fallback still requires a new build and push. A free Node instance may take time to wake after inactivity.

Official references: [Next static export](https://nextjs.org/docs/app/guides/static-exports), [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
