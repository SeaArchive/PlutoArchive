import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";
export async function POST(request: Request) {
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  if (request.headers.get("origin") !== origin)
    return new Response("Forbidden", { status: 403 });
  const db = await sessionDb();
  await db?.auth.signOut();
  return NextResponse.redirect(new URL("/", origin), 303);
}
