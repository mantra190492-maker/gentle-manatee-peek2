"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, Upload, FileText, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { QMSEntity, SOP, CAPA, ChangeControl, Training, AuditLog, VaultFile, SOPStatus, CAPAStatus, ChangeControlStatus, TrainingStatus } from "@/lib/qmsStore";
import { QMSStatusPill } from "./QMSStatusPill";
import DateInput from "@/components/common/DateInput";
import { supabase } from "@/integrations/supabase/client"; // Import supabase for user auth
import { listQMSUpdates, createQMSUpdate, createQMSReply, QMSUpdateWithReplies, QMSReply, QMSUpdate } from "@/lib/qmsApi"; // Import QMS API functions and types
import { QMSUpdateItem } from "./QMSUpdateItem"; // Import the new QMSUpdateItem component
import { toast } from "sonner"; // Import toast

// Simplified Audit type for frontend-only
type Audit = {
  id: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  at: string;
};

// FileItem interface remains the same for now, as file integration is next
interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export function QMSDrawer({
  item,
  module,
  open,
  onClose,
  onSaved,
}: {
  item: QMSEntity | null;
  module: string;
  open: boolean;
  onClose: () => void;
  onSaved: (updatedItem: QMSEntity) => void;
}) {
  const [editItem, setEditItem] = useState<QMSEntity | null>(item);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [qmsUpdates, setQMSUpdates] = useState<QMSUpdateWithReplies[]>([]); // Renamed to qmsUpdates
  const [files, setFiles] = useState<FileItem[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [loadingUpdates, setLoadingUpdates] = useState(true); // New loading state for updates
  const [posting, setPosting] = useState(false); // Declared posting state

  const isSOP = module === "sop-register";

  const fetchQMSUpdates = async (entityId: string, moduleType: string) => {
    setLoadingUpdates(true);
    const data = await listQMSUpdates(entityId, moduleType);
    if (data) {
      setQMSUpdates(data);
    } else {
      toast.error("Failed to load QMS updates.");
    }
    setLoadingUpdates(false);
  };

  useEffect(() => {
    setEditItem(item);
    if (item && open) {
      setPanelError(null); // Clear panel errors on item change
      void fetchQMSUpdates(item.id, module); // Fetch updates for the current item

      // Simulate loading for files/activity (will be replaced later)
      setTimeout(() => {
        setFiles([
          { id: "1", name: "Document.pdf", size: "1.5 MB", uploadedAt: "2024-07-29T10:10:00Z" },
        ]);
        setAudits([
          { id: "a1", field: "status", oldValue: "Draft", newValue: "Approved", at: "2024-07-29T10:05:00Z" },
        ]);
      }, 500);

      // Realtime subscription for QMS updates
      const updatesChannel = supabase
        .channel(`qms_updates:${item.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "qms_updates", filter: `entity_id=eq.${item.id}` },
          (payload) => {
            console.log("Realtime QMS update received!", payload);
            const newUpdate = payload.new as QMSUpdate;
            setQMSUpdates(prev => {
              if (prev.some(u => u.id === newUpdate.id)) {
                return prev.map(u => u.id === newUpdate.id ? { ...newUpdate, replies: u.replies } : u);
              }
              return [{ ...newUpdate, replies: [] }, ...prev];
            });
            setRealtimeError(null);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            setRealtimeError("Realtime updates for QMS comments are not available. Data might be stale.");
            console.error("Supabase Realtime channel error for qms_updates.");
          }
        });

      // Realtime subscription for QMS replies
      const repliesChannel = supabase
        .channel(`qms_replies:${item.id}`) // Filter by entity_id of the parent update's entity_id
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "qms_replies" },
          async (payload) => {
            console.log("Realtime QMS reply received!", payload);
            const newReply = payload.new as QMSReply;
            // To filter replies by the current item's updates, we need to fetch the parent update
            const { data: parentUpdate, error: parentError } = await supabase
              .from('qms_updates')
              .select('entity_id')
              .eq('id', newReply.update_id)
              .single();

            if (parentError) {
              console.error("Error fetching parent update for reply:", parentError);
              return;
            }

            if (parentUpdate?.entity_id === item.id) {
              setQMSUpdates(prev => prev.map(update => {
                if (update.id === newReply.update_id) {
                  if (update.replies.some(r => r.id === newReply.id)) {
                    return { ...update, replies: update.replies.map(r => r.id === newReply.id ? newReply : r) };
                  }
                  return { ...update, replies: [...update.replies, newReply] };
                }
                return update;
              }));
              setRealtimeError(null);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            setRealtimeError("Realtime updates for QMS replies are not available. Data might be stale.");
            console.error("Supabase Realtime channel error for qms_replies.");
          }
        });


      return () => {
        void supabase.removeChannel(updatesChannel);
        void supabase.removeChannel(repliesChannel);
      };

    } else {
      setQMSUpdates([]);
      setFiles([]);
      setAudits([]);
      setNewUpdateContent("");
      setSelectedFile(null);
      setRealtimeError(null);
      setPanelError(null);
      setLoadingUpdates(true);
    }
  }, [item, module, open]);

  if (!open || !editItem) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would call an API to save the item
      console.log("Saving item:", editItem);
      onSaved(editItem);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdateContent.trim()) return;
    if (!editItem?.id || !module) {
      setPanelError("Cannot post update: No QMS entity selected.");
      return;
    }

    setPosting(true);
    setPanelError(null);

    const user = await supabase.auth.getUser();
    const authorName = user.data.user?.email || "Anonymous";

    const tempId = `temp-${Date.now()}`;
    const optimisticUpdate: QMSUpdateWithReplies = {
      id: tempId,
      entity_id: editItem.id,
      module_type: module,
      author: authorName,
      body: newUpdateContent.trim(),
      created_at: new Date().toISOString(),
      replies: [],
    };
    setQMSUpdates(prev => [optimisticUpdate, ...prev]);
    setNewUpdateContent("");

    try {
      const newUpdate = await createQMSUpdate(editItem.id, module, optimisticUpdate.body, authorName);
      setQMSUpdates(prev => prev.map(u => u.id === tempId ? { ...newUpdate, replies: [] } : u));
      toast.success("Update posted!");
    } catch (err: any) {
      console.error("Error posting QMS update:", err.message);
      setPanelError(err.message);
      toast.error("Failed to post update.");
      setQMSUpdates(prev => prev.filter(u => u.id !== tempId));
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (updateId: string, body: string, author: string) => {
    setPanelError(null);

    const tempId = `temp-reply-${Date.now()}`;
    const optimisticReply: QMSReply = {
      id: tempId,
      update_id: updateId,
      author: author,
      body: body,
      created_at: new Date().toISOString(),
    };
    setQMSUpdates(prev => prev.map(update =>
      update.id === updateId ? { ...update, replies: [...update.replies, optimisticReply] } : update
    ));

    try {
      const newReply = await createQMSReply(updateId, body, author);
      setQMSUpdates(prev => prev.map(update =>
        update.id === updateId ? { ...update, replies: update.replies.map(r => r.id === tempId ? newReply : r) } : update
      ));
      toast.success("Reply posted!");
      return newReply;
    } catch (err: any) {
      console.error("Error posting QMS reply:", err.message);
      setPanelError(err.message);
      toast.error("Failed to post reply.");
      setQMSUpdates(prev => prev.map(update =>
        update.id === updateId ? { ...update, replies: update.replies.filter(r => r.id !== tempId) } : update
      ));
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      const newFile: FileItem = {
        id: String(files.length + 1),
        name: e.target.files[0].name,
        size: (e.target.files[0].size / 1024 / 1024).toFixed(2) + " MB",
        uploadedAt: new Date().toISOString(),
      };
      setFiles(prev => [...prev, newFile]);
      setSelectedFile(null);
    }
  };

  const renderDetailsForm = () => {
    switch (module) {
      case "sop-register":
        const sopItem = editItem as SOP;
        const sopStatusOptions: SOPStatus[] = ["Draft", "Approved", "Expired"];
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sopNumber">SOP #</Label>
              <Input id="sopNumber" value={sopItem.sopNumber} onChange={e => setEditItem({ ...sopItem, sopNumber: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={sopItem.title} onChange={e => setEditItem({ ...sopItem, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" value={sopItem.version} onChange={e => setEditItem({ ...sopItem, version: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={sopItem.status} onValueChange={(val: SOPStatus) => setEditItem({ ...sopItem, status: val })}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {sopStatusOptions.map(s => <SelectItem key={s} value={s}><QMSStatusPill status={s} /></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={sopItem.owner} onChange={e => setEditItem({ ...sopItem, owner: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <DateInput
                value={sopItem.effectiveDate ? new Date(sopItem.effectiveDate) : undefined}
                onChange={(date) => setEditItem({ ...sopItem, effectiveDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reviewDate">Review Date</Label>
              <DateInput
                value={sopItem.reviewDate ? new Date(sopItem.reviewDate) : undefined}
                onChange={(date) => setEditItem({ ...sopItem, reviewDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trainingProgress">Training Progress (%)</Label>
              <Input id="trainingProgress" type="number" min={0} max={100} value={sopItem.trainingProgress} onChange={e => setEditItem({ ...sopItem, trainingProgress: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileCount">File Count</Label>
              <Input id="fileCount" type="number" min={0} value={sopItem.fileCount} onChange={e => setEditItem({ ...sopItem, fileCount: Number(e.target.value) })} />
            </div>
          </form>
        );
      case "capa":
        const capaItem = editItem as CAPA;
        const capaStatusOptions: CAPAStatus[] = ["Open", "In Progress", "Closed"];
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="capaId">CAPA ID</Label>
              <Input id="capaId" value={capaItem.capaId} onChange={e => setEditItem({ ...capaItem, capaId: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issue">Issue</Label>
              <Textarea id="issue" value={capaItem.issue} onChange={e => setEditItem({ ...capaItem, issue: e.target.value })} className="resize-y" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rootCause">Root Cause</Label>
              <Textarea id="rootCause" value={capaItem.rootCause} onChange={e => setEditItem({ ...capaItem, rootCause: e.target.value })} className="resize-y" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={capaItem.status} onValueChange={(val: CAPAStatus) => setEditItem({ ...capaItem, status: val })}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {capaStatusOptions.map(s => <SelectItem key={s} value={s}><QMSStatusPill status={s} /></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedSop">Linked SOP</Label>
              <Input id="linkedSop" value={capaItem.linkedSop} onChange={e => setEditItem({ ...capaItem, linkedSop: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={capaItem.owner} onChange={e => setEditItem({ ...capaItem, owner: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetCloseDate">Target Close Date</Label>
              <DateInput
                value={capaItem.targetCloseDate ? new Date(capaItem.targetCloseDate) : undefined}
                onChange={(date) => setEditItem({ ...capaItem, targetCloseDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="updatesCount">Updates Count</Label>
              <Input id="updatesCount" type="number" min={0} value={capaItem.updatesCount} onChange={e => setEditItem({ ...capaItem, updatesCount: Number(e.target.value) })} />
            </div>
          </form>
        );
      case "change-control":
        const changeControlItem = editItem as ChangeControl;
        const changeControlStatusOptions: ChangeControlStatus[] = ["Proposed", "Approved", "Rejected", "Implemented"];
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="changeId">Change ID</Label>
              <Input id="changeId" value={changeControlItem.changeId} onChange={e => setEditItem({ ...changeControlItem, changeId: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={changeControlItem.description} onChange={e => setEditItem({ ...changeControlItem, description: e.target.value })} className="resize-y" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="impactAssessment">Impact Assessment</Label>
              <Textarea id="impactAssessment" value={changeControlItem.impactAssessment} onChange={e => setEditItem({ ...changeControlItem, impactAssessment: e.target.value })} className="resize-y" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={changeControlItem.status} onValueChange={(val: ChangeControlStatus) => setEditItem({ ...changeControlItem, status: val })}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {changeControlStatusOptions.map(s => <SelectItem key={s} value={s}><QMSStatusPill status={s} /></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedEntity">Linked Entity</Label>
              <Input id="linkedEntity" value={changeControlItem.linkedEntity} onChange={e => setEditItem({ ...changeControlItem, linkedEntity: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={changeControlItem.owner} onChange={e => setEditItem({ ...changeControlItem, owner: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approvalDate">Approval Date</Label>
              <DateInput
                value={changeControlItem.approvalDate ? new Date(changeControlItem.approvalDate) : undefined}
                onChange={(date) => setEditItem({ ...changeControlItem, approvalDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
          </form>
        );
      case "training":
        const trainingItem = editItem as Training;
        const trainingStatusOptions: TrainingStatus[] = ["Not Started", "In Progress", "Completed"];
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Input id="user" value={trainingItem.user} onChange={e => setEditItem({ ...trainingItem, user: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sopAssigned">SOP Assigned</Label>
              <Input id="sopAssigned" value={trainingItem.sopAssigned} onChange={e => setEditItem({ ...trainingItem, sopAssigned: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={trainingItem.status} onValueChange={(val: TrainingStatus) => setEditItem({ ...trainingItem, status: val })}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {trainingStatusOptions.map(s => <SelectItem key={s} value={s}><QMSStatusPill status={s} /></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignedDate">Assigned Date</Label>
              <DateInput
                value={trainingItem.assignedDate ? new Date(trainingItem.assignedDate) : undefined}
                onChange={(date) => setEditItem({ ...trainingItem, assignedDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="completedDate">Completed Date</Label>
              <DateInput
                value={trainingItem.completedDate ? new Date(trainingItem.completedDate) : undefined}
                onChange={(date) => setEditItem({ ...trainingItem, completedDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="signature" checked={trainingItem.signature} onCheckedChange={(checked) => setEditItem({ ...trainingItem, signature: checked as boolean })} className="mt-2" />
              <Label htmlFor="signature">Signature</Label>
            </div>
          </form>
        );
      case "audit-log":
        const auditLogItem = editItem as AuditLog;
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="eventId">Event ID</Label>
              <Input id="eventId" value={auditLogItem.eventId} onChange={e => setEditItem({ ...auditLogItem, eventId: e.target.value })} readOnly className="bg-gray-100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entity">Entity</Label>
              <Input id="entity" value={auditLogItem.entity} onChange={e => setEditItem({ ...auditLogItem, entity: e.target.value })} readOnly className="bg-gray-100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="action">Action</Label>
              <Input id="action" value={auditLogItem.action} onChange={e => setEditItem({ ...auditLogItem, action: e.target.value })} readOnly className="bg-gray-100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Input id="user" value={auditLogItem.user} onChange={e => setEditItem({ ...auditLogItem, user: e.target.value })} readOnly className="bg-gray-100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input id="timestamp" value={format(new Date(auditLogItem.timestamp), "PPP p")} readOnly className="bg-gray-100" />
            </div>
          </form>
        );
      case "vault":
        const vaultItem = editItem as VaultFile;
        const fileTypeOptions = ["Document", "Image", "Spreadsheet", "Presentation", "Other"];
        return (
          <form className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input id="fileName" value={vaultItem.fileName} onChange={e => setEditItem({ ...vaultItem, fileName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedEntity">Linked Entity</Label>
              <Input id="linkedEntity" value={vaultItem.linkedEntity} onChange={e => setEditItem({ ...vaultItem, linkedEntity: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={vaultItem.type} onValueChange={(val: string) => setEditItem({ ...vaultItem, type: val })}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  {fileTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="uploadedBy">Uploaded By</Label>
              <Input id="uploadedBy" value={vaultItem.uploadedBy} onChange={e => setEditItem({ ...vaultItem, uploadedBy: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateUploaded">Date Uploaded</Label>
              <Input id="dateUploaded" value={format(new Date(vaultItem.dateUploaded), "PPP p")} readOnly className="bg-gray-100" />
            </div>
          </form>
        );
      default:
        return <div className="text-slate-600">No details form available for this module.</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-gray-900/30" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-md bg-white h-full shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="font-semibold text-lg text-gray-900">Item Details</div>
          <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-4 h-auto rounded-none border-b border-gray-200 bg-gray-50 p-0">
            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Details</TabsTrigger>
            <TabsTrigger value="updates" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Updates ({qmsUpdates.length})</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Files ({files.length})</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Activity</TabsTrigger>
            {isSOP && <TabsTrigger value="training" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Training</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="flex-1 p-4 overflow-y-auto">
            {renderDetailsForm()}
          </TabsContent>

          <TabsContent value="updates" className="flex-1 flex flex-col p-4 overflow-y-auto">
            {realtimeError && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm mb-4">
                <AlertCircle className="w-5 h-5" /> {realtimeError}
              </div>
            )}
            {panelError && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3 text-sm mb-4">
                <AlertCircle className="w-5 h-5" /> {panelError}
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50 shadow-sm">
              <Textarea
                placeholder="Add an update..."
                className="w-full border-none focus-visible:ring-0 resize-y bg-transparent text-gray-900 placeholder:text-gray-500 min-h-[80px]"
                rows={3}
                value={newUpdateContent}
                onChange={(e) => setNewUpdateContent(e.target.value)}
                disabled={posting}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" onClick={handleAddUpdate} disabled={!newUpdateContent.trim() || posting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4 mr-2" /> {posting ? "Posting..." : "Update"}
                </Button>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {loadingUpdates ? (
                <div className="text-center text-gray-500 py-6">Loading updates...</div>
              ) : qmsUpdates.length === 0 ? (
                <div className="text-center text-gray-500 py-6">No updates yet.</div>
              ) : (
                qmsUpdates.map(update => (
                  <QMSUpdateItem key={update.id} update={update} onReply={handleReply} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="mb-4">
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors h-11"
              >
                <Upload className="w-4 h-4" /> Upload File
              </label>
            </div>
            <div className="flex-1 space-y-2">
              {files.length === 0 ? (
                <div className="text-center text-gray-500 py-6">No files uploaded.</div>
              ) : (
                files.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-600">{file.size} - {new Date(file.uploadedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="font-semibold mb-2 text-gray-900">Audit Trail</div>
            {audits.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No activity yet.</div>
            ) : (
                <ul className="space-y-3 text-sm">
                  {audits.map(a => (
                    <li key={a.id} className="border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{a.field}</span> changed from&nbsp;
                        <span className="line-through text-rose-500">{a.oldValue ?? "—"}</span>
                        &nbsp;to&nbsp;
                        <span className="text-emerald-600">{a.newValue ?? "—"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6">{new Date(a.at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
          </TabsContent>

          {isSOP && (
            <TabsContent value="training" className="flex-1 p-4 overflow-y-auto">
              <div className="text-gray-600">Training completion status will be shown here.</div>
              {/* Placeholder for training details for SOPs */}
            </TabsContent>
          )}
        </Tabs>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-800">Close</Button>
          <Button type="submit" disabled={saving} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
        </div>
      </aside>
    </div>
  );
}