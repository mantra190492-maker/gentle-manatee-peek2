"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { CAPA } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function CAPATable({ onRowClick }: { onRowClick: (item: CAPA) => void }) {
  const [tempData, setTempData] = useState<CAPA[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      capaId: `CAPA-${200 + i}`,
      issue: `Issue description ${i + 1}`,
      rootCause: `Root cause ${i + 1}`,
      status: i % 3 === 0 ? "Open" : i % 3 === 1 ? "In Progress" : "Closed",
      linkedSop: `SOP-${100 + (i % 5)}`,
      owner: `Owner ${i + 1}`,
      targetCloseDate: `2024-08-${(i % 28) + 1}`,
      updatesCount: i % 4,
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "capaId", header: "CAPA ID" },
    { accessor: "issue", header: "Issue" },
    { accessor: "rootCause", header: "Root Cause" },
    { accessor: "status", header: "Status", type: "status" },
    { accessor: "linkedSop", header: "Linked SOP" },
    { accessor: "owner", header: "Owner" },
    { accessor: "targetCloseDate", header: "Target Close Date", type: "date" },
    { accessor: "updatesCount", header: "Updates", type: "update" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="capa"
    />
  );
}