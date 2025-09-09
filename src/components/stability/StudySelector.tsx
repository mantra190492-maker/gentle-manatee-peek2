"use client";
import React from "react";
import { listStudies } from "@/server/stability/service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import shadcn Select

type Option = { value: string; label: string };

export default function StudySelector({
  value,
  onChange,
  includeAll = true,
}: {
  value?: string;
  onChange: (v?: string) => void;
  includeAll?: boolean;
}) {
  const [opts, setOpts] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const studies = await listStudies();
        const mapped: Option[] = studies.map((s) => ({
          value: s.id,
          label: `${s.product_name} - ${s.batch_no}`, // Combine product name and batch number
        }));
        setOpts(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-slate-600">Study</label>
      <Select
        value={value ?? ""}
        onValueChange={(val) => onChange(val || undefined)}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px] h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
          <SelectValue placeholder={includeAll ? "All Studies" : "Select a study"} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="">All Studies</SelectItem>}
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}