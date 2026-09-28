import { PublicShell } from "@/components/public-shell";
import { ProjectsContent } from "@/components/public-sections";
export const metadata = {
  title: "Projects",
  description: "Pluto Archive의 프로젝트 목표, 설계 선택과 진행 상태를 기록합니다.",
};
export default function Projects() {
  return (
    <PublicShell>
      <ProjectsContent />
    </PublicShell>
  );
}
