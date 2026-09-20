export interface AppManifest {
  id: string;
  name: string;
  version: string;
  platforms: ("desktop" | "mobile")[];
  permissions: string[];
  window: {
    minWidth: number;
    minHeight: number;
    defaultWidth: number;
    defaultHeight: number;
    resizable: boolean;
  };
}
export interface Command {
  id: string;
  label: string;
  execute: () => void;
}
export interface WorkspaceServices {
  notify(message: string): void;
  open(appId: string): void;
  close(appId: string): void;
}
