-- Execute as the project SQL owner. Test inserts are rolled back; no Auth/Storage writes.
begin;
set local role anon;
select set_config('pluto_test.public_count', (select count(*)::text from public.contents), true);
reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.site_admins limit 1), true);
set local role authenticated;
do $$
begin
  if public.current_app_role() <> 'admin' then raise exception 'Legacy administrator role lost'; end if;
  perform set_config('pluto_test.draft_id', gen_random_uuid()::text, true);
  insert into public.contents(id, type, slug, title)
    values (current_setting('pluto_test.draft_id')::uuid, 'artwork',
      'rls-smoke-' || current_setting('pluto_test.draft_id'), 'Rollback-only RLS check');
  insert into public.content_blocks(content_id, block_type, position)
    values (current_setting('pluto_test.draft_id')::uuid, 'text', 0);
end
$$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  if (select count(*) from public.contents) <> current_setting('pluto_test.public_count')::bigint
    then raise exception 'Draft leaked to public'; end if;
  if exists (select 1 from public.content_blocks where content_id = current_setting('pluto_test.draft_id')::uuid)
    then raise exception 'Draft blocks leaked'; end if;
  begin
    insert into public.contents(type, slug, title) values ('artwork', 'must-fail', 'Must fail');
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.profiles;
    raise exception 'Profiles leaked';
  exception when insufficient_privilege then null; end;
end
$$;
reset role;
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where role = 'user' limit 1), true);
set local role authenticated;
do $$
begin
  if public.current_app_role() is distinct from 'user' then raise exception 'Missing ordinary-user test identity'; end if;
  if exists (select 1 from public.contents where id = current_setting('pluto_test.draft_id')::uuid)
    then raise exception 'Draft leaked to user'; end if;
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'Self promotion allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.contents(type, slug, title) values ('artwork', 'must-fail', 'Must fail');
    raise exception 'Ordinary user write allowed';
  exception when insufficient_privilege then null; end;
end
$$;
rollback;
select 'CMS live RLS smoke passed; all test writes rolled back' as result;
