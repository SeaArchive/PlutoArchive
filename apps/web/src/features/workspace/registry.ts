import dynamic from "next/dynamic";
import type { AppManifest } from "@pluto/sdk";
export const apps: AppManifest[] = ["Music", "Notes", "Tasks", "Timer"].map(
  (name) => ({
    id: name.toLowerCase(),
    name,
    version: "0.1.0",
    platforms: ["desktop", "mobile"],
    permissions: [],
    window: {
      minWidth: 280,
      minHeight: 240,
      defaultWidth: 500,
      defaultHeight: 400,
      resizable: false,
    },
  }),
);

export const renderers: Record<
  string,
  React.ComponentType<{
    notify: (message: string) => void;
    persistent?: boolean;
  }>
> = {
  music: dynamic(() => import("./music")),
  notes: dynamic(() => import("./notes")),
  tasks: dynamic(() => import("./tasks")),
  timer: dynamic(() => import("./timer")),
};
