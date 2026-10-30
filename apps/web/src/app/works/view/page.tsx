import { Suspense } from "react";
import { PublicShell } from "@/components/public-shell";
import {
  ArchiveStatus,
  LiveWorkDetail,
} from "@/features/public-gallery/live-gallery";

export const metadata = {
  title: "Artwork",
  robots: { index: false, follow: true },
};
export default function ArtworkViewer() {
  return (
    <PublicShell>
      <Suspense fallback={<ArchiveStatus state="loading" />}>
        <LiveWorkDetail />
      </Suspense>
    </PublicShell>
  );
}
