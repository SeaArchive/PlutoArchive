-- Layout only: app content stays in dedicated Music/Notes/Tasks tables.
create table public.workspace_layouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_type text not null check (device_type in ('desktop', 'tablet', 'mobile')),
  windows jsonb not null default '[]'::jsonb check (
    jsonb_typeof(windows) = 'array' and
    jsonb_array_length(windows) <= 4 and
    octet_length(windows::text) <= 8000
  ),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_type)
);
alter table public.workspace_layouts enable row level security;
revoke all on public.workspace_layouts from public, anon, authenticated;
grant select, insert, update, delete on public.workspace_layouts to authenticated;
create policy layout_read on public.workspace_layouts for select to authenticated
  using (user_id = (select auth.uid()));
create policy layout_create on public.workspace_layouts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy layout_update on public.workspace_layouts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy layout_delete on public.workspace_layouts for delete to authenticated
  using (user_id = (select auth.uid()));
create trigger touch_updated_at before update on public.workspace_layouts
  for each row execute function pluto_private.touch_updated_at();
