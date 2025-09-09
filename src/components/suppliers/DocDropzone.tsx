// @ts-nocheck
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Label } from "@/components/ui/label"; // Added Label import

interface DocDropzoneProps {
  onFileChange: (file: File | undefined) => void;
  currentFile?: File;
  label: string;
  maxSize?: number; // in bytes, default 20MB
  language: 'en' | 'fr';
}

export function DocDropzone({ onFileChange, currentFile, label, maxSize = 20 * 1024 * 1024, language }: DocDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(t(language, "portal.documentUpload.fileTooLarge", { size: (maxSize / (1024 * 1024)).toFixed(0) }));
      } else {
        setError(rejection.errors[0].message);
      }
      onFileChange(undefined);
      return;
    }
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange, maxSize, language]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxSize,
    multiple: false,
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering dropzone click
    onFileChange(undefined);
    setError(null);
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors",
          "border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-700",
          isDragActive && "border-emerald-500 bg-emerald-50",
          error && "border-rose-500 text-rose-500"
        )}
      >
        <input {...getInputProps()} />
        {currentFile ? (
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span>{currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
              <XCircle className="w-4 h-4 text-rose-500" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mb-2" />
            <p className="text-sm text-center">{t(language, "portal.documentUpload.dragDrop")}</p>
            <p className="text-xs text-gray-500 mt-1">({t(language, "portal.documentUpload.maxSize", { size: (maxSize / (1024 * 1024)).toFixed(0) })})</p>
          </>
        )}
      </div>
      {error && <p className="text-rose-500 text-sm">{error}</p>}
    </div>
  );
}