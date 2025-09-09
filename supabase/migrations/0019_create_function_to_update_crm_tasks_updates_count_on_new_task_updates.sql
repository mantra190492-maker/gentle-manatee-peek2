CREATE OR REPLACE FUNCTION public.increment_task_updates_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.crm_tasks
  SET updates_count = updates_count + 1
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_task_updates_count
AFTER INSERT ON public.task_updates
FOR EACH ROW EXECUTE FUNCTION public.increment_task_updates_count();