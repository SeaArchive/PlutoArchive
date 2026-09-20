import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  const code = url.searchParams.get("code");
  const db = await sessionDb();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/workspace", origin));
  }
  return NextResponse.redirect(new URL("/login?reason=callback", origin));
}
