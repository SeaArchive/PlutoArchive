import "server-only";
import { redirect } from "next/navigation";
import { sessionDb } from "./supabase";
export async function requireUser(admin = false) {
  const db = await sessionDb();
  if (!db) redirect("/login?reason=configuration");
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (admin) {
    const { data, error } = await db.rpc("is_admin");
    if (error || data !== true) redirect("/login?reason=permission");
  }
  return { db, user };
}
