-- Same access rules, one SELECT policy per role/table (Supabase advisor feedback).
drop policy cms_select on public.categories;
drop policy cms_select on public.tags;

do $$
declare p record;
begin
  for p in select tablename, policyname, qual from pg_policies
    where schemaname = 'public'
      and (tablename, policyname) in (
        ('contents', 'published_content'), ('content_blocks', 'published_blocks'),
        ('content_media', 'published_media_links'), ('media', 'published_media'),
        ('content_categories', 'published_categories'), ('content_tags', 'published_tags')
      ) loop
    execute format('alter policy %I on public.%I to anon', p.policyname, p.tablename);
    execute format('alter policy cms_select on public.%I using ((select pluto_private.current_role()) in (''editor'', ''admin'') or (%s))', p.tablename, p.qual);
  end loop;
end
$$;
