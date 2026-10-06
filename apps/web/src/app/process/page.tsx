import { PublicShell } from "@/components/public-shell";
import { ProcessContent } from "@/components/public-sections";
export const metadata = {
  title: "Process",
  description:
    "How Pluto Archive defines problems, makes decisions, and verifies outcomes.",
};
export default function Process() {
  return (
    <PublicShell>
      <ProcessContent />
    </PublicShell>
  );
}
