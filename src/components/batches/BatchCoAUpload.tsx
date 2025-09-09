"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Loader2, XCircle } from "lucide-react";
import type { CoAFile } from "@/types/batches/types";
import { uploadCoAFile, getCoAFileUrl } from "@/server/batches/service";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface BatchCoAUploadProps {
  batchId: string;
  coaFiles: CoAFile[];
  onCoAUploaded: () => void;
}

export function BatchCoAUpload({ batchId, coaFiles, onCoAUploaded }: BatchCoAUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    setIsUploading(true);
    try {
      const file = event.target.files[0];
      await uploadCoAFile(batchId, file);
      onCoAUploaded();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload CoA.");
    } finally {
      setIsUploading(false);
      event.target.value = ""; // Clear input
    }
  };

  const handleDownloadCoA = async (fileId: string, fileName: string) => {
    try {
      const url = await getCoAFileUrl(fileId);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Downloading ${fileName}...`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download CoA.");
    }
  };

  const handleDeleteCoA = async (fileId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this CoA file?")) return;
    try {
      // First delete from storage
      const pathInBucket = filePath.replace(supabase.storage.from("coa").getPublicUrl('').data.publicUrl + '/', '');
      const { error: storageError } = await supabase.storage.from("coa").remove([pathInBucket]);
      if (storageError) throw storageError;

      // Then delete from database
      const { error: dbError } = await supabase.from("coa_files").delete().eq("id", fileId);
      if (dbError) throw dbError;

      toast.success("CoA file deleted!");
      onCoAUploaded();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete CoA.");
    }
  };

  return (
    <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
      <h4 className="font-semibold text-gray-900 mb-3">Certificate of Analysis (CoA)</h4>
      <div className="space-y-3">
        {coaFiles.length === 0 ? (
          <p className="text-gray-500 text-sm">No CoA files uploaded yet.</p>
        ) : (
          coaFiles.map(file => (
            <div key={file.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-md bg-gray-50">
              <FileText className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.file_name}</p>
                <p className="text-xs text-gray-600">Uploaded: {format(new Date(file.created_at), "MMM d, yyyy")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDownloadCoA(file.id, file.file_name)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteCoA(file.id, file.storage_path)}>
                <XCircle className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          ))
        )}
      </div>
      <div className="mt-4">
        <label htmlFor="coa-upload" className="cursor-pointer">
          <Button variant="outline" asChild disabled={isUploading} className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Upload CoA File"}
          </Button>
          <input id="coa-upload" type="file" accept=".pdf,image/*,.csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} ref={fileInputRef} />
        </label>
      </div>
    </div>
  );
}