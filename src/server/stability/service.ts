import { supabase } from "@/integrations/supabase/client";
import type {
  StabilityStudy,
  NewStabilityStudy,
  UpdateStabilityStudy,
  StabilityProtocol,
  NewStabilityProtocol,
  UpdateStabilityProtocol,
  StabilityTimepoint,
  NewStabilityTimepoint,
  UpdateStabilityTimepoint,
} from "@/types/stability/types";

function ok<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("No data returned from Supabase.");
  return data;
}

// ---------- Studies ----------
export async function listStudies(): Promise<
  Pick<StabilityStudy, "id" | "product_name" | "batch_no" | "created_at">[]
> {
  const { data, error } = await supabase
    .from("stability_studies")
    .select("id,product_name,batch_no,created_at")
    .order("created_at", { ascending: false });

  return ok(data, error);
}

export async function createStudy(
  input: Omit<NewStabilityStudy, "id" | "created_at" | "updated_at">
): Promise<StabilityStudy> {
  const { data, error } = await supabase
    .from("stability_studies")
    .insert(input)
    .select("*")
    .single();

  return ok(data, error);
}

export async function updateStudy(
  id: string,
  patch: UpdateStabilityStudy
): Promise<StabilityStudy> {
  const { data, error } = await supabase
    .from("stability_studies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  return ok(data, error);
}

export async function getStudyById(id: string): Promise<StabilityStudy | null> {
  const { data, error } = await supabase
    .from("stability_studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ---------- Protocols ----------
export async function listProtocols(params?: {
  studyId?: string;
}): Promise<StabilityProtocol[]> {
  let query = supabase
    .from("stability_protocols")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.studyId) query = query.eq("study_id", params.studyId);

  const { data, error } = await query;
  return ok(data, error);
}

export async function createProtocol(
  input: Omit<NewStabilityProtocol, "id" | "created_at" | "updated_at">
): Promise<StabilityProtocol> {
  const { data, error } = await supabase
    .from("stability_protocols")
    .insert({
      study_id: input.study_id,
      title: input.title,
      product_batch: input.product_batch || null,
      storage_conditions: input.storage_conditions,
      pull_schedule: input.pull_schedule || null,
      notes: input.notes || null,
      status: input.status || 'Draft',
      start_date: input.start_date || null,
    })
    .select("*")
    .single();

  return ok(data, error);
}

export async function updateProtocol(
  id: string,
  patch: UpdateStabilityProtocol
): Promise<StabilityProtocol> {
  const { data, error } = await supabase
    .from("stability_protocols")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  return ok(data, error);
}

export async function getProtocolById(
  id: string
): Promise<StabilityProtocol | null> {
  const { data, error } = await supabase
    .from("stability_protocols")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ---------- Timepoints ----------
export async function listTimepoints(
  protocolId: string
): Promise<StabilityTimepoint[]> {
  const { data, error } = await supabase
    .from("stability_timepoints")
    .select("*")
    .eq("protocol_id", protocolId)
    .order("planned_date", { ascending: true });

  return ok(data, error);
}

export async function bulkUpsertTimepoints(
  input: Array<Omit<NewStabilityTimepoint, "id" | "created_at" | "updated_at">>,
  onConflict?: string
): Promise<StabilityTimepoint[]> {
  const upsertOpts = onConflict ? { onConflict } : undefined;

  const { data, error } = await supabase
    .from("stability_timepoints")
    .upsert(input, upsertOpts)
    .select("*");

  return ok(data, error);
}

export async function updateTimepoint(
  id: string,
  patch: UpdateStabilityTimepoint
): Promise<StabilityTimepoint> {
  const { data, error } = await supabase
    .from("stability_timepoints")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  return ok(data, error);
}

export async function deleteTimepoint(id: string): Promise<void> {
  const { error } = await supabase
    .from("stability_timepoints")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}