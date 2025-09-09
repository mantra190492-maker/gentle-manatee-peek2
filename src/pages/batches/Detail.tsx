"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Download, AlertCircle, Pencil } from "lucide-react";
import {
  getBatch,
  updateBatchMeta,
  setDisposition,
  addChainEvent,
  addShipment,
  generateTraceReport,
  generateRecallReportForSKU,
} from "@/server/batches/service";
import { getSpecWithContent } from "@/server/labels/service";
import type {
  Batch,
  BatchAttribute,
  BatchTest,
  CoAFile,
  Shipment,
  ChainEvent,
  Disposition,
  ChainEventType,
} from "@/types/batches/types";
import type { LabelSpecWithContent } from "@/server/labels/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isBefore, addYears } from "date-fns";
import { BatchDispositionPill } from "@/components/batches/BatchDispositionPill";
import { BatchTestTable } from "@/components/batches/BatchTestTable";
import { BatchCoAUpload } from "@/components/batches/BatchCoAUpload";
import { BatchQCSummary } from "@/components/batches/BatchQCSummary";
import { BatchQRGenerator } from "@/components/batches/BatchQRGenerator";
import { BatchAttributeEditor } from "@/components/batches/BatchAttributeEditor";
import { BatchShipmentItem } from "@/components/batches/BatchShipmentItem";
import BatchChainEventItem from "@/components/batches/BatchChainEventItem";
import Papa from "papaparse";

const dispositionOptions: Disposition[] = [
  "Pending",
  "Released",
  "Quarantined",
  "On Hold",
  "Rejected",
  "Recalled",
];

const chainEventTypes: ChainEventType[] = [
  "Manufactured",
  "Received",
  "QC Sampled",
  "QC Passed",
  "QC Failed",
  "Labeled",
  "Packed",
  "Shipped",
  "Return",
  "Destroyed",
];

// ---- Normalized UI type + helper ----
type UIBatch = Batch & {
  attributes: BatchAttribute[];
  tests: BatchTest[];
  coa_files: CoAFile[];
  shipments: Shipment[];
  chain_events: ChainEvent[];
};

function normalizeBatch(fetched: any): UIBatch {
  return {
    ...fetched,
    attributes: fetched.batch_attributes ?? [], // Use batch_attributes from DB
    tests: fetched.batch_tests ?? [], // Use batch_tests from DB
    coa_files: fetched.coa_files ?? [],
    shipments: fetched.shipments ?? [],
    chain_events: fetched.chain_events ?? [],
  };
}
// -------------------------------------

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<UIBatch | null>(null);

  const [linkedSpec, setLinkedSpec] = useState<LabelSpecWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editMetaData, setEditMetaData] = useState<Partial<Batch>>({});
  const [newDisposition, setNewDisposition] = useState<Disposition | "">("");
  const [dispositionNote, setDispositionNote] = useState("");
  const [isChangingDisposition, setIsChangingDisposition] = useState(false);
  const [newChainEventType, setNewChainEventType] = useState<ChainEventType | "">("");
  const [newChainEventDetail, setNewChainEventDetail] = useState("");
  const [isAddingChainEvent, setIsAddingChainEvent] = useState(false);
  const [newShipmentData, setNewShipmentData] = useState<Partial<Shipment>>({
    to_party: "",
    shipped_on: format(new Date(), "yyyy-MM-dd"),
    qty: 0,
    uom: "units",
  });
  const [isAddingShipment, setIsAddingShipment] = useState(false);

  const fetchBatchData = useCallback(async () => {
    if (!id) {
      setError("Batch ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetched = await getBatch(id);
      if (fetched) {
        const normalized = normalizeBatch(fetched);
        setBatch(normalized); // Corrected: Use normalized data
        setEditMetaData({
          lot_code: normalized.lot_code,
          sku: normalized.sku,
          manufacturer: normalized.manufacturer,
          mfg_site: normalized.mfg_site,
          mfg_date: normalized.mfg_date,
          expiry_date: normalized.expiry_date,
          quantity: normalized.quantity,
          uom: normalized.uom,
        });
        setNewDisposition(normalized.disposition);

        const spec = await getSpecWithContent((normalized as any).spec_id);
        setLinkedSpec(spec ?? null);
      } else {
        setError("Failed to fetch batch details.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load batch data.");
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchBatchData();
  }, [fetchBatchData]);

  const handleSaveMeta = async () => {
    if (!id || !batch) return;
    setIsSaving(true);
    try {
      await updateBatchMeta(id, editMetaData as any);
      toast.success("Batch metadata updated!");
      setIsEditingMeta(false);
      void fetchBatchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save metadata.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeDisposition = async () => {
    if (!id || !newDisposition) {
      toast.error("Please select a disposition.");
      return;
    }
    setIsChangingDisposition(true);
    try {
      await setDisposition(id, newDisposition as Disposition, dispositionNote);
      toast.success("Batch disposition updated!");
      setDispositionNote("");
      void fetchBatchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to change disposition.");
    } finally {
      setIsChangingDisposition(false);
    }
  };

  const handleAddChainEvent = async () => {
    if (!id || !newChainEventType) {
      toast.error("Please select an event type.");
      return;
    }
    setIsAddingChainEvent(true);
    try {
      await addChainEvent(id, newChainEventType as ChainEventType, newChainEventDetail);
      toast.success("Chain event added!");
      setNewChainEventType("");
      setNewChainEventDetail("");
      void fetchBatchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add chain event.");
    } finally {
      setIsAddingChainEvent(false);
    }
  };

  const handleAddShipment = async () => {
    if (!id || !newShipmentData.to_party || !newShipmentData.shipped_on || !newShipmentData.qty) {
      toast.error("Recipient, ship date, and quantity are required for shipment.");
      return;
    }
    setIsAddingShipment(true);
    try {
      await addShipment(id, newShipmentData as any);
      toast.success("Shipment added!");
      setNewShipmentData({
        to_party: "",
        shipped_on: format(new Date(), "yyyy-MM-dd"),
        qty: 0,
        uom: "units",
      });
      void fetchBatchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add shipment.");
    } finally {
      setIsAddingShipment(false);
    }
  };

  const handleExportTraceReport = async () => {
    if (!id || !batch) return;
    try {
      const { rows } = await generateTraceReport(id);
      if (rows.length === 0) {
        toast.info("No data to export for trace report.");
        return;
      }
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trace_report_${batch.lot_code}_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Trace report downloaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate trace report.");
    }
  };

  const handleExportRecallReport = async () => {
    if (!batch?.sku) {
      toast.error("SKU is missing for recall report.");
      return;
    }
    try {
      const { rows } = await generateRecallReportForSKU(batch.sku);
      if (rows.length === 0) {
        toast.info("No data to export for recall report.");
        return;
      }
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recall_report_sku_${batch.sku}_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recall report downloaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate recall report.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">
            Loading batch details...
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-rose-500">
            {error}
          </main>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">
            Batch not found.
          </main>
        </div>
      </div>
    );
  }

  const totalShippedQty = (batch.shipments ?? []).reduce((sum, s) => sum + Number(s.qty), 0);
  const remainingQty = Number((batch as any).quantity) - totalShippedQty;

  const isExpirySoon =
    batch.expiry_date &&
    isBefore(new Date(batch.expiry_date), addYears(new Date(), 1)) &&
    isBefore(new Date(), new Date(batch.expiry_date));
  const isExpired = batch.expiry_date && isBefore(new Date(batch.expiry_date), new Date());

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Batch: {batch.lot_code}</h1>
          <div className="flex items-center gap-3">
            <BatchDispositionPill disposition={batch.disposition} />
            <Button
              onClick={() => navigate("/batches")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 h-auto rounded-md border-b border-gray-200 bg-gray-50 p-0">
              <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Summary</TabsTrigger>
              <TabsTrigger value="tests" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Tests & CoA ({batch.tests.length})</TabsTrigger>
              <TabsTrigger value="packaging" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Packaging & Labeling</TabsTrigger>
              <TabsTrigger value="shipments" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Shipments ({batch.shipments.length})</TabsTrigger>
              <TabsTrigger value="chain" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Chain of Custody ({batch.chain_events.length})</TabsTrigger>
              <TabsTrigger value="disposition" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Holds & Disposition</TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Audit</TabsTrigger>
            </TabsList>

            <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <TabsContent value="summary">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Batch Metadata</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingMeta(!isEditingMeta)}
                        className="text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> {isEditingMeta ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lot_code">Lot Code</Label>
                        {isEditingMeta ? (
                          <Input
                            id="lot_code"
                            value={editMetaData.lot_code || ""}
                            onChange={(e) => setEditMetaData({ ...editMetaData, lot_code: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-700">{batch.lot_code}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sku">SKU</Label>
                        {isEditingMeta ? (
                          <Input
                            id="sku"
                            value={editMetaData.sku || ""}
                            onChange={(e) => setEditMetaData({ ...editMetaData, sku: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-700">{batch.sku}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        {isEditingMeta ? (
                          <Input
                            id="manufacturer"
                            value={editMetaData.manufacturer || ""}
                            onChange={(e) => setEditMetaData({ ...editMetaData, manufacturer: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-700">{batch.manufacturer}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mfg_site">Manufacturing Site</Label>
                        {isEditingMeta ? (
                          <Input
                            id="mfg_site"
                            value={editMetaData.mfg_site || ""}
                            onChange={(e) => setEditMetaData({ ...editMetaData, mfg_site: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-700">{batch.mfg_site || "N/A"}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mfg_date">Manufacturing Date</Label>
                        {isEditingMeta ? (
                          <Input
                            id="mfg_date"
                            type="date"
                            value={editMetaData.mfg_date || ""}
                            onChange={(e) =>
                              setEditMetaData({
                                ...editMetaData,
                                mfg_date: e.target.value || undefined,
                              })
                            }
                          />
                        ) : (
                          <p className="text-gray-700">{format(new Date(batch.mfg_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiry_date">Expiry Date</Label>
                        {isEditingMeta ? (
                          <Input
                            id="expiry_date"
                            type="date"
                            value={editMetaData.expiry_date || ""}
                            onChange={(e) =>
                              setEditMetaData({
                                ...editMetaData,
                                expiry_date: e.target.value || undefined,
                              })
                            }
                            className={cn(
                              isExpirySoon && "bg-amber-50 text-amber-800 border-amber-200",
                              isExpired && "bg-rose-50 text-rose-800 border-rose-200"
                            )}
                          />
                        ) : (
                          <p
                            className={cn(
                              "text-gray-700",
                              isExpirySoon && "text-amber-800 font-medium",
                              isExpired && "text-rose-800 font-medium"
                            )}
                          >
                            {batch.expiry_date ? format(new Date(batch.expiry_date), "MMM d, yyyy") : "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        {isEditingMeta ? (
                          <Input
                            id="quantity"
                            type="number"
                            value={Number(editMetaData.quantity ?? 0)}
                            onChange={(e) =>
                              setEditMetaData({ ...editMetaData, quantity: Number(e.target.value) })
                            }
                          />
                        ) : (
                          <p className="text-gray-700">
                            {batch.quantity} {batch.uom}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="uom">Unit of Measure</Label>
                        {isEditingMeta ? (
                          <Input
                            id="uom"
                            value={editMetaData.uom || ""}
                            onChange={(e) => setEditMetaData({ ...editMetaData, uom: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-700">{batch.uom}</p>
                        )}
                      </div>
                    </div>
                    {isEditingMeta && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditingMeta(false)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveMeta}
                          disabled={isSaving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold">Linked Label Spec</h3>
                    {linkedSpec ? (
                      <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
                        <p className="font-medium text-gray-900">
                          {linkedSpec.content?.product_name_en || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700">SKU: {batch.sku}</p>
                        <p className="text-sm text-gray-700">
                          NPN: {linkedSpec.content?.npn_number || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700">
                          Version: {linkedSpec.version} ({linkedSpec.status})
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto mt-2 text-emerald-600"
                          onClick={() => navigate(`/labels/${linkedSpec.id}`)}
                        >
                          View Label Spec
                        </Button>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No linked label spec found.</div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tests">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold">
                      Batch Tests ({batch.tests.length})
                    </h3>
                    <BatchTestTable
                      batchId={id!}
                      tests={batch.tests}
                      onTestsUpdated={fetchBatchData}
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <BatchQCSummary batch={batch} />
                    <BatchCoAUpload
                      batchId={id!}
                      coaFiles={batch.coa_files}
                      onCoAUploaded={fetchBatchData}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="packaging">
                <h3 className="text-lg font-semibold mb-4">Packaging & Labeling</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <BatchAttributeEditor
                      batchId={id!}
                      attributes={batch.attributes}
                      onAttributesUpdated={fetchBatchData}
                    />
                  </div>
                  <div className="space-y-4">
                    <BatchQRGenerator lotCode={batch.lot_code} sku={batch.sku} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shipments">
                <h3 className="text-lg font-semibold mb-4">
                  Shipments ({batch.shipments.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {batch.shipments.length === 0 ? (
                      <p className="text-gray-500">No shipments recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {batch.shipments.map((shipment) => (
                          <BatchShipmentItem key={shipment.id} shipment={shipment} />
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={handleExportTraceReport}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-2" /> Export Shipments CSV
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <div className="border border-gray-200 p-4 rounded-md bg-gray-50 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3">Add New Shipment</h4>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="to_party">Recipient / To Party</Label>
                          <Input
                            id="to_party"
                            value={newShipmentData.to_party || ""}
                            onChange={(e) =>
                              setNewShipmentData({ ...newShipmentData, to_party: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="to_address">Address (Optional)</Label>
                          <Input
                            id="to_address"
                            value={newShipmentData.to_address || ""}
                            onChange={(e) =>
                              setNewShipmentData({ ...newShipmentData, to_address: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="shipped_on">Shipped On Date</Label>
                          <Input
                            id="shipped_on"
                            type="date"
                            value={newShipmentData.shipped_on || ""}
                            onChange={(e) =>
                              setNewShipmentData({
                                ...newShipmentData,
                                shipped_on: e.target.value || undefined,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="grid gap-2">
                            <Label htmlFor="qty">Quantity</Label>
                            <Input
                              id="qty"
                              type="number"
                              value={Number(newShipmentData.qty ?? 0)}
                              onChange={(e) =>
                                setNewShipmentData({
                                  ...newShipmentData,
                                  qty: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="uom">UOM</Label>
                            <Input
                              id="uom"
                              value={newShipmentData.uom || "units"}
                              onChange={(e) =>
                                setNewShipmentData({ ...newShipmentData, uom: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reference">Reference (PO, Tracking #)</Label>
                          <Input
                            id="reference"
                            value={newShipmentData.reference || ""}
                            onChange={(e) =>
                              setNewShipmentData({ ...newShipmentData, reference: e.target.value })
                            }
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          Remaining in batch: {remainingQty} {batch.uom}
                        </div>
                        <Button
                          onClick={handleAddShipment}
                          disabled={isAddingShipment || remainingQty < Number(newShipmentData.qty ?? 0)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isAddingShipment ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Add Shipment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chain">
                <h3 className="text-lg font-semibold mb-4">
                  Chain of Custody ({batch.chain_events.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {batch.chain_events.length === 0 ? (
                      <p className="text-gray-500">No chain events recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {batch.chain_events.map((event) => (
                          <BatchChainEventItem key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={handleExportTraceReport}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-2" /> Export Trace Report CSV
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <div className="border border-gray-200 p-4 rounded-md bg-gray-50 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3">Add New Event</h4>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="chain_event_type">Event Type</Label>
                          <Select
                            value={newChainEventType}
                            onValueChange={(val: ChainEventType) => setNewChainEventType(val)}
                          >
                            <SelectTrigger id="chain_event_type">
                              <SelectValue placeholder="Select Event Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {chainEventTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="chain_event_detail">Detail (Optional)</Label>
                          <Textarea
                            id="chain_event_detail"
                            value={newChainEventDetail}
                            onChange={(e) => setNewChainEventDetail(e.target.value)}
                            rows={3}
                            className="resize-y"
                          />
                        </div>
                        <Button
                          onClick={handleAddChainEvent}
                          disabled={isAddingChainEvent || !newChainEventType}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isAddingChainEvent ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Add Event
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="disposition">
                <h3 className="text-lg font-semibold mb-4">Holds & Disposition</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border border-gray-200 p-4 rounded-md bg-gray-50 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3">Current Disposition</h4>
                      <BatchDispositionPill disposition={batch.disposition} className="text-base px-3 py-1.5" />
                      <p className="text-sm text-gray-600 mt-2">
                        Last updated: {format(new Date(batch.last_updated), "MMM d, yyyy p")}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3">Change Disposition</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Only QA personnel can set disposition to Released, Rejected, Quarantined, or Recalled.
                      </p>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="new_disposition">New Disposition</Label>
                          <Select
                            value={newDisposition}
                            onValueChange={(val: Disposition) => setNewDisposition(val)}
                          >
                            <SelectTrigger id="new_disposition">
                              <SelectValue placeholder="Select New Disposition" />
                            </SelectTrigger>
                            <SelectContent>
                              {dispositionOptions.map((disp) => (
                                <SelectItem key={disp} value={disp}>
                                  {disp}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="disposition_note">Reason / Note (Required for Recalled)</Label>
                          <Textarea
                            id="disposition_note"
                            value={dispositionNote}
                            onChange={(e) => setDispositionNote(e.target.value)}
                            rows={3}
                            className="resize-y"
                          />
                        </div>
                        <Button
                          onClick={handleChangeDisposition}
                          disabled={
                            isChangingDisposition ||
                            !newDisposition ||
                            (newDisposition === "Recalled" && !dispositionNote.trim())
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isChangingDisposition ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Update Disposition
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {batch.disposition === "Recalled" && (
                      <div className="border border-rose-200 p-4 rounded-md bg-rose-50 shadow-sm">
                        <h4 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Recall Actions
                        </h4>
                        <p className="text-sm text-rose-700 mb-4">
                          This batch is marked as Recalled. Generate a report to initiate the recall process.
                        </p>
                        <Button
                          onClick={handleExportRecallReport}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" /> Generate Recall Report CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audit">
                <h3 className="text-lg font-semibold mb-4">Audit Log</h3>
                {batch.chain_events.length === 0 ? (
                  <p className="text-gray-500">No audit events recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {batch.chain_events.map((event) => (
                      <BatchChainEventItem key={event.id} event={event} showDetail />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}