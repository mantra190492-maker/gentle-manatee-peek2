"use client";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Paperclip, HardDrive, Laptop } from "lucide-react";
import { toast } from "sonner";

interface AttachmentMenuProps {
  onUpload: (file: File) => Promise<void>;
  onPickFromDrive: () => Promise<void>;
  children?: React.ReactNode; // Add children prop
}

export default function AttachmentMenu({ onUpload, onPickFromDrive, children }: AttachmentMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      await onUpload(event.target.files[0]);
      event.target.value = ''; // Clear input to allow re-uploading the same file
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || ( // Render children if provided, otherwise default button
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Paperclip className="w-4 h-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
          <Laptop className="mr-2 h-4 w-4" />
          From Computer
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLocalFileChange}
            className="hidden"
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPickFromDrive}>
          <HardDrive className="mr-2 h-4 w-4" />
          From Google Drive
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <HardDrive className="mr-2 h-4 w-4" />
          From Dropbox (Coming soon)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <HardDrive className="mr-2 h-4 w-4" />
          From OneDrive & SharePoint (Coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}