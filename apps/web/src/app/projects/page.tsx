import { PublicShell } from "@/components/public-shell";
import { ProjectsContent } from "@/components/public-sections";
export const metadata = {
  title: "Projects",
  description:
    "Project goals, design decisions, and work in progress at Pluto Archive.",
};
export default function Projects() {
  return (
    <PublicShell>
      <ProjectsContent />
    </PublicShell>
  );
}
