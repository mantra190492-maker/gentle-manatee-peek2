ALTER TABLE public.crm_tasks
ADD CONSTRAINT crm_tasks_status_check
CHECK (status IN ('Working on it', 'Stuck', 'Done', 'Pending', 'Not Started', 'In Progress'));