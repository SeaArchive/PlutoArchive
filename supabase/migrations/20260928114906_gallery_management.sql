-- Keep one public home selection and the legacy gallery/CMS metadata in sync.
create table public.home_artwork (
  slot integer primary key default 1 check (slot = 1),
  artwork_id uuid references public.gallery_items(id) on delete set null
);
insert into public.home_artwork(slot, artwork_id)
select 1, id from public.gallery_items
order by (id = 'ba5758d2-8114-410b-aad0-17c4e9857444') desc, created_at desc
limit 1;
alter table public.home_artwork enable row level security;
revoke all on public.home_artwork from public, anon, authenticated;
grant select on public.home_artwork to anon;
grant select, insert, update on public.home_artwork to authenticated;
create policy home_public_read on public.home_artwork for select to anon, authenticated using (true);
create policy home_admin_insert on public.home_artwork for insert to authenticated
  with check (public.is_admin());
create policy home_admin_update on public.home_artwork for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Legacy admins may edit old works too; the trigger protects immutable ownership and image paths.
drop policy "owner can update gallery items" on public.gallery_items;
create policy gallery_admin_metadata_update on public.gallery_items for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create function pluto_private.sync_gallery_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.created_by is distinct from old.created_by
       or new.image_path is distinct from old.image_path
       or new.created_at is distinct from old.created_at then
      raise exception 'Gallery identity and image are immutable';
    end if;
    update public.contents set title = new.title, summary = new.description
      where legacy_gallery_id = old.id;
    update public.media set alt_text = new.title
      where bucket = 'gallery' and path = old.image_path;
    return new;
  end if;
  -- Delete the mirrored CMS row before its legacy foreign key is set to null.
  delete from public.contents where legacy_gallery_id = old.id;
  delete from public.media m where m.bucket = 'gallery' and m.path = old.image_path
    and not exists (select 1 from public.content_media cm where cm.media_id = m.id)
    and not exists (select 1 from public.contents c where c.thumbnail_media_id = m.id);
  return old;
end
$$;
revoke all on function pluto_private.sync_gallery_change() from public, anon, authenticated;
create trigger sync_gallery_metadata before update of title, description, image_path, created_by, created_at
on public.gallery_items for each row execute function pluto_private.sync_gallery_change();
create trigger cleanup_gallery_metadata before delete on public.gallery_items
for each row execute function pluto_private.sync_gallery_change();
