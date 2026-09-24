"use client";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { apps } from "./manifests";
import { renderers } from "./registry";
import { fitWindow, type WindowPlacement } from "./layout";

type Props = {
  windows: WindowPlacement[];
  change: (
    next:
      WindowPlacement[] | ((previous: WindowPlacement[]) => WindowPlacement[]),
  ) => void;
  save: () => void;
  notify: (message: string) => void;
  preview: boolean;
};
type Gesture = {
  pointer: number;
  id: string;
  x: number;
  y: number;
  start: WindowPlacement;
  kind: "move" | "resize";
};

export function WindowManager({
  windows,
  change,
  save,
  notify,
  preview,
}: Props) {
  const canvas = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 900, height: 700 });

  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);

  function bounds() {
    return {
      width: canvas.current?.clientWidth || size.width,
      height: canvas.current?.clientHeight || size.height,
    };
  }
  function focus(id: string) {
    change((items) => {
      const top = Math.max(0, ...items.map((item) => item.z));
      if (items.find((item) => item.id === id)?.z === top) return items;
      const ordered =
        top >= 9990
          ? [...items]
              .sort((a, b) => a.z - b.z)
              .map((item, index) => ({ ...item, z: index + 1 }))
          : items;
      return ordered.map((item) =>
        item.id === id
          ? { ...item, z: Math.max(0, ...ordered.map((w) => w.z)) + 1 }
          : item,
      );
    });
    setActive(id);
  }
  function start(
    event: PointerEvent<HTMLElement>,
    w: WindowPlacement,
    kind: Gesture["kind"],
  ) {
    if (kind === "move" && (event.target as HTMLElement).closest("button"))
      return;
    if (event.button !== 0) return;
    focus(w.id);
    gesture.current = {
      pointer: event.pointerId,
      id: w.id,
      x: event.clientX,
      y: event.clientY,
      start: w,
      kind,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function move(event: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    const dx = Math.round(event.clientX - g.x),
      dy = Math.round(event.clientY - g.y);
    const area = bounds();
    change((items) =>
      items.map((item) => {
        if (item.id !== g.id) return item;
        const next =
          g.kind === "move"
            ? { ...item, x: g.start.x + dx, y: g.start.y + dy }
            : {
                ...item,
                width: Math.min(
                  Math.max(
                    apps.find((app) => app.id === g.id)!.window.minWidth,
                    g.start.width + dx,
                  ),
                  Math.max(280, area.width - g.start.x),
                ),
                height: Math.min(
                  Math.max(
                    apps.find((app) => app.id === g.id)!.window.minHeight,
                    g.start.height + dy,
                  ),
                  Math.max(260, area.height - g.start.y),
                ),
              };
        return fitWindow(next, area.width, area.height);
      }),
    );
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointer !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    save();
  }
  function keyboard(
    event: KeyboardEvent<HTMLElement>,
    w: WindowPlacement,
    kind: Gesture["kind"],
  ) {
    if (kind === "move" && !event.altKey) return;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-20, 0],
      ArrowRight: [20, 0],
      ArrowUp: [0, -20],
      ArrowDown: [0, 20],
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    focus(w.id);
    const area = bounds();
    change((items) =>
      items.map((item) =>
        item.id !== w.id
          ? item
          : fitWindow(
              kind === "move"
                ? { ...item, x: item.x + delta[0], y: item.y + delta[1] }
                : {
                    ...item,
                    width: Math.max(
                      apps.find((app) => app.id === w.id)!.window.minWidth,
                      item.width + delta[0],
                    ),
                    height: Math.max(
                      apps.find((app) => app.id === w.id)!.window.minHeight,
                      item.height + delta[1],
                    ),
                  },
              area.width,
              area.height,
            ),
      ),
    );
    save();
  }
  return (
    <div className="workspace-canvas" ref={canvas} aria-label="창 작업 공간">
      {windows
        .filter((w) => !w.minimized)
        .map((window) => {
          const app = apps.find((entry) => entry.id === window.id)!;
          const App = renderers[window.id];
          const w = fitWindow(window, size.width, size.height);
          return (
            <section
              key={w.id}
              className={`app-window floating-window${active === w.id ? " window-active" : ""}`}
              style={{
                left: w.x,
                top: w.y,
                width: w.width,
                height: w.height,
                zIndex: w.z,
              }}
              aria-label={`${app.name} 창`}
              onPointerDown={(e) => {
                if (
                  (e.target as HTMLElement).closest(
                    ".window-title,.window-resize",
                  )
                )
                  return;
                if (active !== w.id) {
                  focus(w.id);
                  save();
                }
              }}
            >
              <header
                className="window-title window-drag"
                tabIndex={0}
                aria-label={`${app.name} 창. Alt와 방향키로 이동`}
                onPointerDown={(e) => start(e, w, "move")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => keyboard(e, w, "move")}
              >
                <span>{app.name}</span>
                <div className="window-actions">
                  <button
                    aria-label={`${app.name} 최소화`}
                    onClick={() => {
                      change((items) =>
                        items.map((item) =>
                          item.id === w.id
                            ? { ...item, minimized: true }
                            : item,
                        ),
                      );
                      save();
                    }}
                  >
                    —
                  </button>
                  <button
                    aria-label={`${app.name} 닫기`}
                    onClick={() => {
                      change((items) =>
                        items.filter((item) => item.id !== w.id),
                      );
                      save();
                    }}
                  >
                    ×
                  </button>
                </div>
              </header>
              <div className="app-body">
                <App notify={notify} persistent={!preview} />
              </div>
              {app.window.resizable && (
                <button
                  className="window-resize"
                  aria-label={`${app.name} 크기 조절. 방향키로 조절`}
                  onPointerDown={(e) => start(e, w, "resize")}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  onKeyDown={(e) => keyboard(e, w, "resize")}
                >
                  ↘
                </button>
              )}
            </section>
          );
        })}
      {windows.every((w) => w.minimized) && (
        <p className="canvas-empty">Dock에서 앱을 열거나 복원하세요.</p>
      )}
    </div>
  );
}
