"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyDealValue } from "./types.ts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "./utils.ts";

interface DealValueChartProps {
  data: MonthlyDealValue[];
  asOfDate: string;
}

export function DealValueChart({ data, asOfDate }: DealValueChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Deal Value (Closed Won)</h3>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("monthly_deal_value.csv", data)} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Last 12 months as of {asOfDate}</p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: 12 }}
            labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            formatter={(value: number) => value.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}
          />
          <Line type="monotone" dataKey="totalAmount" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}