"use client";
import { useTasksStore, Task, TaskStatus, TaskPriority, defaultVisibleColumns } from "@/lib/tasksStore";
import { useState, useRef, useEffect } from "react";
import { StatusPill } from "./StatusPill";
import { UpdateBubble } from "./UpdateBubble";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Loader2, Dot } from "lucide-react"; // Added Dot icon
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isWithinInterval, subHours } from "date-fns"; // Added isWithinInterval, subHours
import { TaskCard } from "./TaskCard";
import { useIsMobile } from "@/hooks/use-mobile";
import DateCellPro from "@/components/crm/DateCellPro";
import PriorityCellPro from "@/components/crm/PriorityCellPro";
import { TaskDetailsDrawer } from "@/components/tasks/TaskDetailsDrawer"; // Import the renamed drawer

export function CRMTable({
  onTaskSelect,
  newTaskAddedId,
  onNewTaskAddedIdConsumed,
}: {
  onTaskSelect: (task: Task) => void;
  newTaskAddedId: string | null;
  onNewTaskAddedIdConsumed: () => void;
}) {
  const { items: tasks, total, updateTask, loading: storeLoading, visibleColumns } = useTasksStore();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Task } | null>(null);
  const [cellValue, setCellValue] = useState<string>("");
  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newRowRef = useRef<HTMLTableRowElement>(null);
  const isMobile = useIsMobile();

  // Debounce logic for inline edits
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingCell) {
      const task = tasks.find(t => t.id === editingCell.id);
      if (task) {
        setCellValue(String(task[editingCell.field] || ""));
      }
      setTimeout(() => {
        if (editingCell.field === 'task' || editingCell.field === 'extra') {
          inputRef.current?.focus();
        } else if (editingCell.field === 'notes') {
          textareaRef.current?.focus();
        }
      }, 0);
    }
  }, [editingCell, tasks]);

  // Effect to scroll to and focus a newly added task
  useEffect(() => {
    if (newTaskAddedId && newRowRef.current) {
      newRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Find the task cell and trigger edit mode
      const newTask = tasks.find(t => t.id === newTaskAddedId);
      if (newTask) {
        setEditingCell({ id: newTask.id, field: 'task' });
      }
      onNewTaskAddedIdConsumed(); // Mark as consumed
    }
  }, [newTaskAddedId, tasks, onNewTaskAddedIdConsumed]);


  const handleRowSelect = (id: string, isSelected: boolean) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRows(new Set(tasks.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleCellClick = (task: Task, field: keyof Task) => {
    setEditingCell({ id: task.id, field });
  };

  const handleCellValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCellValue(e.target.value);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      void handleSaveCell(e.target.value);
    }, 400);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setSavingCellId(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error saving inline edit:", error);
    } finally {
      setSavingCellId(null);
      setEditingCell(null); // Exit editing mode
    }
  };

  const handleSelectValueChange = (value: string | TaskPriority) => { // Only for Priority now
    setCellValue(String(value));
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      void handleSaveCell(value);
    }, 400);
  };

  const handleSaveCell = async (value: any) => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    const originalTask = tasks.find(t => t.id === id);
    if (!originalTask || originalTask[field] === value) {
      setSavingCellId(null);
      return; // No change or task not found
    }

    setSavingCellId(id); // Show spinner for this row
    try {
      await updateTask(id, { [field]: value });
    } catch (error) {
      console.error("Error saving inline edit:", error);
      // Revert cell value on error (handled by zustand store)
    } finally {
      setSavingCellId(null);
      setEditingCell(null); // Exit editing mode
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // Trigger onBlur to save
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null); // Exit editing without saving current input value
    }
  };

  if (storeLoading && tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
        Loading tasks...
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
        No tasks found. Click "Add Task" to add one.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onTaskSelect={onTaskSelect} />
        ))}
      </div>
    );
  }

  const columnMap: Record<string, { header: string; render: (task: Task) => React.ReactNode; className?: string }> = {
    task: {
      header: "Task",
      render: (task) => {
        const updatesCount = task.updates_count; // Use actual count
        return (
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
            {editingCell?.id === task.id && editingCell.field === 'task' ? (
              <Input
                ref={inputRef}
                value={cellValue}
                onChange={handleCellValueChange}
                onBlur={() => void handleSaveCell(cellValue)}
                onKeyDown={handleInputKeyDown}
                className="h-8 px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md"
              />
            ) : (
              <span onClick={(e) => { e.stopPropagation(); onTaskSelect(task); }} className="flex-1 cursor-pointer min-w-[50px] block">
                {task.task || "—"}
              </span>
            )}
            {updatesCount > 0 && (
              <UpdateBubble count={updatesCount} className="ml-2" />
            )}
            {savingCellId === task.id && <Loader2 className="w-4 h-4 animate-spin text-emerald-600 ml-2" />}
          </div>
        );
      },
      className: "min-w-[18rem] lg:w-[18rem] xl:w-[18rem]", // 288px
    },
    status: {
      header: "Status",
      render: (task) => (
        <StatusPill
          value={task.status}
          onChange={(newStatus) => handleStatusChange(task.id, newStatus)}
        />
      ),
      className: "min-w-[9rem] lg:w-[9rem] xl:w-[9rem]", // 144px
    },
    date: {
      header: "Date",
      render: (task) => <DateCellPro id={task.id} value={task.date} />,
      className: "min-w-[10rem] lg:w-[10rem] xl:w-[10rem]", // 160px
    },
    priority: {
      header: "Priority",
      render: (task) => <PriorityCellPro id={task.id} value={task.priority} />,
      className: "min-w-[8rem] lg:w-[8rem] xl:w-[8rem]", // 128px
    },
    notes: {
      header: "Ongoing notes",
      render: (task) => (
        editingCell?.id === task.id && editingCell.field === 'notes' ? (
          <Textarea
            ref={textareaRef}
            value={cellValue}
            onChange={handleCellValueChange}
            onBlur={() => void handleSaveCell(cellValue)}
            onKeyDown={handleInputKeyDown}
            className="h-10 px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md resize-none"
            rows={1}
          />
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-600 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); handleCellClick(task, 'notes'); }}>
                {task.notes || "Add notes..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2 text-sm text-gray-700 rounded-xl border border-gray-200 bg-white shadow-xl">
              {task.notes || "No ongoing notes."}
            </PopoverContent>
          </Popover>
        )
      ),
      className: "min-w-[12rem] lg:w-[12rem] xl:w-[16rem]", // 192px (lg), 256px (xl)
    },
    extra: {
      header: "Future notes",
      render: (task) => (
        editingCell?.id === task.id && editingCell.field === 'extra' ? (
          <Input
            ref={inputRef}
            value={cellValue}
            onChange={handleCellValueChange}
            onBlur={() => void handleSaveCell(cellValue)}
            onKeyDown={handleInputKeyDown}
            className="h-8 px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md"
          />
        ) : (
          <span onClick={(e) => { e.stopPropagation(); handleCellClick(task, 'extra'); }} className="flex-1 cursor-text min-w-[50px] block">
            {task.extra || "—"}
          </span>
        )
      ),
      className: "min-w-[12rem] lg:w-[12rem] xl:w-[12rem]", // 192px
    },
    google_calendar_event: {
      header: "Google Calendar event",
      render: (task) => <span className="text-gray-500">N/A</span>, // Placeholder
      className: "min-w-[12rem] lg:w-[12rem] xl:w-[12rem]", // 192px
    },
    created_at: {
      header: "Created At",
      render: (task) => (task.created_at ? format(new Date(task.created_at), "MMM d, yyyy p") : "N/A"),
      className: "min-w-[10rem] lg:w-[10rem] xl:w-[10rem]", // 160px
    },
    updated_at: {
      header: "Updated At",
      render: (task) => {
        const latestActivity = task.latest_activity_at ? new Date(task.latest_activity_at) : null;
        const isRecent = latestActivity && isWithinInterval(latestActivity, { start: subHours(new Date(), 24), end: new Date() });
        return (
          <div className="flex items-center gap-1">
            {isRecent && <Dot className="w-5 h-5 text-emerald-500" aria-label="Recent activity" />}
            {latestActivity ? format(latestActivity, "MMM d, yyyy p") : "N/A"}
          </div>
        );
      },
      className: "min-w-[10rem] lg:w-[10rem] xl:w-[10rem]", // 160px
    },
  };

  const displayedColumns = visibleColumns.map(colKey => columnMap[colKey]).filter(Boolean);

  return (
    <div className="relative overflow-visible md:overflow-x-auto rounded-2xl border border-gray-200 shadow-sm hidden md:block">
      <div className="overflow-auto max-h-[calc(100vh-220px)]">
        <table className="w-full text-sm table-fixed border-separate border-spacing-x-2">
          <thead>
            <tr>
              <th className="w-12 px-4 py-3 text-left sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
                <Checkbox
                  checked={selectedRows.size === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
                />
              </th>
              {displayedColumns.map((col, index) => (
                <th key={col.header} className={cn(
                  "px-4 py-3 text-left text-gray-600 font-semibold sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 whitespace-nowrap",
                  col.className
                )}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const isSelected = selectedRows.has(task.id);

              return (
                <tr
                  key={task.id}
                  ref={task.id === newTaskAddedId ? newRowRef : null}
                  className={cn(
                    "h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group",
                    isSelected && "bg-emerald-50 border-l-4 border-emerald-600",
                    index % 2 === 1 ? "bg-gray-50/60" : "bg-white" // Zebra stripes
                  )}
                >
                  <td className="w-12 px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(task.id, checked as boolean)}
                      aria-label={`Select row ${task.task}`}
                    />
                  </td>
                  {displayedColumns.map((col) => (
                    <td key={col.header} className="px-4 py-3 text-gray-900 font-medium cursor-pointer truncate" onClick={() => onTaskSelect(task)}>
                      {col.render(task)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}