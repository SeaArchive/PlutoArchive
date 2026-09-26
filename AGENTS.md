# Pluto Archive contributor instructions

Read `docs/HANDOFF.md`, `docs/architecture.md`, and `docs/master-development-prompt.md` before changes.
Preserve root README.md byte-for-byte (baseline Git blob cb2b0c1cb64a61362a3536fb91657d297a60974c).
Use Node >=22 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, and `pnpm build`.
All Public page backgrounds and artwork backgrounds are #000817 (latest user override); Workspace charcoal/green; Admin ivory/gold. Radius 0–4px; no glow.
Do not treat preview apps as persistent functionality. Do not invent portfolio content or performance results.
Keep data, config, renderers and services separated. Every private operation requires server authorization and RLS.
Preserve existing Supabase gallery and administrator data until a tested migration copies and validates it.
Never put service secrets in NEXT_PUBLIC variables or Git. Google API grants are separate from sign-in.
Update HANDOFF after meaningful changes so desktop and web agents can continue from GitHub.

Before ending work or hitting usage limits, update docs/progress.md with current status, completed work, remaining work and recommended next steps, then sync to GitHub.

GitHub Pages publishes this branch's root. Root HTML, route folders and `_next` are generated artifacts; edit apps/web and run `pnpm build:pages` then `pnpm check:pages` before pushing UI changes. See docs/github-pages.md. Do not export private records or server authentication handlers.

Current next-work priority (2026-09-26): Complete Public Space first. Shape Projects, Process and About so verified work can also support a game development or game planning self-introduction; do not invent experience or outcomes. Read docs/public-roadmap.md. Workspace and CMS remain required after Public except shared prerequisites.
