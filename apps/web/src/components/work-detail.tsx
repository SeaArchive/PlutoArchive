import Image from "next/image";
import Link from "next/link";
import type { Content } from "@pluto/types";

export function WorkDetail({ work }: { work: Content }) {
  return (
    <article className="section">
      <Link className="meta" href="/works">
        ← ALL WORKS
      </Link>
      <h1 className="page-title">{work.title}</h1>
      <p className="intro">{work.summary}</p>
      {!!work.categories?.length && (
        <p className="meta">
          {work.categories.map((category) => category.name).join(" · ")}
        </p>
      )}
      {work.thumbnail_url && (
        <div className="detail-image">
          <Image
            src={work.thumbnail_url}
            alt={work.title}
            fill
            sizes="100vw"
            priority
          />
        </div>
      )}
      <p className="meta">ARTWORK / {work.published_at?.slice(0, 10)}</p>
    </article>
  );
}
