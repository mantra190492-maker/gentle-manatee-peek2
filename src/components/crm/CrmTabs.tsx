"use client";
import React, { useMemo } from "react"; // Explicitly import React
import { useNavigate, useSearchParams } from "react-router-dom";
import CrmTasksContent from "@/modules/crm/CrmTasksContent";
import ContactsList from "@/modules/crm/contacts/ContactsList";
import { cn } from "@/lib/utils"; // Import cn for utility classes
// Removed: import dynamic from "next/dynamic"; // Not needed in a pure React app

// Dynamically import new components
const DealsRoot = React.lazy(() => import("@/modules/crm/deals/DealsRoot.tsx"));
const ReportsRoot = React.lazy(() => import("@/modules/crm/reports/ReportsRoot.tsx"));

type TabKey = "tasks" | "contacts" | "deals" | "reports";

const TABS: { key: TabKey; label: string }[] = [
  { key: "tasks", label: "Tasks" },
  { key: "contacts", label: "Contacts" },
  { key: "deals", label: "Deals" },
  { key: "reports", label: "Reports" },
];

export default function CrmTabs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || "tasks";

  function setTab(next: TabKey) {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("tab", next);
    navigate(`/crm?${newSearchParams.toString()}`);
  }

  const Content = useMemo(() => {
    switch (tab) {
      case "contacts":
        return <ContactsList />;
      case "deals":
        return <React.Suspense fallback={<div className="p-6 text-center text-gray-500">Loading Deals...</div>}><DealsRoot /></React.Suspense>;
      case "reports":
        return <React.Suspense fallback={<div className="p-6 text-center text-gray-500">Loading Reports...</div>}><ReportsRoot /></React.Suspense>;
      case "tasks":
      default:
        return <CrmTasksContent />;
    }
  }, [tab]);

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 pt-4 bg-white">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 pb-3 text-sm font-medium relative",
              tab === t.key
                ? "text-emerald-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-emerald-600"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {Content}
      </div>
    </div>
  );
}