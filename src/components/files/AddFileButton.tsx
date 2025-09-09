"use client";
import AttachmentMenu from "@/components/crm/AttachmentMenu";
import { uploadLocalFile } from "@/lib/files/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Import Button
import { Plus } from "lucide-react"; // Import Plus icon

export default function AddFileButton({ taskId, onAdded }:{ taskId?: string; onAdded: () => void }) {
  return (
    <AttachmentMenu
      onUpload={async (file) => {
        try {
          await uploadLocalFile(file, { taskId });
          toast.success("File uploaded");
          onAdded();
        }
        catch (e:any) {
          toast.error(e?.message ?? "Upload failed");
        }
      }}
      onPickFromDrive={async () => {
        // TODO: wire Google Picker, enforce same size/type rules before insert
        toast.message("Google Drive coming soon");
      }}
    >
      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 h-10 px-4 rounded-xl">
        <Plus className="w-4 h-4" /> Add file
      </Button>
    </AttachmentMenu>
  );
}