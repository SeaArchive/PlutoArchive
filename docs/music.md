# Music app

2026-09-24 user priority: Music first, Workspace completion remains the main goal.

## Delivered

The Music app uses the official YouTube IFrame Player API. It accepts HTTPS links from YouTube Music, YouTube and youtu.be, including video and playlist URLs. No credentials/API key are needed for public embedded playback. It does not embed the YouTube Music website or extract audio.

- `music/source.ts`: pure URL validation, canonical URL generation, embed URL construction and error messages.
- `music/youtube.ts`: typed API contract; lazy shared loader with timeout, failure and retry handling.
- `music/player.tsx`: visible native player, playback state, play/pause, playlist previous/next, volume, current video link, errors and teardown.
- `music/index.tsx`: named link list, selection, deletion and compact UI.
- `/api/music/links`: authenticated GET/POST/DELETE with server-side URL validation, origin checks on writes and no-store responses.
- `registry.ts`: manifests and dynamically loaded app components. Shell owns shared launch/close/notification behavior.

Only selecting a link connects to YouTube. URLs are canonicalized to remove tracking parameters; arbitrary HTML, other origins, credentials and non-HTTPS links are rejected. The iframe includes the page origin, strict-origin-when-cross-origin referrer policy and inline playback. Autoplay is disabled; users initiate playback. Native YouTube controls/branding stay visible, including in compact mode. The player is at least 200 × 200 CSS pixels. Closing/changing tracks destroys the previous instance; hiding the browser tab pauses playback.

YouTube controls display the supplied video's title/thumbnail and playlist menu. The app's optional name is user-provided, not invented metadata. Previous/next applies to a YouTube playlist, not the saved-link list. Authenticated Workspace links are stored per user in `music_links` (max 50); the public preview remains session-only. The selected track and playback position are not saved. Compact mode preserves the same player. Notes/Tasks behavior is unchanged.

## Remaining / limitations

This is a playback and personal link foundation, not a finished YouTube Music account client. No account-library sync, catalog search, offline playback, audio extraction, OAuth grants or album metadata API is implemented. Playback depends on availability, region, embedded-player permission and browser policy; private/personalized YouTube Music playlists may not embed. Use the external YouTube link when playback is unavailable.

Next: verify real playback and reload/relogin restoration on a Node-hosted origin with Google OAuth configured, then Music preferences if required. A separate incremental YouTube OAuth grant is needed for account playlist access. GitHub Pages still cannot host server auth or private APIs; its Workspace preview never calls the personal links API.

## Verification

`pnpm test:music` validates hostile/malformed links, supported URL formats, playlist normalization, iframe origin/autoplay parameters, playback error mapping, shared API loading and network-failure retry. Run with Node >=22.13 (CI tracks latest Node 22). Also run TypeScript/server/Pages builds and the existing database regression gate. Automated loader tests simulate the external API; they do not prove actual video playback.

Official references:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/terms/required-minimum-functionality
