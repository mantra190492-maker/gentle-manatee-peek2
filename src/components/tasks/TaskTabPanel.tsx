"use client";
import { cn } from "@/lib/utils";
import React from "react"; // Import React

export default function TaskTabPanel({
  active,
  className,
  children,
}: { active: boolean; className?: string; children: React.ReactNode }) {
  if (!active) return null;
  return (
    <div className={cn("h-full w-full overflow-hidden bg-white", className)}>
      {children}
    </div>
  );
}