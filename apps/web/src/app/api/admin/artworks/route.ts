import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFileBytes = 6 * 1024 * 1024;
const maxRequestBytes = maxFileBytes + 20 * 1024;
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers });

function imageExtension(bytes: Uint8Array): string | null {
  const starts = (...magic: number[]) =>
    magic.every((part, index) => bytes[index] === part);
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (
    Buffer.from(bytes.subarray(0, 6))
      .toString("ascii")
      .match(/^GIF8[79]a$/)
  )
    return "gif";
  if (
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  )
    return "webp";
  return null;
}

async function limitedForm(request: Request): Promise<FormData | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxRequestBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data;")) return null;
    return await new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body: Buffer.concat(chunks),
    }).formData();
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  if (request.headers.get("origin") !== expected)
    return fail("요청 출처를 확인할 수 없습니다.", 403);
  if (Number(request.headers.get("content-length")) > maxRequestBytes)
    return fail("이미지는 6MB 이하로 올려주세요.", 413);

  const db = await sessionDb();
  if (!db) return fail("서버 연결 설정이 필요합니다.", 503);
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) return fail("로그인이 필요합니다.", 401);
  const { data: admin, error: adminError } = await db.rpc("is_admin");
  if (adminError || admin !== true)
    return fail("관리자 권한이 필요합니다.", 403);

  const form = await limitedForm(request);
  if (!form) return fail("이미지는 6MB 이하의 파일로 선택해 주세요.", 413);
  const title = form.get("title");
  const description = form.get("description");
  const image = form.get("image");
  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !(image instanceof File)
  )
    return fail("입력 항목을 확인해 주세요.", 400);
  const safeTitle = title.trim();
  const safeDescription = description.trim();
  if (
    !safeTitle ||
    safeTitle.length > 200 ||
    safeDescription.length > 5000 ||
    !image.size ||
    image.size > maxFileBytes
  )
    return fail("제목(200자), 설명(5000자), 이미지 크기를 확인해 주세요.", 400);

  const bytes = new Uint8Array(await image.arrayBuffer());
  const ext = imageExtension(bytes);
  const mime: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  if (!ext || image.type !== mime[ext])
    return fail("JPG, PNG, GIF, WebP 이미지만 올릴 수 있습니다.", 400);

  const id = crypto.randomUUID();
  const path = `${auth.user.id}/${id}.${ext}`;
  const bucket = db.storage.from("gallery");
  const { error: uploadError } = await bucket.upload(path, bytes, {
    contentType: mime[ext],
    upsert: false,
    cacheControl: "3600",
  });
  if (uploadError) return fail("이미지를 저장하지 못했습니다.", 503);

  // The database trigger writes gallery + CMS metadata in one transaction.
  const { error: rowError } = await db.from("gallery_items").insert({
    id,
    title: safeTitle,
    description: safeDescription,
    image_path: path,
    created_by: auth.user.id,
  });
  if (rowError) {
    const { error: cleanupError } = await bucket.remove([path]);
    if (cleanupError)
      console.error("Admin upload cleanup failed", cleanupError);
    return fail("작품 정보를 저장하지 못했습니다. 다시 시도해 주세요.", 503);
  }
  return NextResponse.json({ id }, { status: 201, headers });
}
