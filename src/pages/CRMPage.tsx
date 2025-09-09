"use client";
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import CrmTabs from "@/components/crm/CrmTabs"; // Import the new CrmTabs component

export default function CRMPage() {
  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar className="w-64 shrink-0 border-r" />
      <section className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              CRM Hub
            </h1>
          </div>
        </div>
        <CrmTabs /> {/* Render the new CrmTabs component */}
      </section>
    </main>
  );
}