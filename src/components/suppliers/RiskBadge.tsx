"use client";
import { cn } from "@/lib/utils";
import React from "react";

interface RiskBadgeProps {
  score: number;
  className?: string;
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  let colorClass = "bg-green-100 text-green-800 border-green-200"; // Low risk
  if (score > 70) {
    colorClass = "bg-red-100 text-red-800 border-red-200"; // High risk
  } else if (score > 40) {
    colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200"; // Medium risk
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        colorClass,
        className
      )}
    >
      Risk: {score}
    </span>
  );
}