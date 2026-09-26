import Link from "next/link";
import { processSteps, projects } from "@/config/public-content";
import site from "@/config/site.json";

export function ProjectsContent() {
  return (
    <>
      <header className="section statement-intro">
        <span className="meta">02 / SYSTEMS & EXPERIENCES</span>
        <h1 className="page-title">Projects.</h1>
        <p className="intro">
          무엇을 만들었는지와 함께, 왜 그렇게 만들었는지를 기록합니다.
        </p>
      </header>
      <section className="section" aria-label="프로젝트 목록">
        {projects.map((project, index) => (
          <Link
            className="project-entry"
            href={`/projects/${project.slug}`}
            key={project.slug}
          >
            <span className="meta">
              {String(index + 1).padStart(2, "0")} / {project.category}
            </span>
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
            <span className="meta">{project.status} · 사례 읽기 ↗</span>
          </Link>
        ))}
      </section>
    </>
  );
}

export function ProcessContent() {
  return (
    <>
      <header className="section statement-intro">
        <span className="meta">03 / THINKING & PROCESS</span>
        <h1 className="page-title">In the making.</h1>
        <p className="intro">
          작업의 결과뿐 아니라 문제를 정의하고 선택을 검증하는 순서를
          보여줍니다.
        </p>
      </header>
      <section className="section" aria-label="작업 과정">
        {processSteps.map((step) => (
          <div className="process-step" key={step.number}>
            <span className="meta">{step.number} / PROCESS</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <p className="process-example">실제 사례 · {step.example}</p>
            </div>
          </div>
        ))}
        <Link className="text-link" href="/projects/pluto-archive">
          Pluto Archive 사례 읽기 ↗
        </Link>
      </section>
    </>
  );
}

export function AboutContent() {
  return (
    <>
      <header className="section statement-intro">
        <span className="meta">04 / ABOUT</span>
        <h1 className="page-title">A world of my own.</h1>
        <p className="intro">
          {site.introduction} {site.description}
        </p>
      </header>
      <section className="section case-section">
        <span className="meta">01 / INTEREST</span>
        <div>
          <h2>이미지에서 경험으로</h2>
          <p>
            그림과 화면 구성에서 출발해, 사람이 무엇을 보고 어떻게 움직이며 어떤
            피드백을 받는지에 관심을 두고 있습니다.
          </p>
          <p>
            게임 개발과 기획에서는 시각적 표현이 규칙, 조작, 보상과 연결되는
            방식을 더 깊이 탐구하고 싶습니다.
          </p>
        </div>
      </section>
      <section className="section case-section">
        <span className="meta">02 / EVIDENCE</span>
        <div>
          <h2>보여줄 수 있는 작업부터</h2>
          <p>
            공개한 작품과 이 사이트의 제작 과정을 통해 시각 구성, 정보 설계,
            구현과 검증의 선택을 확인할 수 있습니다.
          </p>
          <div className="case-next">
            <Link className="text-link" href="/works">
              작품 보기 ↗
            </Link>
            <Link className="text-link" href="/projects/pluto-archive">
              제작 사례 보기 ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function ContactContent() {
  return (
    <section className="section statement">
      <span className="meta">05 / CONTACT</span>
      <h1 className="page-title">Let’s connect.</h1>
      <p className="intro">
        연락 채널은 준비 중입니다. 공개된 작업과 코드는 GitHub에서 확인할 수
        있습니다.
      </p>
      <a
        className="text-link"
        href={site.github}
        target="_blank"
        rel="noopener noreferrer"
      >
        SeaArchive on GitHub ↗
      </a>
    </section>
  );
}
