import { NextResponse } from "next/server";
import { sessionDb } from "@/lib/supabase";
export async function POST(request: Request) {
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  if (request.headers.get("origin") !== origin)
    return new Response("Forbidden", { status: 403 });
  const db = await sessionDb();
  if (!db)
    return NextResponse.redirect(
      new URL("/login?reason=configuration", origin),
      303,
    );
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: origin + "/auth/callback",
      scopes: "openid email profile",
    },
  });
  return NextResponse.redirect(
    error || !data.url ? new URL("/login?reason=provider", origin) : data.url,
    303,
  );
}
