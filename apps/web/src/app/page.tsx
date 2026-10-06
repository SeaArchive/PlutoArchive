import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { WorkGrid } from "@/components/work-grid";
import { CodeNote } from "@/components/code-note";
import { getWorks } from "@/lib/content";
import { projects } from "@/config/public-content";
export const revalidate = 60;
export default async function Home() {
  const works = await getWorks();
  const featuredWorks = {
    ...works,
    items: works.items.filter((item) => item.featured),
  };
  return (
    <PublicShell home>
      <section className="hero">
        <div className="hero-top meta">
          <span>INDEPENDENT CREATIVE ARCHIVE</span>
          <span>134340 / BEYOND THE ORDINARY</span>
        </div>
        <h1 aria-label="Pluto Archive">
          PLUTO
          <span>
            ARCHIVE<span className="asterisk">✳</span>
          </span>
        </h1>
        <div className="hero-bottom">
          <div className="hero-code">
            <span className="meta">01 / INTRODUCTION</span>
            <CodeNote
              name="planner"
              fields={[
                {
                  name: "purpose",
                  value: "Align perspectives. Shape a shared direction.",
                },
                {
                  name: "knowledge",
                  value: ["illustration", "development", "accounting"],
                },
                {
                  name: "focus",
                  value: ["game planning", "software planning"],
                },
              ]}
            />
          </div>
          <Link className="text-link" href="#works">
            Explore the archive <span>↓</span>
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
                / {String(featuredWorks.items.length).padStart(2, "0")}
              </span>
            </h2>
          </div>
          <Link className="text-link" href="/works">
            All artwork ↗
          </Link>
        </div>
        <WorkGrid {...featuredWorks} showSummary={false} />
      </section>
      <section className="section" id="projects">
        <div className="section-heading">
          <div>
            <span className="meta">02 / PROJECT CASE STUDY</span>
            <h2>Projects.</h2>
          </div>
          <Link className="text-link" href="/projects">
            All projects ↗
          </Link>
        </div>
        {projects.map((project) => (
          <Link
            className="project-entry"
            href={`/projects/${project.slug}`}
            key={project.slug}
          >
            <span className="meta">{project.category}</span>
            <h3>{project.title}</h3>
            <CodeNote
              name="project"
              fields={[
                { name: "goal", value: project.summary },
                { name: "status", value: project.status },
              ]}
            />
            <span className="meta">
              PURPOSE · DECISIONS · IMPLEMENTATION · VERIFICATION ↗
            </span>
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
          <CodeNote
            name="workflow"
            fields={[
              { name: "start", value: "Define the problem and the audience." },
              {
                name: "decide",
                value: "Make constraints and trade-offs explicit.",
              },
              {
                name: "verify",
                value: "Check the outcome. Refine the next step.",
              },
            ]}
          />
          <Link className="index-link" href="/projects">
            <span>01</span>Projects<span>↗</span>
          </Link>
          <Link className="index-link" href="/process">
            <span>02</span>Process<span>↗</span>
          </Link>
        </div>
      </section>
      <section className="section technical">
        <span className="meta">04 / BUILT WITH INTENTION</span>
        <h2>
          From the surface
          <br />
          to the structure.
        </h2>
        <div className="principles code-principles">
          <CodeNote
            name="clarity"
            fields={[{ name: "goal", value: "Keep the work in focus." }]}
          />
          <CodeNote
            name="structure"
            fields={[
              { name: "goal", value: "Connect content and functionality." },
            ]}
          />
          <CodeNote
            name="performance"
            fields={[
              {
                name: "approach",
                value: "Measure first. Improve what matters.",
              },
            ]}
          />
        </div>
      </section>
      <section className="section split">
        <div>
          <span className="meta">05 / ABOUT</span>
          <h2>
            Understand.
            <br />
            Align. Plan.
          </h2>
        </div>
        <div>
          <CodeNote
            name="direction"
            fields={[
              {
                name: "role",
                value:
                  "A planner who connects teams through shared understanding.",
              },
              {
                name: "outlook",
                value: "Games and software, with room to explore other fields.",
              },
              {
                name: "next",
                value: [
                  "law studies",
                  "e-commerce analysis",
                  "reverse planning",
                ],
              },
            ]}
          />
          <Link className="text-link" href="/about">
            Read about me ↗
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
        <CodeNote
          name="connection"
          fields={[
            {
              name: "intent",
              value: "Turn different perspectives into a shared direction.",
            },
          ]}
        />
        <Link href="/contact" className="text-link">
          Contact & public work ↗
        </Link>
      </section>
    </PublicShell>
  );
}
