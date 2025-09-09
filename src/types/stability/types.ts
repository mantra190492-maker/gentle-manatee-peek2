// src/types/stability/types.ts
import type { Database } from "@/lib/db/schema";

// ---------- Direct DB-mapped types (from Supabase) ----------
export type StabilityStudy = Database["public"]["Tables"]["stability_studies"]["Row"];
export type NewStabilityStudy = Database["public"]["Tables"]["stability_studies"]["Insert"];
export type UpdateStabilityStudy = Database["public"]["Tables"]["stability_studies"]["Update"];

export type StabilityProtocol = Database["public"]["Tables"]["stability_protocols"]["Row"];
export type NewStabilityProtocol = Database["public"]["Tables"]["stability_protocols"]["Insert"];
export type UpdateStabilityProtocol = Database["public"]["Tables"]["stability_protocols"]["Update"];

export type StabilityTimepoint = Database["public"]["Tables"]["stability_timepoints"]["Row"];
export type NewStabilityTimepoint = Database["public"]["Tables"]["stability_timepoints"]["Insert"];
export type UpdateStabilityTimepoint = Database["public"]["Tables"]["stability_timepoints"]["Update"];

// ---------- Extended UI-friendly nested types ----------
export type StabilityStudyWithProtocols = StabilityStudy & {
  stability_protocols: StabilityProtocol[];
};

export type StabilityProtocolWithTimepoints = StabilityProtocol & {
  stability_timepoints: StabilityTimepoint[];
};