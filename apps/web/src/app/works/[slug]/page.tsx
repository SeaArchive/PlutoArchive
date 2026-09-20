import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getWorks } from "@/lib/content";
export const revalidate = 60;
export default async function Work({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { items, state } = await getWorks();
  if (state === "error") throw new Error("Archive unavailable");
  const work = items.find((w) => w.slug === slug);
  if (!work) notFound();
  return (
    <PublicShell>
      <article className="section">
        <Link className="meta" href="/works">
          ← ALL WORKS
        </Link>
        <h1 className="page-title">{work.title}</h1>
        <p className="intro">{work.summary}</p>
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
    </PublicShell>
  );
}
