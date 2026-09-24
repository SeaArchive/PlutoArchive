import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";
import { parseWindows, type Device } from "@/features/workspace/layout";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers });
const isDevice = (value: unknown): value is Device =>
  value === "desktop" || value === "tablet" || value === "mobile";

async function authenticated() {
  const db = await sessionDb();
  if (!db) return null;
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  return { db, user: data.user };
}

export async function GET(request: Request) {
  const device = new URL(request.url).searchParams.get("device");
  if (!isDevice(device)) return fail("기기 종류를 확인해 주세요.", 400);
  const session = await authenticated();
  if (!session) return fail("로그인이 필요합니다.", 401);
  const { data, error } = await session.db
    .from("workspace_layouts")
    .select("windows")
    .eq("user_id", session.user.id)
    .eq("device_type", device)
    .maybeSingle();
  if (error) return fail("창 배치를 불러오지 못했습니다.", 503);
  const windows = data ? parseWindows(data.windows) : null;
  if (data && !windows) return fail("저장된 창 배치가 올바르지 않습니다.", 503);
  // null means first visit; an empty array means the user closed every app.
  return NextResponse.json({ windows }, { headers });
}

export async function PUT(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.SITE_URL || request.url).origin
  )
    return fail("요청 출처를 확인할 수 없습니다.", 403);
  const session = await authenticated();
  if (!session) return fail("로그인이 필요합니다.", 401);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return fail("창 배치가 너무 큽니다.", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("창 배치를 확인해 주세요.", 400);
  }
  if (!body || typeof body !== "object")
    return fail("창 배치를 확인해 주세요.", 400);
  const input = body as Record<string, unknown>;
  if (!isDevice(input.device) || !Array.isArray(input.windows))
    return fail("창 배치를 확인해 주세요.", 400);
  const windows = parseWindows(input.windows);
  if (!windows) return fail("창 배치를 확인해 주세요.", 400);
  const { error } = await session.db
    .from("workspace_layouts")
    .upsert(
      { user_id: session.user.id, device_type: input.device, windows },
      { onConflict: "user_id,device_type" },
    );
  if (error) return fail("창 배치를 저장하지 못했습니다.", 503);
  return NextResponse.json({ ok: true }, { headers });
}
