import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subMonths, startOfMonth } from "date-fns";
import type { DealSummary, MonthlyDealValue, TaskStatusSummary, ComplaintSummary } from "./types.ts";
import type { DealStage } from "@/modules/crm/deals/types.ts";
import type { TaskStatus } from "@/lib/tasksStore";
import type { Database } from "@/lib/db/schema"; // Import Database

export async function getDealSummary(): Promise<{ dealSummaries: DealSummary[]; monthlyDealValues: MonthlyDealValue[] }> {
  try {
    // Deals by Stage
    const { data: stageData, error: stageError } = await supabase
      .from('deals')
      .select('stage, amount')
      .not('stage', 'in', '("Closed Won", "Closed Lost")'); // Exclude closed deals from active summary

    if (stageError) throw stageError;

    const dealSummariesMap = new Map<DealStage, { count: number; totalAmount: number }>();
    stageData.forEach(deal => {
      const current = dealSummariesMap.get(deal.stage) || { count: 0, totalAmount: 0 };
      dealSummariesMap.set(deal.stage, {
        count: current.count + 1,
        totalAmount: current.totalAmount + Number(deal.amount),
      });
    });
    const dealSummaries: DealSummary[] = Array.from(dealSummariesMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      totalAmount: data.totalAmount,
    }));

    // Monthly Deal Value (last 12 months for Closed Won deals)
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('deals')
      .select('created_at, amount')
      .eq('stage', 'Closed Won')
      .gte('created_at', twelveMonthsAgo.toISOString());

    if (monthlyError) throw monthlyError;

    const monthlyDealValuesMap = new Map<string, number>();
    monthlyData.forEach(deal => {
      const monthKey = format(new Date(deal.created_at), 'MMM yyyy');
      monthlyDealValuesMap.set(monthKey, (monthlyDealValuesMap.get(monthKey) || 0) + Number(deal.amount));
    });

    // Ensure all last 12 months are present, even if no deals
    const monthlyDealValues: MonthlyDealValue[] = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthKey = format(month, 'MMM yyyy');
      monthlyDealValues.push({
        month: monthKey,
        totalAmount: monthlyDealValuesMap.get(monthKey) || 0,
      });
    }

    return { dealSummaries, monthlyDealValues };
  } catch (error: any) {
    console.error("Error fetching deal summary:", error);
    toast.error("Failed to load deal reports: " + error.message);
    return { dealSummaries: [], monthlyDealValues: [] };
  }
}

export async function getTaskStatusSummary(): Promise<TaskStatusSummary[]> {
  try {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('status')
      .not('status', 'eq', 'Completed'); // Exclude completed tasks from active summary

    if (error) throw error;

    const taskStatusSummariesMap = new Map<TaskStatus, number>();
    data.forEach(task => {
      taskStatusSummariesMap.set(task.status, (taskStatusSummariesMap.get(task.status) || 0) + 1);
    });

    const taskStatusSummaries: TaskStatusSummary[] = Array.from(taskStatusSummariesMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return taskStatusSummaries;
  } catch (error: any) {
    console.error("Error fetching task status summary:", error);
    toast.error("Failed to load task reports: " + error.message);
    return [];
  }
}

export async function getComplaintSummary(): Promise<{ open: number; critical: number; total: number; byContact: { contactName: string; count: number }[] }> {
  try {
    const ninetyDaysAgo = subMonths(new Date(), 3).toISOString(); // Last 90 days (approx 3 months)
    const { data, error } = await supabase
      .from('complaints')
      .select(`id, status, priority, crm_contact_id, contacts(name)`) // Select contacts(name)
      .gte('created_at', ninetyDaysAgo);

    if (error) throw error;

    let open = 0;
    let critical = 0;
    const contactCountsMap = new Map<string, number>();

    data.forEach(complaint => {
      if (complaint.status === 'Open' || complaint.status === 'Under Review') {
        open++;
      }
      if (complaint.priority === 'High') {
        critical++;
      }
      // Safely access contact name and explicitly cast to string
      if (complaint.crm_contact_id && complaint.contacts && 'name' in complaint.contacts && complaint.contacts.name) {
        const contactName = complaint.contacts.name as string; // Explicit cast
        contactCountsMap.set(contactName, (contactCountsMap.get(contactName) || 0) + 1);
      }
    });

    const byContact = Array.from(contactCountsMap.entries()).map(([contactName, count]) => ({
      contactName,
      count,
    }));

    return {
      open,
      critical,
      total: data.length,
      byContact,
    };
  } catch (error: any) {
    console.error("Error fetching complaint summary:", error);
    toast.error("Failed to load complaint reports: " + error.message);
    return { open: 0, critical: 0, total: 0, byContact: [] };
  }
}