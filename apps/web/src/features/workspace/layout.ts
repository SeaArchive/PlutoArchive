import { apps } from "./manifests";

export type Device = "desktop" | "tablet" | "mobile";
export type WindowPlacement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
};

export function deviceForWidth(width: number): Device {
  return width < 700 ? "mobile" : width < 1100 ? "tablet" : "desktop";
}

export function defaultWindows(device: Device): WindowPlacement[] {
  const ids = device === "mobile" ? ["music"] : ["music", "notes", "timer"];
  return ids.map((id, i) => {
    const config = apps.find((app) => app.id === id)!.window;
    return {
      id,
      x: 24 + i * (device === "tablet" ? 45 : 170),
      y: 24 + i * 70,
      width: config.defaultWidth,
      height: config.defaultHeight,
      z: i + 1,
      minimized: false,
    };
  });
}

/** Validate persisted layout as data, including direct Data API writes. */
export function parseWindows(value: unknown): WindowPlacement[] | null {
  if (!Array.isArray(value) || value.length > apps.length) return null;
  const seen = new Set<string>();
  const result: WindowPlacement[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") return null;
    const w = row as Record<string, unknown>;
    const app = apps.find((candidate) => candidate.id === w.id);
    if (!app || seen.has(app.id) || typeof w.minimized !== "boolean")
      return null;
    for (const [key, max] of [
      ["x", 5000],
      ["y", 5000],
      ["width", 2500],
      ["height", 1600],
      ["z", 10000],
    ] as const) {
      if (
        typeof w[key] !== "number" ||
        !Number.isInteger(w[key]) ||
        w[key] < 0 ||
        w[key] > max
      )
        return null;
    }
    if (
      (w.width as number) < app.window.minWidth ||
      (w.height as number) < app.window.minHeight
    )
      return null;
    seen.add(app.id);
    result.push({
      id: app.id,
      x: w.x as number,
      y: w.y as number,
      width: w.width as number,
      height: w.height as number,
      z: w.z as number,
      minimized: w.minimized,
    });
  }
  return result;
}

/** Keep the title and resize control reachable after a viewport change. */
export function fitWindow(
  w: WindowPlacement,
  areaWidth: number,
  areaHeight: number,
): WindowPlacement {
  const app = apps.find((candidate) => candidate.id === w.id)!;
  const width = Math.min(w.width, Math.max(app.window.minWidth, areaWidth));
  const height = Math.min(w.height, Math.max(app.window.minHeight, areaHeight));
  return {
    ...w,
    width,
    height,
    x: Math.min(Math.max(0, w.x), Math.max(0, areaWidth - width)),
    y: Math.min(Math.max(0, w.y), Math.max(0, areaHeight - height)),
  };
}
