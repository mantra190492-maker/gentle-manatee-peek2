-- supabase/migrations/0011_create_activity_logging_triggers.sql

-- Function to update crm_tasks.latest_activity_at
CREATE OR REPLACE FUNCTION public.fn_update_crm_tasks_latest_activity_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the latest_activity_at on the parent crm_task
  UPDATE public.crm_tasks
  SET latest_activity_at = NOW()
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$;

-- Trigger on task_activity inserts to update parent crm_task's latest_activity_at
DROP TRIGGER IF EXISTS trg_task_activity_update_crm_task_timestamp ON public.task_activity;
CREATE TRIGGER trg_task_activity_update_crm_task_timestamp
AFTER INSERT ON public.task_activity
FOR EACH ROW EXECUTE FUNCTION public.fn_update_crm_tasks_latest_activity_timestamp();


-- Log row lifecycle + field diffs on crm_tasks
CREATE OR REPLACE FUNCTION public.fn_log_crm_tasks_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  actor_id TEXT;
BEGIN
  actor_id := coalesce(current_setting('request.jwt.claims', true)::json->>'sub','system');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_activity(task_id, actor, event, field, to_value)
    VALUES (NEW.id, actor_id, 'created', 'task', NEW.task);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.task_activity(task_id, actor, event, field, from_value)
    VALUES (OLD.id, actor_id, 'deleted', 'task', OLD.task);
    RETURN OLD;
  ELSE -- UPDATE
    -- Title
    IF NEW.task IS DISTINCT FROM OLD.task THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'title_changed','task', OLD.task, NEW.task);
    END IF;
    -- Status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'status_changed','status', OLD.status, NEW.status);
    END IF;
    -- Priority
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'priority_changed','priority', OLD.priority::text, NEW.priority::text);
    END IF;
    -- Date
    IF NEW.date IS DISTINCT FROM OLD.date THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'date_changed','date', OLD.date::text, NEW.date::text);
    END IF;
    -- Notes
    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'note_changed','notes', LEFT(OLD.notes,120), LEFT(NEW.notes,120));
    END IF;
    -- Extra (future notes)
    IF NEW.extra IS DISTINCT FROM OLD.extra THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.id, actor_id, 'note_changed','extra', LEFT(OLD.extra,120), LEFT(NEW.extra,120));
    END IF;

    -- Generic 'updated' event if other fields changed and no specific event was logged
    IF (to_jsonb(NEW) - ARRAY['updated_at', 'latest_activity_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['updated_at', 'latest_activity_at']) THEN
      INSERT INTO public.task_activity(task_id, actor, event, field)
      VALUES (NEW.id, actor_id, 'updated', NULL);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_tasks_activity ON public.crm_tasks;
CREATE TRIGGER trg_crm_tasks_activity
AFTER INSERT OR UPDATE OR DELETE ON public.crm_tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_log_crm_tasks_activity();

-- Log comments (updates) & replies
CREATE OR REPLACE FUNCTION public.fn_log_comments_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  actor_id TEXT;
  task_id_val UUID;
BEGIN
  actor_id := coalesce(current_setting('request.jwt.claims', true)::json->>'sub','system');

  IF TG_TABLE_NAME = 'task_updates' THEN
    task_id_val := NEW.task_id;
    INSERT INTO public.task_activity(task_id, actor, event, field, to_value)
    VALUES (task_id_val, actor_id, 'comment_added','comment', LEFT(NEW.body, 200));
  ELSIF TG_TABLE_NAME = 'task_replies' THEN
    -- Need to get task_id from parent task_update
    SELECT tu.task_id INTO task_id_val FROM public.task_updates tu WHERE tu.id = NEW.update_id;
    INSERT INTO public.task_activity(task_id, actor, event, field, to_value)
    VALUES (task_id_val, actor_id, 'reply_added','reply', LEFT(NEW.body, 200));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_updates_activity ON public.task_updates;
CREATE TRIGGER trg_task_updates_activity
AFTER INSERT ON public.task_updates
FOR EACH ROW EXECUTE FUNCTION public.fn_log_comments_activity();

DROP TRIGGER IF EXISTS trg_task_replies_activity ON public.task_replies;
CREATE TRIGGER trg_task_replies_activity
AFTER INSERT ON public.task_replies
FOR EACH ROW EXECUTE FUNCTION public.fn_log_comments_activity();

-- Log files
CREATE OR REPLACE FUNCTION public.fn_log_files_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  actor_id TEXT;
BEGIN
  actor_id := coalesce(current_setting('request.jwt.claims', true)::json->>'sub','system');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_activity(task_id, actor, event, field, to_value)
    VALUES (NEW.task_id, actor_id, 'file_uploaded','file', NEW.name);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.task_activity(task_id, actor, event, field, from_value)
    VALUES (OLD.task_id, actor_id, 'file_deleted','file', OLD.name);
    RETURN OLD;
  ELSE -- UPDATE (for rename)
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      INSERT INTO public.task_activity(task_id, actor, event, field, from_value, to_value)
      VALUES (NEW.task_id, actor_id, 'file_renamed','file', OLD.name, NEW.name);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_files_activity_ins ON public.task_files;
CREATE TRIGGER trg_task_files_activity_ins
AFTER INSERT ON public.task_files
FOR EACH ROW EXECUTE FUNCTION public.fn_log_files_activity();

DROP TRIGGER IF EXISTS trg_task_files_activity_upd ON public.task_files;
CREATE TRIGGER trg_task_files_activity_upd
AFTER UPDATE ON public.task_files
FOR EACH ROW EXECUTE FUNCTION public.fn_log_files_activity();

DROP TRIGGER IF EXISTS trg_task_files_activity_del ON public.task_files;
CREATE TRIGGER trg_task_files_activity_del
AFTER DELETE ON public.task_files
FOR EACH ROW EXECUTE FUNCTION public.fn_log_files_activity();