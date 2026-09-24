-- Note content is independent of future device-specific window/layout state.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 20000),
  color text not null default 'slate' check (color in ('slate', 'green', 'blue', 'amber')),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_updated_idx on public.notes(user_id, updated_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'todo' check (status in ('todo', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks(user_id, status, due_date);

do $$
declare table_name text;
begin
  foreach table_name in array array['notes', 'tasks'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, delete on public.%I to authenticated', table_name);
    execute format('create policy own_select on public.%I for select to authenticated using (user_id = (select auth.uid()))', table_name);
    execute format('create policy own_insert on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', table_name);
    execute format('create policy own_update on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', table_name);
    execute format('create policy own_delete on public.%I for delete to authenticated using (user_id = (select auth.uid()))', table_name);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function pluto_private.touch_updated_at()', table_name);
  end loop;
end $$;

grant insert (user_id, body, color, pinned) on public.notes to authenticated;
grant update (body, color, pinned) on public.notes to authenticated;
grant insert (user_id, title, status, priority, due_date) on public.tasks to authenticated;
grant update (title, status, priority, due_date) on public.tasks to authenticated;
