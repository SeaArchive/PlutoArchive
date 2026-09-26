import { PublicShell } from "@/components/public-shell";
import { AboutContent } from "@/components/public-sections";
export const metadata = { title: "About" };
export default function About() {
  return (
    <PublicShell>
      <AboutContent />
    </PublicShell>
  );
}
