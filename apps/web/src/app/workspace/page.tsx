import { requireUser } from "@/lib/auth";
import { WorkspaceShell } from "@/features/workspace/shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};
export default async function Workspace() {
  await requireUser();
  return <WorkspaceShell />;
}
