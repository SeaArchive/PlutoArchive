import { PublicShell } from "@/components/public-shell";
import { AboutContent } from "@/components/public-sections";
export const metadata = {
  title: "About",
  description: "The planner’s interests, background, and published work.",
};
export default function About() {
  return (
    <PublicShell>
      <AboutContent />
    </PublicShell>
  );
}
