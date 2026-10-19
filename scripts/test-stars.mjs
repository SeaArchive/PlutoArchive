import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const code = stripTypeScriptTypes(
  await readFile(
    new URL("../apps/web/src/components/starfield-engine.ts", import.meta.url),
    "utf8",
  ),
);
let run = 0;
async function setup({
  width = 1200,
  reduced = false,
  fine = true,
  path = "/",
} = {}) {
  const listeners = new Map(),
    frames = new Map(),
    cleanups = [];
  let points = [],
    id = 0,
    time = 0,
    fills = [],
    history = [];
  const on = (name, handler) => listeners.set(name, handler);
  const off = (name) => listeners.delete(name);
  const motion = {
    matches: reduced,
    addEventListener: (n, h) => on("motion", h),
    removeEventListener: () => off("motion"),
  };
  const ctx = {
    setTransform() {},
    clearRect() {
      points = [];
      fills = [];
    },
    beginPath() {},
    arc(x, y, r) {
      points.push([x, y, r]);
    },
    fill() {
      fills.push(this.fillStyle);
    },
  };
  const canvas = { getContext: () => ctx };
  globalThis.window = {
    innerWidth: width,
    innerHeight: 800,
    devicePixelRatio: 3,
    matchMedia: (q) => (q.includes("reduce") ? motion : { matches: fine }),
    addEventListener: on,
    removeEventListener: off,
  };
  globalThis.document = {
    hidden: false,
    documentElement: { addEventListener: on, removeEventListener: off },
    addEventListener: on,
    removeEventListener: off,
  };
  globalThis.location = {
    href: "https://example.com/",
    origin: "https://example.com",
    pathname: "/",
  };
  globalThis.Element = class {
    closest() {
      return this;
    }
  };
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (key) => frames.delete(key);
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(code + "\n//" + run++).toString("base64")}`
  );
  globalThis.performance = { now: () => time };
  const controller = module.publicPath(path)
    ? module.mountStarfield(canvas)
    : null;
  if (controller) cleanups.push(controller.destroy);
  const drain = () => {
    let count = 0;
    while (frames.size) {
      assert.ok(++count < 160, "animation must settle rather than run forever");
      const callbacks = [...frames.values()];
      frames.clear();
      time += 34;
      callbacks.forEach((fn) => fn(time));
      history.push(points.map((p) => [...p]));
    }
  };
  const click = () => {
    const link = new Element();
    Object.assign(link, {
      href: "https://example.com/about",
      target: "",
      hasAttribute: () => false,
    });
    listeners.get("click")?.({
      target: link,
      button: 0,
      defaultPrevented: false,
    });
  };
  return {
    listeners,
    frames,
    finish: () => controller?.finish(),
    history,
    fills: () => fills,
    drain,
    click,
    points: () => points,
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}
const desktop = await setup();
desktop.drain();
assert.equal(desktop.points().length, 64);
assert.ok(
  desktop.points().every((p) => p[2] >= 0.7 && p[2] <= 1.35),
  "minimum visible radius",
);
assert.ok(
  desktop.fills().every((c) => Number(c.match(/,([\d.]+)\)$/)[1]) >= 0.32),
  "minimum visible opacity",
);
const initial = desktop.points().map((p) => [...p]);
desktop.listeners.get("pointermove")({
  clientX: 900,
  clientY: 600,
  pointerType: "mouse",
});
desktop.drain();
assert.ok(
  desktop
    .points()
    .some(
      (p, i) => Math.hypot(p[0] - initial[i][0], p[1] - initial[i][1]) > 0.1,
    ),
);
assert.ok(
  desktop
    .points()
    .every(
      (p, i) => Math.hypot(p[0] - initial[i][0], p[1] - initial[i][1]) < 12,
    ),
);
desktop.click();
desktop.drain();
assert.ok(
  desktop.points().every((p) => p[1] < 24),
  "navigation gathers stars at the top",
);
desktop.finish();
desktop.drain();
assert.ok(
  desktop.points().some((p) => p[1] > 100),
  "route completion disperses stars",
);
desktop.listeners.get("pointermove")({
  clientX: 200,
  clientY: 100,
  pointerType: "mouse",
});
document.hidden = true;
desktop.listeners.get("visibilitychange")();
assert.equal(desktop.frames.size, 0);
desktop.cleanup();
assert.equal(desktop.listeners.size, 0);
const fast = await setup();
fast.drain();
fast.click();
fast.finish(); // Next can commit a prefetched route before the first animation frame.
fast.drain();
assert.ok(
  fast.history.some(
    (points) => points.length && points.every((p) => p[1] < 36),
  ),
  "instant navigation retains a visible gather cue",
);
assert.ok(
  fast.points().some((p) => p[1] > 100),
  "fast navigation disperses without delaying content",
);
fast.cleanup();
const base = await setup({ path: "/PlutoArchive/works" });
base.drain();
assert.equal(base.points().length, 64, "Pages base path is public");
base.cleanup();
const reduced = await setup({ reduced: true });
reduced.drain();
reduced.click();
reduced.listeners.get("pointermove")({
  clientX: 200,
  clientY: 100,
  pointerType: "mouse",
});
assert.equal(reduced.frames.size, 0);
reduced.cleanup();
const mobile = await setup({ width: 600, fine: false });
mobile.drain();
assert.equal(mobile.points().length, 30);
mobile.cleanup();
const privatePage = await setup({ path: "/workspace" });
assert.equal(privatePage.frames.size, 0);
privatePage.cleanup();
console.log(
  "Stars: subtle motion, transition gather/release, idle/hidden cleanup, reduced motion, mobile and private routes passed.",
);
