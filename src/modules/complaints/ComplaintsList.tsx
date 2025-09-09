"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Complaint {
  id: string;
  title: string;
  status: "Open" | "Closed" | "Under Review";
  priority: "High" | "Medium" | "Low";
  reportedAt: string;
}

const mockComplaints: Complaint[] = [
  { id: "comp-1", title: "Product A Adverse Event", status: "Open", priority: "High", reportedAt: "2024-07-20" },
  { id: "comp-2", title: "Packaging Defect - Batch 123", status: "Under Review", priority: "Medium", reportedAt: "2024-07-18" },
  { id: "comp-3", title: "Customer Complaint - Shipping Delay", status: "Closed", priority: "Low", reportedAt: "2024-07-15" },
  { id: "comp-4", title: "Ingredient Contamination Report", status: "Open", priority: "High", reportedAt: "2024-07-22" },
];

export default function ComplaintsList() {
  const navigate = useNavigate();

  const handleNewComplaint = () => {
    navigate("/complaints/new");
  };

  const handleRowClick = (complaint: Complaint) => {
    navigate(`/complaints/${complaint.id}`);
  };

  const renderStatusPill = (status: Complaint['status']) => {
    let colorClass = "";
    switch (status) {
      case "Open":
        colorClass = "bg-rose-100 text-rose-800 border-rose-200";
        break;
      case "Under Review":
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        break;
      case "Closed":
        colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
        break;
    }
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", colorClass)}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Complaints & Adverse Events</h1>
        <Button onClick={handleNewComplaint} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Complaint
        </Button>
      </div>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 h-12">
                  <th className="px-3 py-2 text-left text-gray-600 font-semibold">Title</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-semibold">Status</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-semibold">Priority</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-semibold">Reported At</th>
                </tr>
              </thead>
              <tbody>
                {mockComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => handleRowClick(complaint)}
                  >
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-gray-400 group-hover:text-gray-700 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        {complaint.title}
                      </div>
                    </td>
                    <td className="px-3 py-2">{renderStatusPill(complaint.status)}</td>
                    <td className="px-3 py-2 capitalize">{complaint.priority}</td>
                    <td className="px-3 py-2 text-gray-600">{complaint.reportedAt}</td>
                  </tr>
                ))}
                {mockComplaints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-6">No complaints found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}