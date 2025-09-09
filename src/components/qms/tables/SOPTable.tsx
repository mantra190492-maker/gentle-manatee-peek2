"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { SOP } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function SOPTable({ onRowClick }: { onRowClick: (item: SOP) => void }) {
  const [tempData, setTempData] = useState<SOP[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      sopNumber: `SOP-${100 + i}`,
      title: `Standard Operating Procedure ${i + 1}`,
      version: `1.0.${i}`,
      status: i % 3 === 0 ? "Draft" : i % 3 === 1 ? "Approved" : "Expired",
      owner: `Owner ${i + 1}`,
      effectiveDate: `2024-01-${(i % 28) + 1}`,
      reviewDate: `2025-01-${(i % 28) + 1}`,
      trainingProgress: (i * 10) % 100,
      fileCount: i % 5,
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "sopNumber", header: "SOP #" },
    { accessor: "title", header: "Title" },
    { accessor: "version", header: "Version" },
    { accessor: "status", header: "Status", type: "status" },
    { accessor: "owner", header: "Owner" },
    { accessor: "effectiveDate", header: "Effective Date", type: "date" },
    { accessor: "reviewDate", header: "Review Date", type: "date" },
    { accessor: "trainingProgress", header: "Training %", type: "progress" },
    { accessor: "fileCount", header: "Files", type: "file" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="sop-register"
    />
  );
}