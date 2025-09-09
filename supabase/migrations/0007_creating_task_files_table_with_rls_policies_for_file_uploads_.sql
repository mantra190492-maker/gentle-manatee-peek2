-- db/sql/011_task_files.sql
create table if not exists public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.crm_tasks(id) on delete cascade,
  name text not null,
  size_bytes bigint not null,
  url text not null,
  uploaded_at timestamptz not null default now()
);

-- Enable RLS
alter table public.task_files enable row level security;

-- Policies for task_files
create policy "Authenticated users can view task files" on public.task_files
for select to authenticated using (true); -- Relaxed for development

create policy "Authenticated users can upload task files" on public.task_files
for insert to authenticated with check (true); -- Relaxed for development

create policy "Authenticated users can delete their own task files" on public.task_files
for delete to authenticated using (true); -- Relaxed for development

create index if not exists idx_task_files_task on public.task_files(task_id, uploaded_at desc);