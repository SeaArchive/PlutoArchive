# GitHub Pages — fast public site

Public URL: https://seaarchive.github.io/PlutoArchive/
Private Node host: https://pluto-archive.onrender.com
Publishing source: `codex/platform-foundation`, `/(root)` (Deploy from a branch).

## Public and private delivery

Public HTML, styles, scripts and the starfield are served directly by GitHub Pages. Public routes no longer redirect to Render. Home/Works/artwork views fetch the current gallery, Home selection and category assignments directly from Supabase's public REST API. Requests contain only the publishable key, omit credentials and never use a signed-in session. Existing anonymous RLS controls every read; no policies were expanded.

`apps/web/src/config/public-gallery-connection.json` contains only the project's public API URL and publishable key. It is intentionally shipped to visitors. Never put a secret/service key there. Update this file and rebuild if the public key is rotated.

Artwork is loaded after hydration, with a ten-second timeout and retry. No old artwork snapshot is displayed after a failed live request. The rest of the page remains available independently. JavaScript is required to view the current artwork; static editorial pages remain readable without it. Artwork-specific search/social metadata on Pages is generic; Node's existing detailed routes retain their server metadata.

New cards use `/works/view/?id=<artwork UUID>`, an exported route that can open new uploads without rebuilding. Previously exported UUID paths remain available and also read live data. GitHub Pages' root `404.html` forwards a previously unseen `/works/<UUID>` to the query viewer. That compatibility request initially has HTTP 404; normal card links go directly to the viewer with HTTP 200.

`/admin`, `/login` and `/workspace` forward to the same private route on Render, preserving query and fragment. Public Workspace navigation links directly to Render. `/workspace/preview` remains a separate ephemeral preview. OAuth callbacks, sessions and all writes remain server-authorized on Node with existing RLS. Free Render startup delay can still affect private operations and visits made directly to the old Node URL. Share the Pages URL for the public portfolio.

## Publish a source/design update

```sh
pnpm install --frozen-lockfile
pnpm test:public-gallery
pnpm typecheck
pnpm build
pnpm build:pages
pnpm check:pages
git add .
git commit -m "Update public site"
git push origin codex/platform-foundation
```

New artwork, edits, deletions, categories and Home selection are read live on page load; they do not require these build steps. `pnpm refresh:pages` remains an optional way to refresh the legacy snapshot and pre-export additional UUID compatibility paths. Its Supabase publishable credentials must be provided in the environment or ignored `apps/web/.env.local`. The snapshot is no longer the public artwork reader.

The builder copies shared source to ignored `.pages-build/`, swaps only the public data entry points, removes private APIs/proxy and exports Next with `basePath=/PlutoArchive`, trailing slashes and unoptimized public images. It replaces root generated artifacts only after a successful build, checks allowed output paths and preserves README bytes. Edit `apps/web` and the builder, never generated HTML or `_next` manually.

CI validates the Node build, gallery reader and Pages output. Generated commits are pushed with the user's GitHub connection; CI does not push `GITHUB_TOKEN` commits that would skip branch-based Pages publication.

References: [Next static export](https://nextjs.org/docs/app/guides/static-exports), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [GitHub Pages sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
