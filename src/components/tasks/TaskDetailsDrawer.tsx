"use client";
import { useState, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasksStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Smile, Sparkles, Send, Upload, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useTasksStore } from "@/lib/tasksStore";
import DateInput from "@/components/common/DateInput";
import { UpdatesPanel } from "./UpdatesPanel";
import FilesTab from "@/components/files/FilesTab"; // Corrected import path for FilesTab
import ActivityLogTab from "@/components/tasks/ActivityLogTab"; // Import the new ActivityLogTab
import TaskTabPanel from "@/components/tasks/TaskTabPanel"; // Import the new TaskTabPanel
import ContactPicker from "@/components/pickers/ContactPicker"; // Import ContactPicker

const statusOpts: TaskStatus[] = ["Not Started", "In Progress", "Working on it", "Completed", "Stuck", "Done", "Pending"];
const priorityOpts: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

export function TaskDetailsDrawer({
  task,
  open,
  onClose,
  onSaved,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: Task) => void;
}) {
  // Explicitly check if task is null or undefined before proceeding
  if (!task) {
    console.log("TaskDetailsDrawer: task prop is null or undefined. Not rendering.");
    return null;
  }

  const [localTaskData, setLocalTaskData] = useState<Task>(task);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("updates");

  const { updateTask: tasksStoreUpdateTask } = useTasksStore();

  useEffect(() => {
    // Update local state when task prop changes
    setLocalTaskData(task);
    // Reset active tab when task changes or drawer opens/closes
    if (open) {
      setActiveTab("updates");
    }
  }, [task, open]); // Dependency array includes 'task'

  // Only render the drawer if 'open' is true
  if (!open) {
    return null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updatedPatch: Partial<Omit<Task, 'created_at' | 'updated_at' | 'user_id'>> = {
        task: localTaskData.task,
        status: localTaskData.status,
        date: localTaskData.date,
        priority: localTaskData.priority,
        notes: localTaskData.notes,
        extra: localTaskData.extra,
        contact_id: localTaskData.contact_id, // Include contact_id
      };
      await tasksStoreUpdateTask(localTaskData.id, updatedPatch);
      if (onSaved) onSaved(localTaskData); // Pass the local state back
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-gray-900/30" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-xl bg-white h-full shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="font-semibold text-lg text-gray-900">Task Details</div>
          <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-4 h-auto rounded-none border-b border-gray-200 bg-gray-50 p-0">
            <TabsTrigger value="updates" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
              Updates
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
              Files
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
              Activity Log
            </TabsTrigger>
          <TabsTrigger value="item-card" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
              Item Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="h-full flex flex-col">
            <UpdatesPanel key={localTaskData.id} taskId={localTaskData.id} />
          </TabsContent>

          <TabsContent value="files" className="h-full flex flex-col"> {/* Ensure full height for tab content */}
            <TaskTabPanel active={activeTab === "files"} className="p-4"> {/* Apply padding and background here */}
              <FilesTab taskId={localTaskData.id} />
            </TaskTabPanel>
          </TabsContent>

          <TabsContent value="activity" className="h-full flex flex-col">
            <TaskTabPanel active={activeTab === "activity"}>
              <ActivityLogTab taskId={localTaskData.id} title={localTaskData.task} />
            </TaskTabPanel>
          </TabsContent>

          <TabsContent value="item-card" className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="font-semibold text-lg mb-4 text-gray-900">Task Information</div>
            <form
              className="flex flex-col gap-3 flex-1"
              onSubmit={e => { e.preventDefault(); void handleSave(); }}
            >
              <div className="grid gap-2">
                <Label htmlFor="task">Task</Label>
                <Input
                  id="task"
                  value={localTaskData.task}
                  onChange={e => setLocalTaskData({ ...localTaskData, task: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={localTaskData.status}
                  onValueChange={(val: TaskStatus) => setLocalTaskData({ ...localTaskData, status: val })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOpts.map((s: TaskStatus) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <DateInput
                  value={localTaskData.date ? new Date(localTaskData.date) : undefined}
                  onChange={(date) => setLocalTaskData({ ...localTaskData, date: date ? format(date, "yyyy-MM-dd") : undefined })}
                  placeholder="Pick a date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={localTaskData.priority}
                  onValueChange={(val: TaskPriority) => setLocalTaskData({ ...localTaskData, priority: val })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOpts.map((p: TaskPriority) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={localTaskData.notes || ""}
                  onChange={e => setLocalTaskData({ ...localTaskData, notes: e.target.value })}
                  className="resize-y"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="extra">Extra Info</Label>
                <Input
                  id="extra"
                  value={localTaskData.extra || ""}
                  onChange={e => setLocalTaskData({ ...localTaskData, extra: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_id">Contact</Label>
                <ContactPicker
                  value={localTaskData.contact_id ?? null}
                  onChange={(id) => setLocalTaskData(prev => ({ ...prev, contact_id: id }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user_id">Owner ID</Label>
                <Input id="user_id" value={localTaskData.user_id || ""} readOnly className="bg-gray-100" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="created_at">Created At</Label>
                <Input id="created_at" value={localTaskData.created_at ? format(new Date(localTaskData.created_at), "PPP p") : "N/A"} readOnly className="bg-gray-100" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="updated_at">Updated At</Label>
                <Input id="updated_at" value={localTaskData.updated_at ? format(new Date(localTaskData.updated_at), "PPP p") : "N/A"} readOnly className="bg-gray-100" />
              </div>
              <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-800">Close</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}