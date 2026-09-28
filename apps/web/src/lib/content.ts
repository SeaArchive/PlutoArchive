import "server-only";
import { publicDb } from "./supabase";
import type { Content } from "@pluto/types";
// Transitional adapter: existing gallery data remains intact until the CMS migration.
export async function getWorks(): Promise<{
  items: Content[];
  state: "ready" | "unconfigured" | "error";
}> {
  const db = publicDb();
  if (!db) return { items: [], state: "unconfigured" };
  const [gallery, home, categoryList, assignments] = await Promise.all([
    db.from("gallery_items")
      .select("id,title,description,image_path,created_at")
      .order("created_at", { ascending: false }),
    db.from("home_artwork").select("artwork_id").eq("slot", 1).maybeSingle(),
    db.from("categories").select("id,name,slug").order("position"),
    db.from("content_categories").select("content_id,category_id"),
  ]);
  if (gallery.error || home.error || categoryList.error || assignments.error)
    return { items: [], state: "error" };
  const categoriesById = new Map((categoryList.data || []).map((item) => [item.id, item]));
  const byArtwork = new Map<string, typeof categoryList.data>();
  for (const link of assignments.data || []) {
    const category = categoriesById.get(link.category_id);
    if (category) byArtwork.set(link.content_id,
      [...(byArtwork.get(link.content_id) || []), category]);
  }
  return {
    state: "ready",
    items: (gallery.data || []).map((row) => ({
      id: row.id,
      type: "artwork",
      slug: row.id,
      title: row.title,
      summary: row.description,
      status: "published",
      visibility: "public",
      featured: row.id === home.data?.artwork_id,
      featured_order: 0,
      categories: byArtwork.get(row.id) || [],
      thumbnail_url: db.storage.from("gallery").getPublicUrl(row.image_path)
        .data.publicUrl,
      published_at: row.created_at,
    })),
  };
}
