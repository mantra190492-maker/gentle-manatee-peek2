-- Activity table
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.crm_tasks(id) ON DELETE CASCADE,
  field text not null default 'comment',  -- 'status','assignee','priority','due_date','text','file','title','group','created', etc.
  action text not null default 'set',     -- 'set' | 'update' | 'add' | 'remove' | 'create'
  old_value jsonb,
  new_value jsonb,
  message text,                           -- for comments/notes (emoji OK)
  actor uuid references auth.users(id) ON DELETE SET NULL, -- user id
  created_at timestamptz not null default now()
);

create index if not exists idx_task_activity_task_time on public.task_activity(task_id, created_at desc);

-- Safety: ensure default for 'field'
update public.task_activity set field = 'comment' where field is null;
alter table public.task_activity alter column field set default 'comment';

-- Enable RLS (REQUIRED)
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

-- Policies for task_activity
CREATE POLICY "Authenticated users can view their own task activity" ON public.task_activity
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.crm_tasks WHERE crm_tasks.id = task_activity.task_id AND crm_tasks.user_id = auth.uid()));

CREATE POLICY "Authenticated users can insert their own task activity" ON public.task_activity
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.crm_tasks WHERE crm_tasks.id = task_activity.task_id AND crm_tasks.user_id = auth.uid()));

-- Optional: Allow admins to view all activity (if an is_admin() function exists)
-- CREATE POLICY "Admins can view all task activity" ON public.task_activity
-- FOR SELECT TO authenticated USING (is_admin());