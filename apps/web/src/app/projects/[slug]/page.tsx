import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { projects } from "@/config/public-content";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return (
    <PublicShell>
      <article>
        <header className="section project-header">
          <Link className="meta" href="/projects">
            ← ALL PROJECTS
          </Link>
          <p className="meta">
            {project.category} / {project.status}
          </p>
          <h1 className="page-title">{project.title}</h1>
          <p className="intro">{project.summary}</p>
          <a
            className="text-link"
            href={project.repository}
            target="_blank"
            rel="noopener noreferrer"
          >
            프로젝트 저장소 ↗
          </a>
        </header>
        {project.sections.map((section) => (
          <section className="section case-section" key={section.label}>
            <span className="meta">{section.label}</span>
            <div>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <nav className="section case-next" aria-label="이어 보기">
          <Link className="text-link" href="/process">
            작업 과정 보기 ↗
          </Link>
          <Link className="text-link" href="/works">
            작품 보기 ↗
          </Link>
        </nav>
      </article>
    </PublicShell>
  );
}
