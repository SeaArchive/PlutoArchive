import Image from "next/image";
import Link from "next/link";
import type { Content } from "@pluto/types";
export function WorkGrid({
  items,
  state,
}: {
  items: Content[];
  state: string;
}) {
  if (!items.length)
    return (
      <div className="empty">
        <span className="meta">ARCHIVE / 00</span>
        <h3>
          {state === "error"
            ? "작품을 불러오지 못했습니다."
            : state === "unconfigured"
              ? "아카이브 연결을 준비하고 있습니다."
              : "아직 공개된 작품이 없습니다."}
        </h3>
        <p>
          {state === "error"
            ? "잠시 후 다시 방문해 주세요."
            : "새로운 기록이 이곳에 모입니다."}
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
          {item.summary && <p>{item.summary}</p>}
        </Link>
      ))}
    </div>
  );
}
