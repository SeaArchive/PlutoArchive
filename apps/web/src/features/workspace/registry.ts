import dynamic from "next/dynamic";
export { apps } from "./manifests";

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
