import { PublicShell } from "@/components/public-shell";
import { ProcessContent } from "@/components/public-sections";
export const metadata = {
  title: "Process",
  description: "문제를 정의하고 선택을 검증하는 Pluto Archive의 작업 과정을 소개합니다.",
};
export default function Process() {
  return (
    <PublicShell>
      <ProcessContent />
    </PublicShell>
  );
}
