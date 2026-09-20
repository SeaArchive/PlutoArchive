import { WorkspaceShell } from "@/features/workspace/shell";
export const metadata = {
  title: "Workspace Preview",
  robots: { index: false, follow: false },
};
export default function Preview() {
  return <WorkspaceShell preview />;
}
