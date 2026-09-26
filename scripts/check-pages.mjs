import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(path.join(root, "pages-artifact-manifest.json"), "utf8"),
);
assert.equal(manifest.basePath, "/PlutoArchive");
await stat(path.join(root, ".nojekyll"));
const htmlFiles = manifest.files.filter((file) => file.endsWith(".html"));
for (const file of manifest.files) {
  const marker = file.indexOf("__next.");
  if (marker >= 0) {
    const requestPath =
      file.slice(0, marker) + file.slice(marker).replaceAll("/", ".");
    assert(
      manifest.files.includes(requestPath),
      `Missing prefetch payload: ${requestPath}`,
    );
  }
}
let checked = 0;
for (const file of htmlFiles) {
  const html = await readFile(path.join(root, file), "utf8");
  assert(!html.includes("sb_secret_"), `Server secret in ${file}`);
  assert(!html.includes('action="/auth/'), `Server form exported in ${file}`);
  assert(
    !html.includes("/_next/image?"),
    `Image optimizer dependency in ${file}`,
  );
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const url = match[1].replaceAll("&amp;", "&");
    if (!url.startsWith("/")) continue;
    assert(
      url.startsWith(manifest.basePath + "/"),
      `Missing basePath in ${file}: ${url}`,
    );
    const rel = decodeURIComponent(
      url.slice(manifest.basePath.length + 1).split(/[?#]/)[0],
    );
    const target = path.join(
      root,
      rel.endsWith("/") || !rel ? rel + "index.html" : rel,
    );
    assert(target.startsWith(root + path.sep));
    await stat(target);
    checked++;
  }
}
for (const file of [
  "index.html",
  "works/index.html",
  "projects/index.html",
  "projects/pluto-archive/index.html",
  "process/index.html",
  "about/index.html",
  "contact/index.html",
  "workspace/index.html",
  "workspace/preview/index.html",
  "login/index.html",
  "admin/index.html",
  "404.html",
])
  assert(manifest.files.includes(file), `Missing route ${file}`);
console.log(
  `Pages check passed: ${htmlFiles.length} HTML documents, ${checked} local asset/link targets.`,
);
