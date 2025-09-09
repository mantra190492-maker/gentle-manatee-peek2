// src/components/suppliers/ChecklistSidebar.tsx
"use client";
import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocType } from "@/lib/suppliers/types";
import { t } from "@/lib/i18n";

interface ChecklistSidebarProps {
  requiredDocs: DocType[];
  uploadedDocs: { type: DocType; isUploaded: boolean }[];
  language: 'en' | 'fr';
}

export function ChecklistSidebar({ requiredDocs, uploadedDocs, language }: ChecklistSidebarProps) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
      <h3 className="font-semibold text-lg mb-4">{t(language, "portal.documentUpload.title")}</h3>
      <ul className="space-y-3">
        {requiredDocs.map((docType) => {
          const isUploaded = uploadedDocs.some(d => d.type === docType && d.isUploaded);
          return (
            <li key={docType} className="flex items-center gap-3 text-sm text-gray-700">
              {isUploaded ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span>{docType.replace(/_/g, ' ')}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}