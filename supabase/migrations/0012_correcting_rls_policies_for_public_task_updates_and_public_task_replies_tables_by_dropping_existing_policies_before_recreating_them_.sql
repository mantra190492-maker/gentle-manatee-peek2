-- supabase/migrations/0014_updates_policies.sql
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view task updates" ON public.task_updates;
DROP POLICY IF EXISTS "Authenticated users can create task updates" ON public.task_updates;
DROP POLICY IF EXISTS "Authenticated users can view task replies" ON public.task_replies;
DROP POLICY IF EXISTS "Authenticated users can create task replies" ON public.task_replies;

-- Allow authenticated users to read task updates
CREATE POLICY "Authenticated users can view task updates" ON public.task_updates
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create task updates
CREATE POLICY "Authenticated users can create task updates" ON public.task_updates
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to view task replies
CREATE POLICY "Authenticated users can view task replies" ON public.task_replies
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create task replies
CREATE POLICY "Authenticated users can create task replies" ON public.task_replies
FOR INSERT TO authenticated WITH CHECK (true);