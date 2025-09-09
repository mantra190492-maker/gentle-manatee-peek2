"use client";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./RiskBadge.tsx"; // Added .tsx extension
import type { Supplier, SupplierStatus, SupplierType } from "@/lib/suppliers/types.ts"; // Added .ts extension
import { useNavigate } from "react-router-dom";

interface SupplierTableProps {
  suppliers: Supplier[];
  onRowClick: (supplier: Supplier) => void;
}

const statusColors: Record<SupplierStatus, string> = {
  "Pending Invite": "bg-gray-100 text-gray-800 border-gray-200",
  "Invited": "bg-blue-100 text-blue-800 border-blue-200",
  "Drafting": "bg-amber-100 text-amber-800 border-amber-200",
  "Submitted": "bg-purple-100 text-purple-800 border-purple-200",
  "Under Review": "bg-sky-100 text-sky-800 border-sky-200",
  "Approved": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Conditional": "bg-orange-100 text-orange-800 border-orange-200",
  "Rejected": "bg-rose-100 text-rose-800 border-rose-200",
  "Inactive": "bg-gray-100 text-gray-800 border-gray-200",
};

export function SupplierTable({ suppliers, onRowClick }: SupplierTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleRowSelect = (id: string, isSelected: boolean) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRows(new Set(suppliers.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const renderStatusPill = (status: SupplierStatus) => (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", statusColors[status])}>
      {status}
    </span>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
              <th className="w-12 px-3 py-2 text-left">
                <Checkbox
                  checked={selectedRows.size === suppliers.length && suppliers.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Legal Name</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Type</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Status</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Risk Score</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">PO Blocked</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Country</th>
              <th className="px-3 py-2 text-left text-gray-600 font-semibold">Created At</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => {
              const isSelected = selectedRows.has(supplier.id);
              return (
                <tr
                  key={supplier.id}
                  className={cn(
                    "h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group",
                    isSelected && "bg-emerald-50 border-l-4 border-emerald-600"
                  )}
                >
                  <td className="w-12 px-3 py-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(supplier.id, checked as boolean)}
                      aria-label={`Select row ${supplier.legal_name}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-900 font-medium cursor-pointer" onClick={() => onRowClick(supplier)}>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      {supplier.legal_name} {supplier.dba && <span className="text-xs text-gray-500">({supplier.dba})</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 capitalize">{supplier.type}</td>
                  <td className="px-3 py-2">{renderStatusPill(supplier.status)}</td>
                  <td className="px-3 py-2"><RiskBadge score={supplier.risk_score} /></td>
                  <td className="px-3 py-2">
                    {supplier.po_blocked ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Blocked</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Open</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{supplier.country || "N/A"}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              );
            })}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-6">No suppliers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 px-4 py-2 text-sm text-gray-600 border-t border-gray-200">
        <span>
          {suppliers.length === 0 ? "No suppliers" : `showing 1–${suppliers.length} of ${suppliers.length}`}
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