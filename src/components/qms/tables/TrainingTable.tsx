"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { Training } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function TrainingTable({ onRowClick }: { onRowClick: (item: Training) => void }) {
  const [tempData, setTempData] = useState<Training[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      user: `User ${i + 1}`,
      sopAssigned: `SOP-${100 + (i % 5)}`,
      status: i % 3 === 0 ? "Not Started" : i % 3 === 1 ? "In Progress" : "Completed",
      assignedDate: `2024-06-${(i % 28) + 1}`,
      completedDate: i % 2 === 0 ? `2024-07-${(i % 28) + 1}` : undefined,
      signature: i % 2 === 0,
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "user", header: "User" },
    { accessor: "sopAssigned", header: "SOP Assigned" },
    { accessor: "status", header: "Status", type: "status" },
    { accessor: "assignedDate", header: "Assigned Date", type: "date" },
    { accessor: "completedDate", header: "Completed Date", type: "date" },
    { accessor: "signature", header: "Signature ✔️", type: "signature" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="training"
    />
  );
}