"use client";
import React from "react";
import type { Batch, BatchTest } from "@/types/batches/types";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchQCSummaryProps {
  batch: Batch & { tests: BatchTest[]; coa_files: any[] };
}

export function BatchQCSummary({ batch }: BatchQCSummaryProps) {
  const totalTests = batch.tests.length;
  const passedTests = batch.tests.filter(test => test.pass).length;
  const failedTests = totalTests - passedTests;
  const hasCoA = batch.coa_files.length > 0;

  // Placeholder for critical analytes (e.g., Identity, Microbial, Heavy Metals)
  const criticalAnalytes = ['Identity', 'Microbial', 'Heavy Metals'];
  const criticalTests = batch.tests.filter(test => criticalAnalytes.includes(test.analyte));
  const allCriticalTestsPassed = criticalTests.every(test => test.pass);
  const hasCriticalFailures = criticalTests.some(test => !test.pass);

  return (
    <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
      <h4 className="font-semibold text-gray-900 mb-3">QC Summary</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Passed: {passedTests}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>Failed: {failedTests}</span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          {hasCoA ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>CoA Uploaded: {hasCoA ? "Yes" : "No"}</span>
        </div>
      </div>

      {totalTests > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {hasCriticalFailures ? (
            <div className="flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Critical QC failures detected.</span>
            </div>
          ) : allCriticalTestsPassed ? (
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>All critical QC tests passed.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Pending critical QC tests or some non-critical failures.</span>
            </div>
          )}
        </div>
      )}

      {failedTests > 0 && (
        <p className="text-sm text-rose-700 mt-3">
          Consider changing disposition to "On Hold" or "Rejected" due to test failures.
        </p>
      )}
    </div>
  );
}