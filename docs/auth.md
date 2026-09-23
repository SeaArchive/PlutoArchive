# Authentication

Site sign-in uses Supabase Google PKCE, initiated by POST /auth/sign-in. The callback exchanges the one-time code server-side and redirects to the workspace. Sign-in only requests identity scopes; no Drive or YouTube scopes/tokens.

All Supabase session access is server-only. Cookies are HttpOnly, SameSite=Lax and Secure in production. Proxy refreshes authenticated-route sessions and marks responses private/no-store. There is no browser Supabase client. Server actions/API work in future milestones must use the same server boundary.

Private pages call getUser, not getSession. Admin additionally calls existing is_admin and denies errors. Existing database RLS remains the final authorization layer. Database editor/admin roles and CMS RLS are now implemented; the server editor-role guard is still pending.

Sign-in and sign-out verify Origin against SITE_URL. The callback destination is fixed; no arbitrary next URL is accepted. Credentials, service keys and Google refresh tokens must never be committed.

References reviewed: https://supabase.com/docs/guides/auth/server-side/creating-a-client and https://supabase.com/docs/guides/auth/server-side/advanced-guide .

## Database roles — 2026-09-23

`public.current_app_role()` resolves the current authenticated identity against the legacy administrator table and trusted profiles. Clients cannot insert/update the role column. No authorization uses user metadata. New-user profile initialization and editor routing remain application follow-ups; the existing `requireUser(true)` behavior is unchanged. See `database.md` for exact grants and security tests.
