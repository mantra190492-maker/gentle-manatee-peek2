import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deal, NewDeal, UpdateDeal, DealStage, DealWithContact } from "./types.ts";

export const DEAL_STAGES: DealStage[] = ["New", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export async function listDeals(q?: string, stage?: DealStage | "All"): Promise<DealWithContact[]> {
  let query = supabase
    .from("deals")
    .select(`*, contacts(name, email)`)
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    query = query.ilike("title", `%${q.trim()}%`);
  }
  if (stage && stage !== "All") {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error listing deals:", error);
    toast.error("Failed to load deals: " + error.message);
    return [];
  }
  return data as DealWithContact[];
}

export async function getDeal(id: string): Promise<DealWithContact | null> {
  const { data, error } = await supabase
    .from("deals")
    .select(`*, contacts(name, email)`)
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error getting deal:", error);
    toast.error("Failed to load deal: " + error.message);
    return null;
  }
  return data as DealWithContact;
}

export async function upsertDeal(body: NewDeal | UpdateDeal): Promise<Deal> {
  const { data, error } = await supabase.from("deals").upsert(body).select().single();
  if (error) {
    console.error("Error upserting deal:", error);
    toast.error("Failed to save deal: " + error.message);
    throw error;
  }
  toast.success("Deal saved successfully!");
  return data!;
}

export async function moveDeal(id: string, nextStage: DealStage): Promise<Deal> {
  const { data, error } = await supabase
    .from("deals")
    .update({ stage: nextStage, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Error moving deal:", error);
    toast.error("Failed to move deal: " + error.message);
    throw error;
  }
  toast.success(`Deal moved to "${nextStage}"!`);
  return data!;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) {
    console.error("Error deleting deal:", error);
    toast.error("Failed to delete deal: " + error.message);
    throw error;
  }
  toast.success("Deal deleted successfully!");
}