-- Table (if not already)
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.crm_tasks(id) ON DELETE CASCADE,
  field text not null default 'comment',
  action text not null default 'set',
  old_value jsonb,
  new_value jsonb,
  message text,
  actor uuid references auth.users(id) ON DELETE SET NULL,
  created_at timestamptz not null default now()
);

-- Index
create index if not exists idx_task_activity_task_time
  on public.task_activity(task_id, created_at desc);

-- Safety default
update public.task_activity set field = 'comment' where field is null;
alter table public.task_activity alter column field set default 'comment';

-- Enable Row Level Security
alter table public.task_activity enable row level security;

-- Simple permissive policies for now (adjust later to scope by project/org)
drop policy if exists task_activity_select on public.task_activity;
drop policy if exists task_activity_insert on public.task_activity;

create policy task_activity_select
on public.task_activity for select
to authenticated
using ( true );

create policy task_activity_insert
on public.task_activity for insert
to authenticated
with check ( true );