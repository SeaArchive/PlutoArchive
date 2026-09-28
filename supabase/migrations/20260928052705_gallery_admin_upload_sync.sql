-- Preserve the public gallery reader while keeping new Admin uploads in the CMS model.
-- The legacy RLS policies already restrict writes to site_admins members.
revoke all on public.gallery_items from public, anon, authenticated;
grant select on public.gallery_items to anon;
grant select, insert, update, delete on public.gallery_items to authenticated;

create function pluto_private.mirror_gallery_insert() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare new_media_id uuid;
begin
  insert into public.media(owner_id, type, bucket, path, filename, alt_text, created_at)
  values (new.created_by, 'image', 'gallery', new.image_path,
    regexp_replace(new.image_path, '^.*/', ''), new.title, new.created_at)
  returning id into new_media_id;

  insert into public.contents(id, type, slug, title, summary, status, visibility,
    thumbnail_media_id, created_by, created_at, published_at, legacy_gallery_id)
  values (new.id, 'artwork', new.id::text, new.title, new.description,
    'published', 'public', new_media_id, new.created_by, new.created_at,
    new.created_at, new.id);

  insert into public.content_media(content_id, media_id)
  values (new.id, new_media_id);
  return new;
end
$$;
revoke all on function pluto_private.mirror_gallery_insert() from public, anon, authenticated;
create trigger mirror_gallery_insert after insert on public.gallery_items
for each row execute function pluto_private.mirror_gallery_insert();
