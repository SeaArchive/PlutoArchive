-- Personal Music links are independent of the public CMS and legacy gallery.
create table public.music_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null check (
    char_length(url) <= 256 and
    url ~ '^https://www[.]youtube[.]com/(watch[?]v=[A-Za-z0-9_-]{11}(&list=[A-Za-z0-9_-]{10,150})?|playlist[?]list=[A-Za-z0-9_-]{10,150})$'
  ),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (user_id, url)
);
create index music_links_user_created_idx on public.music_links(user_id, created_at, id);
alter table public.music_links enable row level security;
revoke all on public.music_links from public, anon, authenticated;
grant select, delete on public.music_links to authenticated;
grant insert (user_id, url, title) on public.music_links to authenticated;
create policy music_own_read on public.music_links for select to authenticated
  using (user_id = (select auth.uid()));
create policy music_own_create on public.music_links for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy music_own_delete on public.music_links for delete to authenticated
  using (user_id = (select auth.uid()));

-- Serialize inserts for one owner so concurrent API requests cannot exceed 50.
create function pluto_private.limit_music_links() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  if (select count(*) from public.music_links where user_id = new.user_id) >= 50 then
    raise exception 'Music link limit reached' using errcode = '23514';
  end if;
  return new;
end
$$;
revoke all on function pluto_private.limit_music_links() from public, anon, authenticated;
create trigger limit_music_links before insert on public.music_links
  for each row execute function pluto_private.limit_music_links();
