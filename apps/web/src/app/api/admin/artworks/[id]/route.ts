import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminError, adminHeaders, adminSession } from "@/lib/admin-artworks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Context) {
  const session = await adminSession(request);
  if (session.error) return session.error;
  const { id } = await params;
  if (!uuid.test(id)) return adminError("작품 주소를 확인해 주세요.", 400);
  if (Number(request.headers.get("content-length")) > 12288)
    return adminError("입력 내용이 너무 깁니다.", 413);
  let body: unknown;
  try { body = await request.json(); } catch { return adminError("입력 내용을 확인해 주세요.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return adminError("입력 내용을 확인해 주세요.", 400);
  const { title, description } = body as Record<string, unknown>;
  if (typeof title !== "string" || typeof description !== "string" ||
      !title.trim() || title.trim().length > 200 || description.trim().length > 5000)
    return adminError("제목(200자)과 설명(5000자)을 확인해 주세요.", 400);
  const { data, error } = await session.db!.from("gallery_items")
    .update({ title: title.trim(), description: description.trim() })
    .eq("id", id).select("id").maybeSingle();
  if (error) return adminError("작품 정보를 수정하지 못했습니다.", 503);
  if (!data) return adminError("해당 작품을 찾을 수 없습니다.", 404);
  revalidatePath("/"); revalidatePath("/works"); revalidatePath(`/works/${id}`);
  return NextResponse.json({ id }, { headers: adminHeaders });
}

export async function DELETE(request: Request, { params }: Context) {
  const session = await adminSession(request);
  if (session.error) return session.error;
  const { id } = await params;
  if (!uuid.test(id)) return adminError("작품 주소를 확인해 주세요.", 400);
  const { data: artwork, error: readError } = await session.db!.from("gallery_items")
    .select("image_path").eq("id", id).maybeSingle();
  if (readError) return adminError("작품 정보를 불러오지 못했습니다.", 503);
  if (!artwork) return adminError("해당 작품을 찾을 수 없습니다.", 404);
  const { data, error } = await session.db!.from("gallery_items")
    .delete().eq("id", id).select("id").maybeSingle();
  if (error) return adminError("작품을 삭제하지 못했습니다.", 503);
  if (!data) return adminError("해당 작품을 찾을 수 없습니다.", 404);
  revalidatePath("/"); revalidatePath("/works"); revalidatePath(`/works/${id}`);
  // Storage is a separate service. Report any orphaned image instead of hiding failure.
  const { error: storageError } = await session.db!.storage.from("gallery")
    .remove([artwork.image_path]);
  if (storageError) console.error("Gallery image cleanup failed", id, storageError);
  return NextResponse.json({ id, imageCleanupFailed: Boolean(storageError) },
    { headers: adminHeaders });
}
