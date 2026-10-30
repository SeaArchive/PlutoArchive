import type { Category, Content } from "@pluto/types";

export interface PublicGalleryConnection {
  url: string;
  publishableKey: string;
}

// Anonymous, read-only requests. Never attach an account session to this reader.
export async function fetchPublicWorks(
  connection: PublicGalleryConnection,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Content[]> {
  if (!connection.publishableKey.startsWith("sb_publishable_"))
    throw new Error("A publishable key is required for the public archive.");
  const origin = new URL(connection.url);
  if (origin.protocol !== "https:") throw new Error("HTTPS is required.");
  async function read<T>(table: string, query: string): Promise<T[]> {
    const response = await fetcher(
      new URL(`/rest/v1/${table}?${query}`, origin),
      {
        headers: { apikey: connection.publishableKey },
        credentials: "omit",
        cache: "no-store",
        signal,
      },
    );
    if (!response.ok) throw new Error("The public archive is unavailable.");
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid archive response.");
    return rows as T[];
  }
  const [gallery, home, categories, assignments] = await Promise.all([
    read<{
      id: string;
      title: string;
      description: string | null;
      image_path: string;
      created_at: string;
    }>(
      "gallery_items",
      "select=id,title,description,image_path,created_at&order=created_at.desc",
    ),
    read<{ artwork_id: string }>("home_artwork", "select=artwork_id&slot=eq.1"),
    read<Category>("categories", "select=id,name,slug&order=position"),
    read<{ content_id: string; category_id: string }>(
      "content_categories",
      "select=content_id,category_id",
    ),
  ]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  return gallery.map((row) => ({
    id: row.id,
    type: "artwork",
    slug: row.id,
    title: row.title,
    summary: row.description || "",
    status: "published",
    visibility: "public",
    featured: row.id === home[0]?.artwork_id,
    featured_order: 0,
    categories: assignments
      .filter((link) => link.content_id === row.id)
      .flatMap((link) =>
        byId.has(link.category_id) ? [byId.get(link.category_id)!] : [],
      ),
    thumbnail_url: new URL(
      "/storage/v1/object/public/gallery/" +
        row.image_path.split("/").map(encodeURIComponent).join("/"),
      origin,
    ).href,
    published_at: row.created_at,
  }));
}
