"use client";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Smile, Sparkles, Send, AlertCircle } from "lucide-react";
import { UpdateItem } from "./UpdateItem";
import { listUpdates, createUpdate, createReply, uploadTaskFile, attachExternalDriveFile, UpdateWithReplies, TaskUpdate, TaskReply } from "@/lib/tasksApi";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // For getting current user
import AttachmentMenu from "@/components/crm/AttachmentMenu"; // Import the renamed component

interface UpdatesPanelProps {
  taskId: string;
}

export function UpdatesPanel({ taskId }: UpdatesPanelProps) {
  const [updates, setUpdates] = useState<UpdateWithReplies[]>([]);
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null); // New state for panel-specific errors

  const fetchUpdates = async () => {
    setLoading(true);
    const data = await listUpdates(taskId);
    if (data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!taskId) {
      setPanelError("No task selected. Please select a task to view/add updates.");
      setLoading(false);
      return;
    }

    void fetchUpdates();

    // Set up Realtime subscription for updates
    const updatesChannel = supabase
      .channel(`task_updates:${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_updates", filter: `task_id=eq.${taskId}` },
        (payload) => {
          console.log("Realtime update received!", payload);
          const newUpdate = payload.new as TaskUpdate;
          setUpdates(prev => {
            // Only add if not already present (e.g., if it was added by this client optimistically)
            if (prev.some(u => u.id === newUpdate.id)) {
              return prev.map(u => u.id === newUpdate.id ? { ...newUpdate, replies: u.replies } : u);
            }
            return [{ ...newUpdate, replies: [] }, ...prev];
          });
          setRealtimeError(null);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setRealtimeError("Realtime updates for comments are not available. Data might be stale.");
          console.error("Supabase Realtime channel error for task_updates.");
        }
      });

    // Set up Realtime subscription for replies
    const repliesChannel = supabase
      .channel(`task_replies:${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_replies" }, // Filter by update_id later if needed
        (payload) => {
          console.log("Realtime reply received!", payload);
          const newReply = payload.new as TaskReply;
          setUpdates(prev => prev.map(update => {
            if (update.id === newReply.update_id) {
              // Only add if not already present (e.g., from optimistic UI)
              if (update.replies.some(r => r.id === newReply.id)) {
                return { ...update, replies: update.replies.map(r => r.id === newReply.id ? newReply : r) };
              }
              return { ...update, replies: [...update.replies, newReply] };
            }
            return update;
          }));
          setRealtimeError(null);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setRealtimeError("Realtime updates for replies are not available. Data might be stale.");
          console.error("Supabase Realtime channel error for task_replies.");
        }
      });


    return () => {
      void supabase.removeChannel(updatesChannel);
      void supabase.removeChannel(repliesChannel);
    };
  }, [taskId]);

  const handlePostUpdate = async () => {
    if (!newUpdateContent.trim()) return;
    if (!taskId) {
      setPanelError("Cannot post update: No task selected.");
      return;
    }

    setPosting(true);
    setPanelError(null); // Clear previous panel errors

    const user = await supabase.auth.getUser();
    const authorName = user.data.user?.email || "Anonymous";

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticUpdate: UpdateWithReplies = {
      id: tempId,
      task_id: taskId,
      author: authorName,
      body: newUpdateContent.trim(),
      created_at: new Date().toISOString(),
      replies: [],
    };
    setUpdates(prev => [optimisticUpdate, ...prev]);
    setNewUpdateContent(""); // Clear input optimistically

    try {
      const newUpdate = await createUpdate(taskId, optimisticUpdate.body, authorName);
      // Replace optimistic update with actual data
      setUpdates(prev => prev.map(u => u.id === tempId ? { ...newUpdate, replies: [] } : u));
      toast.success("Update posted!");
    } catch (err: any) {
      const msg = err?.message ?? "Failed to post update.";
      console.error("Error posting update:", msg, err);
      setPanelError(msg); // Display specific error in panel
      toast.error(msg); // Generic toast
      // Revert optimistic update on failure
      setUpdates(prev => prev.filter(u => u.id !== tempId));
      setNewUpdateContent(optimisticUpdate.body); // Restore content on error
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (updateId: string, body: string, author: string) => {
    setPanelError(null); // Clear previous panel errors

    // Optimistic reply
    const tempId = `temp-reply-${Date.now()}`;
    const optimisticReply: TaskReply = {
      id: tempId,
      update_id: updateId,
      author: author,
      body: body,
      created_at: new Date().toISOString(),
    };
    setUpdates(prev => prev.map(update =>
      update.id === updateId ? { ...update, replies: [...update.replies, optimisticReply] } : update
    ));

    try {
      const newReply = await createReply(updateId, body, author);
      setUpdates(prev => prev.map(update =>
        update.id === updateId ? { ...update, replies: update.replies.map(r => r.id === tempId ? newReply : r) } : update
      ));
      toast.success("Reply posted!");
      return newReply;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to post reply.";
      console.error("Error posting reply:", msg, err);
      setPanelError(msg); // Display specific error in panel
      toast.error(msg); // Generic toast
      // Revert optimistic reply on failure
      setUpdates(prev => prev.map(update =>
        update.id === updateId ? { ...update, replies: update.replies.filter(r => r.id !== tempId) } : update
      ));
      return null;
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!taskId) {
      toast.error("No task selected to attach file to.");
      return;
    }
    try {
      await uploadTaskFile(taskId, file);
      // File will appear in Files tab and activity log via Realtime
    } catch (e: any) {
      const msg = e?.message ?? "Failed to upload file.";
      console.error("Error uploading file:", msg, e);
      toast.error(msg);
    }
  };

  const handleExternalFileAttached = async () => { // Changed to no-argument function
    if (!taskId) {
      toast.error("No task selected to attach file to.");
      return;
    }
    // Placeholder for Google Drive picker logic
    toast.message("Google Drive integration coming soon. No file attached.");
    // When implemented, it would look something like:
    // const fileMeta = await openGoogleDrivePicker(); // This would return the fileMeta
    // if (fileMeta) {
    //   const attachedFile = await attachExternalDriveFile(taskId, fileMeta);
    //   if (attachedFile) { /* handle success */ }
    // }
  };

  if (panelError && !taskId) { // Display specific error if taskId is missing
    return (
      <div className="text-center text-rose-500 py-6">{panelError}</div>
    );
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-6">Loading updates...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {realtimeError && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm mx-4 mt-4">
          <AlertCircle className="w-5 h-5" /> {realtimeError}
        </div>
      )}
      {panelError && ( // Display panel-specific error
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3 text-sm mx-4 mt-4">
          <AlertCircle className="w-5 h-5" /> {panelError}
        </div>
      )}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
          <Textarea
            placeholder="@mention someone, add an update..."
            className="w-full border-none focus-visible:ring-0 resize-y bg-transparent text-gray-900 placeholder:text-gray-500 min-h-[80px]"
            rows={3}
            value={newUpdateContent}
            onChange={(e) => setNewUpdateContent(e.target.value)}
            disabled={posting}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <AttachmentMenu
                onUpload={handleFileSelected}
                onPickFromDrive={handleExternalFileAttached}
              />
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Smile className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handlePostUpdate} disabled={!newUpdateContent.trim() || posting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="w-4 h-4 mr-2" /> {posting ? "Posting..." : "Update"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {updates.length === 0 ? (
          <div className="text-center text-gray-500 py-6">No updates yet.</div>
        ) : (
          updates.map(update => (
            <UpdateItem key={update.id} update={update} onReply={handleReply} />
          ))
        )}
      </div>
    </div>
  );
}