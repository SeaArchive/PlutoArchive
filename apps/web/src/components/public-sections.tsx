import Link from "next/link";
import {
  plannerProfile,
  processSteps,
  projects,
} from "@/config/public-content";
import site from "@/config/site.json";

export function ProjectsContent() {
  return (
    <>
      <header className="section statement-intro">
        <span className="meta">02 / SYSTEMS & EXPERIENCES</span>
        <h1 className="page-title">Projects.</h1>
        <p className="intro">The work, and the decisions that shaped it.</p>
      </header>
      <section className="section" aria-label="Project list">
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
            <span className="meta">
              {project.status} · Read the case study ↗
            </span>
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
          From defining the problem to verifying the choices behind the outcome.
        </p>
      </header>
      <section className="section" aria-label="Working process">
        {processSteps.map((step) => (
          <div className="process-step" key={step.number}>
            <span className="meta">{step.number} / PROCESS</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <p className="process-example">In practice · {step.example}</p>
            </div>
          </div>
        ))}
        <Link className="text-link" href="/projects/pluto-archive">
          Read the Pluto Archive case study ↗
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
        <span className="meta">01 / PLANNING & COMMUNICATION</span>
        <div>
          <h2>{plannerProfile.heading}</h2>
          <p>{plannerProfile.background}</p>
          <p>{plannerProfile.approach}</p>
          <p>{plannerProfile.direction}</p>
          <p>{plannerProfile.learning}</p>
        </div>
      </section>
      <section className="section case-section">
        <span className="meta">02 / EVIDENCE</span>
        <div>
          <h2>Start with work you can explore</h2>
          <p>
            Explore published artwork and this site’s project case for examples
            of visual composition, information design, implementation, and
            verification.
          </p>
          <div className="case-next">
            <Link className="text-link" href="/works">
              Explore artwork ↗
            </Link>
            <Link className="text-link" href="/projects/pluto-archive">
              Explore the project case ↗
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
        A direct contact channel is being prepared. Published work and code are
        available on GitHub.
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
