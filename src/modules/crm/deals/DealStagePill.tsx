"use client";
import { cn } from "@/lib/utils";
import type { DealStage } from "./types.ts";
import React from "react";

const stageColors: Record<DealStage, string> = {
  "New": "bg-gray-100 text-gray-800 border-gray-200",
  "Qualified": "bg-blue-100 text-blue-800 border-blue-200",
  "Proposal": "bg-purple-100 text-purple-800 border-purple-200",
  "Negotiation": "bg-amber-100 text-amber-800 border-amber-200",
  "Closed Won": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Closed Lost": "bg-rose-100 text-rose-800 border-rose-200",
};

export function DealStagePill({ stage, className }: { stage: DealStage | ""; className?: string }) {
  if (!stage) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-transparent">
        &nbsp;
      </span>
    );
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", stageColors[stage], className)}>
      {stage}
    </span>
  );
}