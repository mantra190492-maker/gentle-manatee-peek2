"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Download } from "lucide-react";
import type { BatchTest } from "@/types/batches/types";
import { addBatchTest, importBatchTestsCSV } from "@/server/batches/service";
import { toast } from "sonner";
import { BatchTestStatusPill } from "./BatchTestStatusPill";
import Papa from "papaparse";
import { format } from "date-fns";

interface BatchTestTableProps {
  batchId: string;
  tests: BatchTest[];
  onTestsUpdated: () => void;
}

export function BatchTestTable({
  batchId,
  tests,
  onTestsUpdated,
}: BatchTestTableProps) {
  const [newTest, setNewTest] = useState<Partial<BatchTest>>({
    analyte: "",
    result: "",
    pass: false,
    unit: "",
    spec_min: "",
    spec_max: "",
    method: "",
    lab_name: "",
    tested_on: "",
  });
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddTest = async () => {
    if (!newTest.analyte || !newTest.result) {
      toast.error("Analyte and Result are required for a new test.");
      return;
    }
    setIsAddingTest(true);
    try {
      // Build payload for server shape
      await addBatchTest(batchId, {
        analyte: newTest.analyte!,
        result: newTest.result!,
        pass: !!newTest.pass,
        unit: newTest.unit || null,
        spec_min: newTest.spec_min || null,
        spec_max: newTest.spec_max || null,
        method: newTest.method || null,
        lab_name: newTest.lab_name || null,
        tested_on: newTest.tested_on || null,
      } as any); // server adds batch_id
      setNewTest({
        analyte: "",
        result: "",
        pass: false,
        unit: "",
        spec_min: "",
        spec_max: "",
        method: "",
        lab_name: "",
        tested_on: "",
      });
      onTestsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add test.");
    } finally {
      setIsAddingTest(false);
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files?.[0]) return;
    setIsImporting(true);
    try {
      const file = event.target.files[0];
      const result = await importBatchTestsCSV(batchId, file);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err) => toast.error(err));
      }
      if (result.added > 0) onTestsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import tests.");
    } finally {
      setIsImporting(false);
      event.target.value = ""; // Clear input
    }
  };

  const handleExportTests = () => {
    if (tests.length === 0) {
      toast.info("No tests to export.");
      return;
    }
    const csv = Papa.unparse(tests);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_tests_${batchId}_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tests exported to CSV!");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Analyte
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Result
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Unit
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Spec Min
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Spec Max
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Method
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Lab
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Tested On
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr
                  key={test.id}
                  className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2 text-gray-900 font-medium">
                    {test.analyte}
                  </td>
                  <td className="px-3 py-2">{test.result}</td>
                  <td className="px-3 py-2">{test.unit || "N/A"}</td>
                  <td className="px-3 py-2">{test.spec_min || "N/A"}</td>
                  <td className="px-3 py-2">{test.spec_max || "N/A"}</td>
                  <td className="px-3 py-2">{test.method || "N/A"}</td>
                  <td className="px-3 py-2">{test.lab_name || "N/A"}</td>
                  <td className="px-3 py-2">
                    {test.tested_on
                      ? format(new Date(test.tested_on), "MMM d, yyyy")
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2">
                    <BatchTestStatusPill pass={test.pass} />
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-6">
                    No tests recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-gray-200 p-4 rounded-md bg-gray-50 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3">Add New Test</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="new_analyte">Analyte</Label>
            <Input
              id="new_analyte"
              value={newTest.analyte || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, analyte: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_result">Result</Label>
            <Input
              id="new_result"
              value={newTest.result || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, result: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_unit">Unit</Label>
            <Input
              id="new_unit"
              value={newTest.unit || ""}
              onChange={(e) => setNewTest({ ...newTest, unit: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_spec_min">Spec Min</Label>
            <Input
              id="new_spec_min"
              value={newTest.spec_min || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, spec_min: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_spec_max">Spec Max</Label>
            <Input
              id="new_spec_max"
              value={newTest.spec_max || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, spec_max: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_method">Method</Label>
            <Input
              id="new_method"
              value={newTest.method || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, method: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_lab_name">Lab Name</Label>
            <Input
              id="new_lab_name"
              value={newTest.lab_name || ""}
              onChange={(e) =>
                setNewTest({ ...newTest, lab_name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new_tested_on">Tested On</Label>
            <Input
              id="new_tested_on"
              type="date"
              value={newTest.tested_on || ""}
              onChange={(e) =>
                setNewTest({
                  ...newTest,
                  tested_on: e.target.value || "",
                })
              }
              placeholder="Pick a date"
            />
          </div>
          <div className="flex items-center space-x-2 md:mt-auto">
            <input
              type="checkbox"
              id="new_pass"
              checked={!!newTest.pass}
              onChange={(e) =>
                setNewTest({ ...newTest, pass: e.target.checked })
              }
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <Label htmlFor="new_pass">Pass</Label>
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button
            onClick={handleAddTest}
            disabled={isAddingTest || !newTest.analyte || !newTest.result}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isAddingTest ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Add Test
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Button
              variant="outline"
              disabled={isImporting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileImport}
              disabled={isImporting}
            />
          </label>
          <Button
            variant="outline"
            onClick={handleExportTests}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
