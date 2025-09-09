"use client";
import { useState } from "react";
import { EmptyEditableQMSTable } from "@/components/qms/EmptyEditableQMSTable";
import type { VaultFile } from "@/lib/qmsStore";
import type { QMSColumn } from "@/components/qms/EmptyEditableQMSTable";

const initialRows = 12;

export function VaultTable({ onRowClick }: { onRowClick: (item: VaultFile) => void }) {
  const [tempData, setTempData] = useState<VaultFile[]>(() =>
    Array.from({ length: initialRows }).map((_, i) => ({
      id: `temp-${i}`,
      fileName: `Document_${i + 1}.pdf`,
      linkedEntity: `SOP-${100 + (i % 5)}`,
      type: i % 3 === 0 ? "Document" : i % 3 === 1 ? "Image" : "Spreadsheet",
      uploadedBy: `User ${i + 1}`,
      dateUploaded: new Date(Date.now() - i * 86400 * 1000).toISOString(), // Older timestamps
    }))
  );

  const columns: QMSColumn[] = [
    { accessor: "fileName", header: "File Name" },
    { accessor: "linkedEntity", header: "Linked Entity" },
    { accessor: "type", header: "Type", type: "select", options: ["Document", "Image", "Spreadsheet", "Presentation", "Other"] },
    { accessor: "uploadedBy", header: "Uploaded By" },
    { accessor: "dateUploaded", header: "Date Uploaded", type: "date" },
    { accessor: "download", header: "Download", type: "download" },
  ];

  return (
    <EmptyEditableQMSTable
      columns={columns}
      data={tempData}
      setData={setTempData}
      onRowClick={onRowClick}
      module="vault"
    />
  );
}