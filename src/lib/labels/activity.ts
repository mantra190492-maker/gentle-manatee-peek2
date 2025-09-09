import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/db/schema";

export type LabelSpecActivity = Database['public']['Tables']['label_spec_activity']['Row'];
export type NewLabelSpecActivity = Database['public']['Tables']['label_spec_activity']['Insert'];

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

export async function logLabelActivity(row: Partial<NewLabelSpecActivity>) {
  try {
    assert(row.spec_id, "Missing spec_id for activity");
    const payload = {
      spec_id: row.spec_id,
      field: row.field ?? "comment",
      action: row.action ?? "set",
      old_value: row.old_value ?? null,
      new_value: row.new_value ?? null,
      actor: row.actor ?? null,
    };

    const { data, error } = await supabase
      .from("label_spec_activity")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as LabelSpecActivity;
  } catch (e) {
    const msg = humanizeError(e);
    // Surface a useful console error for debugging
    // eslint-disable-next-line no-console
    console.error("logLabelActivity failed:", msg, e);
    throw new Error(msg);
  }
}

export async function listLabelActivity(specId: string, opts?: { field?: string; actor?: string }) {
  let query = supabase.from("label_spec_activity").select("*")
    .eq("spec_id", specId)
    .order("created_at", { ascending: false });

  if (opts?.field && opts.field !== "all") query = query.eq("field", opts.field);
  if (opts?.actor && opts.actor !== "all") query = query.eq("actor", opts.actor);

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to fetch label activity");
  return (data ?? []) as LabelSpecActivity[];
}

export function subscribeLabelActivity(specId: string, onInsert: (row: LabelSpecActivity) => void) {
  const chan = supabase
    .channel(`label-spec-activity-${specId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "label_spec_activity", filter: `spec_id=eq.${specId}` },
      (payload: any) => onInsert(payload.new as LabelSpecActivity)
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error("Supabase Realtime channel error for label_spec_activity:", specId);
        toast.error("Realtime updates for label activity log are not available. Data might be stale.");
      }
    });
  return () => {
    void supabase.removeChannel(chan);
  };
}