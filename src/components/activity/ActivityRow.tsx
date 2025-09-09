"use client";
import FieldIcon from "./FieldIcon.tsx";
import { Chip } from "./Chip.tsx";
import { formatDistanceToNow } from "date-fns";
import React from "react"; // Import React

function statusTone(v?: string) {
  if (!v) return "neutral";
  const s = v.toLowerCase();
  if (s.includes("completed") || s.includes("done")) return "success";
  if (s.includes("progress") || s.includes("working")) return "warning";
  if (s.includes("pending")) return "info";
  if (s.includes("stuck")) return "danger";
  return "neutral";
}

export default function ActivityRow({
  itemTitle,
  actorAvatar = "/placeholder.svg", // Using placeholder.svg
  field,
  oldValue,
  newValue,
  message,
  createdAt,
}: {
  itemTitle: string;
  actorAvatar?: string;
  field: string;
  oldValue?: any;
  newValue?: any;
  message?: string | null;
  createdAt: string;
}) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const renderValue = (v: any, side: "old" | "new") => {
    if (field === "status") return <Chip tone={statusTone(String(v))}>{String(v ?? "-")}</Chip>;
    if (field === "due_date" || field === "date") return <Chip>{v ? new Date(v).toLocaleDateString() : "-"}</Chip>;
    if (field === "file") return <Chip tone="info">{v?.name ?? "File"}</Chip>;
    if (typeof v === "string") return <span className="truncate">{v || "-"}</span>;
    if (v === null || v === undefined) return <span className="truncate">-</span>;
    return <span className="truncate">{JSON.stringify(v)}</span>;
  };

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 py-3">
      {/* time */}
      <div className="w-16 shrink-0 text-xs text-gray-500">{timeAgo.replace("about ", "")}</div>

      {/* avatar + title */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <img src={actorAvatar} width={28} height={28} alt="Actor Avatar" className="rounded-full border border-gray-200" />
        <div className="font-medium text-gray-900 truncate">{itemTitle}</div>
      </div>

      {/* field */}
      <div className="flex items-center gap-2 w-40 shrink-0">
        <FieldIcon field={field} />
        <div className="text-gray-700 text-sm capitalize">
          {field === "text" ? "Text" : field.replace("_", " ")}
        </div>
      </div>

      {/* old -> new */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-sm text-gray-700 min-w-0 truncate">{renderValue(oldValue, "old")}</div>
        <div className="text-gray-400">›</div>
        <div className="text-sm text-gray-900 min-w-0 truncate">{renderValue(newValue, "new")}</div>
      </div>

      {/* message (for notes) */}
      {message ? <div className="max-w-[28rem] text-sm text-gray-800 truncate">{message}</div> : <div className="w-0" />}
    </div>
  );
}