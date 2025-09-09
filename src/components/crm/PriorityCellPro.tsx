"use client";

import * as React from "react";
import { AlertTriangle, Check } from "lucide-react"; // Added Check icon
import { useTasksStore } from "@/lib/tasksStore";
import type { TaskPriority } from "@/lib/tasksStore";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Import cn for utility classes

const OPTS: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

const chip = (p?: TaskPriority | null) => {
  const map: Record<string, string> = {
    Critical: "bg-rose-100 text-rose-800 border border-rose-200",
    High:     "bg-amber-100 text-amber-800 border border-amber-200",
    Medium:   "bg-blue-100 text-blue-800 border border-blue-200",
    Low:      "bg-gray-100 text-gray-800 border border-gray-200",
  };
  return map[p ?? ""] ?? "bg-gray-100 text-gray-800 border border-gray-200";
};

export default function PriorityCellPro({ id, value }: { id: string; value?: TaskPriority | null }) {
  const updateTask = useTasksStore(s => s.updateTask);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            `inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium shadow-sm h-8`,
            chip(value),
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          )}
        >
          {value ?? "—"}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="z-[90] w-[220px] rounded-xl border border-gray-200 bg-white p-2 text-gray-900 shadow-xl">
        <div className="space-y-1">
          {OPTS.map((p) => (
            <button
              key={p}
              onClick={() => {
                updateTask(id, { priority: p });
                setOpen(false);
              }}
              className={cn(
                `flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm`,
                chip(p),
                "hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
              )}
            >
              <span>{p}</span>
              {value === p && <Check className="h-4 w-4" />} {/* Show checkmark for selected */}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}