import { supabase } from "@/integrations/supabase/client";

const MAX = 5 * 1024 * 1024; // 5 MB
const BLOCKED = /^(audio|video)\//i;

export type FileRow = {
  id: string;
  name: string;
  mime: string;
  size_bytes: number;
  url: string;
  version: number;
  created_at: string;
  uploaded_by: string | null;
};

export async function uploadLocalFile(file: File, opts: { taskId?: string }) {
  if (BLOCKED.test(file.type)) throw new Error("Audio/video files are not allowed.");
  if (file.size > MAX) throw new Error("Max file size is 5 MB.");

  const path = `${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from("attachments").upload(path, file, { upsert: false });
  if (up.error) throw up.error;

  const pub = supabase.storage.from("attachments").getPublicUrl(up.data.path);
  const url = pub.data.publicUrl;

  const { data, error } = await supabase
    .from("files")
    .insert({
      task_id: opts.taskId ?? null,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size_bytes: file.size,
      url,
      // version defaults to 1 in DB
    })
    .select()
    .single();
  if (error) throw error;
  return data as FileRow;
}

export async function listFiles(q?: string, taskId?: string) {
  let query = supabase
    .from("files")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (q?.trim()) query = query.ilike("name", `%${q.trim()}%`);
  if (taskId) query = query.eq("task_id", taskId); // Filter by taskId if provided

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FileRow[];
}

export async function getDownloadUrl(file: FileRow) {
  // If bucket is public, return direct URL. If private, sign it:
  // const { data } = await supabase.storage.from("attachments").createSignedUrl(file.path, 60);
  return file.url;
}