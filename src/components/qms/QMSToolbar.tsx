"use client";
import { useState } from "react"; // Added useState import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ArrowUpDown, Group, MoreHorizontal, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function QMSToolbar({
  entityName,
  onNewClick,
}: {
  entityName: string;
  onNewClick: () => void;
}) {
  // Placeholder for filter/sort states, will be implemented later if needed
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [sortActive, setSortActive] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* New Entity Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
              <Plus className="w-4 h-4" /> New {entityName} <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onNewClick}>New {entityName}</DropdownMenuItem>
            {/* Add other new options here if applicable for QMS */}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Placeholder for search logic
          />
        </div>

        {/* Filter */}
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Filter
          {filterActive && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
        </Button>

        {/* Sort */}
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
          <ArrowUpDown className="w-4 h-4" /> Sort
          {sortActive && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
        </Button>

        {/* Group By */}
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
          <Group className="w-4 h-4" /> Group by
        </Button>

        {/* Ellipsis Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="text-gray-700 border-gray-200 hover:bg-gray-50">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Placeholder Option 1</DropdownMenuItem>
            <DropdownMenuItem>Placeholder Option 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}