"use client";
import React from "react";
import { useParams } from "react-router-dom";
import ContactDetail from "@/modules/crm/contacts/ContactDetail";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-rose-500">
            Contact ID is missing.
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
        <ContactDetail id={id} />
      </div>
    </div>
  );
}