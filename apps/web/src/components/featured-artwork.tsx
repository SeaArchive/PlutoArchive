import Link from "next/link";
import { WorkGrid } from "./work-grid";
import type { Content } from "@pluto/types";

export function FeaturedArtwork({
  works,
  pending,
}: {
  works: { items: Content[]; state: string };
  pending?: React.ReactNode;
}) {
  const featured = works.items.filter((item) => item.featured);
  return (
    <section className="section" id="works">
      <div className="section-heading">
        <div>
          <span className="meta">01 / VISUAL EXPLORATION</span>
          <h2>
            Artwork
            <span className="count">
              {" "}
              / {pending ? "—" : String(featured.length).padStart(2, "0")}
            </span>
          </h2>
        </div>
        <Link className="text-link" href="/works">
          All artwork ↗
        </Link>
      </div>
      {pending || (
        <WorkGrid items={featured} state={works.state} showSummary={false} />
      )}
    </section>
  );
}
