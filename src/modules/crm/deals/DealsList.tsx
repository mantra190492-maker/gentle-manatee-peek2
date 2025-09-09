"use client";
import React, { useState } from "react";
import type { DealWithContact } from "./types.ts";
import { DealStagePill } from "./DealStagePill.tsx";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DealsListProps {
  deals: DealWithContact[];
  onRowClick: (deal: DealWithContact) => void;
  // Add sorting props if implementing sort
}

export function DealsList({ deals, onRowClick }: DealsListProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Placeholder for multi-select

  // Placeholder for sorting logic
  // const sortedDeals = useMemo(() => { /* apply sorting */ }, [deals, sortKey, sortDir]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
              {/* Placeholder for checkbox column if multi-select is needed */}
              {/* <th className="w-12 px-3 py-2 text-left">
                <Checkbox />
              </th> */}
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Title</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Stage</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Amount</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Close Date</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Contact</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Created At</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const isSelected = selectedRows.has(deal.id); // Placeholder
              return (
                <tr
                  key={deal.id}
                  className={cn(
                    "h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer",
                    isSelected && "bg-emerald-50 border-l-4 border-emerald-600"
                  )}
                  onClick={() => onRowClick(deal)}
                >
                  {/* Placeholder for checkbox column */}
                  {/* <td className="w-12 px-3 py-2">
                    <Checkbox />
                  </td> */}
                  <td className="px-3 py-2 text-gray-900 font-medium">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      {deal.title}
                    </div>
                  </td>
                  <td className="px-3 py-2"><DealStagePill stage={deal.stage} /></td>
                  <td className="px-3 py-2">{deal.amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</td>
                  <td className="px-3 py-2">{deal.close_date ? format(new Date(deal.close_date), "MMM d, yyyy") : "N/A"}</td>
                  <td className="px-3 py-2">{deal.contacts?.name || "N/A"}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              );
            })}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">No deals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination placeholder */}
      <div className="flex items-center justify-between mt-4 px-4 py-2 text-sm text-gray-600 border-t border-gray-200">
        <span>
          {deals.length === 0 ? "No deals" : `showing 1–${deals.length} of ${deals.length}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}