-- db/sql/012_activity_log.sql
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.crm_tasks(id) on delete cascade,
  actor text not null,
  field text not null,   -- e.g., 'status','priority','date'
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.task_activity enable row level security;

-- Policies for task_activity
create policy "Authenticated users can view task activity" on public.task_activity
for select to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can create task activity" on public.task_activity
for insert to authenticated with check (true); -- Relaxed for development

create index if not exists idx_task_activity_task on public.task_activity(task_id, created_at desc);