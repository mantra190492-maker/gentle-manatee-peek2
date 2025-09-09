"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, FileText, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import ContactPicker from "@/components/pickers/ContactPicker"; // Import ContactPicker
import { Label } from "@/components/ui/label"; // Import Label
import { toast } from "sonner"; // Import toast

interface ComplaintDetailProps {
  id: string;
  initialTab?: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "Open" | "Closed" | "Under Review";
  priority: "High" | "Medium" | "Low";
  reportedAt: string;
  reporter: string; // This will be replaced by fetching contact name from crm_contact_id
  linkedCapaId?: string;
  crm_contact_id?: string | null; // New field for contact ID
}

const mockComplaintDetails: Record<string, Complaint> = {
  "comp-1": {
    id: "comp-1",
    title: "Product A Adverse Event",
    description: "Customer reported severe allergic reaction after using Product A. Batch number: XYZ789. Immediate investigation required.",
    status: "Open",
    priority: "High",
    reportedAt: "2024-07-20",
    reporter: "Jane Doe",
    linkedCapaId: "CAPA-205",
    crm_contact_id: null, // Placeholder
  },
  "comp-2": {
    id: "comp-2",
    title: "Packaging Defect - Batch 123",
    description: "Several units from Batch 123 found with compromised seals. Potential for product spoilage. Root cause analysis initiated.",
    status: "Under Review",
    priority: "Medium",
    reportedAt: "2024-07-18",
    reporter: "John Smith",
    crm_contact_id: null, // Placeholder
  },
  "comp-3": {
    id: "comp-3",
    title: "Customer Complaint - Shipping Delay",
    description: "Order #98765 was delivered 3 days late. Customer is requesting a refund for shipping costs.",
    status: "Closed",
    priority: "Low",
    reportedAt: "2024-07-15",
    reporter: "Alice Johnson",
    crm_contact_id: null, // Placeholder
  },
  "comp-4": {
    id: "comp-4",
    title: "Ingredient Contamination Report",
    description: "Internal QC detected trace contaminants in a raw material batch. Supplier notified. Production halted for affected products.",
    status: "Open",
    priority: "High",
    reportedAt: "2024-07-22",
    reporter: "QC Department",
    crm_contact_id: null, // Placeholder
  },
};

export default function ComplaintDetail({ id, initialTab = "overview" }: ComplaintDetailProps) {
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // New state for editing

  useEffect(() => {
    setLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      const fetchedComplaint = mockComplaintDetails[id];
      setComplaint(fetchedComplaint ? { ...fetchedComplaint, crm_contact_id: "some-contact-id" } : null); // Mock a contact ID
      setLoading(false);
    }, 500);
  }, [id]);

  const handleContactChange = (contactId: string | null) => {
    setComplaint(prev => prev ? { ...prev, crm_contact_id: contactId } : null);
  };

  const handleSave = () => {
    // Simulate saving changes
    console.log("Saving complaint changes:", complaint);
    setIsEditing(false);
    toast.success("Complaint updated!");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white items-center justify-center text-gray-500">
        Loading complaint details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white items-center justify-center text-rose-500">
        Complaint not found.
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">{complaint.title}</h1>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-emerald-600 text-white hover:bg-emerald-700">Save</Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            </div>
          )}
          <Button onClick={() => navigate("/complaints")} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
          </Button>
        </div>
      </div>
      <main className="flex-1 p-6 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto rounded-md border-b border-gray-200 bg-gray-50 p-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Overview</TabsTrigger>
            <TabsTrigger value="ae" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">AE Details</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Files</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">Activity</TabsTrigger>
            <TabsTrigger value="capa" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">CAPA</TabsTrigger>
          </TabsList>

          <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <TabsContent value="overview">
              <h3 className="text-lg font-semibold mb-4">Complaint Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">ID:</p><p className="font-medium text-gray-900">{complaint.id}</p></div>
                <div><p className="text-gray-500">Status:</p><p>{renderStatusPill(complaint.status)}</p></div>
                <div><p className="text-gray-500">Priority:</p><p className="capitalize font-medium text-gray-900">{complaint.priority}</p></div>
                <div><p className="text-gray-500">Reported By:</p><p className="font-medium text-gray-900">{complaint.reporter}</p></div>
                <div><p className="text-gray-500">Reported At:</p><p className="font-medium text-gray-900">{complaint.reportedAt}</p></div>
                {complaint.linkedCapaId && (
                  <div><p className="text-gray-500">Linked CAPA:</p><p className="font-medium text-blue-600 hover:underline cursor-pointer">{complaint.linkedCapaId}</p></div>
                )}
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="crm_contact_id">Reporter (Contact)</Label>
                  {isEditing ? (
                    <ContactPicker
                      value={complaint.crm_contact_id}
                      onChange={handleContactChange}
                    />
                  ) : (
                    <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-gray-800">
                      {complaint.crm_contact_id ? `Contact ID: ${complaint.crm_contact_id}` : "—"}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{complaint.description}</p>
              </div>
            </TabsContent>
            <TabsContent value="ae">
              <h3 className="text-lg font-semibold mb-4">Adverse Event Details</h3>
              <p className="text-gray-700">Details about the adverse event will be displayed here.</p>
              <p className="text-gray-500 mt-2">e.g., Patient information, symptoms, severity, outcome, etc.</p>
            </TabsContent>
            <TabsContent value="files">
              <h3 className="text-lg font-semibold mb-4">Attached Files</h3>
              <p className="text-gray-700">Files related to this complaint will be listed here.</p>
              <p className="text-gray-500 mt-2">e.g., Investigation reports, images, customer correspondence.</p>
            </TabsContent>
            <TabsContent value="activity">
              <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
              <p className="text-gray-700">A timeline of all actions and updates on this complaint.</p>
              <p className="text-gray-500 mt-2">e.g., Status changes, comments, file uploads.</p>
            </TabsContent>
            <TabsContent value="capa">
              <h3 className="text-lg font-semibold mb-4">Corrective & Preventive Actions (CAPA)</h3>
              <p className="text-gray-700">Linked CAPA items and their status will be shown here.</p>
              <p className="text-gray-500 mt-2">e.g., CAPA-205: Root Cause Analysis - In Progress.</p>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}