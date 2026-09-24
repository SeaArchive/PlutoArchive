import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";
import { parseMusicSource } from "@/features/workspace/music/source";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };
const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: privateHeaders });

async function currentUser() {
  const db = await sessionDb();
  if (!db) return null;
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  return { db, user: data.user };
}

function sameOrigin(request: Request) {
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  return request.headers.get("origin") === expected;
}

export async function GET() {
  const session = await currentUser();
  if (!session) return fail("로그인이 필요합니다.", 401);
  const { data, error } = await session.db
    .from("music_links")
    .select("id,url,title")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(50);
  if (error) return fail("음악 목록을 불러오지 못했습니다.", 503);
  return NextResponse.json({ entries: data }, { headers: privateHeaders });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("요청 출처를 확인할 수 없습니다.", 403);
  const session = await currentUser();
  if (!session) return fail("로그인이 필요합니다.", 401);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return fail("요청이 너무 큽니다.", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("올바른 요청을 입력해 주세요.", 400);
  }
  if (!body || typeof body !== "object")
    return fail("올바른 요청을 입력해 주세요.", 400);
  const input = body as Record<string, unknown>;
  if (typeof input.url !== "string" || typeof input.title !== "string")
    return fail("링크와 이름을 확인해 주세요.", 400);
  const source = parseMusicSource(input.url);
  const title = input.title.trim();
  if (!source || !title || title.length > 120)
    return fail("YouTube 링크와 120자 이내의 이름을 확인해 주세요.", 400);
  const { data, error } = await session.db
    .from("music_links")
    .insert({ user_id: session.user.id, url: source.url, title })
    .select("id,url,title")
    .single();
  if (error?.code === "23505") return fail("이미 저장된 링크입니다.", 409);
  if (error?.code === "23514")
    return fail("최대 50개 링크를 저장할 수 있습니다.", 409);
  if (error) return fail("음악 링크를 저장하지 못했습니다.", 503);
  return NextResponse.json(
    { entry: data },
    { status: 201, headers: privateHeaders },
  );
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail("요청 출처를 확인할 수 없습니다.", 403);
  const session = await currentUser();
  if (!session) return fail("로그인이 필요합니다.", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return fail("삭제할 항목을 확인해 주세요.", 400);
  const { data, error } = await session.db
    .from("music_links")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id");
  if (error) return fail("음악 링크를 삭제하지 못했습니다.", 503);
  if (!data.length) return fail("항목을 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true }, { headers: privateHeaders });
}
