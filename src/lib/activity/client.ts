import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ActivityRow = {
  id: string;
  task_id: string;
  field: string;
  action: string;
  old_value: any;
  new_value: any;
  message: string | null;
  actor: string | null;
  created_at: string;
};

function assert(value: any, msg: string) {
  if (value === undefined || value === null || value === "") {
    throw new Error(msg);
  }
}

function humanizeError(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e.message) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

export async function logActivity(row: Partial<ActivityRow>) {
  try {
    assert(row.task_id, "Missing task_id for activity");
    const payload = {
      task_id: row.task_id,
      field: row.field ?? "comment",
      action: row.action ?? "set",
      old_value: row.old_value ?? null,
      new_value: row.new_value ?? null,
      message: row.message ?? null,
      actor: row.actor ?? null,
    };

    const { data, error } = await supabase
      .from("task_activity")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as ActivityRow;
  } catch (e) {
    const msg = humanizeError(e);
    // Surface a useful console error for debugging
    // eslint-disable-next-line no-console
    console.error("logActivity failed:", msg, e);
    throw new Error(msg);
  }
}

export async function listActivity(taskId: string, opts?: { field?: string; actor?: string }) {
  let query = supabase.from("task_activity").select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (opts?.field && opts.field !== "all") query = query.eq("field", opts.field);
  if (opts?.actor && opts.actor !== "all") query = query.eq("actor", opts.actor);

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to fetch activity");
  return (data ?? []) as ActivityRow[];
}

export function subscribeActivity(taskId: string, onInsert: (row: ActivityRow) => void) {
  const chan = supabase
    .channel(`task-activity-${taskId}`)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "task_activity", filter: `task_id=eq.${taskId}` },
      (payload: any) => onInsert(payload.new as ActivityRow)
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error("Supabase Realtime channel error for task_activity:", taskId);
        toast.error("Realtime updates for activity log are not available. Data might be stale.");
      }
    });
  return () => {
    void supabase.removeChannel(chan);
  };
}