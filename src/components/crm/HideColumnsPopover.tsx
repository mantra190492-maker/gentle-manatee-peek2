"use client";
import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/tasksStore";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HideColumnsPopoverProps {
  currentVisibleColumns: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event")[];
  onVisibleColumnsChange: (visibleColumns: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event")[]) => void;
}

const allColumnOptions: { label: string; value: keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event" }[] = [
  { label: "Task", value: "task" },
  { label: "Status", value: "status" },
  { label: "Date", value: "date" },
  { label: "Priority", value: "priority" },
  { label: "Ongoing notes", value: "notes" }, // Maps to 'notes' in Task
  { label: "Future notes", value: "extra" }, // Maps to 'extra' in Task
  { label: "Google Calendar event", value: "google_calendar_event" }, // Placeholder
  { label: "Created At", value: "created_at" },
  { label: "Updated At", value: "updated_at" },
];

export function HideColumnsPopover({ currentVisibleColumns, onVisibleColumnsChange }: HideColumnsPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localVisibleColumns, setLocalVisibleColumns] = useState(new Set(currentVisibleColumns));

  useEffect(() => {
    setLocalVisibleColumns(new Set(currentVisibleColumns));
  }, [currentVisibleColumns]);

  const handleToggleColumn = (columnValue: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event"), checked: boolean) => {
    const newSet = new Set(localVisibleColumns);
    if (checked) {
      newSet.add(columnValue);
    } else {
      newSet.delete(columnValue);
    }
    setLocalVisibleColumns(newSet);
    onVisibleColumnsChange(Array.from(newSet)); // Apply changes instantly
  };

  const filteredColumns = allColumnOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50 h-8 px-3 rounded-xl">
          <EyeOff className="w-4 h-4" /> Hide
          {currentVisibleColumns.length < allColumnOptions.length && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[260px] p-3 rounded-xl border border-gray-200 bg-white shadow-md space-y-3">
        <h3 className="font-semibold text-gray-900">Display columns</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search columns..."
            className="pl-8 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500 h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-48 pr-2">
          <div className="space-y-2">
            {filteredColumns.map(option => (
              <div key={option.value} className="flex items-center justify-between text-sm">
                <Label htmlFor={`col-${option.value}`} className="flex items-center gap-2 cursor-pointer text-gray-700">
                  <Checkbox
                    id={`col-${option.value}`}
                    checked={localVisibleColumns.has(option.value)}
                    onCheckedChange={(checked) => handleToggleColumn(option.value, checked as boolean)}
                  />
                  {option.label}
                </Label>
              </div>
            ))}
            {filteredColumns.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">No columns found.</p>
            )}
          </div>
        </ScrollArea>
        {/* Removed footer buttons as per request */}
      </PopoverContent>
    </Popover>
  );
}