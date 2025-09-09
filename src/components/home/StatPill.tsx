import { cn } from "@/lib/utils";
import React from "react";

interface StatPillProps {
  label: string;
  className?: string;
}

export function StatPill({ label, className }: StatPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700",
        className
      )}
    >
      {label}
    </span>
  );
}