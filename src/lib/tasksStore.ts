import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity/client.ts"; // New import for activity logging

export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Working on it" | "Stuck" | "Done" | "Pending";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type TaskOwner = "Yash" | "Alexis" | "Ops"; // Assuming these are fixed owners for now

export interface Task {
  id: string;
  user_id: string; // owner (set by trigger)
  task: string;
  status: TaskStatus;
  date?: string; // YYYY-MM-DD format
  priority?: TaskPriority;
  notes?: string;
  extra?: string; // Changed from JSONB to TEXT as per SQL
  contact_id?: string | null; // New: Link to a contact
  created_at: string;
  updated_at: string;
  latest_activity_at?: string | null; // New field for latest activity
  updates_count: number; // New field for the number of updates/comments
}

const TABLE_NAME = 'crm_tasks'; // Centralized table name

export type SortKey = "task" | "status" | "date" | "priority" | "created_at" | "updated_at" | "latest_activity_at" | "updates_count";
export type SortDir = "asc" | "desc";

export const defaultVisibleColumns: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event")[] = [
  "task", "status", "date", "priority", "notes", "extra", "created_at", "updated_at"
];

interface TasksState {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  q?: string;
  status?: TaskStatus | "All";
  owner?: TaskOwner | "All"; // Owner is not in DB schema, but kept for filtering UI
  sortKey: SortKey;
  sortDir: SortDir;
  visibleColumns: (keyof Task | "ongoing_notes" | "future_notes" | "google_calendar_event")[];
  loading: boolean;
  error: string | null;
  setFilters: (partial: Partial<Pick<TasksState, 'q' | 'status' | 'owner' | 'sortKey' | 'sortDir' | 'visibleColumns' | 'page'>>) => void;
  setPage: (p: number) => void;
  refresh: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'latest_activity_at' | 'updates_count'>) => Promise<Task | null>;
  updateTask: (id: string, patch: Partial<Omit<Task, 'created_at' | 'updated_at' | 'user_id' | 'latest_activity_at' | 'updates_count'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  q: "",
  status: "All",
  owner: "All",
  sortKey: "created_at",
  sortDir: "desc",
  visibleColumns: defaultVisibleColumns,
  loading: false,
  error: null,

  setFilters: (partial) => {
    set((state) => ({ ...state, ...partial, page: partial.page !== undefined ? partial.page : 1 }));
    void get().refresh();
  },
  setPage: (p) => {
    set({ page: p });
    void get().refresh();
  },
  refresh: async () => {
    set({ loading: true, error: null });
    const { q, status, page, pageSize, sortKey, sortDir } = get();

    let query = supabase.from(TABLE_NAME).select("*", { count: "exact" });

    if (q) {
      query = query.ilike("task", `%${q}%`);
    }
    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    // Apply sorting
    query = query.order(sortKey, { ascending: sortDir === "asc" });

    // Pagination is now handled by limit, but keeping page/pageSize for potential future use
    // const from = (page - 1) * pageSize;
    // const to = from + pageSize - 1;
    // query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      set({ error: error.message, loading: false });
      if (error.code === "401" || error.code === "403") { // Generic RLS/Auth error codes
        toast.error("You don’t have permission. Please sign in again.");
      } else {
        toast.error("Failed to fetch tasks: " + error.message);
      }
    } else {
      set({ items: data || [], total: count || 0, loading: false });
    }
  },

  addTask: async (taskData) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        items: [data as Task, ...state.items],
        total: state.total + 1,
        loading: false,
      }));
      toast.success("Task added successfully!");
      // Log activity
      void logActivity({
        task_id: data.id,
        field: "created",
        action: "create",
        new_value: { title: data.task },
        actor: actorId,
      });
      return data as Task;
    } catch (e: any) {
      const msg = e?.message ?? "Failed to add task";
      console.error("Error adding task:", msg, e);
      set({ error: msg, loading: false });
      toast.error(msg);
      return null;
    }
  },

  updateTask: async (id, patch) => {
    const originalItems = get().items;
    const originalTask = originalItems.find(task => task.id === id);
    if (!originalTask) return;

    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;

    // Optimistic update
    set((state) => ({
      items: state.items.map((task) =>
        task.id === id ? { ...task, ...patch } : task
      ),
    }));

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(patch)
        .eq("id", id);

      if (error) throw error;

      toast.success("Task updated successfully!");
      // Log activity for each changed field
      for (const key in patch) {
        const field = key as keyof typeof patch;
        const oldValue = originalTask[field];
        const newValue = patch[field];

        if (oldValue !== newValue) {
          let activityField: string = field;
          let message: string | null = null;
          if (field === 'notes' || field === 'extra') {
            activityField = 'text';
            message = String(newValue);
          } else if (field === 'task') {
            activityField = 'title';
          } else if (field === 'contact_id') { // Log contact changes
            activityField = 'contact';
          }

          void logActivity({
            task_id: id,
            field: activityField,
            action: "update",
            old_value: oldValue,
            new_value: newValue,
            message: message,
            actor: actorId,
          });
        }
      }
    } catch (e: any) {
      const msg = e?.message ?? "Failed to update task";
      console.error("Error updating task:", msg, e);
      set({ error: msg, items: originalItems }); // Revert on error
      toast.error(msg);
    }
  },

  deleteTask: async (id) => {
    const originalItems = get().items;
    const originalTask = originalItems.find(task => task.id === id);
    if (!originalTask) return;

    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;

    // Optimistic update
    set((state) => ({
      items: state.items.filter((task) => task.id !== id),
      total: state.total - 1,
    }));

    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

      if (error) throw error;

      toast.success("Task deleted successfully!");
      // Log activity
      void logActivity({
        task_id: id,
        field: "created", // Using 'created' field for deletion event
        action: "remove",
        old_value: { title: originalTask.task },
        actor: actorId,
      });
    } catch (e: any) {
      const msg = e?.message ?? "Failed to delete task";
      console.error("Error deleting task:", msg, e);
      set({ error: msg, items: originalItems, total: originalItems.length }); // Revert on error
      toast.error(msg);
    }
  },

  subscribeToChanges: () => {
    const channel = supabase
      .channel(`public:${TABLE_NAME}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE_NAME },
        (payload) => {
          console.log("Realtime change received!", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let newItems = [...state.items];
            switch (eventType) {
              case "INSERT":
                // Only add if not already present (e.g., if it was added by this client optimistically)
                if (!newItems.some(item => item.id === newRecord.id)) {
                  newItems = [newRecord as Task, ...newItems];
                  toast.info(`New task "${(newRecord as Task).task}" added!`);
                }
                break;
              case "UPDATE":
                newItems = newItems.map((item) =>
                  item.id === newRecord.id ? { ...item, ...newRecord as Task } : item
                );
                toast.info(`Task "${(newRecord as Task).task}" updated!`);
                break;
              case "DELETE":
                newItems = newItems.filter((item) => item.id !== oldRecord.id);
                toast.info(`Task deleted!`);
                break;
            }
            return { items: newItems, total: newItems.length }; // Recalculate total for simplicity
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
}));