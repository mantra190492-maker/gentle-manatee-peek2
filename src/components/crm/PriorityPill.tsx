import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { TaskPriority } from "@/lib/tasksStore";

const priorityColors: Record<TaskPriority, string> = {
  "Critical": "bg-rose-50 text-rose-700 border border-rose-200",
  "High": "bg-amber-50 text-amber-700 border border-amber-200",
  "Medium": "bg-blue-50 text-blue-700 border border-blue-200",
  "Low": "bg-gray-50 text-gray-700 border border-gray-200",
};

export function PriorityPill({ priority, icon, isEmpty = false }: { priority: TaskPriority | ""; icon?: ReactNode; isEmpty?: boolean }) {
  if (isEmpty || !priority) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-20 rounded-full text-xs font-medium border border-gray-300 bg-white text-transparent">
        &nbsp;
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", priorityColors[priority])}>
      {priority === "Critical" && <TriangleAlert className="w-3 h-3" />}
      {icon}
      {priority}
    </span>
  );
}