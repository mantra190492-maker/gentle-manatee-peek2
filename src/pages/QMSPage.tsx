"use client";
import { useParams, useSearchParams, useNavigate } from "react-router-dom"; // Changed from next/navigation, added useSearchParams, useNavigate
import { useState, useMemo, useEffect } from "react";
import { QMSToolbar } from "@/components/qms/QMSToolbar";
import { SOPTable } from "@/components/qms/tables/SOPTable";
import { CAPATable } from "@/components/qms/tables/CAPATable";
import { ChangeControlTable } from "@/components/qms/tables/ChangeControlTable";
import { TrainingTable } from "@/components/qms/tables/TrainingTable";
import { AuditLogTable } from "@/components/qms/tables/AuditLogTable";
import { VaultTable } from "@/components/qms/tables/VaultTable";
import { QMSDrawer } from "@/components/qms/QMSDrawer";
import type { QMSEntity } from "@/lib/qmsStore";
import { Sidebar } from "@/components/Sidebar"; // Use the common Sidebar
import { Topbar } from "@/components/Topbar";

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
  const { module } = useParams<{ module: ModuleKey }>(); // Use useParams from react-router-dom
  const moduleKey: ModuleKey = module ?? "sop-register"; // Default to sop-register
  const [searchParams, setSearchParams] = useSearchParams(); // For URL parameters
  const navigate = useNavigate(); // For URL manipulation

  const config = useMemo(() => moduleConfig[moduleKey], [moduleKey]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QMSEntity | null>(null);

  const handleRowClick = (item: QMSEntity) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const createNewItem = (tempId: string): QMSEntity => {
    switch (moduleKey) {
      case "sop-register":
        return {
          id: tempId,
          sopNumber: "",
          title: "",
          version: "",
          status: "Draft",
          owner: "",
          trainingProgress: 0,
          fileCount: 0,
        };
      case "capa":
        return {
          id: tempId,
          capaId: "",
          issue: "",
          rootCause: "",
          status: "Open",
          linkedSop: "",
          owner: "",
          updatesCount: 0,
        };
      case "change-control":
        return {
          id: tempId,
          changeId: "",
          description: "",
          impactAssessment: "",
          status: "Proposed",
          linkedEntity: "",
          owner: "",
        };
      case "training":
        return {
          id: tempId,
          user: "",
          sopAssigned: "",
          status: "Not Started",
          signature: false,
        };
      case "audit-log":
        return {
          id: tempId,
          eventId: "",
          entity: "",
          action: "",
          user: "",
          timestamp: new Date().toISOString(),
        };
      case "vault":
        return {
          id: tempId,
          fileName: "",
          linkedEntity: "",
          type: "",
          uploadedBy: "",
          dateUploaded: new Date().toISOString(),
        };
      default:
        throw new Error(`Unknown QMS module: ${String(moduleKey)}`);
    }
  };

  const handleAddNew = () => {
    const tempId = `temp-${Date.now()}`;
    const newItem = createNewItem(tempId);
    setSelectedItem(newItem);
    setDrawerOpen(true);
  };

  const handleDrawerSaved = (_updatedItem: QMSEntity) => {
    setDrawerOpen(false);
    // In a real app, you'd refresh the table data here
  };

  // Effect to handle 'action=newItem' URL parameter
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "newItem" && !drawerOpen) {
      handleAddNew();
      // Remove the action parameter from the URL to prevent re-triggering
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("action");
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, drawerOpen, navigate, handleAddNew]); // Added handleAddNew to dependencies

  if (!config) {
    return <div className="p-6">Module not found.</div>;
  }

  const { TableComponent } = config;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar /> {/* Use the common Topbar */}
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
    </div>
  );
}