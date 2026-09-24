import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const manifestSource = await readFile(
  new URL("../apps/web/src/features/workspace/manifests.ts", import.meta.url),
  "utf8",
);
const manifestModule = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(manifestSource)).toString("base64")}`
);
const layoutSource = await readFile(
  new URL("../apps/web/src/features/workspace/layout.ts", import.meta.url),
  "utf8",
);
const layoutCode = stripTypeScriptTypes(
  layoutSource.replace(
    'import { apps } from "./manifests";',
    `const apps = ${JSON.stringify(manifestModule.apps)};`,
  ),
);
const { parseWindows, defaultWindows, fitWindow, deviceForWidth } =
  await import(
    `data:text/javascript;base64,${Buffer.from(layoutCode).toString("base64")}`
  );
assert.deepEqual([699, 700, 1099, 1100].map(deviceForWidth), [
  "mobile",
  "tablet",
  "tablet",
  "desktop",
]);
const desktop = defaultWindows("desktop");
assert.equal(desktop.length, 3);
assert.equal(
  parseWindows([])?.length,
  0,
  "closed-all layout is a valid saved value",
);
assert.deepEqual(parseWindows(desktop), desktop);
for (const invalid of [
  [{ ...desktop[0], id: "admin" }],
  [desktop[0], desktop[0]],
  [{ ...desktop[0], x: -1 }],
  [{ ...desktop[0], x: 1.5 }],
  [{ ...desktop[0], width: 1 }],
  [{ ...desktop[0], minimized: "false" }],
  [null],
])
  assert.equal(parseWindows(invalid), null, "untrusted layout rejected");
const fitted = fitWindow(
  { ...desktop[0], x: 3000, y: 3000, width: 2000, height: 1400 },
  900,
  700,
);
assert.ok(
  fitted.x >= 0 &&
    fitted.y >= 0 &&
    fitted.x + fitted.width <= 900 &&
    fitted.y + fitted.height <= 700,
);
console.log(
  "Window layout: device boundaries, saved-empty state, hostile data and viewport fitting passed.",
);
