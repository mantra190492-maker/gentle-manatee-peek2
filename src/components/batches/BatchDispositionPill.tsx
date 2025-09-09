"use client";
import { cn } from "@/lib/utils";
import type { Disposition } from "@/types/batches/types";
import React from "react";

const dispositionColors: Record<Disposition, string> = {
  "Pending": "bg-gray-100 text-gray-800 border-gray-200",
  "Released": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Quarantined": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-blue-100 text-blue-800 border-blue-200",
  "Rejected": "bg-rose-100 text-rose-800 border-rose-200",
  "Recalled": "bg-red-100 text-red-800 border-red-200",
};

export function BatchDispositionPill({ disposition, className }: { disposition: Disposition | ""; className?: string }) {
  if (!disposition) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-transparent">
        &nbsp;
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", dispositionColors[disposition], className)}>
      {disposition}
    </span>
  );
}