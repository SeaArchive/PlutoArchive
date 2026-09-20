# Authentication

Site sign-in uses Supabase Google PKCE, initiated by POST /auth/sign-in. The callback exchanges the one-time code server-side and redirects to the workspace. Sign-in only requests identity scopes; no Drive or YouTube scopes/tokens.

All Supabase session access is server-only. Cookies are HttpOnly, SameSite=Lax and Secure in production. Proxy refreshes authenticated-route sessions and marks responses private/no-store. There is no browser Supabase client. Server actions/API work in future milestones must use the same server boundary.

Private pages call getUser, not getSession. Admin additionally calls existing is_admin and denies errors. Existing database RLS remains the final authorization layer. Editor roles and new RLS tables are pending the versioned CMS migration.

Sign-in and sign-out verify Origin against SITE_URL. The callback destination is fixed; no arbitrary next URL is accepted. Credentials, service keys and Google refresh tokens must never be committed.

References reviewed: https://supabase.com/docs/guides/auth/server-side/creating-a-client and https://supabase.com/docs/guides/auth/server-side/advanced-guide .
