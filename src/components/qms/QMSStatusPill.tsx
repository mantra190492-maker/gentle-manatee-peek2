import { cn } from "@/lib/utils";
import type { SOPStatus, CAPAStatus, ChangeControlStatus, TrainingStatus } from "@/lib/qmsStore";

export type AllStatus = SOPStatus | CAPAStatus | ChangeControlStatus | TrainingStatus;

const statusColors: Record<AllStatus, string> = {
  // SOP
  Draft: "bg-slate-100 text-slate-800 border border-slate-200",
  Approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Expired: "bg-rose-100 text-rose-800 border border-rose-200",
  // CAPA
  Open: "bg-amber-100 text-amber-800 border border-amber-200", // Pending (orange)
  "In Progress": "bg-sky-100 text-sky-800 border border-sky-200",
  Closed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  // Change Control
  Proposed: "bg-blue-100 text-blue-800 border border-blue-200",
  Rejected: "bg-rose-100 text-rose-800 border border-rose-200",
  Implemented: "bg-teal-100 text-teal-800 border border-teal-200",
  // Training
  "Not Started": "bg-slate-100 text-slate-800 border border-slate-200",
  Completed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

export function QMSStatusPill({ status }: { status: AllStatus | "" }) {
  if (!status) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-slate-300 bg-white text-transparent">
        &nbsp;
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[status])}>
      {status}
    </span>
  );
}