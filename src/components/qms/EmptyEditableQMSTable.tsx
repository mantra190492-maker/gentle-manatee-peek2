"use client";
import React, { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Download, File, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QMSStatusPill } from "./QMSStatusPill";
import { UpdateBubble } from "@/components/crm/UpdateBubble"; // Reusing CRM's UpdateBubble
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Keep Calendar for now, as it's not directly replaced by DateInput in table cells
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SOPStatus, CAPAStatus, ChangeControlStatus, TrainingStatus } from "@/lib/qmsStore";
import type { AllStatus } from "./QMSStatusPill"; // Import AllStatus type
import DateInput from "@/components/common/DateInput"; // Import the new DateInput

// Define a generic column type for the table
export interface QMSColumn {
  accessor: string;
  header: string;
  type?: "text" | "status" | "date" | "progress" | "file" | "update" | "signature" | "download" | "select";
  options?: string[]; // For select type
}

export function EmptyEditableQMSTable({
  columns,
  data,
  setData,
  onRowClick,
  module,
}: {
  columns: QMSColumn[];
  data: any[]; // Can be SOP, CAPA, etc.
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  onRowClick: (item: any) => void;
  module: string; // e.g., "sop-register", "capa"
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && editingCell) {
      inputRef.current.focus();
    }
  }, [editingCell]);

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
      setSelectedRows(new Set(data.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleCellChange = (id: string, field: string, value: any) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
    field: string
  ) => {
    if (e.key === "Enter") {
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const getStatusOptions = (module: string): string[] => {
    switch (module) {
      case "sop-register":
        return ["Draft", "Approved", "Expired"];
      case "capa":
        return ["Open", "In Progress", "Closed"];
      case "change-control":
        return ["Proposed", "Approved", "Rejected", "Implemented"];
      case "training":
        return ["Not Started", "In Progress", "Completed"];
      default:
        return [];
    }
  };

  const renderCell = (row: any, column: QMSColumn) => {
    const value = row[column.accessor];
    const isEditing = editingCell?.id === row.id && editingCell.field === column.accessor;

    switch (column.type) {
      case "status":
        const statusOptions = getStatusOptions(module);
        return (
          <Select
            value={value}
            onValueChange={(val: SOPStatus | CAPAStatus | ChangeControlStatus | TrainingStatus | "") =>
              handleCellChange(row.id, column.accessor, val)
            }
          >
            <SelectTrigger className="h-7 w-28 px-2 py-0.5 text-xs border-gray-300 rounded-full bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <SelectValue placeholder={value ? <QMSStatusPill status={value} /> : <QMSStatusPill status={""} />} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s || "empty"} value={s}>
                  <QMSStatusPill status={s as AllStatus} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <DateInput
            value={value ? new Date(value) : undefined}
            onChange={(date) =>
              handleCellChange(row.id, column.accessor, date ? format(date, "yyyy-MM-dd") : undefined)
            }
            placeholder="Set Date"
            buttonClassName="h-7 w-full justify-start text-left font-normal px-2 py-0.5 text-xs border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md"
          />
        );
      case "progress":
        return <Progress value={value} className="w-24 h-2" />;
      case "file":
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <File className="w-4 h-4" /> {value}
          </div>
        );
      case "update":
        return <UpdateBubble count={value} />;
      case "signature":
        return value ? <Check className="w-5 h-5 text-emerald-600" /> : <span className="text-gray-400">-</span>;
      case "download":
        return (
          <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
          </Button>
        );
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val: string) => handleCellChange(row.id, column.accessor, val)}
          >
            <SelectTrigger className="h-8 px-2 py-1 text-sm border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md">
              <SelectValue placeholder={value || `Select ${column.header}`} />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default: // "text" type or default
        return isEditing ? (
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => handleCellChange(row.id, column.accessor, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => handleInputKeyDown(e, row.id, column.accessor)}
            className="h-8 px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md"
          />
        ) : (
          <span
            onClick={() => setEditingCell({ id: row.id, field: column.accessor })}
            className="flex-1 cursor-text min-w-[50px] block"
          >
            {value || "—"}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
              <th className="w-12 px-3 py-2 text-left">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
                />
              </th>
              {columns.map((col) => (
                <th key={col.accessor} className="px-3 py-2 text-left text-gray-600 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isSelected = selectedRows.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group",
                    isSelected && "bg-emerald-50 border-l-4 border-emerald-600"
                  )}
                >
                  <td className="w-12 px-3 py-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                      aria-label={`Select row ${row[columns[0].accessor]}`}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-3 py-2" onClick={() => onRowClick(row)}>
                      {col.accessor === columns[0].accessor ? ( // First column gets the chevron
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          {renderCell(row, col)}
                        </div>
                      ) : (
                        renderCell(row, col)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-gray-400 py-6">No items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 px-4 py-2 text-sm text-gray-600 border-t border-gray-200">
        <span>
          {data.length === 0 ? "No items" : `showing 1–${data.length} of ${data.length}`}
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