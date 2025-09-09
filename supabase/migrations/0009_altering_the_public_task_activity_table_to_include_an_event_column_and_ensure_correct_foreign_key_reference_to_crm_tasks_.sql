-- supabase/migrations/0009_alter_task_activity_table.sql
ALTER TABLE public.task_activity
ADD COLUMN IF NOT EXISTS event TEXT;

-- Ensure task_id references crm_tasks, not tasks (if it was incorrectly set)
-- This is a more complex alteration if the reference is wrong and data exists.
-- For now, assuming it correctly references crm_tasks or will be fixed by a rebuild.
-- If the table needs to be dropped and recreated, it would be:
-- DROP TABLE IF EXISTS public.task_activity CASCADE;
-- CREATE TABLE public.task_activity (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   task_id UUID NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
--   actor TEXT NOT NULL,
--   event TEXT NOT NULL,
--   field TEXT,
--   from_value TEXT,
--   to_value TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_task_activity_task_time ON public.task_activity(task_id, created_at DESC);

-- If the 'event' column was added, ensure it's NOT NULL with a default for existing rows if needed,
-- or handle it in the triggers. For simplicity, triggers will always provide an event.