// src/components/suppliers/SupplierFilters.tsx
"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown, Search } from "lucide-react";
import type { SupplierStatus, SupplierType } from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

interface SupplierFiltersProps {
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: SupplierStatus | "All") => void;
  onTypeFilterChange: (type: SupplierType | "All") => void;
  onRiskFilterChange: (risk: number | "All") => void; // Placeholder for risk filter
  onSortChange: (sortKey: string) => void; // Placeholder for sort
  currentSearch: string;
  currentStatus: SupplierStatus | "All";
  currentType: SupplierType | "All";
  currentRisk: number | "All";
  currentSort: string;
}

const supplierStatusOptions: (SupplierStatus | "All")[] = [
  "All", "Pending Invite", "Invited", "Drafting", "Submitted", "Under Review", "Approved", "Conditional", "Rejected", "Inactive"
];
const supplierTypeOptions: (SupplierType | "All")[] = [
  "All", "manufacturer", "packer", "lab", "broker", "3PL"
];
const sortOptions = [
  { label: "Legal Name (A-Z)", value: "legal_name-asc" },
  { label: "Legal Name (Z-A)", value: "legal_name-desc" },
  { label: "Risk Score (Low-High)", value: "risk_score-asc" },
  { label: "Risk Score (High-Low)", value: "risk_score-desc" },
  { label: "Created At (Newest First)", value: "created_at-desc" },
];

export function SupplierFilters({
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onRiskFilterChange,
  onSortChange,
  currentSearch,
  currentStatus,
  currentType,
  currentRisk,
  currentSort,
}: SupplierFiltersProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name..."
            className="pl-8 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500"
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Status
              {currentStatus !== "All" && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">{currentStatus}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {supplierStatusOptions.map(s => (
              <DropdownMenuItem key={s} onClick={() => onStatusFilterChange(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </PopoverContent>
        </Popover>

        {/* Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Type
              {currentType !== "All" && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">{currentType}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {supplierTypeOptions.map(t => (
              <DropdownMenuItem key={t} onClick={() => onTypeFilterChange(t)}>
                {t}
              </DropdownMenuItem>
            ))}
          </PopoverContent>
        </Popover>

        {/* Risk Filter (Placeholder for more complex logic) */}
        <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Risk
          {currentRisk !== "All" && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">{currentRisk}</span>}
        </Button>

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50">
              <ArrowUpDown className="w-4 h-4" /> Sort
              {currentSort && <span className="ml-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {sortOptions.map(option => (
              <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}