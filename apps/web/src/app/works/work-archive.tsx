"use client";

import { useState } from "react";
import type { Content } from "@pluto/types";
import { WorkGrid } from "@/components/work-grid";

export function WorkArchive({
  items,
  state,
}: {
  items: Content[];
  state: "ready" | "unconfigured" | "error";
}) {
  const [selected, setSelected] = useState("all");
  const categories = [
    ...new Map(
      items
        .flatMap((item) => item.categories || [])
        .map((category) => [category.id, category]),
    ).values(),
  ];
  const uncategorized = items.some((item) => !item.categories?.length);
  const filtered =
    selected === "all"
      ? items
      : selected === "unclassified"
        ? items.filter((item) => !item.categories?.length)
        : items.filter((item) =>
            item.categories?.some((category) => category.id === selected),
          );
  return (
    <>
      {categories.length > 0 && (
        <div className="work-filters" aria-label="Artwork categories">
          <button
            type="button"
            aria-pressed={selected === "all"}
            onClick={() => setSelected("all")}
          >
            All ({items.length})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected === category.id}
              onClick={() => setSelected(category.id)}
            >
              {category.name} (
              {
                items.filter((item) =>
                  item.categories?.some((entry) => entry.id === category.id),
                ).length
              }
              )
            </button>
          ))}
          {uncategorized && (
            <button
              type="button"
              aria-pressed={selected === "unclassified"}
              onClick={() => setSelected("unclassified")}
            >
              Uncategorized
            </button>
          )}
        </div>
      )}
      {selected !== "all" && (
        <p className="meta" role="status">
          {filtered.length} artworks
        </p>
      )}
      <WorkGrid items={filtered} state={state} />
    </>
  );
}
