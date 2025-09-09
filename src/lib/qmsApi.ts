import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/db/schema";

// Type definitions for new tables
export type QMSUpdate = Database['public']['Tables']['qms_updates']['Row'];
export type NewQMSUpdate = Database['public']['Tables']['qms_updates']['Insert'];
export type QMSReply = Database['public']['Tables']['qms_replies']['Row'];
export type NewQMSReply = Database['public']['Tables']['qms_replies']['Insert'];

// --- Updates API ---

export interface QMSUpdateWithReplies extends QMSUpdate {
  replies: QMSReply[];
}

export async function listQMSUpdates(entityId: string, moduleType: string): Promise<QMSUpdateWithReplies[] | null> {
  const { data, error } = await supabase
    .from("qms_updates")
    .select(`*, replies:qms_replies(*)`)
    .eq("entity_id", entityId)
    .eq("module_type", moduleType)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "qms_replies", ascending: true });

  if (error) {
    console.error("Error listing QMS updates:", error);
    toast.error("Failed to load QMS updates: " + error.message);
    return null;
  }
  return data as QMSUpdateWithReplies[];
}

export async function createQMSUpdate(entityId: string, moduleType: string, body: string, author: string): Promise<QMSUpdate> {
  if (!entityId || !moduleType) {
    console.error("createQMSUpdate: entityId or moduleType is undefined or null.");
    throw new Error("No QMS entity selected.");
  }
  const { data, error } = await supabase
    .from("qms_updates")
    .insert({ entity_id: entityId, module_type: moduleType, body, author })
    .select('*')
    .single();

  if (error) {
    console.error("Error creating QMS update:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function createQMSReply(updateId: string, body: string, author: string): Promise<QMSReply> {
  if (!updateId) {
    console.error("createQMSReply: updateId is undefined or null.");
    throw new Error("No QMS update selected to reply to.");
  }
  const { data, error } = await supabase
    .from("qms_replies")
    .insert({ update_id: updateId, body, author })
    .select('*')
    .single();

  if (error) {
    console.error("Error creating QMS reply:", error);
    throw new Error(error.message);
  }
  return data;
}