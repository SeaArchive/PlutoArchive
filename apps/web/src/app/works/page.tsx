import { PublicShell } from "@/components/public-shell";
import { WorkArchive } from "./work-archive";
import { getWorks } from "@/lib/content";
export const metadata = {
  title: "Works",
  description: "Pluto Archive에 공개된 작품과 이미지를 살펴봅니다.",
};
export const revalidate = 60;
export default async function Works() {
  return (
    <PublicShell>
      <section className="section">
        <span className="meta">01 / ARTWORK ARCHIVE</span>
        <h1 className="page-title">Works.</h1>
        <p className="intro">상상에서 시작된 이미지, 오래 남기고 싶은 장면.</p>
        <WorkArchive {...await getWorks()} />
      </section>
    </PublicShell>
  );
}
