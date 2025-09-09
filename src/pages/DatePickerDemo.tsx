"use client";

import React, { useState } from "react";
import { DatePicker } from "@/components/date/DatePicker.tsx"; // Added .tsx extension
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";

export default function DatePickerDemoPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold mb-6">Date Picker Demo</h1>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-start gap-6">
              <p className="text-lg text-slate-700">
                Selected Date:{" "}
                <span className="font-semibold text-emerald-600">
                  {selectedDate ? format(selectedDate, "PPP") : "None"}
                </span>
              </p>
              <DatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}