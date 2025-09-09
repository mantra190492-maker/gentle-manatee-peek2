import { create } from "zustand";

// --- TYPE DEFINITIONS ---

// Status Enums
export type SOPStatus = "Draft" | "Approved" | "Expired";
export type CAPAStatus = "Open" | "In Progress" | "Closed";
export type ChangeControlStatus = "Proposed" | "Approved" | "Rejected" | "Implemented";
export type TrainingStatus = "Not Started" | "In Progress" | "Completed";

// Entity Interfaces
export interface SOP {
  id: string;
  sopNumber: string;
  title: string;
  version: string;
  status: SOPStatus | "";
  owner: string;
  effectiveDate?: string; // YYYY-MM-DD
  reviewDate?: string; // YYYY-MM-DD
  trainingProgress: number; // 0-100
  fileCount: number;
}

export interface CAPA {
  id: string;
  capaId: string;
  issue: string;
  rootCause: string;
  status: CAPAStatus | "";
  linkedSop: string;
  owner: string;
  targetCloseDate?: string; // YYYY-MM-DD
  updatesCount: number;
}

export interface ChangeControl {
  id: string;
  changeId: string;
  description: string;
  impactAssessment: string;
  status: ChangeControlStatus | "";
  linkedEntity: string;
  owner: string;
  approvalDate?: string; // YYYY-MM-DD
}

export interface Training {
  id: string;
  user: string;
  sopAssigned: string;
  status: TrainingStatus | "";
  assignedDate?: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  signature: boolean;
}

export interface AuditLog {
  id: string;
  eventId: string;
  entity: string;
  action: string;
  user: string;
  timestamp: string; // ISO string
}

export interface VaultFile {
  id: string;
  fileName: string;
  linkedEntity: string;
  type: string;
  uploadedBy: string;
  dateUploaded: string; // ISO string
}

export type QMSEntity = SOP | CAPA | ChangeControl | Training | AuditLog | VaultFile;

// New types for QMS Updates and Replies
export type QMSUpdate = {
  id: string;
  entity_id: string;
  module_type: string;
  author: string;
  body: string;
  created_at: string;
};

export type QMSReply = {
  id: string;
  update_id: string;
  author: string;
  body: string;
  created_at: string;
};

// --- ZUSTAND STORE ---

interface QMSState {
  sops: SOP[];
  capas: CAPA[];
  changeControls: ChangeControl[];
  trainings: Training[];
  auditLogs: AuditLog[];
  vaultFiles: VaultFile[];
  // Add/Update functions will be added later when backend is connected
}

export const useQMSStore = create<QMSState>((set) => ({
  sops: [],
  capas: [],
  changeControls: [],
  trainings: [],
  auditLogs: [],
  vaultFiles: [],
}));