"use client";
import React from "react";
import type { Task } from "@/lib/tasksStore";
import { StatusPill } from "./StatusPill";
import { PriorityPill } from "./PriorityPill";
import { UpdateBubble } from "./UpdateBubble";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onTaskSelect: (task: Task) => void;
}

export function TaskCard({ task, onTaskSelect }: TaskCardProps) {
  const updatesCount = task.updates_count; // Use actual count
  const priority = task.priority || "Low";

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {task.task}
          {updatesCount > 0 && <UpdateBubble count={updatesCount} />}
        </h3>
        <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 hover:text-gray-700" onClick={() => onTaskSelect(task)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <StatusPill value={task.status} onChange={() => {}} />
        <PriorityPill priority={priority} />
        {task.date && (
          <span className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" /> {format(new Date(task.date), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {task.notes && (
        <p className="text-sm text-gray-700 line-clamp-2">
          {task.notes}
        </p>
      )}

      <div className="text-xs text-gray-500 mt-1">
        Created: {format(new Date(task.created_at), "MMM d, yyyy")}
      </div>
    </div>
  );
}