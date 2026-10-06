"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function publicPath(path: string) {
  return (
    path === "/" || /^\/(works|projects|process|about|contact)(\/|$)/.test(path)
  );
}

/** Decorative, event-driven canvas: no animation loop runs while it is idle. */
export function Starfield() {
  const pathname = usePathname();
  const visible = publicPath(pathname);
  const canvas = useRef<HTMLCanvasElement>(null);
  const release = useRef<() => void>(() => {});

  useEffect(() => {
    if (!visible || !canvas.current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d", { alpha: true });
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let width = 0,
      height = 0,
      frame = 0,
      lastTime = 0;
    let gather = 0,
      destination = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pointer = { x: -1000, y: -1000 };
    let offset = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let stars: { x: number; y: number; radius: number; alpha: number }[] = [];

    function wake() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function draw(time: number) {
      frame = 0;
      if (document.hidden) return;
      if (time - lastTime < 32) {
        wake();
        return;
      }
      lastTime = time;
      const animate = !motion.matches;
      offset.x += (target.x - offset.x) * 0.12;
      offset.y += (target.y - offset.y) * 0.12;
      gather += (destination - gather) * 0.16;
      if (!animate) {
        offset = { x: 0, y: 0 };
        gather = 0;
      }
      ctx!.clearRect(0, 0, width, height);
      stars.forEach((star, index) => {
        let x = star.x * width + offset.x;
        let y = star.y * height + offset.y;
        const dx = pointer.x - x,
          dy = pointer.y - y;
        const distance = Math.hypot(dx, dy);
        const attraction = animate ? Math.max(0, 1 - distance / 180) : 0;
        if (distance > 0) {
          x += (dx / distance) * attraction * 6;
          y += (dy / distance) * attraction * 6;
        }
        // An indeterminate transition cue, not a fabricated loading percentage.
        x +=
          (width / 2 - 140 + (index / (stars.length - 1)) * 280 - x) * gather;
        y += (18 + (index % 3) * 2 - y) * gather;
        ctx!.fillStyle = `rgba(174,195,220,${star.alpha + attraction * 0.06})`;
        ctx!.beginPath();
        ctx!.arc(x, y, star.radius, 0, Math.PI * 2);
        ctx!.fill();
      });
      if (
        animate &&
        (Math.abs(target.x - offset.x) + Math.abs(target.y - offset.y) > 0.02 ||
          Math.abs(destination - gather) > 0.002)
      )
        wake();
    }
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * scale);
      element.height = Math.round(height * scale);
      ctx!.setTransform(scale, 0, 0, scale, 0, 0);
      let seed = 134340;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      stars = Array.from({ length: width < 700 ? 30 : 64 }, () => ({
        x: random(),
        y: random(),
        radius: 0.4 + random() * 0.65,
        alpha: 0.12 + random() * 0.2,
      }));
      wake();
    }
    function move(event: PointerEvent) {
      if (!fine.matches || motion.matches || event.pointerType !== "mouse")
        return;
      pointer = { x: event.clientX, y: event.clientY };
      target = {
        x: (event.clientX / width - 0.5) * 5,
        y: (event.clientY / height - 0.5) * 5,
      };
      wake();
    }
    function leave() {
      pointer = { x: -1000, y: -1000 };
      target = { x: 0, y: 0 };
      wake();
    }
    function settle() {
      destination = 0;
      clearTimeout(timeout);
      wake();
    }
    function click(event: MouseEvent) {
      if (
        motion.matches ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>(".public-space a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname === location.pathname ||
        !publicPath(url.pathname.replace(/^\/PlutoArchive(?=\/|$)/, "") || "/")
      )
        return;
      destination = 1;
      clearTimeout(timeout);
      timeout = setTimeout(settle, 2200);
      wake();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    }
    function reduced() {
      settle();
      leave();
    }
    release.current = settle;
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("click", click, true);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", reduced);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      release.current = () => {};
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("click", click, true);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", reduced);
    };
  }, [visible]);

  useEffect(() => {
    release.current();
  }, [pathname]);
  return visible ? (
    <canvas ref={canvas} className="public-stars" aria-hidden="true" />
  ) : null;
}
