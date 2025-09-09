"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { AuditLog } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function AuditLogTable({ onRowClick }: { onRowClick: (item: AuditLog) => void }) {
  const [tempData, setTempData] = useState<AuditLog[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      eventId: `AUDIT-${400 + i}`,
      entity: i % 2 === 0 ? "SOP" : "CAPA",
      action: i % 3 === 0 ? "Created" : i % 3 === 1 ? "Updated" : "Deleted",
      user: `Admin ${i % 2 === 0 ? "A" : "B"}`,
      timestamp: new Date(Date.now() - i * 3600 * 1000).toISOString(), // Recent timestamps
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "eventId", header: "Event ID" },
    { accessor: "entity", header: "Entity" },
    { accessor: "action", header: "Action" },
    { accessor: "user", header: "User" },
    { accessor: "timestamp", header: "Timestamp" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="audit-log"
    />
  );
}