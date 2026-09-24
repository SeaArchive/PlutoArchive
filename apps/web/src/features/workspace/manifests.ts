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
      minHeight: 260,
      defaultWidth: name === "Music" ? 740 : 440,
      defaultHeight: name === "Music" ? 450 : 430,
      resizable: true,
    },
  }),
);
