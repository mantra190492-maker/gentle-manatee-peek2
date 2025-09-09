"use client";
import { useState, useEffect } from "react";
import { useTasksStore, Task } from "@/lib/tasksStore";
import { CRMTable } from "@/components/crm/CRMTable";
import { Lanes } from "@/components/crm/Lanes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskDetailsDrawer } from "@/components/tasks/TaskDetailsDrawer";
import { Toolbar } from "@/components/crm/Toolbar";
import { useSearchParams, useNavigate } from "react-router-dom"; // Import useSearchParams and useNavigate

const views = ["Table", "Lanes"] as const;

export default function CrmTasksContent() {
  const { refresh, items: tasks, addTask, subscribeToChanges, loading: storeLoading } = useTasksStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [view, setView] = useState<(typeof views)[number]>("Table");
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newTaskAddedId, setNewTaskAddedId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [refresh, subscribeToChanges]);

  // Effect to handle 'action=newTask' URL parameter
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "newTask" && !drawerOpen) {
      void handleCreateNewTask();
      // Remove the action parameter from the URL to prevent re-triggering
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("action");
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, drawerOpen, navigate]);


  const handleTaskSelect = (task: Task) => {
    setDrawerTask(task);
    setDrawerOpen(true);
  };

  const handleCreateNewTask = async () => {
    const newTaskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'latest_activity_at' | 'updates_count'> = {
      task: "New Task",
      status: "Not Started",
      date: undefined,
      priority: "Low",
      notes: "",
      extra: "",
    };
    const createdTask = await addTask(newTaskData);
    if (createdTask) {
      setDrawerTask(createdTask);
      setDrawerOpen(true);
      setNewTaskAddedId(createdTask.id);
    }
  };

  const handleDrawerSaved = () => {
    void refresh();
    setDrawerOpen(false);
    setNewTaskAddedId(null);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div id="tasks-content" className="h-full flex flex-col">
        <Toolbar onNewTaskClick={handleCreateNewTask} onRefreshClick={refresh} />

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 mb-4">
              {views.map((v) => (
                <Button
                  key={v}
                  variant="ghost"
                  onClick={() => setView(v)}
                  className={cn(
                    "text-sm font-medium text-gray-600 hover:text-gray-900",
                    view === v && "text-emerald-700 border-b-2 border-emerald-600"
                  )}
                >
                  {v}
                </Button>
              ))}
            </div>

            {storeLoading && tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-6">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
                No tasks yet. Click "Add Task" to create one.
              </div>
            ) : view === "Table" ? (
              <CRMTable
                onTaskSelect={handleTaskSelect}
                newTaskAddedId={newTaskAddedId}
                onNewTaskAddedIdConsumed={() => setNewTaskAddedId(null)}
              />
            ) : (
              <Lanes onSelect={handleTaskSelect} />
            )}
          </div>
        </div>
      </div>

      <TaskDetailsDrawer
        key={drawerTask?.id || 'new-task-drawer'}
        task={drawerTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleDrawerSaved}
      />
    </div>
  );
}