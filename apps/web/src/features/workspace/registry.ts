import type { AppManifest } from "@pluto/sdk";
export const apps: AppManifest[] = ["Notes", "Tasks", "Timer"].map((name) => ({
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
}));
