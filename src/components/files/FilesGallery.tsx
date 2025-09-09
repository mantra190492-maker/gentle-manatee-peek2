"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Grid, List, FileText, Search } from "lucide-react";
import AddFileButton from "./AddFileButton";
import { FileRow, getDownloadUrl, listFiles } from "@/lib/files/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input"; // Import Input for search
import { Button } from "@/components/ui/button"; // Import Button for download
import { cn } from "@/lib/utils"; // Import cn for utility classes

type ViewMode = "list" | "grid";

export default function FilesGallery({ taskId }:{ taskId?: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    console.log("FilesGallery: Attempting to fetch files with query:", q, "and taskId:", taskId);
    try {
      const fetchedFiles = await listFiles(q, taskId); // Pass taskId to listFiles
      setFiles(fetchedFiles);
      console.log("FilesGallery: Fetched files:", fetchedFiles);
    } catch (e: any) {
      console.error("FilesGallery: Failed to load files:", e);
      toast.error(e?.message ?? "Failed to load files.");
    } finally {
      setLoading(false);
      console.log("FilesGallery: Loading complete. Files count:", files.length);
    }
  };

  useEffect(() => {
    void refresh(); // on mount
  }, [taskId]); // Re-fetch when taskId changes

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 250); // Debounce search
    return () => clearTimeout(t);
  }, [q, taskId]); // Re-run debounce when q or taskId changes

  const total = files.length;
  const showing = total; // if you paginate, change this

  const selected = useMemo(() => files.find(f => f.id === selectedId) || null, [files, selectedId]);

  async function handleDownload() {
    try {
      if (!selected) return;
      const url = await getDownloadUrl(selected);
      const a = document.createElement("a");
      a.href = url;
      a.download = selected.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloading ${selected.name}`);
    } catch (e:any) {
      toast.error(e?.message ?? "Download failed");
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-3"> {/* Removed p-4 bg-white, now handled by TaskTabPanel */}
      {/* Header row */}
      <div className="flex items-center gap-3">
        <AddFileButton onAdded={refresh} taskId={taskId} />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search for files"
            className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className={cn(
              "h-10 w-10 rounded-xl border",
              view==="grid" ? "bg-gray-100 border-gray-300" : "border-gray-200 bg-white",
              "hover:bg-gray-100 p-0"
            )}
            onClick={()=>setView("grid")}
            aria-label="Grid view"
            title="Grid view"
          >
            <Grid className="mx-auto h-5 w-5 text-gray-700"/>
          </Button>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-10 rounded-xl border",
              view==="list" ? "bg-gray-100 border-gray-300" : "border-gray-200 bg-white",
              "hover:bg-gray-100 p-0"
            )}
            onClick={()=>setView("list")}
            aria-label="List view"
            title="List view"
          >
            <List className="mx-auto h-5 w-5 text-gray-700"/>
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!selected}
            className="h-10 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={selected ? `Download ${selected.name}` : "Select a file to download"}
          >
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-gray-700"/>
              <span className="text-sm text-gray-800">Download</span>
            </div>
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500">Showing {showing} out of {total} file{total!==1?"s":""}</div>

      {loading ? (
        <div className="text-center text-gray-500 py-6">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center text-gray-500 py-6">No files found.</div>
      ) : view === "list" ? (
        <div className="space-y-3">
          {files.map((f)=>(
            <button
              key={f.id}
              onClick={()=>setSelectedId(f.id)}
              className={cn(
                "w-full rounded-xl border p-3 bg-white hover:bg-gray-50 text-left transition-all",
                selectedId===f.id ? "ring-2 ring-emerald-500 border-emerald-300" : "border-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="h-12 w-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                  <span className="text-[10px] text-gray-600">
                    {(f.mime||"").includes("pdf") ? "PDF" : "FILE"}
                  </span>
                </div>
                {/* Title & meta */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-gray-900">{f.name}</div>
                  <div className="text-xs text-gray-500">Files gallery</div>
                </div>
                {/* Avatar + date (placeholder avatar path) */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {/* Using a simple img tag for avatar placeholder */}
                  <img src="/placeholder.svg" alt="User Avatar" width={20} height={20} className="rounded-full border border-gray-200"/>
                  <span>{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                {/* Actions */}
                <div className="ml-3 flex items-center gap-2">
                  <span className="h-8 rounded-lg border border-gray-300 px-2 text-xs flex items-center text-gray-700">V{f.version ?? 1}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f)=>(
            <button
              key={f.id}
              onClick={()=>setSelectedId(f.id)}
              className={cn(
                "rounded-xl border p-3 bg-white hover:bg-gray-50 text-left transition-all",
                selectedId===f.id ? "ring-2 ring-emerald-500 border-emerald-300" : "border-gray-200"
              )}
            >
              <div className="h-28 rounded-lg bg-gray-100 mb-3 flex items-center justify-center border border-gray-200">
                <span className="text-xs text-gray-600">{(f.mime||"").includes("pdf")?"PDF":"FILE"}</span>
              </div>
              <div className="truncate font-semibold text-gray-900">{f.name}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                <span>{new Date(f.created_at).toLocaleDateString()}</span>
                <span className="rounded-lg border border-gray-300 px-2 text-gray-700">V{f.version ?? 1}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}