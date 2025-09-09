-- Drop table if it exists to ensure a clean slate for column definitions
DROP TABLE IF EXISTS public.crm_tasks CASCADE;

-- Table
create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- owner (set by trigger), now with foreign key
  task text not null default '',
  status text not null default 'Not Started',
  date date,
  priority text,
  notes text,
  extra text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists crm_tasks_user_id_idx   on public.crm_tasks (user_id);
create index if not exists crm_tasks_created_idx   on public.crm_tasks (created_at desc);
create index if not exists crm_tasks_status_idx    on public.crm_tasks (status);
create index if not exists crm_tasks_priority_idx  on public.crm_tasks (priority);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_crm_tasks_updated_at on public.crm_tasks;
create trigger trg_crm_tasks_updated_at
before update on public.crm_tasks
for each row execute function public.set_updated_at();

-- set_owner trigger (assigns auth.uid() if user_id empty)
create or replace function public.set_owner()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists trg_crm_tasks_set_owner on public.crm_tasks;
create trigger trg_crm_tasks_set_owner
before insert on public.crm_tasks
for each row execute function public.set_owner();

-- Enable RLS and apply per-user policies
alter table public.crm_tasks enable row level security;

drop policy if exists crm_tasks_select_own on public.crm_tasks;
drop policy if exists crm_tasks_insert_own on public.crm_tasks;
drop policy if exists crm_tasks_update_own on public.crm_tasks;

create policy crm_tasks_select_own on public.crm_tasks
for select to authenticated
using (user_id = auth.uid());

create policy crm_tasks_insert_own on public.crm_tasks
for insert to authenticated
with check (coalesce(user_id, auth.uid()) = auth.uid());

create policy crm_tasks_update_own on public.crm_tasks
for update to authenticated
using (user_id = auth.uid());

-- IMPORTANT: refresh PostgREST schema cache
notify pgrst, 'reload schema';