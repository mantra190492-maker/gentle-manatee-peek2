"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TaskStatusSummary } from "./types.ts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "./utils.ts";

interface TaskStatusChartProps {
  data: TaskStatusSummary[];
  asOfDate: string;
}

const statusColors: Record<string, string> = {
  "Not Started": "#a78bfa", // violet-400
  "In Progress": "#38bdf8", // sky-400
  "Working on it": "#fbbf24", // amber-400
  "Stuck": "#f87171", // rose-400
  "Done": "#34d399", // emerald-400
  "Pending": "#9ca3af", // gray-400
};

export function TaskStatusChart({ data, asOfDate }: TaskStatusChartProps) {
  const chartData = data.map(d => ({
    name: d.status,
    count: d.count,
    fill: statusColors[d.status] || "#6b7280", // Default gray
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tasks by Status</h3>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("tasks_by_status.csv", data)} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Active tasks as of {asOfDate}</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: 12 }}
            labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            formatter={(value: number) => `${value} Tasks`}
          />
          <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}