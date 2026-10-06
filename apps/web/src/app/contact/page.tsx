import { PublicShell } from "@/components/public-shell";
import { ContactContent } from "@/components/public-sections";
export const metadata = {
  title: "Contact",
  description: "Published GitHub work and contact-channel availability.",
};
export default function Contact() {
  return (
    <PublicShell>
      <ContactContent />
    </PublicShell>
  );
}
