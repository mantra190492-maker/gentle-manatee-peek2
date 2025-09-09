import { Database } from "@/lib/db/schema.ts";
import type { Json } from "@/lib/db/schema";

// Enums
export type DocType = Database['public']['Enums']['doc_type'];
export type SupplierStatus = Database['public']['Enums']['supplier_status'];
export type ApprovalDecision = Database['public']['Enums']['approval_decision'];
export type SupplierType = Database['public']['Enums']['supplier_type'];

// Tables
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type NewSupplier = Database['public']['Tables']['suppliers']['Insert'];
export type UpdateSupplier = Database['public']['Tables']['suppliers']['Update'];

export type SupplierSite = Database['public']['Tables']['supplier_sites']['Row'];
export type NewSupplierSite = Database['public']['Tables']['supplier_sites']['Insert'];
export type UpdateSupplierSite = Database['public']['Tables']['supplier_sites']['Update'];

export type SupplierContact = Database['public']['Tables']['supplier_contacts']['Row'];
export type NewSupplierContact = Database['public']['Tables']['supplier_contacts']['Insert'];
export type UpdateSupplierContact = Database['public']['Tables']['supplier_contacts']['Update'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type NewDocument = Database['public']['Tables']['documents']['Insert'];
export type UpdateDocument = Database['public']['Tables']['documents']['Update'];

export type Questionnaire = Database['public']['Tables']['questionnaires']['Row'];
export type NewQuestionnaire = Database['public']['Tables']['questionnaires']['Insert'];
export type UpdateQuestionnaire = Database['public']['Tables']['questionnaires']['Update'];

export type Response = Database['public']['Tables']['responses']['Row'];
export type NewResponse = Database['public']['Tables']['responses']['Insert'];
export type UpdateResponse = Database['public']['Tables']['responses']['Update'];

export type Approval = Database['public']['Tables']['approvals']['Row'];
export type NewApproval = Database['public']['Tables']['approvals']['Insert'];
export type UpdateApproval = Database['public']['Tables']['approvals']['Update'];

export type Change = Database['public']['Tables']['changes']['Row'];
export type NewChange = Database['public']['Tables']['changes']['Insert'];
export type UpdateChange = Database['public']['Tables']['changes']['Update'];

export type Scorecard = Database['public']['Tables']['scorecards']['Row'];
export type NewScorecard = Database['public']['Tables']['scorecards']['Insert'];
export type UpdateScorecard = Database['public']['Tables']['scorecards']['Update'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type NewTask = Database['public']['Tables']['tasks']['Insert'];
export type UpdateTask = Database['public']['Tables']['tasks']['Update'];

export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
export type NewActivityLog = Database['public']['Tables']['activity_log']['Insert'];
export type UpdateActivityLog = Database['public']['Tables']['activity_log']['Update'];

// Explicitly define Invite types as Database['public']['Tables']['invites'] was causing issues
export type Invite = {
  id: string;
  supplier_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  required_docs: Json; // Assuming this is stored as JSONB
  language: string;
  created_by: string | null;
  created_at: string | null;
};

export type NewInvite = {
  supplier_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string | null;
  required_docs?: Json;
  language?: string;
  created_by?: string | null;
  created_at?: string | null;
};

export type UpdateInvite = Partial<NewInvite>;


// Combined types for easier use
export type SupplierWithDetails = Supplier & {
  sites: SupplierSite[];
  contacts: SupplierContact[];
  documents: Document[];
  responses: Response[];
  approvals: Approval[];
  changes: Change[];
  scorecards: Scorecard[];
  tasks: Task[];
  activity_log: ActivityLog[];
};

export interface PortalUploadedFile {
  file: File;
  type: DocType;
  issuedOn?: string;
  expiresOn?: string;
}

export interface PortalSubmissionData {
  legal_name: string;
  dba?: string;
  type: SupplierType;
  country: string;
  contacts: { role: string; name: string; email: string; phone?: string }[];
  sites: { address: string; city: string; region?: string; country: string; gmp_status?: string; last_audit_date?: string }[];
  gmp_certified?: boolean;
  last_audit_date?: string;
  product_list?: string;
  code_of_conduct_agreed: boolean;
  anti_bribery_agreed: boolean;
  data_protection_agreed: boolean;
}