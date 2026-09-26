import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { WorkGrid } from "@/components/work-grid";
import { getWorks } from "@/lib/content";
import { processSteps, projects } from "@/config/public-content";
import site from "@/config/site.json";
export const revalidate = 60;
export default async function Home() {
  const works = await getWorks();
  return (
    <PublicShell home>
      <section className="hero">
        <div className="hero-top meta">
          <span>INDEPENDENT CREATIVE ARCHIVE</span>
          <span>134340 / BEYOND THE ORDINARY</span>
        </div>
        <h1>
          PLUTO
          <span>
            ARCHIVE<span className="asterisk">✳</span>
          </span>
        </h1>
        <div className="hero-bottom">
          <div className="frame">
            <span className="meta">01 / INTRODUCTION</span>
            <h2>{site.introduction}</h2>
            <p>{site.description}</p>
          </div>
          <Link className="text-link" href="#works">
            아카이브 둘러보기 <span>↓</span>
          </Link>
        </div>
        <div className="orbit-art" aria-hidden="true">
          <i />
          <i />
          <i />
          <b>134340</b>
        </div>
      </section>
      <section className="section" id="works">
        <div className="section-heading">
          <div>
            <span className="meta">01 / VISUAL EXPLORATION</span>
            <h2>
              Artwork
              <span className="count">
                {" "}
                / {String(works.items.length).padStart(2, "0")}
              </span>
            </h2>
          </div>
          <Link className="text-link" href="/works">
            전체 작품 ↗
          </Link>
        </div>
        <WorkGrid {...works} />
      </section>
      <section className="section" id="projects">
        <div className="section-heading">
          <div>
            <span className="meta">02 / PROJECT CASE STUDY</span>
            <h2>Projects.</h2>
          </div>
          <Link className="text-link" href="/projects">
            전체 프로젝트 ↗
          </Link>
        </div>
        {projects.map((project) => (
          <Link
            className="project-entry"
            href={`/projects/${project.slug}`}
            key={project.slug}
          >
            <span className="meta">
              {project.category} / {project.status}
            </span>
            <h3>{project.title}</h3>
            <p>{project.summary}</p>
            <span className="meta">목표 · 선택 · 구현 · 검증 ↗</span>
          </Link>
        ))}
      </section>
      <section className="section split">
        <div>
          <span className="meta">03 / THINKING & PROCESS</span>
          <h2>
            Beyond
            <br />
            the canvas.
          </h2>
        </div>
        <div>
          <h3>{processSteps[0].title}</h3>
          <p>{processSteps[0].description}</p>
          <Link className="index-link" href="/projects">
            <span>01</span>Projects <span>↗</span>
          </Link>
          <Link className="index-link" href="/process">
            <span>02</span>Process <span>↗</span>
          </Link>
        </div>
      </section>
      <section className="section technical">
        <span className="meta">04 / BUILT WITH INTENTION</span>
        <h2>
          보이는 것부터,
          <br />
          보이지 않는 구조까지.
        </h2>
        <div className="principles">
          <p>
            <b>01 — Clarity</b>작품에 집중하는 명확한 화면.
          </p>
          <p>
            <b>02 — Structure</b>콘텐츠와 기능을 연결하는 구조.
          </p>
          <p>
            <b>03 — Performance</b>측정한 문제부터 개선하기.
          </p>
        </div>
      </section>
      <section className="section split">
        <div>
          <span className="meta">05 / ABOUT</span>
          <h2>
            이미지에서
            <br />
            경험으로.
          </h2>
        </div>
        <div>
          <p>
            그림과 화면을 만드는 경험을 규칙, 조작, 피드백이 있는 경험으로
            확장하고 싶습니다. 작품과 제작 사례를 통해 현재의 작업을 보여줍니다.
          </p>
          <Link className="text-link" href="/about">
            소개 읽기 ↗
          </Link>
        </div>
      </section>
      <section className="section contact">
        <span className="meta">06 / MAKE A CONNECTION</span>
        <h2>
          Let’s create
          <br />
          something meaningful.
        </h2>
        <Link href="/contact" className="text-link">
          함께 이야기하기 ↗
        </Link>
      </section>
    </PublicShell>
  );
}
