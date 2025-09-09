"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupplierDetails, updateSupplier, getSignedUrlForDocument, createApproval, createChange, createActivityLog } from "@/lib/suppliers/api";
import type { SupplierWithDetails, SupplierStatus, ApprovalDecision, Document, Change, NewChange, Approval, NewApproval } from "@/lib/suppliers/types";
import { RiskBadge } from "@/components/suppliers/RiskBadge.tsx";
import { cn } from "@/lib/utils";
import { FileText, Download, Check, X, Clock, AlertCircle, Ban, CheckCircle2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import { calculateRiskScore } from "@/lib/suppliers/risk";
import { generateSupplierScorecard } from "@/lib/suppliers/scorecard";
import { supabase } from "@/integrations/supabase/client.ts"; // Added supabase import
import DateInput from "@/components/common/DateInput"; // Import the new DateInput

// --- Sub-components for Tabs ---

interface OverviewTabProps {
  supplier: SupplierWithDetails;
  onUpdateSupplier: (updates: Partial<SupplierWithDetails>) => void;
}

const SupplierOverviewTab: React.FC<OverviewTabProps> = ({ supplier, onUpdateSupplier }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    legal_name: supplier.legal_name,
    dba: supplier.dba || '',
    country: supplier.country || '',
    po_blocked: supplier.po_blocked,
  });

  useEffect(() => {
    setEditData({
      legal_name: supplier.legal_name,
      dba: supplier.dba || '',
      country: supplier.country || '',
      po_blocked: supplier.po_blocked,
    });
  }, [supplier]);

  const handleSave = async () => {
    const changes: NewChange[] = [];
    if (editData.legal_name !== supplier.legal_name) {
      changes.push({ supplier_id: supplier.id, field: "legal_name", old_value: supplier.legal_name, new_value: editData.legal_name });
    }
    if (editData.dba !== (supplier.dba || '')) {
      changes.push({ supplier_id: supplier.id, field: "dba", old_value: supplier.dba || '', new_value: editData.dba });
    }
    if (editData.country !== (supplier.country || '')) {
      changes.push({ supplier_id: supplier.id, field: "country", old_value: supplier.country || '', new_value: editData.country });
    }
    if (editData.po_blocked !== supplier.po_blocked) {
      changes.push({ supplier_id: supplier.id, field: "po_blocked", old_value: String(supplier.po_blocked), new_value: String(editData.po_blocked) });
    }

    if (changes.length > 0) {
      for (const change of changes) {
        await createChange(change);
        await createActivityLog({ supplier_id: supplier.id, action: `Change recorded: ${change.field}`, meta_json: change });
      }
    }

    await onUpdateSupplier(editData);
    setIsEditing(false);
    toast.success("Supplier details updated.");
  };

  const expiringDocsCount = supplier.documents.filter(doc => {
    if (!doc.expires_on) return false;
    const expiryDate = new Date(doc.expires_on);
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    return expiryDate > today && expiryDate <= sixtyDaysFromNow;
  }).length;

  const expiredDocsCount = supplier.documents.filter(doc => {
    if (!doc.expires_on) return false;
    const expiryDate = new Date(doc.expires_on);
    return expiryDate <= new Date();
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">General Information</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="text-gray-700 hover:bg-gray-50">
          <Pencil className="w-4 h-4 mr-2" /> {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="legal_name">Legal Name</Label>
          {isEditing ? (
            <Input id="legal_name" value={editData.legal_name} onChange={e => setEditData({ ...editData, legal_name: e.target.value })} />
          ) : (
            <p className="text-gray-700 border-none bg-transparent shadow-none">{supplier.legal_name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="dba">DBA</Label>
          {isEditing ? (
            <Input id="dba" value={editData.dba} onChange={e => setEditData({ ...editData, dba: e.target.value })} />
          ) : (
            <p className="text-gray-700 border-none bg-transparent shadow-none">{supplier.dba || "N/A"}</p>
          )}
        </div>
        <div>
          <Label>Type</Label>
          <p className="capitalize text-gray-700 border-none bg-transparent shadow-none">{supplier.type}</p>
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          {isEditing ? (
            <Input id="country" value={editData.country} onChange={e => setEditData({ ...editData, country: e.target.value })} />
          ) : (
            <p className="text-gray-700 border-none bg-transparent shadow-none">{supplier.country || "N/A"}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", {
            "bg-emerald-100 text-emerald-800 border-emerald-200": supplier.status === "Approved",
            "bg-amber-100 text-amber-800 border-amber-200": supplier.status === "Under Review" || supplier.status === "Conditional",
            "bg-rose-100 text-rose-800 border-rose-200": supplier.status === "Rejected",
            "bg-gray-100 text-gray-800 border-gray-200": supplier.status === "Invited" || supplier.status === "Drafting" || supplier.status === "Pending Invite",
          })}>
            {supplier.status}
          </span>
        </div>
        <div>
          <Label htmlFor="po_blocked">PO Blocked</Label>
          {isEditing ? (
            <Checkbox
              id="po_blocked"
              checked={editData.po_blocked}
              onCheckedChange={(checked) => setEditData({ ...editData, po_blocked: checked as boolean })}
              className="mt-2"
            />
          ) : (
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", {
              "bg-rose-100 text-rose-800 border-rose-200": supplier.po_blocked,
              "bg-green-100 text-green-800 border-green-200": !supplier.po_blocked,
            })}>
              {supplier.po_blocked ? "Blocked" : "Open"}
            </span>
          )}
        </div>
      </div>
      {isEditing && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setIsEditing(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-800">Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
        </div>
      )}

      <h3 className="text-lg font-semibold mt-6">Risk & Compliance Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Current Risk Score</Label>
          <RiskBadge score={supplier.risk_score} />
        </div>
        <div>
          <Label>Expiring Documents (60 days)</Label>
          <p className="text-gray-700 border-none bg-transparent shadow-none">{expiringDocsCount} documents</p>
        </div>
        <div>
          <Label>Expired Documents</Label>
          <p className="text-rose-700 font-medium border-none bg-transparent shadow-none">{expiredDocsCount} documents</p>
        </div>
      </div>
    </div>
  );
};

interface DocumentsTabProps {
  supplier: SupplierWithDetails;
}

const SupplierDocumentsTab: React.FC<DocumentsTabProps> = ({ supplier }) => {
  const handleDownload = async (filePath: string, fileName: string) => {
    const signedUrl = await getSignedUrlForDocument(filePath);
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Document download started.");
    } else {
      toast.error("Failed to generate download link.");
    }
  };

  const getDocStatus = (doc: Document) => {
    if (!doc.expires_on) return { label: "No Expiry", color: "bg-gray-100 text-gray-700 border-gray-200" };
    const expiryDate = new Date(doc.expires_on);
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    if (expiryDate <= today) {
      return { label: "Expired", color: "bg-rose-100 text-rose-800 border-rose-200" };
    } else if (expiryDate <= sixtyDaysFromNow) {
      return { label: "Expiring Soon", color: "bg-amber-100 text-amber-800 border-amber-200" };
    } else {
      return { label: "Valid", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Documents ({supplier.documents.length})</h3>
      {supplier.documents.length === 0 ? (
        <p className="text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="grid gap-3">
          {supplier.documents.map(doc => {
            const status = getDocStatus(doc);
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.type.replace(/_/g, ' ')}</p>
                    <div className="text-xs text-gray-600">
                      {doc.issued_on && `Issued: ${format(new Date(doc.issued_on), "PPP")}`}
                      {doc.expires_on && ` | Expires: ${format(new Date(doc.expires_on), "PPP")}`}
                      {doc.version && ` | Version: ${doc.version}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                    {status.label}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path, doc.type + ".pdf")} className="text-gray-700 hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ApprovalsTabProps {
  supplier: SupplierWithDetails;
  onUpdateSupplier: (updates: Partial<SupplierWithDetails>) => void;
  onRefresh: () => void;
}

const SupplierApprovalsTab: React.FC<ApprovalsTabProps> = ({ supplier, onUpdateSupplier, onRefresh }) => {
  const [comment, setComment] = useState("");
  const [esignName, setEsignName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async (decision: ApprovalDecision) => {
    setLoading(true);
    try {
      const newApproval: NewApproval = {
        supplier_id: supplier.id,
        stage: "Final Review", // Example stage
        actor_id: (await supabase.auth.getUser()).data.user?.id || "unknown",
        decision: decision,
        comment: comment || null,
        esign_name: esignName || null,
        decided_at: new Date().toISOString(),
      };
      const approval = await createApproval(newApproval);

      if (approval) {
        let newStatus: SupplierStatus = supplier.status;
        let poBlocked = supplier.po_blocked;

        if (decision === "approved") {
          newStatus = "Approved";
          // Check if all required docs are valid/current to unblock PO
          const allDocsValid = supplier.documents.every(doc => {
            if (!doc.expires_on) return true; // Docs without expiry are always valid
            return new Date(doc.expires_on) > new Date();
          });
          if (allDocsValid) {
            poBlocked = false;
          } else {
            toast.warning("Supplier approved, but PO remains blocked due to expiring/missing documents.");
          }
        } else if (decision === "conditional") {
          newStatus = "Conditional";
          poBlocked = true; // Keep PO blocked for conditional
        } else if (decision === "rejected") {
          newStatus = "Rejected";
          poBlocked = true; // Keep PO blocked for rejected
        }

        await updateSupplier(supplier.id, { status: newStatus, po_blocked: poBlocked });
        await createActivityLog({ supplier_id: supplier.id, action: `Supplier ${decision}`, meta_json: { decision, comment } });
        toast.success(`Supplier ${decision} successfully!`);
        onRefresh(); // Refresh parent data
      } else {
        toast.error("Failed to record approval.");
      }
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error("An error occurred during approval: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Approval History</h3>
      {supplier.approvals.length === 0 ? (
        <p className="text-gray-500">No approvals recorded yet.</p>
      ) : (
        <div className="grid gap-3">
          {supplier.approvals.map(app => (
            <div key={app.id} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {app.decision === "approved" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {app.decision === "conditional" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                {app.decision === "rejected" && <Ban className="w-4 h-4 text-rose-600" />}
                <span className="font-medium text-gray-900 capitalize">{app.decision}</span>
                <span className="text-xs text-gray-500">by {app.esign_name || "N/A"} on {app.decided_at ? format(new Date(app.decided_at), "PPP p") : "N/A"}</span>
              </div>
              {app.comment && <p className="text-sm text-gray-700 italic">"{app.comment}"</p>}
            </div>
          ))}
        </div>
      )}

      <h3 className="text-lg font-semibold mt-6">New Approval Decision</h3>
      <div className="grid gap-4 p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="esignName">E-Signature Name</Label>
          <Input id="esignName" value={esignName} onChange={e => setEsignName(e.target.value)} placeholder="Your Full Name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comment">Comment (Required for Conditional/Rejected)</Label>
          <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} className="resize-y" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleApprove("approved")} disabled={loading || !esignName} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Check className="w-4 h-4 mr-2" /> Approve
          </Button>
          <Button onClick={() => handleApprove("conditional")} disabled={loading || !esignName || !comment} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
            <AlertCircle className="w-4 h-4 mr-2" /> Conditional
          </Button>
          <Button onClick={() => handleApprove("rejected")} disabled={loading || !esignName || !comment} variant="destructive" className="bg-rose-600 hover:bg-rose-700 text-white">
            <X className="w-4 h-4 mr-2" /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ChangesTabProps {
  supplier: SupplierWithDetails;
}

const SupplierChangesTab: React.FC<ChangesTabProps> = ({ supplier }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Change Log ({supplier.changes.length})</h3>
      {supplier.changes.length === 0 ? (
        <p className="text-gray-500">No changes recorded yet.</p>
      ) : (
        <div className="grid gap-3">
          {supplier.changes.map(change => (
            <div key={change.id} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{change.field}</span> changed from&nbsp;
                <span className="line-through text-rose-500">{change.old_value || "—"}</span>
                &nbsp;to&nbsp;
                <span className="text-emerald-600">{change.new_value || "—"}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                Opened by {change.opened_by || "N/A"} on {change.opened_at ? format(new Date(change.opened_at), "PPP p") : "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ActivityLogTabProps {
  supplier: SupplierWithDetails;
}

const SupplierActivityLogTab: React.FC<ActivityLogTabProps> = ({ supplier }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activity Log ({supplier.activity_log.length})</h3>
      {supplier.activity_log.length === 0 ? (
        <p className="text-gray-500">No activity recorded yet.</p>
      ) : (
        <div className="grid gap-3">
          {supplier.activity_log.map(log => (
            <div key={log.id} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{log.action}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                {log.at ? format(new Date(log.at), "PPP p") : "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Supplier Detail Page ---

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchSupplierData = async () => {
    if (!id) {
      setError("Supplier ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const data = await getSupplierDetails(id);
    if (data) {
      // Calculate risk score on load
      const riskScore = calculateRiskScore(data, data.documents, data.approvals, data.responses);
      if (data.risk_score !== riskScore) {
        await updateSupplier(id, { risk_score: riskScore });
        data.risk_score = riskScore; // Update local state immediately
      }
      setSupplier(data);
    } else {
      setError("Failed to fetch supplier details.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchSupplierData();
  }, [id]);

  const handleUpdateSupplier = async (updates: Partial<SupplierWithDetails>) => {
    if (!id) return;
    const updated = await updateSupplier(id, updates);
    if (updated) {
      setSupplier(prev => prev ? { ...prev, ...updated } : null);
      void fetchSupplierData(); // Re-fetch to get full details and recalculate risk
    } else {
      toast.error("Failed to update supplier.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">Loading supplier details...</main>
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
          <main className="flex-1 p-6 overflow-y-auto text-center text-rose-500">{error}</main>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">Supplier not found.</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{supplier.legal_name}</h1>
          <div className="flex items-center gap-3">
            <RiskBadge score={supplier.risk_score} />
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", {
              "bg-rose-100 text-rose-800 border-rose-200": supplier.po_blocked,
              "bg-green-100 text-green-800 border-green-200": !supplier.po_blocked,
            })}>
              PO: {supplier.po_blocked ? "Blocked" : "Open"}
            </span>
            <Button variant="outline" onClick={() => navigate("/suppliers")} className="border-gray-300 text-gray-700 hover:bg-gray-50">Back to List</Button>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-auto rounded-md border-b border-gray-200 bg-gray-50 p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Overview</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Documents ({supplier.documents.length})</TabsTrigger>
              <TabsTrigger value="approvals" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Approvals ({supplier.approvals.length})</TabsTrigger>
              <TabsTrigger value="changes" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Changes ({supplier.changes.length})</TabsTrigger>
              <TabsTrigger value="scorecards" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Scorecards ({supplier.scorecards.length})</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Activity ({supplier.activity_log.length})</TabsTrigger>
            </TabsList>

            <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <TabsContent value="overview">
                <SupplierOverviewTab supplier={supplier} onUpdateSupplier={handleUpdateSupplier} />
              </TabsContent>
              <TabsContent value="documents">
                <SupplierDocumentsTab supplier={supplier} />
              </TabsContent>
              <TabsContent value="approvals">
                <SupplierApprovalsTab supplier={supplier} onUpdateSupplier={handleUpdateSupplier} onRefresh={fetchSupplierData} />
              </TabsContent>
              <TabsContent value="changes">
                <SupplierChangesTab supplier={supplier} />
              </TabsContent>
              <TabsContent value="scorecards">
                <h3 className="text-lg font-semibold mb-4">Scorecards ({supplier.scorecards.length})</h3>
                {supplier.scorecards.length === 0 ? (
                  <p className="text-gray-500">No scorecards generated yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {supplier.scorecards.map(sc => (
                      <div key={sc.id} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                        <p className="font-medium text-gray-900">Period: {sc.period_month}/{sc.period_year}</p>
                        <p className="text-sm text-gray-700">Score: {sc.score} | Grade: {sc.grade}</p>
                        {/* Render KPIs from sc.kpis_json if needed */}
                      </div>
                    ))}
                  </div>
                )}
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                  const newScorecard = generateSupplierScorecard(supplier, new Date().getMonth() + 1, new Date().getFullYear());
                  const { error: insertError } = await supabase.from('scorecards').insert(newScorecard);
                  if (insertError) {
                    toast.error("Failed to generate scorecard: " + insertError.message);
                  } else {
                    toast.success("Scorecard generated successfully!");
                    void fetchSupplierData();
                  }
                }}>Generate Monthly Scorecard</Button>
              </TabsContent>
              <TabsContent value="activity">
                <SupplierActivityLogTab supplier={supplier} />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}