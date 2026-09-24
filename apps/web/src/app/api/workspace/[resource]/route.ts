import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";
type Resource = "notes" | "tasks";
type Context = { params: Promise<{ resource: string }> };
const headers = { "Cache-Control": "private, no-store" };
const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers });
const validResource = (name: string): name is Resource =>
  name === "notes" || name === "tasks";
const validId = (id: string | null) =>
  Boolean(id && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id));

async function access(request: Request, write = false) {
  if (
    write &&
    request.headers.get("origin") !==
      new URL(process.env.SITE_URL || request.url).origin
  )
    return { failure: errorResponse("요청 출처를 확인할 수 없습니다.", 403) };
  const db = await sessionDb();
  if (!db) return { failure: errorResponse("서버 설정이 필요합니다.", 503) };
  const { data, error } = await db.auth.getUser();
  if (error || !data.user)
    return { failure: errorResponse("로그인이 필요합니다.", 401) };
  return { db, user: data.user };
}

async function payload(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await request.text();
    if (raw.length > 22000) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function fields(
  resource: Resource,
  value: Record<string, unknown>,
  creating: boolean,
) {
  const result: Record<string, string | boolean | null> = {};
  if (resource === "notes") {
    if ("body" in value) {
      if (typeof value.body !== "string" || value.body.length > 20000)
        return null;
      result.body = value.body;
    }
    if ("color" in value) {
      if (!["slate", "green", "blue", "amber"].includes(value.color as string))
        return null;
      result.color = value.color as string;
    }
    if ("pinned" in value) {
      if (typeof value.pinned !== "boolean") return null;
      result.pinned = value.pinned;
    }
  } else {
    if ("title" in value) {
      if (
        typeof value.title !== "string" ||
        !value.title.trim() ||
        value.title.length > 200
      )
        return null;
      result.title = value.title.trim();
    }
    if ("status" in value) {
      if (value.status !== "todo" && value.status !== "done") return null;
      result.status = value.status;
    }
    if ("priority" in value) {
      if (!["low", "normal", "high"].includes(value.priority as string))
        return null;
      result.priority = value.priority as string;
    }
    if ("due_date" in value) {
      if (
        value.due_date !== null &&
        (typeof value.due_date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value.due_date) ||
          Number.isNaN(Date.parse(value.due_date)) ||
          new Date(value.due_date).toISOString().slice(0, 10) !==
            value.due_date)
      )
        return null;
      result.due_date = value.due_date;
    }
  }
  if (creating && resource === "tasks" && !result.title) return null;
  if (!creating && !Object.keys(result).length) return null;
  return result;
}

export async function GET(request: Request, context: Context) {
  const { resource } = await context.params;
  if (!validResource(resource))
    return errorResponse("알 수 없는 앱입니다.", 404);
  const session = await access(request);
  if (session.failure) return session.failure;
  const { data, error } = await session
    .db!.from(resource)
    .select("*")
    .eq("user_id", session.user!.id)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) return errorResponse("목록을 불러오지 못했습니다.", 503);
  return NextResponse.json({ items: data }, { headers });
}

export async function POST(request: Request, context: Context) {
  const { resource } = await context.params;
  if (!validResource(resource))
    return errorResponse("알 수 없는 앱입니다.", 404);
  const session = await access(request, true);
  if (session.failure) return session.failure;
  const value = await payload(request);
  const safe = value && fields(resource, value, true);
  if (!safe) return errorResponse("입력 내용을 확인해 주세요.", 400);
  const { data, error } = await session
    .db!.from(resource)
    .insert({ ...safe, user_id: session.user!.id })
    .select("*")
    .single();
  if (error) return errorResponse("저장하지 못했습니다.", 503);
  return NextResponse.json({ item: data }, { status: 201, headers });
}

export async function PATCH(request: Request, context: Context) {
  const { resource } = await context.params;
  if (!validResource(resource))
    return errorResponse("알 수 없는 앱입니다.", 404);
  const session = await access(request, true);
  if (session.failure) return session.failure;
  const id = new URL(request.url).searchParams.get("id");
  if (!validId(id)) return errorResponse("항목을 확인해 주세요.", 400);
  const value = await payload(request);
  const safe = value && fields(resource, value, false);
  if (!safe) return errorResponse("입력 내용을 확인해 주세요.", 400);
  const { data, error } = await session
    .db!.from(resource)
    .update(safe)
    .eq("id", id!)
    .eq("user_id", session.user!.id)
    .select("*")
    .maybeSingle();
  if (error) return errorResponse("수정하지 못했습니다.", 503);
  if (!data) return errorResponse("항목을 찾을 수 없습니다.", 404);
  return NextResponse.json({ item: data }, { headers });
}

export async function DELETE(request: Request, context: Context) {
  const { resource } = await context.params;
  if (!validResource(resource))
    return errorResponse("알 수 없는 앱입니다.", 404);
  const session = await access(request, true);
  if (session.failure) return session.failure;
  const id = new URL(request.url).searchParams.get("id");
  if (!validId(id)) return errorResponse("항목을 확인해 주세요.", 400);
  const { data, error } = await session
    .db!.from(resource)
    .delete()
    .eq("id", id!)
    .eq("user_id", session.user!.id)
    .select("id");
  if (error) return errorResponse("삭제하지 못했습니다.", 503);
  if (!data.length) return errorResponse("항목을 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true }, { headers });
}
