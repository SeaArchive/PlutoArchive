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
  // The database default role is 'user'; client metadata cannot assign roles.
  const { data: profile, error: readError } = await db
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) throw new Error("Could not read the Workspace profile.");
  if (!profile) {
    const { error: profileError } = await db
      .from("profiles")
      .insert({ id: user.id });
    if (profileError && profileError.code !== "23505")
      throw new Error("Could not initialize the Workspace profile.");
  }
  if (admin) {
    const { data, error } = await db.rpc("is_admin");
    if (error || data !== true) redirect("/login?reason=permission");
  }
  return { db, user };
}
