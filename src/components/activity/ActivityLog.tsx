"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Filter, UserRound } from "lucide-react";
import { listActivity, subscribeActivity, ActivityRow as RowType } from "@/lib/activity/client.ts";
import ActivityRow from "./ActivityRow.tsx";
import { Button } from "@/components/ui/button"; // Import Button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { supabase } from "@/integrations/supabase/client"; // Import supabase for actor names

const FIELD_OPTIONS = [
  { key: "all", label: "Filter log" },
  { key: "created", label: "Created" },
  { key: "text", label: "Text" },
  { key: "status", label: "Status" },
  { key: "assignee", label: "Person" },
  { key: "priority", label: "Priority" },
  { key: "date", label: "Date" }, // Changed from due_date to date to match schema
  { key: "file", label: "File" },
  { key: "title", label: "Title" },
  { key: "group", label: "Group" },
];

export default function ActivityLog({ taskId, itemTitle }:{ taskId: string; itemTitle: string }) {
  const [items, setItems] = useState<RowType[]>([]);
  const [field, setField] = useState("all");
  const [actor, setActor] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const fetchedActivities = await listActivity(taskId, { field, actor });
      setItems(fetchedActivities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [taskId, field, actor]);

  useEffect(() => {
    const off = subscribeActivity(taskId, (row) => setItems((prev) => [row, ...prev]));
    return off;
  }, [taskId]);

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
          .from('profiles') // Assuming a profiles table with user info
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
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="pl-9 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <SelectValue placeholder="Filter log" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger className="pl-9 pr-3 h-10 rounded-xl border border-gray-300 bg-white text-sm">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              {uniqueActors.map(a => <SelectItem key={a} value={a}>{actorNames[a] || (a === "all" ? "Person" : a)}</SelectItem>)}
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
              <ActivityRow
                key={i.id}
                itemTitle={itemTitle}
                actorAvatar={i.actor ? `/placeholder.svg` : `/placeholder.svg`} // Placeholder for actual avatar logic
                field={i.field}
                oldValue={i.old_value}
                newValue={i.new_value}
                message={i.message}
                createdAt={i.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}