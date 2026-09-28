import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminError, adminHeaders, adminSession } from "@/lib/admin-artworks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PUT(request: Request) {
  const session = await adminSession(request);
  if (session.error) return session.error;
  let body: unknown;
  try { body = await request.json(); } catch { return adminError("작품을 선택해 주세요.", 400); }
  const id = body && typeof body === "object" && "id" in body ? body.id : null;
  if (typeof id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
    return adminError("작품을 선택해 주세요.", 400);
  const { data: artwork, error: readError } = await session.db!.from("gallery_items")
    .select("id").eq("id", id).maybeSingle();
  if (readError || !artwork) return adminError("해당 작품을 찾을 수 없습니다.", 404);
  const { error } = await session.db!.from("home_artwork")
    .upsert({ slot: 1, artwork_id: id }, { onConflict: "slot" });
  if (error) return adminError("메인 작품을 변경하지 못했습니다.", 503);
  revalidatePath("/");
  return NextResponse.json({ id }, { headers: adminHeaders });
}
