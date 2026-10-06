import Image from "next/image";
import Link from "next/link";
import type { Content } from "@pluto/types";
export function WorkGrid({
  items,
  state,
  showSummary = true,
}: {
  items: Content[];
  state: string;
  showSummary?: boolean;
}) {
  if (!items.length)
    return (
      <div className="empty">
        <span className="meta">ARCHIVE / 00</span>
        <h3>
          {state === "error"
            ? "Artwork could not be loaded."
            : state === "unconfigured"
              ? "The archive connection is being prepared."
              : "No artwork has been published yet."}
        </h3>
        <p>
          {state === "error"
            ? "Please try again later."
            : "New work will appear here."}
        </p>
      </div>
    );
  return (
    <div className="work-grid">
      {items.map((item, i) => (
        <Link href={"/works/" + item.slug} className="work" key={item.id}>
          <div className="work-image">
            {item.thumbnail_url && (
              <Image
                src={item.thumbnail_url}
                alt={item.title}
                fill
                sizes="(max-width: 700px) 100vw, 60vw"
                priority={i === 0}
              />
            )}
          </div>
          <div className="work-caption">
            <span className="meta">
              {String(i + 1).padStart(2, "0")} / ARTWORK
            </span>
            <h3>{item.title}</h3>
            <span>↗</span>
          </div>
          {showSummary && item.summary && <p>{item.summary}</p>}
          {!!item.categories?.length && (
            <p className="meta">
              {item.categories.map((category) => category.name).join(" · ")}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
