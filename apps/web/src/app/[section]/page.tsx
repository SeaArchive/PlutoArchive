import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import site from "@/config/site.json";
const sections: Record<
  string,
  { title: string; label: string; description: string }
> = {
  projects: {
    title: "Projects.",
    label: "02 / SYSTEMS & EXPERIENCES",
    description: "디자인과 개발을 연결하는 프로젝트를 준비하고 있습니다.",
  },
  process: {
    title: "In the making.",
    label: "03 / THINKING & PROCESS",
    description:
      "계획부터 구현까지, 작업의 판단과 과정을 기록합니다. 공개할 기록을 준비하고 있습니다.",
  },
  about: {
    title: "A world of my own.",
    label: "04 / ABOUT",
    description: site.description,
  },
  contact: {
    title: "Let’s connect.",
    label: "05 / CONTACT",
    description: "새로운 작업과 아이디어에 관한 이야기를 기다립니다.",
  },
};
export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}
export default async function Section({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const data = sections[section];
  if (!data) notFound();
  return (
    <PublicShell>
      <section className="section statement">
        <span className="meta">{data.label}</span>
        <h1 className="page-title">{data.title}</h1>
        <p className="intro">{data.description}</p>
        {(section === "contact" || section === "about") && (
          <a
            className="text-link"
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            SeaArchive on GitHub ↗
          </a>
        )}
      </section>
    </PublicShell>
  );
}
