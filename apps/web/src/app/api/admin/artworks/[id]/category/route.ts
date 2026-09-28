import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminError, adminHeaders, adminSession } from "@/lib/admin-artworks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request, { params }: Context) {
  const session = await adminSession(request);
  if (session.error) return session.error;
  const { id } = await params;
  if (!uuid.test(id)) return adminError("작품 주소를 확인해 주세요.", 400);
  let body: unknown;
  try { body = await request.json(); } catch { return adminError("분류를 선택해 주세요.", 400); }
  const categoryId = body && typeof body === "object" && "categoryId" in body ? body.categoryId : undefined;
  if (categoryId !== null && (typeof categoryId !== "string" || !uuid.test(categoryId)))
    return adminError("분류를 선택해 주세요.", 400);
  const { data: artwork, error: readError } = await session.db!.from("gallery_items")
    .select("id").eq("id", id).maybeSingle();
  if (readError || !artwork) return adminError("해당 작품을 찾을 수 없습니다.", 404);
  if (categoryId) {
    const { data: category, error: categoryError } = await session.db!.from("categories")
      .select("id").eq("id", categoryId).maybeSingle();
    if (categoryError || !category) return adminError("해당 분류를 찾을 수 없습니다.", 404);
    const { error } = await session.db!.from("content_categories")
      .upsert({ content_id: id, category_id: categoryId }, { onConflict: "content_id,category_id" });
    if (error) return adminError("분류를 지정하지 못했습니다.", 503);
  }
  const query = session.db!.from("content_categories").delete().eq("content_id", id);
  const { error } = await (categoryId ? query.neq("category_id", categoryId) : query);
  if (error) return adminError("분류를 정리하지 못했습니다. 다시 시도해 주세요.", 503);
  revalidatePath("/works"); revalidatePath(`/works/${id}`); revalidatePath("/");
  return NextResponse.json({ id }, { headers: adminHeaders });
}
