import type { DealStage } from "@/modules/crm/deals/types.ts";
import type { TaskStatus } from "@/lib/tasksStore";
import type { Database } from "@/lib/db/schema"; // Import Database

export type ComplaintStatus = Database['public']['Enums']['complaint_status']; // Correctly reference enum

export interface DealSummary {
  stage: DealStage;
  count: number;
  totalAmount: number;
}

export interface MonthlyDealValue {
  month: string; // e.g., "Jan 2024"
  totalAmount: number;
}

export interface TaskStatusSummary {
  status: TaskStatus;
  count: number;
}

// Updated ComplaintSummary to reflect contacts relationship
export interface ComplaintSummary {
  status: ComplaintStatus;
  count: number;
  crm_contact_id: string | null;
  contacts: { name: string } | null; // Changed from string | null to string
}

export interface ReportData {
  dealSummaries: DealSummary[];
  monthlyDealValues: MonthlyDealValue[];
  taskStatusSummaries: TaskStatusSummary[];
  complaintCounts: {
    open: number;
    critical: number;
    total: number;
    byContact: { contactName: string; count: number }[];
  };
}