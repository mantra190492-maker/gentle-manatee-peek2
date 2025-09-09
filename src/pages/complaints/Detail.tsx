"use client";
import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ComplaintDetail from "@/modules/complaints/ComplaintDetail";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  if (!id) {
    return (
      <div className="flex h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-rose-500">
            Complaint ID is missing.
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <ComplaintDetail id={id} initialTab={initialTab} />
      </div>
    </div>
  );
}