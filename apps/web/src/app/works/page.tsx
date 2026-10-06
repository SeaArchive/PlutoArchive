import { PublicShell } from "@/components/public-shell";
import { WorkArchive } from "./work-archive";
import { getWorks } from "@/lib/content";
export const metadata = {
  title: "Works",
  description: "Explore published artwork and images from Pluto Archive.",
};
export const revalidate = 60;
export default async function Works() {
  return (
    <PublicShell>
      <section className="section">
        <span className="meta">01 / ARTWORK ARCHIVE</span>
        <h1 className="page-title">Works.</h1>
        <p className="intro">
          Images born from imagination. Scenes worth keeping.
        </p>
        <WorkArchive {...await getWorks()} />
      </section>
    </PublicShell>
  );
}
