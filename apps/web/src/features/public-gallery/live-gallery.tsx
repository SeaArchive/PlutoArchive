"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Content } from "@pluto/types";
import connection from "@/config/public-gallery-connection.json";
import { fetchPublicWorks } from "@/lib/public-gallery";
import { FeaturedArtwork as FeaturedLayout } from "@/components/featured-artwork";
import { WorkArchive } from "@/app/works/work-archive";
import { WorkDetail } from "@/components/work-detail";

function usePublicWorks() {
  const [items, setItems] = useState<Content[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setState("loading");
    fetchPublicWorks(connection, controller.signal)
      .then((next) => {
        if (!active) return;
        setItems(next);
        setState("ready");
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setState("error");
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { items, state, retry: () => setAttempt((value) => value + 1) };
}

export function ArchiveStatus({
  state,
  retry,
}: {
  state: string;
  retry?: () => void;
}) {
  return (
    <div className="empty" role={state === "error" ? "alert" : "status"}>
      <p>
        {state === "error"
          ? "Artwork could not be loaded."
          : "Loading artwork…"}
      </p>
      {retry && state === "error" && (
        <button type="button" className="text-link" onClick={retry}>
          Try again ↗
        </button>
      )}
      <noscript>
        <p>Enable JavaScript to view the current artwork archive.</p>
      </noscript>
    </div>
  );
}

export function LiveFeatured(_props: { works?: unknown }) {
  const works = usePublicWorks();
  return (
    <FeaturedLayout
      works={works}
      pending={
        works.state !== "ready" ? <ArchiveStatus {...works} /> : undefined
      }
    />
  );
}

export function LiveArchive(_props: { items?: Content[]; state?: string }) {
  const works = usePublicWorks();
  return works.state === "ready" ? (
    <WorkArchive items={works.items} state="ready" />
  ) : (
    <ArchiveStatus {...works} />
  );
}

export function LiveWorkDetail({ slug }: { slug?: string }) {
  const search = useSearchParams();
  const id = slug || search.get("id");
  const works = usePublicWorks();
  const work = works.items.find((item) => item.slug === id);
  useEffect(() => {
    if (work) document.title = `${work.title} | Pluto Archive`;
  }, [work]);
  if (works.state !== "ready")
    return (
      <section className="section">
        <ArchiveStatus {...works} />
      </section>
    );
  if (!work)
    return (
      <section className="section">
        <h1 className="page-title">Artwork not found.</h1>
        <p>This artwork is no longer available.</p>
        <a
          className="text-link"
          href={
            process.env.NEXT_PUBLIC_STATIC_PUBLIC === "true"
              ? "/PlutoArchive/works/"
              : "/works"
          }
        >
          ← ALL WORKS
        </a>
      </section>
    );
  return <WorkDetail work={work} />;
}
