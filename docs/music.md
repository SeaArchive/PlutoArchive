# Music app

2026-09-24 user priority: Music first, Workspace completion remains the main goal.

## Delivered

The Music app uses the official YouTube IFrame Player API. It accepts HTTPS links from YouTube Music, YouTube and youtu.be, including video and playlist URLs. No credentials/API key are needed for public embedded playback. It does not embed the YouTube Music website or extract audio.

- `music/source.ts`: pure URL validation, canonical URL generation, embed URL construction and error messages.
- `music/youtube.ts`: typed API contract; lazy shared loader with timeout, failure and retry handling.
- `music/player.tsx`: visible native player, playback state, play/pause, playlist previous/next, volume, current video link, errors and teardown.
- `music/index.tsx`: named session link list, selection, deletion and compact UI.
- `registry.ts`: manifests and dynamically loaded app components. Shell owns shared launch/close/notification behavior.

Only selecting a link connects to YouTube. URLs are canonicalized to remove tracking parameters; arbitrary HTML, other origins, credentials and non-HTTPS links are rejected. The iframe includes the page origin, strict-origin-when-cross-origin referrer policy and inline playback. Autoplay is disabled; users initiate playback. Native YouTube controls/branding stay visible, including in compact mode. The player is at least 200 × 200 CSS pixels. Closing/changing tracks destroys the previous instance; hiding the browser tab pauses playback.

YouTube controls display the supplied video's title/thumbnail and playlist menu. The app's optional name is user-provided, not invented metadata. Previous/next applies to a YouTube playlist, not the saved-link list. Music links are session-only (max 50): reload or closing the app clears them. Compact mode preserves the same player. Notes/Tasks behavior is unchanged.

## Remaining / limitations

This is a playback foundation, not a finished YouTube Music account client. No account-library sync, catalog search, offline playback, audio extraction, OAuth grants, server persistence or album metadata API is implemented. Playback depends on availability, region, embedded-player permission and browser policy; private/personalized YouTube Music playlists may not embed. Use the external YouTube link when playback is unavailable.

Next: verify real playback on the deployed origin, then authenticated Music links/settings persistence with server checks and RLS, followed by separate incremental YouTube OAuth if account playlist access is required. GitHub Pages still cannot host server auth or private APIs.

## Verification

`pnpm test:music` validates hostile/malformed links, supported URL formats, playlist normalization, iframe origin/autoplay parameters, playback error mapping, shared API loading and network-failure retry. Run with Node >=22.13 (CI tracks latest Node 22). Also run TypeScript/server/Pages builds and the existing database regression gate. Automated loader tests simulate the external API; they do not prove actual video playback.

Official references:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/terms/required-minimum-functionality
