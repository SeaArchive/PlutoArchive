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
  const { data, error } = await db
    .from("gallery_items")
    .select("id,title,description,image_path,created_at")
    .order("created_at", { ascending: false });
  if (error) return { items: [], state: "error" };
  return {
    state: "ready",
    items: (data || []).map((row) => ({
      id: row.id,
      type: "artwork",
      slug: row.id,
      title: row.title,
      summary: row.description,
      status: "published",
      visibility: "public",
      featured: false,
      featured_order: 0,
      thumbnail_url: db.storage.from("gallery").getPublicUrl(row.image_path)
        .data.publicUrl,
      published_at: row.created_at,
    })),
  };
}
