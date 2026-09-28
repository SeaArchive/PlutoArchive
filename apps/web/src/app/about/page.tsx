import { PublicShell } from "@/components/public-shell";
import { AboutContent } from "@/components/public-sections";
export const metadata = {
  title: "About",
  description: "그림과 화면 구성에서 출발한 관심과 공개된 작업을 소개합니다.",
};
export default function About() {
  return (
    <PublicShell>
      <AboutContent />
    </PublicShell>
  );
}
