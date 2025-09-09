"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { listBatches, createBatch } from "@/server/batches/service";
import type { Batch, Disposition } from "@/types/batches/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BatchDispositionPill } from "@/components/batches/BatchDispositionPill"; // New component

const dispositionOptions: (Disposition | "All")[] = [
  "All", "Pending", "Released", "Quarantined", "On Hold", "Rejected", "Recalled"
];

export default function BatchesIndexPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState<Disposition | "All">("All");

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedBatches = await listBatches({
        q: searchQuery,
        disposition: dispositionFilter,
      });
      setBatches(fetchedBatches);
    } catch (err: any) {
      setError(err.message || "Failed to fetch batches.");
      toast.error(err.message || "Failed to fetch batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBatches();
  }, [searchQuery, dispositionFilter]);

  const handleCreateNewBatch = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const lot = `LOT-${Date.now()}`;
      const newBatch = await createBatch({
        lot_code: lot,
        sku: "NEW-SKU",
        manufacturer: "New Manufacturer",
        mfg_date: today,
        quantity: 100,
        uom: "units",
        disposition: "Pending",
        spec_id: null, // Can be linked later
      });
      if (newBatch) {
        toast.success(`Batch ${newBatch.lot_code} created!`);
        navigate(`/batches/${newBatch.id}`);
      }
    } catch (e: any) {
      toast.error(`Failed to create batch: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = (batchId: string) => {
    navigate(`/batches/${batchId}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Batch & Lot Traceability</h1>
          <Button onClick={handleCreateNewBatch} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" /> New Batch
          </Button>
        </div>
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[150px] max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search lot, SKU, manufacturer..."
                className="pl-8 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500 h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={dispositionFilter} onValueChange={(val: Disposition | "All") => setDispositionFilter(val)}>
              <SelectTrigger className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by Disposition" />
              </SelectTrigger>
              <SelectContent>
                {dispositionOptions.map(disp => (
                  <SelectItem key={disp} value={disp}>
                    {disp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchBatches} disabled={loading} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          {error && <div className="text-center text-rose-500 mb-4">{error}</div>}
          {loading && batches.length === 0 ? (
            <div className="text-center text-gray-500 py-6">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
              No batches found. Click "New Batch" to add one.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Lot Code</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">SKU</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Manufacturer</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Mfg Date</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Expiry Date</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Quantity</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Disposition</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-semibold">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr
                        key={batch.id}
                        className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => handleBatchClick(batch.id)}
                      >
                        <td className="px-3 py-2 text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            {batch.lot_code}
                          </div>
                        </td>
                        <td className="px-3 py-2">{batch.sku}</td>
                        <td className="px-3 py-2">{batch.manufacturer}</td>
                        <td className="px-3 py-2">{format(new Date(batch.mfg_date), "MMM d, yyyy")}</td>
                        <td className="px-3 py-2">{batch.expiry_date ? format(new Date(batch.expiry_date), "MMM d, yyyy") : "N/A"}</td>
                        <td className="px-3 py-2">{batch.quantity} {batch.uom}</td>
                        <td className="px-3 py-2"><BatchDispositionPill disposition={batch.disposition} /></td>
                        <td className="px-3 py-2 text-gray-600">{format(new Date(batch.last_updated), "MMM d, yyyy p")}</td>
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