"use client";
import React from "react";
import type { ChainEvent, ChainEventType } from "@/types/batches/types";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Factory,
  Package,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCw,
  ArrowDownLeft,
  FileText,
  Trash2,
  UserRound,
} from "lucide-react";

const eventIcons: Record<ChainEventType, React.ElementType> = {
  Manufactured: Factory,
  Received: Package,
  "QC Sampled": FlaskConical,
  "QC Passed": CheckCircle2,
  "QC Failed": XCircle,
  Labeled: FileText,
  Packed: Package,
  Shipped: Truck,
  Return: ArrowDownLeft,
  Destroyed: Trash2,
};

interface Props {
  event: ChainEvent;
  showDetail?: boolean;
}

export default function BatchChainEventItem({ event, showDetail }: Props) {
  const IconComp = eventIcons[event.type] ?? RefreshCw;
  const ts = (event as any).created_at ?? (event as any).createdAt ?? null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-md border border-gray-200 bg-white">
      <div className="shrink-0">
        <IconComp className="w-5 h-5 text-emerald-700" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{event.type}</span>
          <span className="text-xs text-gray-500">
            {ts ? `${formatDistanceToNowStrict(new Date(ts))} ago` : "—"}
          </span>
        </div>
        {showDetail && (
          <div className="text-sm text-gray-700 mt-1">
            {event.detail || "No details provided."}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <UserRound className="w-3.5 h-3.5" />
          <span>{(event as any).actor || "System"}</span>
        </div>
      </div>
    </div>
  );
}
