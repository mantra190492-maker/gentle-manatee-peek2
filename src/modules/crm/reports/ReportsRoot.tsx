"use client";
import React, { useState, useEffect } from "react";
import { getDealSummary, getTaskStatusSummary, getComplaintSummary } from "./api.ts";
import type { ReportData } from "./types.ts";
import { DealStageChart } from "./DealStageChart.tsx";
import { DealValueChart } from "./DealValueChart.tsx";
import { TaskStatusChart } from "./TaskStatusChart.tsx";
import { ComplaintSummaryCard } from "./ComplaintSummaryCard.tsx";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ReportsRoot() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "MMM d, yyyy"));

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { dealSummaries, monthlyDealValues } = await getDealSummary();
      const taskStatusSummaries = await getTaskStatusSummary();
      const complaintCounts = await getComplaintSummary();

      setReportData({
        dealSummaries,
        monthlyDealValues,
        taskStatusSummaries,
        complaintCounts,
      });
      setAsOfDate(format(new Date(), "MMM d, yyyy"));
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-lg text-gray-500">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-rose-500 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        {error}
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center text-gray-500 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        No report data available.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CRM Reports</h2>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span className="ml-2">Refresh Reports</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealStageChart data={reportData.dealSummaries} asOfDate={asOfDate} />
        <DealValueChart data={reportData.monthlyDealValues} asOfDate={asOfDate} />
        <TaskStatusChart data={reportData.taskStatusSummaries} asOfDate={asOfDate} />
        <ComplaintSummaryCard
          open={reportData.complaintCounts.open}
          critical={reportData.complaintCounts.critical}
          total={reportData.complaintCounts.total}
          byContact={reportData.complaintCounts.byContact}
          asOfDate={asOfDate}
        />
      </div>
    </div>
  );
}