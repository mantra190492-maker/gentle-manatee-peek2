"use client";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/tasksStore";

interface FilterPopoverProps {
  currentStatus: TaskStatus | "All";
  onStatusFilterChange: (status: TaskStatus | "All") => void;
}

const statusFilterOptions: (TaskStatus | "All")[] = ["All", "Not Started", "In Progress", "Working on it", "Completed"];

export function FilterPopover({ currentStatus, onStatusFilterChange }: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50 h-8 px-3 rounded-xl">
          <Filter className="w-4 h-4" /> Status
          {currentStatus !== "All" && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">{currentStatus}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-48 p-2 rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="space-y-1">
          {statusFilterOptions.map(s => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100",
                currentStatus === s && "bg-gray-100 font-medium"
              )}
            >
              <span>{s}</span>
              {currentStatus === s && <Check className="h-4 w-4 text-emerald-600" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}