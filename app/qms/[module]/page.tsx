"use client";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { QMSToolbar } from "@/components/qms/QMSToolbar";
import { SOPTable } from "@/components/qms/tables/SOPTable";
import { CAPATable } from "@/components/qms/tables/CAPATable";
import { ChangeControlTable } from "@/components/qms/tables/ChangeControlTable";
import { TrainingTable } from "@/components/qms/tables/TrainingTable";
import { AuditLogTable } from "@/components/qms/tables/AuditLogTable";
import { VaultTable } from "@/components/qms/tables/VaultTable";
import { QMSDrawer } from "@/components/qms/QMSDrawer";
import type { QMSEntity } from "@/lib/qmsStore";

const moduleConfig = {
  "sop-register": { title: "SOP Register", TableComponent: SOPTable, entityName: "SOP" },
  capa: { title: "CAPA", TableComponent: CAPATable, entityName: "CAPA" },
  "change-control": { title: "Change Control", TableComponent: ChangeControlTable, entityName: "Change" },
  training: { title: "Training", TableComponent: TrainingTable, entityName: "Training" },
  "audit-log": { title: "Audit Log", TableComponent: AuditLogTable, entityName: "Event" },
  vault: { title: "Vault", TableComponent: VaultTable, entityName: "File" },
} as const;

type ModuleKey = keyof typeof moduleConfig;

export default function QMSPage() {
  // Safely read the route param and coerce to our union
  const raw = useParams<{ module?: string | string[] }>();
  const moduleKey = (Array.isArray(raw?.module) ? raw?.module?.[0] : raw?.module) as ModuleKey ?? "sop-register";

  const config = useMemo(() => moduleConfig[moduleKey], [moduleKey]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QMSEntity | null>(null);

  const handleRowClick = (item: QMSEntity) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleAddNew = () => {
    const tempId = `temp-${Date.now()}`;
    let newItem: QMSEntity;

    switch (moduleKey) {
      case "sop-register":
        newItem = {
          id: tempId,
          sopNumber: "",
          title: "",
          version: "",
          status: "",
          owner: "",
          trainingProgress: 0,
          fileCount: 0,
        };
        break;
      case "capa":
        newItem = {
          id: tempId,
          capaId: "",
          issue: "",
          rootCause: "",
          status: "",
          linkedSop: "",
          owner: "",
          updatesCount: 0,
        };
        break;
      case "change-control":
        newItem = {
          id: tempId,
          changeId: "",
          description: "",
          impactAssessment: "",
          status: "",
          linkedEntity: "",
          owner: "",
        };
        break;
      case "training":
        newItem = {
          id: tempId,
          user: "",
          sopAssigned: "",
          status: "",
          signature: false,
        };
        break;
      case "audit-log":
        newItem = {
          id: tempId,
          eventId: "",
          entity: "",
          action: "",
          user: "",
          timestamp: new Date().toISOString(),
        };
        break;
      case "vault":
        newItem = {
          id: tempId,
          fileName: "",
          linkedEntity: "",
          type: "",
          uploadedBy: "",
          dateUploaded: new Date().toISOString(),
        };
        break;
      default:
        throw new Error(`Unknown QMS module: ${String(moduleKey)}`);
    }

    setSelectedItem(newItem);
    setDrawerOpen(true);
  };

  const handleDrawerSaved = (_updatedItem: QMSEntity) => {
    setDrawerOpen(false);
  };

  if (!config) {
    return <div className="p-6">Module not found.</div>;
  }

  const { TableComponent } = config;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-3xl font-bold text-slate-900">{config.title}</h1>
      </div>
      <QMSToolbar entityName={config.entityName} onNewClick={handleAddNew} />
      <main className="flex-1 p-6 overflow-y-auto">
        <TableComponent onRowClick={handleRowClick} />
      </main>
      <QMSDrawer
        item={selectedItem}
        module={moduleKey}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleDrawerSaved}
      />
    </div>
  );
}
