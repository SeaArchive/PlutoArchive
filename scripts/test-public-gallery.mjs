import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const code = stripTypeScriptTypes(
  await readFile(
    new URL("../apps/web/src/lib/public-gallery.ts", import.meta.url),
    "utf8",
  ),
);
const { fetchPublicWorks } = await import(
  "data:text/javascript," + encodeURIComponent(code)
);
const connection = {
  url: "https://project.supabase.co",
  publishableKey: "sb_publishable_test",
};
const controller = new AbortController();
let rows = [
  {
    id: "new-upload",
    title: "New <artwork>",
    description: null,
    image_path: "owner/new image.png",
    created_at: "2026-10-30",
  },
];
let home = [{ artwork_id: "new-upload" }];
const calls = [];
async function fetcher(url, options) {
  calls.push([url, options]);
  const table = url.pathname.split("/").at(-1);
  return Response.json(
    {
      gallery_items: rows,
      home_artwork: home,
      categories: [{ id: "cat", name: "Illustration", slug: "illustration" }],
      content_categories: [
        { content_id: "new-upload", category_id: "cat" },
        { content_id: "new-upload", category_id: "hidden" },
      ],
    }[table],
  );
}
const items = await fetchPublicWorks(connection, controller.signal, fetcher);
assert.equal(
  items.length,
  1,
  "New uploads must not depend on the export snapshot",
);
assert.equal(items[0].title, "New <artwork>");
assert.equal(items[0].summary, "");
assert.equal(items[0].featured, true);
assert.equal(items[0].categories.length, 1);
assert.equal(
  items[0].thumbnail_url,
  "https://project.supabase.co/storage/v1/object/public/gallery/owner/new%20image.png",
);
assert.equal(calls.length, 4);
for (const [url, options] of calls) {
  assert.equal(url.origin, connection.url);
  assert.equal(options.credentials, "omit");
  assert.equal(options.cache, "no-store");
  assert.equal(options.signal, controller.signal);
  assert.deepEqual(options.headers, { apikey: connection.publishableKey });
  assert(!url.search.includes("created_by"));
}
rows[0] = { ...rows[0], title: "Edited" };
home = [];
const edited = await fetchPublicWorks(connection, undefined, fetcher);
assert.equal(edited[0].title, "Edited");
assert.equal(edited[0].featured, false);
rows = [];
assert.deepEqual(
  await fetchPublicWorks(connection, undefined, fetcher),
  [],
  "Deleted artwork must not return from a fallback snapshot",
);
await assert.rejects(
  fetchPublicWorks(
    connection,
    undefined,
    async () => new Response("", { status: 503 }),
  ),
);
await assert.rejects(
  fetchPublicWorks(connection, undefined, async () =>
    Response.json({ error: true }),
  ),
);
await assert.rejects(
  fetchPublicWorks(
    { ...connection, publishableKey: "sb_secret_forbidden" },
    undefined,
    fetcher,
  ),
);
console.log(
  "Public gallery checks passed: anonymous reads, live uploads/edits/deletes, featured/categories, errors and no session/secret access.",
);
