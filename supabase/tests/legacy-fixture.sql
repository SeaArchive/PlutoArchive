-- Disposable test-only baseline. Never apply this fixture to a real project.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Reproduce Supabase's permissive legacy default grants to test explicit revocation.
alter default privileges in schema public grant all on tables to anon, authenticated;
create table public.site_admins (
  user_id uuid primary key references auth.users(id),
  display_name text not null default 'OWNER',
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
create policy own_admin on public.site_admins for select to authenticated using (user_id = auth.uid());
create function public.is_admin() returns boolean language sql stable set search_path = public as $$
  select exists (select 1 from public.site_admins where user_id = auth.uid())
$$;
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;
create policy gallery_public on public.gallery_items for select to anon, authenticated using (true);
