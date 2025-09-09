"use client";
import { useTasksStore, Task, TaskStatus } from "@/lib/tasksStore";
import { useState } from "react";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TaskDetailsDrawer } from "@/components/tasks/TaskDetailsDrawer"; // Import the renamed drawer

const statusList: TaskStatus[] = ["Not Started", "In Progress", "Working on it", "Completed", "Stuck", "Done", "Pending"]; // Updated status list

export function Lanes({ onSelect }: { onSelect: (task: Task) => void }) {
  const tasks = useTasksStore((s) => s.items);
  const refresh = useTasksStore((s) => s.refresh);

  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTaskSelect = (task: Task) => {
    setDrawerTask(task);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {statusList.map((status) => {
          const items = tasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className="min-w-[280px] flex-1 bg-gray-50 rounded-lg border border-gray-200 p-3 flex flex-col shadow-sm"
            >
              <div className="font-semibold mb-3 flex items-center justify-between text-gray-900">
                <span>{status}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((task) => (
                  <Button
                    key={task.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition-all cursor-pointer h-auto flex flex-col items-start gap-1"
                    onClick={() => onSelect(task)}
                    variant="ghost"
                  >
                    <div className="font-medium text-gray-900">{task.task}</div>
                    <div className="text-xs text-gray-500">
                      Date: {task.date ? format(new Date(task.date), "MMM d, yyyy") : "N/A"}
                    </div>
                    <div className="mt-2">
                      <StatusPill value={task.status} onChange={() => {}} />
                    </div>
                  </Button>
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">No tasks in this stage.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <TaskDetailsDrawer
        task={drawerTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={refresh}
      />
    </>
  );
}