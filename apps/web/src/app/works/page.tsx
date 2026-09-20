import { PublicShell } from "@/components/public-shell";
import { WorkGrid } from "@/components/work-grid";
import { getWorks } from "@/lib/content";
export const metadata = { title: "Works" };
export const revalidate = 60;
export default async function Works() {
  return (
    <PublicShell>
      <section className="section">
        <span className="meta">01 / ARTWORK ARCHIVE</span>
        <h1 className="page-title">Works.</h1>
        <p className="intro">상상에서 시작된 이미지, 오래 남기고 싶은 장면.</p>
        <WorkGrid {...await getWorks()} />
      </section>
    </PublicShell>
  );
}
