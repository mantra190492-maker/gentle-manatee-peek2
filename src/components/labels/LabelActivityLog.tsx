"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Filter, UserRound } from "lucide-react";
import { listLabelActivity, subscribeLabelActivity } from "@/lib/labels/activity.ts"; // Corrected import path
import type { LabelSpecActivity } from "@/server/labels/types.ts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import FieldIcon from "@/components/activity/FieldIcon";
import { Chip } from "@/components/activity/Chip";

// Helper for status tone (can be expanded for label spec specific statuses)
function statusTone(v?: string) {
  if (!v) return "neutral";
  const s = v.toLowerCase();
  if (s.includes("approved") || s.includes("qa approved")) return "success";
  if (s.includes("draft")) return "info";
  if (s.includes("retired")) return "neutral";
  return "neutral";
}

// Helper to render values for activity log
const renderValue = (field: string, v: any, isNewValue: boolean) => {
  if (field === "status") return <Chip tone={statusTone(String(v))}>{String(v ?? "-")}</Chip>;
  if (field === "batch_date" || field === "expiry_date" || field === "qa_approved_at" || field === "approved_at") {
    return <Chip>{v ? new Date(v).toLocaleDateString() : "-"}</Chip>;
  }
  if (field === "coa_file") return <Chip tone="info">{v?.name ?? "CoA File"}</Chip>;
  if (typeof v === "string") return <span className="truncate">{v || "-"}</span>;
  if (v === null || v === undefined) return <span className="truncate">-</span>;
  if (typeof v === 'object' && v !== null) return <span className="truncate">{JSON.stringify(v)}</span>;
  return <span className="truncate">{String(v)}</span>;
};

export default function LabelActivityLog({ specId, itemTitle }:{ specId: string; itemTitle: string }) {
  const [items, setItems] = useState<LabelSpecActivity[]>([]);
  const [fieldFilter, setFieldFilter] = useState("all");
  const [actorFilter, setActor] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});

  const FIELD_OPTIONS = [
    { key: "all", label: "All Fields" },
    { key: "status", label: "Status" },
    { key: "content", label: "Content" },
    { key: "warning", label: "Warning" },
    { key: "qa_approval", label: "QA Approval" }, // Changed from qa_approved_flag to qa_approval to match logActivity
    { key: "batch_id", label: "Batch ID" },
    { key: "batch_date", label: "Batch Date" },
    { key: "shelf_life_months", label: "Shelf Life" },
    { key: "lot_number", label: "Lot Number" },
    { key: "expiry_date", label: "Expiry Date" },
    { key: "coa_file", label: "CoA File" },
    { key: "override_lot_expiry_flag", label: "Lot/Expiry Override" },
    { key: "override_storage_flag", label: "Storage Override" },
    { key: "export", label: "Export" },
    { key: "recall_report", label: "Recall Report" },
  ];

  const refresh = async () => {
    setLoading(true);
    try {
      const fetchedActivities = await listLabelActivity(specId);
      let filtered = fetchedActivities;
      if (fieldFilter !== "all") {
        filtered = filtered.filter(activity => activity.field === fieldFilter);
      }
      if (actorFilter !== "all") {
        filtered = filtered.filter(activity => activity.actor === actorFilter);
      }
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [specId, fieldFilter, actorFilter]);

  useEffect(() => {
    const unsubscribe = subscribeLabelActivity(specId, (row) => {
      // Only add if it passes current filters
      const passesFieldFilter = fieldFilter === "all" || row.field === fieldFilter;
      const passesActorFilter = actorFilter === "all" || row.actor === actorFilter;
      if (passesFieldFilter && passesActorFilter) {
        setItems((prev) => [row, ...prev]);
      }
    });
    return unsubscribe;
  }, [specId, fieldFilter, actorFilter]);

  const uniqueActors = useMemo(() => {
    const set = new Set(items.map(i => i.actor).filter(Boolean) as string[]);
    return ["all", ...Array.from(set)];
  }, [items]);

  // Fetch actor names
  useEffect(() => {
    const fetchActorNames = async () => {
      const newActorNames: Record<string, string> = { "system": "System" };
      const actorsToFetch = uniqueActors.filter(id => id !== "all" && !actorNames[id]);

      if (actorsToFetch.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', actorsToFetch);

        if (error) {
          console.error("Error fetching actor profiles:", error);
        } else if (data) {
          data.forEach(profile => {
            newActorNames[profile.id] = profile.full_name || profile.email || profile.id;
          });
        }
      }
      setActorNames(prev => ({ ...prev, ...newActorNames }));
    };
    void fetchActorNames();
  }, [uniqueActors, actorNames]);

  return (
    <div className="h-full w-full bg-white p-4 flex flex-col">
      {/* toolbar */}
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="relative">
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger className="pl-9 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <SelectValue placeholder="Filter by Field" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Select value={actorFilter} onValueChange={setActor}>
            <SelectTrigger className="pl-9 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <SelectValue placeholder="Filter by Person" />
            </SelectTrigger>
            <SelectContent>
              {uniqueActors.map(a => <SelectItem key={a} value={a}>{actorNames[a] || (a === "all" ? "All Persons" : a)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={refresh} className="ml-auto inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100">
          <RefreshCw className="h-4 w-4" /><span className="text-sm">Refresh</span>
        </Button>
      </div>

      {/* list */}
      <div className="rounded-xl border border-gray-200 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 text-center">Loading activity…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 text-center">No activity yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map(i => (
              <div key={i.id} className="flex items-center gap-4 border-b border-gray-200 py-3 px-4">
                {/* time */}
                <div className="w-16 shrink-0 text-xs text-gray-500">{formatDistanceToNow(new Date(i.created_at), { addSuffix: true }).replace("about ", "")}</div>

                {/* avatar + title */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <img src="/placeholder.svg" width={28} height={28} alt="Actor Avatar" className="rounded-full border border-gray-200" />
                  <div className="font-medium text-gray-900 truncate">{actorNames[i.actor || 'system'] || 'System'}</div>
                </div>

                {/* field */}
                <div className="flex items-center gap-2 w-40 shrink-0">
                  <FieldIcon field={i.field} />
                  <div className="text-gray-700 text-sm capitalize">
                    {FIELD_OPTIONS.find(o => o.key === i.field)?.label || i.field.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* old -> new */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-sm text-gray-700 min-w-0 truncate">{renderValue(i.field, i.old_value, false)}</div>
                  <div className="text-gray-400">›</div>
                  <div className="text-sm text-gray-900 min-w-0 truncate">{renderValue(i.field, i.new_value, true)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}