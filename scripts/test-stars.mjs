import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const source = (
  await readFile(
    new URL("../apps/web/src/components/starfield.tsx", import.meta.url),
    "utf8",
  )
)
  .replace(/import[^;]+;/g, "")
  .replace(/return visible \? \([\s\S]*?\) : null;/, "return null;");
const code = stripTypeScriptTypes(source);
let run = 0;
async function setup({
  width = 1200,
  reduced = false,
  fine = true,
  path = "/",
} = {}) {
  const listeners = new Map(),
    frames = new Map(),
    effects = [],
    cleanups = [];
  let points = [],
    id = 0,
    time = 0,
    refs = 0;
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
    },
    beginPath() {},
    arc(x, y, r) {
      points.push([x, y, r]);
    },
    fill() {},
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
  globalThis.testStars = {
    useRef: (initial) => ({ current: refs++ === 0 ? canvas : initial }),
    useEffect: (callback) => {
      effects.push(callback);
      const cleanup = callback();
      if (cleanup) cleanups.push(cleanup);
    },
    usePathname: () => path,
  };
  const module = await import(
    `data:text/javascript;base64,${Buffer.from("const {useRef,useEffect,usePathname}=globalThis.testStars;\n" + code + "\n//" + run++).toString("base64")}`
  );
  module.Starfield();
  const drain = () => {
    let count = 0;
    while (frames.size) {
      assert.ok(++count < 160, "animation must settle rather than run forever");
      const callbacks = [...frames.values()];
      frames.clear();
      time += 34;
      callbacks.forEach((fn) => fn(time));
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
    effects,
    drain,
    click,
    points: () => points,
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}
const desktop = await setup();
desktop.drain();
assert.equal(desktop.points().length, 64);
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
desktop.effects[1]();
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
