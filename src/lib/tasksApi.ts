import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/db/schema";
import { validateAttachment } from "./attachments"; // Import the new validator
import { logActivity } from "@/lib/activity/client.ts"; // New import for activity logging

// Type definitions for new tables
export type TaskUpdate = Database['public']['Tables']['task_updates']['Row'];
export type NewTaskUpdate = Database['public']['Tables']['task_updates']['Insert'];
export type TaskReply = Database['public']['Tables']['task_replies']['Row'];
export type NewTaskReply = Database['public']['Tables']['task_replies']['Insert'];
export type TaskFile = Database['public']['Tables']['task_files']['Row'];
export type NewTaskFile = Database['public']['Tables']['task_files']['Insert'];
export type TaskActivity = Database['public']['Tables']['task_activity']['Row'];
export type NewTaskActivity = Database['public']['Tables']['task_activity']['Insert'];

// --- Updates API ---

export interface UpdateWithReplies extends TaskUpdate {
  replies: TaskReply[];
}

export async function listUpdates(taskId: string): Promise<UpdateWithReplies[] | null> {
  const { data, error } = await supabase
    .from("task_updates")
    .select(`*, replies:task_replies(*)`)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "task_replies", ascending: true }); // Order replies within updates

  if (error) {
    console.error("Error listing task updates:", error);
    toast.error("Failed to load updates: " + error.message);
    return null;
  }
  return data as UpdateWithReplies[];
}

export async function createUpdate(taskId: string, body: string, author: string): Promise<TaskUpdate> {
  if (!taskId) {
    console.error("createUpdate: taskId is undefined or null.");
    throw new Error("No task selected.");
  }
  try {
    const { data, error } = await supabase
      .from("task_updates")
      .insert({ task_id: taskId, body, author })
      .select('*')
      .single();

    if (error) throw error;

    // Log activity for the new update/comment
    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;
    void logActivity({
      task_id: taskId,
      field: "comment",
      action: "add",
      message: body,
      actor: actorId,
    });

    return data;
  } catch (e: any) {
    const msg = e?.message ?? "Failed to create task update";
    console.error("Error creating task update:", msg, e);
    throw new Error(msg);
  }
}

export async function createReply(updateId: string, body: string, author: string): Promise<TaskReply> {
  if (!updateId) {
    console.error("createReply: updateId is undefined or null.");
    throw new Error("No update selected to reply to.");
  }
  try {
    const { data, error } = await supabase
      .from("task_replies")
      .insert({ update_id: updateId, body, author })
      .select('*')
      .single();

    if (error) throw error;

    // Log activity for the new reply
    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;
    void logActivity({
      task_id: (await supabase.from('task_updates').select('task_id').eq('id', updateId).single()).data?.task_id || '', // Get parent task_id
      field: "comment",
      action: "reply",
      message: body,
      actor: actorId,
    });

    return data;
  } catch (e: any) {
    const msg = e?.message ?? "Failed to create task reply";
    console.error("Error creating task reply:", msg, e);
    throw new Error(msg);
  }
}

// --- Files API ---

export async function uploadTaskFile(taskId: string, file: File): Promise<TaskFile | null> {
  try {
    const validation = validateAttachment({ name: file.name, sizeBytes: file.size, mimeType: file.type });
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;

    const filePath = `${taskId}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-files') // Assuming a bucket named 'task-files'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('task-files').getPublicUrl(filePath);

    const newFile: NewTaskFile = {
      task_id: taskId,
      name: file.name,
      size_bytes: file.size,
      url: publicUrl,
      mime_type: file.type, // Store mime type
    };

    const { data, error } = await supabase
      .from("task_files")
      .insert(newFile)
      .select()
      .single();

    if (error) throw error;

    void logActivity({
      task_id: taskId,
      field: "file",
      action: "add",
      new_value: { name: file.name, url: publicUrl },
      actor: actorId,
    });

    return data;
  } catch (e: any) {
    const msg = e?.message ?? "Failed to upload file";
    console.error("Error uploading file:", msg, e);
    toast.error(msg);
    return null;
  }
}

interface ExternalFileMeta {
  name: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
}

export async function attachExternalDriveFile(taskId: string, fileMeta: ExternalFileMeta): Promise<TaskFile | null> {
  try {
    const validation = validateAttachment({ name: fileMeta.name, sizeBytes: fileMeta.sizeBytes, mimeType: fileMeta.mimeType });
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id || null;

    const newFile: NewTaskFile = {
      task_id: taskId,
      name: fileMeta.name,
      size_bytes: fileMeta.sizeBytes || 0, // Default to 0 if not provided by external drive
      url: fileMeta.url,
      mime_type: fileMeta.mimeType,
    };

    const { data, error } = await supabase
      .from("task_files")
      .insert(newFile)
      .select()
      .single();

    if (error) throw error;

    void logActivity({
      task_id: taskId,
      field: "file",
      action: "add",
      new_value: { name: fileMeta.name, url: fileMeta.url },
      actor: actorId,
    });

    return data;
  } catch (e: any) {
    const msg = e?.message ?? "Failed to attach external file";
    console.error("Error attaching external file record:", msg, e);
    toast.error(msg);
    return null;
  }
}

export async function listTaskFiles(taskId: string): Promise<TaskFile[] | null> {
  const { data, error } = await supabase
    .from("task_files")
    .select("*")
    .eq("task_id", taskId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error listing task files:", error);
    toast.error("Failed to load files: " + error.message);
    return null;
  }
  return data;
}

// --- Activity Log API ---

export async function listTaskActivity(taskId: string): Promise<TaskActivity[] | null> {
  const { data, error } = await supabase
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing task activity:", error);
    toast.error("Failed to load activity log: " + error.message);
    return null;
  }
  return data;
}