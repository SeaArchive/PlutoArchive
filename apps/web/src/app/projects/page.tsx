import { PublicShell } from "@/components/public-shell";
import { ProjectsContent } from "@/components/public-sections";
export const metadata = { title: "Projects" };
export default function Projects() {
  return (
    <PublicShell>
      <ProjectsContent />
    </PublicShell>
  );
}
