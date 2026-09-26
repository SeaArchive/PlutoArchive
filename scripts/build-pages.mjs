import {
  cp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "apps/web");
const staging = path.join(root, ".pages-build");
const web = path.join(staging, "apps/web");
const require = createRequire(path.join(source, "package.json"));
const snapshotPath = path.join(source, "src/config/public-gallery.json");
const manifestPath = path.join(root, "pages-artifact-manifest.json");
const basePath = "/PlutoArchive";
const readmeBefore = await readFile(path.join(root, "README.md"));

// Only this dedicated, resolved build directory is removed recursively.
if (staging !== path.join(root, ".pages-build"))
  throw new Error("Unexpected staging directory");
await rm(staging, { recursive: true, force: true });
await mkdir(web, { recursive: true });

if (process.argv.includes("--refresh")) {
  const envFile = path.join(source, ".env.local");
  if (existsSync(envFile)) loadEnvFile(envFile);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Set Supabase URL and publishable key to refresh public artwork.",
    );
  const { createClient } = require("@supabase/supabase-js");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Anonymous RLS applies. Never use a service key or authenticated session here.
  if (!key.startsWith("sb_publishable_"))
    throw new Error("Only a publishable key is accepted.");
  const { data, error } = await db
    .from("gallery_items")
    .select("id,title,description,image_path,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const items = data.map((row) => ({
    id: row.id,
    type: "artwork",
    slug: row.id,
    title: row.title,
    summary: row.description,
    status: "published",
    visibility: "public",
    featured: false,
    featured_order: 0,
    thumbnail_url: db.storage.from("gallery").getPublicUrl(row.image_path).data
      .publicUrl,
    published_at: row.created_at,
  }));
  await writeFile(
    snapshotPath,
    JSON.stringify({ state: "ready", items }, null, 2) + "\n",
  );
}
if (!existsSync(snapshotPath))
  throw new Error("Missing public snapshot. Run pnpm refresh:pages first.");

// Build an isolated static client from shared source; do not alter the server app.
await cp(path.join(source, "src"), path.join(web, "src"), { recursive: true });
await cp(path.join(root, "packages"), path.join(staging, "packages"), {
  recursive: true,
});
for (const file of ["package.json", "tsconfig.json"])
  await cp(path.join(source, file), path.join(web, file));
const appPackage = JSON.parse(
  await readFile(path.join(source, "package.json"), "utf8"),
);
for (const name of Object.keys({
  ...appPackage.dependencies,
  ...appPackage.devDependencies,
})) {
  const link = path.join(web, "node_modules", name);
  await mkdir(path.dirname(link), { recursive: true });
  await symlink(
    await realpath(path.join(source, "node_modules", name)),
    link,
    process.platform === "win32" ? "junction" : "dir",
  );
}
await writeFile(
  path.join(web, "next.config.mjs"),
  `export default { output: 'export', trailingSlash: true, basePath: '${basePath}', poweredByHeader: false, images: { unoptimized: true }, turbopack: { root: ${JSON.stringify(root)} } };\n`,
);

const stagedSource = path.join(web, "src");
await rm(path.join(stagedSource, "proxy.ts"));
await rm(path.join(stagedSource, "app/auth"), { recursive: true });
await rm(path.join(stagedSource, "app/api"), { recursive: true });
const notice = `import Link from 'next/link';
export const metadata={title:'Private space',robots:{index:false,follow:false}};
export default function Page(){return <div className="private-space login-page"><main id="main" className="login-panel"><Link href="/" className="meta">← PLUTO ARCHIVE</Link><span className="meta status">PRIVATE SPACE</span><h1>Your own<br/>working orbit.</h1><p>현재 공개 사이트에서는 작품 감상과 Workspace 미리보기를 이용할 수 있습니다.</p><p>계정 로그인과 관리자 편집 기능은 준비 중입니다.</p><Link className="text-link" href="/workspace/preview">Workspace 미리보기 →</Link></main></div>;}\n`;
for (const route of ["login", "admin"])
  await writeFile(path.join(stagedSource, "app", route, "page.tsx"), notice);
await writeFile(
  path.join(stagedSource, "app/workspace/page.tsx"),
  `export {default,metadata} from './preview/page';\n`,
);
await writeFile(
  path.join(stagedSource, "lib/content.ts"),
  `import type {Content} from '@pluto/types';\nimport snapshot from '@/config/public-gallery.json';\nexport async function getWorks(): Promise<{items:Content[];state:'ready'}>{return {items:snapshot.items as Content[],state:'ready'};}\n`,
);
for (const route of [
  "app/page.tsx",
  "app/works/page.tsx",
  "app/works/[slug]/page.tsx",
]) {
  const file = path.join(stagedSource, route);
  const text = await readFile(file, "utf8");
  if (!text.includes("export const revalidate = 60;"))
    throw new Error(`Review changed route export: ${route}`);
  await writeFile(
    file,
    text.replace(
      "export const revalidate = 60;",
      "export const revalidate = false;",
    ),
  );
}
const detail = path.join(stagedSource, "app/works/[slug]/page.tsx");
// A snapshot has no network error state. Keep the server app's runtime error handling intact.
let detailSource = (await readFile(detail, "utf8")).replace(
  'if (state === "error") throw new Error("Archive unavailable");',
  "",
);
detailSource +=
  "\nexport const dynamicParams = false;\nexport async function generateStaticParams(){const {items}=await getWorks();return items.map(item=>({slug:item.slug}));}\n";
await writeFile(detail, detailSource);
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build", web],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
if (result.status !== 0)
  throw new Error(
    `Static build failed (${result.status}). Existing root publication was not changed.`,
  );
const out = path.join(web, "out");
async function listFiles(dir, prefix = "") {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    if (entry.isDirectory())
      files.push(...(await listFiles(path.join(dir, entry.name), rel + "/")));
    else files.push(rel);
  }
  return files.sort();
}
// On Windows Next 16.3 can emit nested segment paths while the browser requests
// dot-separated prefetch filenames. Add portable aliases; Linux exports already
// using flat filenames pass through unchanged.
for (const rel of await listFiles(out)) {
  const marker = rel.indexOf("__next.");
  if (marker < 0 || !rel.slice(marker).includes("/")) continue;
  const flat = rel.slice(0, marker) + rel.slice(marker).replaceAll("/", ".");
  await cp(path.join(out, rel), path.join(out, flat));
}
const files = await listFiles(out);
const safeRoots = new Set([
  "_next",
  "404",
  "_not-found",
  "works",
  "projects",
  "process",
  "about",
  "contact",
  "workspace",
  "admin",
  "login",
]);
function artifactTarget(rel) {
  const target = path.resolve(root, rel);
  const top = rel.split("/")[0];
  const rootAsset =
    /^(?:index\.(?:html|txt)|404\.html|icon\.svg|__next[\w.\-]*\.txt)$/.test(
      rel,
    );
  if (
    !target.startsWith(root + path.sep) ||
    rel.includes("..") ||
    (!safeRoots.has(top) && !rootAsset)
  )
    throw new Error(`Unexpected export path: ${rel}`);
  return target;
}
// Validate every path before changing the previous publication.
const previous = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, "utf8")).files
  : [];
for (const rel of [...previous, ...files]) artifactTarget(rel);
if (!files.includes("index.html"))
  throw new Error("Export has no root index.html");
for (const rel of previous)
  if (!files.includes(rel)) await rm(artifactTarget(rel), { force: true });
for (const rel of files) {
  const target = artifactTarget(rel);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(out, rel), target);
}
await writeFile(path.join(root, ".nojekyll"), "");
await writeFile(
  manifestPath,
  JSON.stringify({ basePath, files }, null, 2) + "\n",
);
if (!readmeBefore.equals(await readFile(path.join(root, "README.md"))))
  throw new Error("README changed unexpectedly");
console.log(
  `Published ${files.length} static files at branch root. Commit and push to publish https://seaarchive.github.io${basePath}/`,
);
