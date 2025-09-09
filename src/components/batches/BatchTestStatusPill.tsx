"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function BatchTestStatusPill({ pass, className }: { pass: boolean; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      pass ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200",
      className
    )}>
      {pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {pass ? "Pass" : "Fail"}
    </span>
  );
}