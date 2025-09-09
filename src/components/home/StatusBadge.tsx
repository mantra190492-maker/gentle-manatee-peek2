import { cn } from "@/lib/utils";
import React from "react";

type Status = "Ready" | "Coming Soon" | "In Progress";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusColors: Record<Status, string> = {
  "Ready": "bg-emerald-100 text-emerald-800",
  "Coming Soon": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        statusColors[status],
        className
      )}
    >
      {status}
    </span>
  );
}