"use client";
import { useEffect, useState } from "react";
import FilesGallery from "@/components/files/FilesGallery";
import { listFiles, FileRow } from "@/lib/files/client";
import AddFileButton from "@/components/files/AddFileButton";
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state

export default function FilesTab({ taskId }:{ taskId?: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listFiles(undefined, taskId); // Pass taskId to listFiles
      setFiles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [taskId]); // Re-fetch when taskId changes

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <span className="ml-3 text-sm text-gray-500">Loading files…</span>
    </div>
  );

  if (!files.length) {
    // Empty state (light theme)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white p-4">
        <div className="text-gray-700 font-medium">No files yet</div>
        <div className="text-sm text-gray-500 text-center">Add your first file to this item</div>
        <AddFileButton taskId={taskId} onAdded={refresh} />
      </div>
    );
  }

  // Non-empty: hand off to full gallery (it manages search, grid/list, download, etc.)
  return <FilesGallery taskId={taskId} />;
}