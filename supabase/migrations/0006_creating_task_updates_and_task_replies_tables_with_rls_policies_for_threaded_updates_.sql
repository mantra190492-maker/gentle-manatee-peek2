-- db/sql/010_updates.sql
create table if not exists public.task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.crm_tasks(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.task_updates enable row level security;

-- Policies for task_updates
create policy "Authenticated users can view task updates" on public.task_updates
for select to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can create task updates" on public.task_updates
for insert to authenticated with check (true); -- Relaxed for development

create policy "Authenticated users can update their own task updates" on public.task_updates
for update to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can delete their own task updates" on public.task_updates
for delete to authenticated using (true); -- Relaxed for development


create table if not exists public.task_replies (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.task_updates(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.task_replies enable row level security;

-- Policies for task_replies
create policy "Authenticated users can view task replies" on public.task_replies
for select to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can create task replies" on public.task_replies
for insert to authenticated with check (true); -- Relaxed for development

create policy "Authenticated users can update their own task replies" on public.task_replies
for update to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can delete their own task replies" on public.task_replies
for delete to authenticated using (true); -- Relaxed for development


create index if not exists idx_updates_task on public.task_updates(task_id, created_at desc);
create index if not exists idx_replies_update on public.task_replies(update_id, created_at asc);