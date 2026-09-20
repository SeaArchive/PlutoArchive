export type Role = "user" | "editor" | "admin";
export type ContentStatus = "draft" | "published" | "archived";
export type Visibility = "public" | "unlisted" | "private";
export const blockTypes = [
  "heading",
  "text",
  "quote",
  "divider",
  "spacer",
  "image",
  "gallery",
  "video",
  "hero",
  "process",
  "before_after",
  "metrics",
  "code",
  "tech_stack",
] as const;
export type BlockType = (typeof blockTypes)[number];
export interface Block {
  id: string;
  type: BlockType;
  schemaVersion: 1;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
  position: number;
}
export interface Content {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary: string;
  status: ContentStatus;
  visibility: Visibility;
  featured: boolean;
  featured_order: number;
  thumbnail_url: string | null;
  published_at: string | null;
  blocks?: Block[];
}
export interface Category {
  id: string;
  name: string;
  slug: string;
}
