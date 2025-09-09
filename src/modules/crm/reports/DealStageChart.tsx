"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DealSummary } from "./types.ts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "./utils.ts";

interface DealStageChartProps {
  data: DealSummary[];
  asOfDate: string;
}

const stageColors: Record<string, string> = {
  "New": "#94a3b8",        // slate-400
  "Qualified": "#3b82f6",  // blue-500
  "Proposal": "#a855f7",   // purple-500
  "Negotiation": "#f59e0b",// amber-500
  "Closed Won": "#10b981", // emerald-500
  "Closed Lost": "#ef4444",// rose-500
};

export function DealStageChart({ data, asOfDate }: DealStageChartProps) {
  const chartData = data.map(d => ({
    name: d.stage,
    count: d.count,
    amount: d.totalAmount,
    fill: stageColors[d.stage] || "#6b7280", // Default gray
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Deals by Stage</h3>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("deals_by_stage.csv", data)} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Active deals as of {asOfDate}</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: 12 }}
            labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [`${value} Deals`, 'Count'];
              if (name === 'amount') return [value.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }), 'Amount'];
              return value;
            }}
          />
          <Bar dataKey="count" name="Count" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}