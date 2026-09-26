import type { Command } from "@pluto/sdk";
import { apps } from "./manifests";

export function workspaceCommands(actions: {
  open: (id: string) => void;
  notifications: () => void;
  settings: () => void;
}): Command[] {
  return [
    ...apps.map((app) => ({
      id: `${app.id}.open`,
      label: `${app.name} 열기`,
      execute: () => actions.open(app.id),
    })),
    {
      id: "workspace.notifications",
      label: "알림 센터 열기",
      execute: actions.notifications,
    },
    {
      id: "workspace.settings",
      label: "설정 열기",
      execute: actions.settings,
    },
  ];
}

export function searchCommands(commands: Command[], query: string): Command[] {
  const term = query.trim().toLocaleLowerCase();
  return commands.filter((command) =>
    `${command.label} ${command.id}`.toLocaleLowerCase().includes(term),
  );
}
