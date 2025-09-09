"use client";
import React from "react";
import ComplaintsList from "@/modules/complaints/ComplaintsList";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function ComplaintsIndexPage() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <ComplaintsList />
      </div>
    </div>
  );
}