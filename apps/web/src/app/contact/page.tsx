import { PublicShell } from "@/components/public-shell";
import { ContactContent } from "@/components/public-sections";
export const metadata = {
  title: "Contact",
  description: "Pluto Archive의 공개 GitHub 작업과 연락 채널 준비 상태를 확인합니다.",
};
export default function Contact() {
  return (
    <PublicShell>
      <ContactContent />
    </PublicShell>
  );
}
