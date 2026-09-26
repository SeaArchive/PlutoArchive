import { PublicShell } from "@/components/public-shell";
import { ContactContent } from "@/components/public-sections";
export const metadata = { title: "Contact" };
export default function Contact() {
  return (
    <PublicShell>
      <ContactContent />
    </PublicShell>
  );
}
