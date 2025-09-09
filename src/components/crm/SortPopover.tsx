"use client";
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortKey, SortDir } from "@/lib/tasksStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SortPopoverProps {
  currentSortKey: SortKey;
  currentSortDir: SortDir;
  onSortChange: (sortKey: SortKey, sortDir: SortDir) => void;
}

const sortOptions: { label: string; value: SortKey }[] = [
  { label: "Task", value: "task" },
  { label: "Status", value: "status" },
  { label: "Date", value: "date" },
  { label: "Priority", value: "priority" },
  { label: "Created At", value: "created_at" },
  { label: "Updated At", value: "updated_at" },
];

export function SortPopover({ currentSortKey, currentSortDir, onSortChange }: SortPopoverProps) {
  const [selectedKey, setSelectedKey] = useState<SortKey>(currentSortKey);
  const [selectedDir, setSelectedDir] = useState<SortDir>(currentSortDir);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSelectedKey(currentSortKey);
    setSelectedDir(currentSortDir);
  }, [currentSortKey, currentSortDir]);

  const handleApply = () => {
    onSortChange(selectedKey, selectedDir);
    setOpen(false); // Close popover after applying
  };

  const handleClear = () => {
    onSortChange("created_at", "desc"); // Default sort
    setOpen(false); // Close popover after clearing
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50 h-8 px-3 rounded-xl">
          <ArrowUpDown className="w-4 h-4" /> Sort
          {(currentSortKey !== "created_at" || currentSortDir !== "desc") && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[260px] p-3 rounded-xl border border-gray-200 bg-white shadow-md space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Sort by</Label>
          <Select value={selectedKey} onValueChange={(value: SortKey) => setSelectedKey(value)}>
            <SelectTrigger id="sort-by" className="h-9 text-sm">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium text-gray-700">Order</Label>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDir("asc")}
              className={cn(
                "flex-1 h-8 text-sm rounded-md",
                selectedDir === "asc" ? "bg-white shadow-sm text-gray-900" : "text-gray-700 hover:bg-gray-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
              )}
            >
              Asc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDir("desc")}
              className={cn(
                "flex-1 h-8 text-sm rounded-md",
                selectedDir === "desc" ? "bg-white shadow-sm text-gray-900" : "text-gray-700 hover:bg-gray-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
              )}
            >
              Desc
            </Button>
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-gray-200 pt-3 mt-3">
          <Button variant="outline" size="sm" onClick={handleClear} className="border-gray-200 text-gray-700 hover:bg-gray-50">
            Clear
          </Button>
          <Button size="sm" onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}