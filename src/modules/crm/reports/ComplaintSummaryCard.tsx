"use client";
import React from "react";
import { AlertTriangle, Bug, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "./utils.ts";

interface ComplaintSummaryCardProps {
  open: number;
  critical: number;
  total: number;
  byContact: { contactName: string; count: number }[];
  asOfDate: string;
}

export function ComplaintSummaryCard({ open, critical, total, byContact, asOfDate }: ComplaintSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Complaints (Last 90 Days)</h3>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("complaint_summary.csv", [{ open, critical, total, byContact: JSON.stringify(byContact) }])} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">As of {asOfDate}</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
          <Bug className="w-8 h-8 text-blue-500 mb-2" />
          <span className="text-3xl font-bold text-gray-900">{open}</span>
          <span className="text-sm text-gray-600">Open</span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
          <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
          <span className="text-3xl font-bold text-gray-900">{critical}</span>
          <span className="text-sm text-gray-600">Critical</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Top Reporters:</p>
        {byContact.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-600">
            {byContact.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {item.contactName}</span>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No complaints linked to contacts.</p>
        )}
      </div>
    </div>
  );
}