"use client";
import React from "react";
import { createProtocol, bulkUpsertTimepoints } from "@/server/stability/service";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultStudyId?: string;
  onCreated?: () => void;
};

const INTERVALS = ["1M","3M","6M","9M","12M"] as const;

export default function ProtocolBuilderDrawer({ open, onClose, defaultStudyId, onCreated }: Props) {
  const [studyId, setStudyId] = React.useState(defaultStudyId ?? "");
  const [title, setTitle] = React.useState("");
  const [productBatch, setProductBatch] = React.useState("");
  const [storage, setStorage] = React.useState<"25°C/60%RH"|"30°C/65%RH"|"40°C/75%RH"|"Custom">("25°C/60%RH");
  const [customStorage, setCustomStorage] = React.useState("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [schedule, setSchedule] = React.useState<string[]>(["1M","3M","6M"]);
  const [status, setStatus] = React.useState<"Draft"|"Active"|"Completed">("Draft");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);

  React.useEffect(() => {
    if (!open) {
      setStudyId(defaultStudyId ?? "");
      setTitle(""); setProductBatch("");
      setStorage("25°C/60%RH"); setCustomStorage("");
      setStartDate(""); setSchedule(["1M","3M","6M"]);
      setStatus("Draft"); setNotes(""); setError(null);
    }
  }, [open, defaultStudyId]);

  if (!open) return null;
  const resolvedStorage = storage === "Custom" ? customStorage.trim() : storage;

  async function onSave() {
    setError(null);
    if (!studyId) return setError("Study is required.");
    if (!title.trim()) return setError("Protocol title is required.");
    if (!resolvedStorage) return setError("Storage conditions are required.");

    setSaving(true);
    try {
      const protocol = await createProtocol({
        study_id: studyId,
        title: title.trim(),
        product_batch: productBatch.trim() || null,
        storage_conditions: resolvedStorage,
        pull_schedule: schedule,
        notes: notes.trim() || null,
        status,
        start_date: startDate || null,
      });

      if (startDate && schedule.length) {
        const planned = computePlannedDates(startDate, schedule);
        await bulkUpsertTimepoints(
          planned.map(p => ({
            protocol_id: protocol.id,
            label: p.label,
            planned_date: p.date,
            actual_date: null,
          })),
            "protocol_id,label" 
        );
      }

      onCreated?.();
      onClose();
    } catch (e:any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden md:block w-1/3" onClick={onClose} />
      <div className="ml-auto h-full w-full md:w-[480px] bg-white shadow-xl border-l">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">New Protocol</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Field label="Study ID *">
            <input className="w-full rounded-md border px-3 py-2 text-sm"
              value={studyId} onChange={(e)=>setStudyId(e.target.value)} placeholder="study_uuid" />
          </Field>

          <Field label="Protocol Title *">
            <input className="w-full rounded-md border px-3 py-2 text-sm"
              value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Long-term 25/60" />
          </Field>

          <Field label="Product / Batch No.">
            <input className="w-full rounded-md border px-3 py-2 text-sm"
              value={productBatch} onChange={(e)=>setProductBatch(e.target.value)} />
          </Field>

          <Field label="Storage Conditions *">
            <div className="flex flex-wrap gap-2">
              {(["25°C/60%RH","30°C/65%RH","40°C/75%RH","Custom"] as const).map(opt => (
                <button key={opt} type="button" onClick={()=>setStorage(opt)}
                  className={`rounded-full border px-3 py-1 text-sm ${storage===opt ? "bg-teal-600 text-white border-teal-600" : "bg-white hover:bg-slate-50"}`}>
                  {opt}
                </button>
              ))}
            </div>
            {storage==="Custom" && (
              <input className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="e.g., 25°C/40%RH (dark)" value={customStorage}
                onChange={(e)=>setCustomStorage(e.target.value)} />
            )}
          </Field>

          <Field label="Start Date (for planning)">
            <input type="date" className="w-full rounded-md border px-3 py-2 text-sm"
              value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
          </Field>

          <Field label="Pull Schedule (intervals)">
            <div className="flex flex-wrap gap-2">
              {INTERVALS.map(i=>{
                const active = schedule.includes(i);
                return (
                  <button key={i} type="button"
                    onClick={()=>setSchedule(prev=> active ? prev.filter(x=>x!==i) : [...prev,i])}
                    className={`rounded-full border px-3 py-1 text-sm ${active ? "bg-teal-600 text-white border-teal-600" : "bg-white hover:bg-slate-50"}`}>
                    {i}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Status">
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white"
              value={status} onChange={(e)=>setStatus(e.target.value as any)}>
              <option>Draft</option><option>Active</option><option>Completed</option>
            </select>
          </Field>

          <Field label="Notes">
            <textarea className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </Field>
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" disabled={saving}>Cancel</button>
          <button onClick={onSave} className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm hover:bg-teal-700 disabled:opacity-50" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      {children}
    </div>
  );
}

function computePlannedDates(start: string, intervals: string[]) {
  const base = new Date(start + "T00:00:00");
  const out: { label: string; date: string }[] = [];
  for (const it of intervals) {
    const months = parseInt(it.replace("M",""), 10);
    const d = new Date(base);
    d.setMonth(d.getMonth() + (isNaN(months) ? 0 : months));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    out.push({ label: it, date: `${yyyy}-${mm}-${dd}` });
  }
  return out;
}
