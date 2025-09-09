"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, ArrowUpDown, EyeOff, RefreshCw, X } from "lucide-react"; // Removed Group, MoreHorizontal
import { cn } from "@/lib/utils";
import { useTasksStore, TaskStatus, SortKey, SortDir, defaultVisibleColumns, Task } from "@/lib/tasksStore";
import { FilterPopover } from "./FilterPopover"; // New component
import { SortPopover } from "./SortPopover"; // New component
import { HideColumnsPopover } from "./HideColumnsPopover"; // New component

const mainTabs = ["Main table", "Board", "Dashboard", "Files", "Gantt", "Workload", "Calendar", "Log", "Form", "Chart", "Card", "Roadmap tracker"];

export function Toolbar({ onNewTaskClick, onRefreshClick }: { onNewTaskClick: () => void; onRefreshClick: () => void }) {
  const { q, status, sortKey, sortDir, visibleColumns, setFilters, loading: storeLoading, refresh } = useTasksStore();
  const [activeTab, setActiveTab] = useState("Main table");
  const [searchQuery, setSearchQuery] = useState(q || "");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal search state with store's query
  useEffect(() => {
    setSearchQuery(q || "");
  }, [q]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setFilters({ q: value.trim() === "" ? undefined : value, page: 1 });
      void refresh(); // Trigger refresh after debounce
    }, 250); // Debounce network calls by 250ms
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters({ q: undefined, page: 1 });
    void refresh();
    searchInputRef.current?.focus();
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && searchInputRef.current === document.activeElement) {
      handleClearSearch();
    } else if (e.key === 'Enter' && searchInputRef.current === document.activeElement) {
      // Enter key already triggers debounce and refresh via onChange
      searchInputRef.current?.blur(); // Optional: unfocus after search
    }
  }, [handleClearSearch]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  const handleStatusFilterChange = (newStatus: TaskStatus | "All") => {
    setFilters({ status: newStatus });
  };

  const handleSortChange = (newSortKey: SortKey, newSortDir: SortDir) => {
    setFilters({ sortKey: newSortKey, sortDir: newSortDir });
  };

  const handleVisibleColumnsChange = (newVisibleColumns: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event")[]) => {
    setFilters({ visibleColumns: newVisibleColumns });
  };

  return (
    <div className="border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Top Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b border-gray-200 -mx-6 px-6">
        {mainTabs.map((tab, index) => (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative text-sm font-medium text-gray-600 hover:text-gray-900 pb-3 pt-2 h-auto",
              activeTab === tab && "text-emerald-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-emerald-600"
            )}
          >
            {tab}
            {index === mainTabs.length - 1 && (
              <Button variant="ghost" size="sm" className="ml-2 p-0 h-auto w-auto text-gray-500 hover:text-gray-700">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </Button>
        ))}
      </div>

      {/* Toolbar Row */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-2 items-center">
        {/* New Task Button (direct action) */}
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 h-8 px-3 rounded-xl" onClick={onNewTaskClick}>
          <Plus className="w-4 h-4" /> Add Task
        </Button>

        {/* Search */}
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            className="pl-8 pr-8 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500 h-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 hover:bg-gray-100"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter */}
        <FilterPopover currentStatus={status || "All"} onStatusFilterChange={handleStatusFilterChange} />

        {/* Sort */}
        <SortPopover currentSortKey={sortKey} currentSortDir={sortDir} onSortChange={handleSortChange} />

        {/* Hide Columns */}
        <HideColumnsPopover currentVisibleColumns={visibleColumns} onVisibleColumnsChange={handleVisibleColumnsChange} />

        {/* Refresh Button */}
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50 h-8 px-3 rounded-xl" onClick={onRefreshClick} disabled={storeLoading}>
          <RefreshCw className={cn("w-4 h-4", storeLoading && "animate-spin")} /> Refresh
        </Button>
      </div>
    </div>
  );
}