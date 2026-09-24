import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const source = await readFile(
  new URL(
    "../apps/web/src/features/workspace/music/source.ts",
    import.meta.url,
  ),
  "utf8",
);
const { parseMusicSource, embedUrl, playbackError } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
);
let checks = 0;
for (const url of [
  "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  "https://music.youtube.com/watch?v=M7lc1UVf-VE&si=tracking",
  "https://youtu.be/M7lc1UVf-VE?t=3",
  "https://m.youtube.com/shorts/M7lc1UVf-VE",
  "https://youtube.com/live/M7lc1UVf-VE",
  "https://www.youtube.com/embed/M7lc1UVf-VE",
]) {
  assert.equal(parseMusicSource(url)?.videoId, "M7lc1UVf-VE");
  checks++;
}
for (const url of [
  "javascript:alert(1)",
  "http://youtube.com/watch?v=M7lc1UVf-VE",
  "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
  "https://youtube.com@evil.test/watch?v=M7lc1UVf-VE",
  "https://name:password@youtube.com/watch?v=M7lc1UVf-VE",
  "https://youtube.com:444/watch?v=M7lc1UVf-VE",
  "https://youtu.be/",
  "https://youtube.com/watch?v=invalid",
  "https://youtube.com/playlist?list=<script>",
  "https://youtube.com/@channel",
  "https://youtu.be/M7lc1UVf-VE/extra",
  "https://youtube.com/watch",
  '<iframe src="https://youtube.com"></iframe>',
]) {
  assert.equal(parseMusicSource(url), null, url);
  checks++;
}
const playlist = parseMusicSource(
  "https://music.youtube.com/playlist?list=PL1234567890_abc&si=private-tracking",
);
assert.equal(playlist.playlistId, "PL1234567890_abc");
checks++;
assert.equal(
  playlist.url,
  "https://www.youtube.com/playlist?list=PL1234567890_abc",
);
checks++;
const embed = new URL(embedUrl(playlist, "https://seaarchive.github.io"));
assert.equal(embed.origin, "https://www.youtube.com");
checks++;
assert.equal(embed.pathname, "/embed/videoseries");
checks++;
assert.equal(embed.searchParams.get("origin"), "https://seaarchive.github.io");
checks++;
assert.equal(embed.searchParams.get("autoplay"), "0");
checks++;
assert.equal(embed.searchParams.get("list"), playlist.playlistId);
checks++;
const mixed = parseMusicSource(
  "https://music.youtube.com/watch?v=M7lc1UVf-VE&list=PL1234567890_abc",
);
assert.equal(mixed.videoId, "M7lc1UVf-VE");
checks++;
assert.equal(mixed.playlistId, playlist.playlistId);
checks++;
for (const code of [2, 5, 100, 101, 150, 153, 999]) {
  assert.ok(playbackError(code).length > 10);
  checks++;
}
console.log(`Music: ${checks} URL, embed and playback error checks passed.`);

// Exercise the asynchronous API loader without network access.
const apiSource = await readFile(
  new URL(
    "../apps/web/src/features/workspace/music/youtube.ts",
    import.meta.url,
  ),
  "utf8",
);
const { loadYouTube } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(apiSource)).toString("base64")}`
);
const scripts = [];
let removed = 0;
globalThis.window = { setTimeout, onYouTubeIframeAPIReady: undefined };
globalThis.document = {
  createElement: () => ({ remove: () => removed++ }),
  head: { append: (script) => scripts.push(script) },
};
const first = loadYouTube();
assert.equal(loadYouTube(), first, "concurrent loads share one promise");
assert.equal(scripts.length, 1);
scripts[0].onerror();
await assert.rejects(first, /YouTube/);
assert.equal(removed, 1);
const second = loadYouTube();
assert.equal(scripts.length, 2, "failed loads can retry");
window.YT = { Player: function () {} };
window.onYouTubeIframeAPIReady();
assert.equal(await second, window.YT);
assert.equal(await loadYouTube(), window.YT, "loaded API is reused");
assert.equal(scripts.length, 2);
delete globalThis.window;
delete globalThis.document;
console.log(
  "Music: API loader concurrency, network failure, retry and reuse passed.",
);
