import "server-only";
import { NextResponse } from "next/server";
import { sessionDb } from "./supabase";

export const adminHeaders = { "Cache-Control": "private, no-store" };
export function adminError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: adminHeaders });
}
export async function adminSession(request: Request) {
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  if (request.headers.get("origin") !== expected)
    return { error: adminError("요청 출처를 확인할 수 없습니다.", 403) };
  const db = await sessionDb();
  if (!db) return { error: adminError("서버 연결 설정이 필요합니다.", 503) };
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return { error: adminError("로그인이 필요합니다.", 401) };
  const { data: isAdmin, error: adminFailure } = await db.rpc("is_admin");
  if (adminFailure || isAdmin !== true)
    return { error: adminError("관리자 권한이 필요합니다.", 403) };
  return { db, user: auth.user };
}
