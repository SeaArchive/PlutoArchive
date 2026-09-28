import { NextResponse, type NextRequest } from "next/server";
import { sessionDb } from "@/lib/supabase";
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  const code = url.searchParams.get("code");
  const db = await sessionDb();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(
        new URL(
          request.cookies.get("pluto_next")?.value === "admin"
            ? "/admin"
            : "/workspace",
          origin,
        ),
      );
      response.cookies.set("pluto_next", "", {
        path: "/auth/callback",
        maxAge: 0,
      });
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?reason=callback", origin));
}
