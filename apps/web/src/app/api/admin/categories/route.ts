import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminError, adminHeaders, adminSession } from "@/lib/admin-artworks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const session = await adminSession(request);
  if (session.error) return session.error;
  let body: unknown;
  try { body = await request.json(); } catch { return adminError("분류 이름을 확인해 주세요.", 400); }
  const name = body && typeof body === "object" && "name" in body ? body.name : null;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120)
    return adminError("분류 이름은 1~120자로 입력해 주세요.", 400);
  const cleanName = name.trim();
  const { data: existing, error: listError } = await session.db!.from("categories").select("name");
  if (listError) return adminError("분류를 확인하지 못했습니다.", 503);
  if (existing.some((item) => item.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase()))
    return adminError("이미 같은 이름의 분류가 있습니다.", 409);
  const { data, error } = await session.db!.from("categories").insert({
    name: cleanName, slug: `category-${crypto.randomUUID()}`,
  }).select("id").single();
  if (error) return adminError("분류를 만들지 못했습니다.", 503);
  revalidatePath("/works");
  return NextResponse.json({ id: data.id }, { status: 201, headers: adminHeaders });
}
