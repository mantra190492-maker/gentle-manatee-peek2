"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronRight, CheckCircle2, XCircle } from "lucide-react"; // Added XCircle import
import { listSpecsByProduct, createDraft } from "@/server/labels/service";
import type { LabelSpec } from "@/server/labels/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function LabelSpecIndexPage() {
  const navigate = useNavigate();
  const [specs, setSpecs] = useState<LabelSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState("mock-product-id-123"); // Mock product ID for now

  const fetchSpecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSpecs = await listSpecsByProduct(productId);
      setSpecs(fetchedSpecs);
    } catch (err: any) {
      setError(err.message || "Failed to fetch label specs.");
      toast.error(err.message || "Failed to fetch label specs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSpecs();
  }, [productId]);

  const handleCreateNewSpec = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newSpec = await createDraft(productId, user?.id);
      toast.success(`New draft spec V${newSpec.version} created!`);
      navigate(`/labels/${newSpec.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create new spec.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpecClick = (specId: string) => {
    navigate(`/labels/${specId}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Label Spec Generator</h1>
          <Button onClick={handleCreateNewSpec} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" /> New Label Spec
          </Button>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          {error && <div className="text-center text-rose-500 mb-4">{error}</div>}
          {loading && specs.length === 0 ? (
            <div className="text-center text-gray-500 py-6">Loading label specifications...</div>
          ) : specs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
              No label specifications found for this product. Click "New Label Spec" to create one.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Version</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Status</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">QA Approved</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Created At</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Approved At</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec) => (
                      <tr
                        key={spec.id}
                        className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => handleSpecClick(spec.id)}
                      >
                        <td className="px-3 py-2 text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            V{spec.version}
                          </div>
                        </td>
                        <td className="px-3 py-2 capitalize">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", {
                            "bg-blue-100 text-blue-800 border-blue-200": spec.status === "draft",
                            "bg-emerald-100 text-emerald-800 border-emerald-200": spec.status === "approved",
                            "bg-gray-100 text-gray-800 border-gray-200": spec.status === "retired",
                          })}>
                            {spec.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {spec.qa_approved_flag ? ( // Corrected property name
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{format(new Date(spec.created_at), "MMM d, yyyy p")}</td>
                        <td className="px-3 py-2 text-gray-600">{spec.approved_at ? format(new Date(spec.approved_at), "MMM d, yyyy p") : "N/A"}</td>
                        <td className="px-3 py-2 text-gray-600">{spec.created_by || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}