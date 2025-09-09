-- allow anyone (anon + authenticated) to read/insert/update during development
alter table public.crm_tasks enable row level security;

drop policy if exists crm_tasks_select_dev on public.crm_tasks;
drop policy if exists crm_tasks_insert_dev on public.crm_tasks;
drop policy if exists crm_tasks_update_dev on public.crm_tasks;

create policy crm_tasks_select_dev
on public.crm_tasks for select
to anon, authenticated
using (true);

create policy crm_tasks_insert_dev
on public.crm_tasks for insert
to anon, authenticated
with check (true);

create policy crm_tasks_update_dev
on public.crm_tasks for update
to anon, authenticated
using (true);

-- refresh PostgREST cache so policies take effect immediately
notify pgrst, 'reload schema';