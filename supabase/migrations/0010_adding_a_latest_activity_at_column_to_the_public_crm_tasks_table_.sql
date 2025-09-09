-- supabase/migrations/0010_add_latest_activity_to_crm_tasks.sql
ALTER TABLE public.crm_tasks
ADD COLUMN IF NOT EXISTS latest_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows with their current updated_at as a sensible default
UPDATE public.crm_tasks
SET latest_activity_at = updated_at
WHERE latest_activity_at IS NULL;