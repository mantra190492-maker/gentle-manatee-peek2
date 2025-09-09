"use client";
import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SupplierTable } from "@/components/suppliers/SupplierTable.tsx"; // Added .tsx extension
import { getSuppliers } from "@/lib/suppliers/api.ts"; // Added .ts extension
import type { Supplier } from "@/lib/suppliers/types.ts"; // Added .ts extension
import { useNavigate } from "react-router-dom";

export default function SuppliersIndexPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      if (data) {
        setSuppliers(data);
      } else {
        setError("Failed to fetch suppliers.");
      }
      setLoading(false);
    };
    void fetchSuppliers();
  }, []);

  const handleRowClick = (supplier: Supplier) => {
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleNewInviteClick = () => {
    navigate("/suppliers/new");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Supplier Onboarding & Scorecards</h1>
          <Button onClick={handleNewInviteClick} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Invite Supplier
          </Button>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          {loading && <div className="text-center text-slate-500">Loading suppliers...</div>}
          {error && <div className="text-center text-rose-500">{error}</div>}
          {!loading && !error && (
            <SupplierTable suppliers={suppliers} onRowClick={handleRowClick} />
          )}
        </main>
      </div>
    </div>
  );
}