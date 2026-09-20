import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { WorkGrid } from "@/components/work-grid";
import { getWorks } from "@/lib/content";
import site from "@/config/site.json";
export const revalidate = 60;
export default async function Home() {
  const works = await getWorks();
  return (
    <PublicShell>
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
      <section className="section split">
        <div>
          <span className="meta">02 / SYSTEMS & EXPERIENCES</span>
          <h2>
            Beyond
            <br />
            the canvas.
          </h2>
        </div>
        <div>
          <h3>하나의 결과, 수많은 결정.</h3>
          <p>
            디자인과 개발을 연결하는 프로젝트, 그리고 완성에 이르기까지의 과정을
            기록합니다.
          </p>
          <Link className="index-link" href="/projects">
            <span>01</span>Projects <span>↗</span>
          </Link>
          <Link className="index-link" href="/process">
            <span>02</span>Process <span>↗</span>
          </Link>
        </div>
      </section>
      <section className="section technical">
        <span className="meta">03 / BUILT WITH INTENTION</span>
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
            <b>03 — Performance</b>필요한 만큼, 가볍고 빠르게.
          </p>
        </div>
      </section>
      <section className="section contact">
        <span className="meta">04 / MAKE A CONNECTION</span>
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
