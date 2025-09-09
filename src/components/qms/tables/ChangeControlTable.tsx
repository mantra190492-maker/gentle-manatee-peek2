"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { ChangeControl } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function ChangeControlTable({ onRowClick }: { onRowClick: (item: ChangeControl) => void }) {
  const [tempData, setTempData] = useState<ChangeControl[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      changeId: `CC-${300 + i}`,
      description: `Change description ${i + 1}`,
      impactAssessment: `Impact assessment for change ${i + 1}`,
      status: i % 4 === 0 ? "Proposed" : i % 4 === 1 ? "Approved" : i % 4 === 2 ? "Rejected" : "Implemented",
      linkedEntity: `Product A-${i % 3}`,
      owner: `Owner ${i + 1}`,
      approvalDate: `2024-07-${(i % 28) + 1}`,
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "changeId", header: "Change ID" },
    { accessor: "description", header: "Description" },
    { accessor: "impactAssessment", header: "Impact Assessment" },
    { accessor: "status", header: "Status", type: "status" },
    { accessor: "linkedEntity", header: "Linked Entity" },
    { accessor: "owner", header: "Owner" },
    { accessor: "approvalDate", header: "Approval Date", type: "date" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="change-control"
    />
  );
}