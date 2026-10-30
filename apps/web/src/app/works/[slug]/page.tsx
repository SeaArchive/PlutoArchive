import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { getWorks } from "@/lib/content";
import { WorkDetail } from "@/components/work-detail";
export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { items } = await getWorks();
  const work = items.find((item) => item.slug === slug);
  if (!work) return {};
  return {
    title: work.title,
    description:
      work.summary || `${work.title} — Artwork published on Pluto Archive.`,
  };
}
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
      <WorkDetail work={work} />
    </PublicShell>
  );
}
