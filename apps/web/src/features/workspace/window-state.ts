"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultWindows,
  deviceForWidth,
  type Device,
  type WindowPlacement,
} from "./layout";

export function useWindowState(preview: boolean) {
  const [device, setDevice] = useState<Device | null>(null);
  const [windows, setState] = useState<WindowPlacement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const current = useRef<WindowPlacement[]>([]);
  const previews = useRef<Partial<Record<Device, WindowPlacement[]>>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const update = () => setDevice(deviceForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const change = useCallback(
    (
      next:
        | WindowPlacement[]
        | ((previous: WindowPlacement[]) => WindowPlacement[]),
    ) => {
      const value = typeof next === "function" ? next(current.current) : next;
      current.current = value;
      setState(value);
      if (preview && device) previews.current[device] = value;
    },
    [preview, device],
  );

  useEffect(() => {
    if (!device) return;
    const controller = new AbortController();
    setLoaded(false);
    setError("");
    if (preview) {
      const initial = previews.current[device] ?? defaultWindows(device);
      current.current = initial;
      setState(initial);
      setLoaded(true);
      return;
    }
    current.current = [];
    setState([]);
    fetch(`/api/workspace/layout?device=${device}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("창 배치를 불러오지 못했습니다.");
        return (await response.json()) as { windows: WindowPlacement[] | null };
      })
      .then(({ windows: saved }) => {
        if (controller.signal.aborted) return;
        const value = saved ?? defaultWindows(device);
        current.current = value;
        setState(value);
        setLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("창 배치를 불러오지 못했습니다. 다시 시도해 주세요.");
      });
    return () => controller.abort();
  }, [device, preview, revision]);

  const save = useCallback(() => {
    if (!device || preview || !loaded) return;
    const payload = JSON.stringify({ device, windows: current.current });
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        const response = await fetch("/api/workspace/layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
        if (!response.ok)
          throw new Error(
            "창 배치를 저장하지 못했습니다. 다시 조작하면 재시도합니다.",
          );
        setError("");
      })
      .catch(() =>
        setError("창 배치를 저장하지 못했습니다. 다시 조작하면 재시도합니다."),
      );
  }, [device, preview, loaded]);

  const reset = useCallback(() => {
    if (!device) return;
    change(defaultWindows(device));
    // Call save in the event handler after change has synchronously updated the ref.
    save();
  }, [device, change, save]);

  return {
    device,
    windows,
    loaded,
    error,
    change,
    save,
    reset,
    retry: () => setRevision((n) => n + 1),
  };
}
