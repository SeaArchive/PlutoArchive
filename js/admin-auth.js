import { supabase } from "./supabase-client.js";

export async function signInOwner(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { ok: false, reason: "invalid_credentials", error };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    await supabase.auth.signOut();
    return { ok: false, reason: "not_admin", error: adminError };
  }

  return { ok: true, session: data.session, user: data.user };
}

export async function getOwnerSession() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { authenticated: false, admin: false, user: null };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    return { authenticated: true, admin: false, user: userData.user };
  }

  return { authenticated: true, admin: true, user: userData.user };
}

export async function requireOwner(redirectPath = "login.html") {
  const state = await getOwnerSession();

  if (!state.admin) {
    const next = encodeURIComponent(window.location.href);
    window.location.href = `${redirectPath}?next=${next}`;
    return null;
  }

  return state;
}

export async function signOutOwner() {
  await supabase.auth.signOut();
}

export { supabase };
