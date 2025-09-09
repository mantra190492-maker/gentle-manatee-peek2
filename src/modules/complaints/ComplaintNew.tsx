"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ContactPicker from "@/components/pickers/ContactPicker"; // Import ContactPicker

interface ComplaintFormData {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  crm_contact_id: string | null; // New field for contact ID
}

export default function ComplaintNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ComplaintFormData>({
    title: "",
    description: "",
    priority: "Medium",
    crm_contact_id: null,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleContactChange = (contactId: string | null) => {
    setFormData(prev => ({ ...prev, crm_contact_id: contactId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    console.log("Submitting new complaint:", formData);
    setTimeout(() => {
      setLoading(false);
      toast.success("Complaint submitted successfully!");
      navigate("/complaints");
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-3xl font-bold text-gray-900">New Complaint</h1>
      </div>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Complaint Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="resize-y"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(val: "High" | "Medium" | "Low") => handleSelectChange("priority", val)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="crm_contact_id">Reporter (Contact)</Label>
              <ContactPicker
                value={formData.crm_contact_id}
                onChange={handleContactChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/complaints")} disabled={loading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}