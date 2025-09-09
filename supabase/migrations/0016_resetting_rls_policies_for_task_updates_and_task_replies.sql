-- DROP any existing policies (whatever their names are)
do $$
declare p text;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='task_updates' loop
    execute format('drop policy if exists %I on public.task_updates', p);
  end loop;
  for p in select policyname from pg_policies where schemaname='public' and tablename='task_replies' loop
    execute format('drop policy if exists %I on public.task_replies', p);
  end loop;
end $$;

-- Ensure RLS is ON (required by Supabase)
alter table public.task_updates  enable row level security;
alter table public.task_replies  enable row level security;

-- ✅ Permissive policies (works for anon & authenticated)
create policy updates_select_public on public.task_updates
for select using (true);

create policy updates_insert_public on public.task_updates
for insert with check (true);

create policy replies_select_public on public.task_replies
for select using (true);

create policy replies_insert_public on public.task_replies
for insert with check (true);