import { PublicShell } from "@/components/public-shell";
import { ProcessContent } from "@/components/public-sections";
export const metadata = { title: "Process" };
export default function Process() {
  return (
    <PublicShell>
      <ProcessContent />
    </PublicShell>
  );
}
