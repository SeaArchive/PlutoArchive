"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { mountStarfield, publicPath } from "./starfield-engine";

export function Starfield() {
  const pathname = usePathname();
  const visible = publicPath(pathname);
  const canvas = useRef<HTMLCanvasElement>(null);
  const release = useRef<() => void>(() => {});

  useEffect(() => {
    if (!visible || !canvas.current) return;
    const stars = mountStarfield(canvas.current);
    release.current = stars.finish;
    return () => {
      release.current = () => {};
      stars.destroy();
    };
  }, [visible]);

  useEffect(() => {
    release.current();
  }, [pathname]);
  return visible ? (
    <canvas ref={canvas} className="public-stars" aria-hidden="true" />
  ) : null;
}
