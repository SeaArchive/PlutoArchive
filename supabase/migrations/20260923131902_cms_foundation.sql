-- Additive transition: gallery_items, site_admins and storage stay untouched.
-- Requires the existing Pluto gallery/auth baseline; see docs/database.md.
create schema if not exists pluto_private;
revoke all on schema pluto_private from public, anon, authenticated;
grant usage on schema pluto_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reads protected role records without recursive profiles policies. No user-supplied ID.
create function pluto_private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select case
    when auth.uid() is null then null
    when exists (select 1 from public.site_admins where user_id = auth.uid()) then 'admin'
    else coalesce((select role from public.profiles where id = auth.uid()), 'user')
  end
$$;
revoke all on function pluto_private.current_role() from public, anon, authenticated;
grant execute on function pluto_private.current_role() to authenticated;

create function public.current_app_role() returns text
language sql stable security invoker set search_path = '' as $$
  select pluto_private.current_role()
$$;
revoke all on function public.current_app_role() from public, anon, authenticated;
grant execute on function public.current_app_role() to authenticated;

create function pluto_private.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end
$$;
revoke all on function pluto_private.touch_updated_at() from public, anon, authenticated;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  type text not null default 'image' check (type in ('image', 'video', 'audio', 'file')),
  bucket text not null check (char_length(bucket) > 0),
  path text not null check (char_length(path) > 0),
  filename text not null,
  mime_type text,
  width integer check (width > 0),
  height integer check (height > 0),
  size bigint check (size >= 0),
  alt_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);
create index media_owner_idx on public.media(owner_id);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type ~ '^[a-z][a-z0-9_]*$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 5000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'private' check (visibility in ('public', 'unlisted', 'private')),
  thumbnail_media_id uuid references public.media(id) on delete set null,
  featured boolean not null default false,
  featured_order integer not null default 0 check (featured_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  legacy_gallery_id uuid unique references public.gallery_items(id) on delete set null,
  check (status <> 'published' or published_at is not null)
);
create index contents_public_idx on public.contents(type, published_at desc)
  where status = 'published' and visibility = 'public';
create index contents_featured_idx on public.contents(featured_order, id)
  where featured and status = 'published' and visibility = 'public';
create index contents_thumbnail_idx on public.contents(thumbnail_media_id);
create index contents_creator_idx on public.contents(created_by);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  block_type text not null check (block_type ~ '^[a-z][a-z0-9_]*$'),
  schema_version integer not null default 1 check (schema_version >= 1),
  position integer not null check (position >= 0),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, position) deferrable initially immediate
);

-- All block media references must also be linked here by the future CMS writer.
create table public.content_media (
  content_id uuid not null references public.contents(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete restrict,
  primary key (content_id, media_id)
);
create index content_media_media_idx on public.content_media(media_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.content_categories (
  content_id uuid not null references public.contents(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (content_id, category_id)
);
create index content_categories_category_idx on public.content_categories(category_id);
create table public.content_tags (
  content_id uuid not null references public.contents(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (content_id, tag_id)
);
create index content_tags_tag_idx on public.content_tags(tag_id);

-- Explicit grants remove Supabase's possible default ALL grants (including TRUNCATE).
do $$
declare t text;
begin
  foreach t in array array['profiles','media','contents','content_blocks','content_media',
    'categories','tags','content_categories','content_tags'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    if t <> 'profiles' then
      execute format('grant select on public.%I to anon', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
      execute format('create policy cms_select on public.%I for select to authenticated using ((select pluto_private.current_role()) in (''editor'', ''admin''))', t);
      execute format('create policy cms_insert on public.%I for insert to authenticated with check ((select pluto_private.current_role()) in (''editor'', ''admin''))', t);
      execute format('create policy cms_update on public.%I for update to authenticated using ((select pluto_private.current_role()) in (''editor'', ''admin'')) with check ((select pluto_private.current_role()) in (''editor'', ''admin''))', t);
      execute format('create policy cms_delete on public.%I for delete to authenticated using ((select pluto_private.current_role()) in (''editor'', ''admin''))', t);
    end if;
  end loop;
  foreach t in array array['profiles','media','contents','content_blocks','categories','tags'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function pluto_private.touch_updated_at()', t);
  end loop;
end
$$;

grant select on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy profile_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select pluto_private.current_role()) = 'admin');
create policy profile_create on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and role = 'user');
create policy profile_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select pluto_private.current_role()) = 'admin')
  with check (id = (select auth.uid()) or (select pluto_private.current_role()) = 'admin');
-- Role assignment deliberately requires a trusted DB migration/operator, not editable metadata.

create policy published_content on public.contents for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and published_at <= now());
create policy published_blocks on public.content_blocks for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_id
    and c.status = 'published' and c.visibility = 'public' and c.published_at <= now()));
create policy published_media_links on public.content_media for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_id
    and c.status = 'published' and c.visibility = 'public' and c.published_at <= now()));
create policy published_media on public.media for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.thumbnail_media_id = media.id
    and c.status = 'published' and c.visibility = 'public' and c.published_at <= now())
    or exists (select 1 from public.content_media cm join public.contents c on c.id = cm.content_id
      where cm.media_id = media.id and c.status = 'published'
      and c.visibility = 'public' and c.published_at <= now()));
create policy public_categories on public.categories for select to anon, authenticated using (true);
create policy public_tags on public.tags for select to anon, authenticated using (true);
create policy published_categories on public.content_categories for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_id
    and c.status = 'published' and c.visibility = 'public' and c.published_at <= now()));
create policy published_tags on public.content_tags for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_id
    and c.status = 'published' and c.visibility = 'public' and c.published_at <= now()));

-- Copy metadata only. No storage move, bucket change, legacy UPDATE or DELETE.
insert into public.profiles(id, display_name, role)
select u.id, coalesce(a.display_name, ''), case when a.user_id is null then 'user' else 'admin' end
from auth.users u left join public.site_admins a on a.user_id = u.id;

insert into public.media(owner_id, type, bucket, path, filename, alt_text, created_at)
select created_by, 'image', 'gallery', image_path,
  regexp_replace(image_path, '^.*/', ''), title, created_at
from public.gallery_items;

insert into public.contents(id, type, slug, title, summary, status, visibility,
  thumbnail_media_id, created_by, created_at, published_at, legacy_gallery_id)
select g.id, 'artwork', g.id::text, g.title, g.description, 'published', 'public',
  m.id, g.created_by, g.created_at, g.created_at, g.id
from public.gallery_items g join public.media m on m.bucket = 'gallery' and m.path = g.image_path;

insert into public.content_media(content_id, media_id)
select id, thumbnail_media_id from public.contents where legacy_gallery_id is not null;

-- Abort the migration if any source field or path was lost.
do $$
begin
  if exists (
    select 1 from public.gallery_items g
    left join public.contents c on c.legacy_gallery_id = g.id
    left join public.media m on m.id = c.thumbnail_media_id
    where c.id is null or c.id <> g.id or c.slug <> g.id::text
      or c.title is distinct from g.title or c.summary is distinct from g.description
      or c.created_by is distinct from g.created_by or c.created_at is distinct from g.created_at
      or c.published_at is distinct from g.created_at or c.status <> 'published'
      or c.visibility <> 'public' or m.bucket is distinct from 'gallery'
      or m.path is distinct from g.image_path
  ) then raise exception 'Gallery copy verification failed'; end if;
end
$$;
