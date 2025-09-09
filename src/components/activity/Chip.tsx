import React from "react";

export function Chip({ children, tone = "neutral" }:{ children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones: Record<string,string> = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger:  "bg-rose-50 text-rose-700 border-rose-200",
    info:    "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${tones[tone]}`}>{children}</span>;
}