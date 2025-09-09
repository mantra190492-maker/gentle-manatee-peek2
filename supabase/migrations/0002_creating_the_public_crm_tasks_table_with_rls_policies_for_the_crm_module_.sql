CREATE TABLE public.crm_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task TEXT DEFAULT '',
  status TEXT DEFAULT 'Not Started',
  date DATE,
  priority TEXT,
  notes TEXT,
  extra JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view crm_tasks" ON public.crm_tasks
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert crm_tasks" ON public.crm_tasks
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update crm_tasks" ON public.crm_tasks
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete crm_tasks" ON public.crm_tasks
FOR DELETE TO authenticated USING (true);