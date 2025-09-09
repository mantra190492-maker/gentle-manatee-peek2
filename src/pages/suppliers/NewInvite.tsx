"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createInvite } from "@/lib/suppliers/api";
import type { SupplierType, DocType } from "@/lib/suppliers/types";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import DateInput from "@/components/common/DateInput"; // Import the new DateInput

const supplierTypes: SupplierType[] = ["manufacturer", "packer", "lab", "broker", "3PL"];
const languages = [{ label: "English", value: "en" }, { label: "French", value: "fr" }];
const internalReviewers = [{ id: "user-qa", name: "QA Manager" }, { id: "user-proc", name: "Procurement Lead" }]; // Mock users

// Define required documents based on supplier type (simplified example)
const getRequiredDocs = (type: SupplierType): DocType[] => {
  switch (type) {
    case "manufacturer":
      return ["GMP_CERT", "INSURANCE_COI", "QA_QUESTIONNAIRE", "RECALL_SOP", "ALLERGEN_STATEMENT", "HACCP_PCP", "HEAVY_METALS_POLICY", "TRACEABILITY_SOP", "STABILITY_POLICY", "COA_SAMPLE", "TAX_W8_W9", "BANKING_INFO"];
    case "packer":
      return ["GMP_CERT", "INSURANCE_COI", "QA_QUESTIONNAIRE", "RECALL_SOP", "ALLERGEN_STATEMENT", "HACCP_PCP", "TAX_W8_W9", "BANKING_INFO"];
    case "lab":
      return ["INSURANCE_COI", "QA_QUESTIONNAIRE", "COA_SAMPLE", "TAX_W8_W9", "BANKING_INFO"];
    case "broker":
      return ["INSURANCE_COI", "TAX_W8_W9", "BANKING_INFO"];
    case "3PL":
      return ["INSURANCE_COI", "TRACEABILITY_SOP", "TAX_W8_W9", "BANKING_INFO"];
    default:
      return [];
  }
};

export default function NewInvitePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    legal_name: "",
    dba: "",
    type: "" as SupplierType | "",
    country: "",
    email: "",
    language: "en",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    message: "",
    selectedReviewers: [] as string[],
  });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string | SupplierType) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, dueDate: date || new Date() }));
  };

  const handleReviewerToggle = (reviewerId: string, checked: boolean) => {
    setFormData(prev => {
      const newReviewers = checked
        ? [...prev.selectedReviewers, reviewerId]
        : prev.selectedReviewers.filter(id => id !== reviewerId);
      return { ...prev, selectedReviewers: newReviewers };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const requiredDocsProfile = getRequiredDocs(formData.type as SupplierType).map(docType => ({ type: docType, status: "Required" }));

      const { supplier, invite, error: apiError } = await createInvite(
        {
          legal_name: formData.legal_name,
          dba: formData.dba || null,
          type: formData.type as SupplierType,
          country: formData.country || null,
        },
        formData.email,
        requiredDocsProfile,
        formData.language,
        format(formData.dueDate, "yyyy-MM-dd"),
        formData.selectedReviewers,
        formData.message,
      );

      if (apiError || !invite) {
        setError(apiError || "Failed to send invite.");
        toast.error("Failed to send invite: " + (apiError || "Unknown error."));
      } else {
        setInviteLink(`${window.location.origin}/portal/invite/${invite.token}`);
        setStep(4); // Move to confirmation step
        toast.success("Supplier invite sent successfully!");
      }
    } catch (err: any) {
      console.error("Invite submission error:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error("An unexpected error occurred: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Basics
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="legal_name">Supplier Legal Name</Label>
              <Input id="legal_name" value={formData.legal_name} onChange={handleInputChange} required />
              {/* Placeholder for error message space */}
              <div className="min-h-[16px] text-xs text-red-600 mt-1">{!formData.legal_name && error ? "Legal name is required." : ""}</div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="dba">Doing Business As (DBA) (Optional)</Label>
              <Input id="dba" value={formData.dba} onChange={handleInputChange} />
              <div className="min-h-[16px]"></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Supplier Type</Label>
              <Select value={formData.type} onValueChange={(val: SupplierType) => handleSelectChange("type", val)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select Supplier Type" />
                </SelectTrigger>
                <SelectContent>
                  {supplierTypes.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="min-h-[16px] text-xs text-red-600 mt-1">{!formData.type && error ? "Supplier type is required." : ""}</div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country (Optional)</Label>
              <Input id="country" value={formData.country} onChange={handleInputChange} />
              <div className="min-h-[16px]"></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Supplier Contact Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
              <div className="min-h-[16px] text-xs text-red-600 mt-1">{!formData.email && error ? "Email is required." : ""}</div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={formData.language} onValueChange={(val: string) => handleSelectChange("language", val)}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="min-h-[16px]"></div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="dueDate">Due Date for Submission</Label>
              <DateInput
                value={formData.dueDate}
                onChange={handleDateChange}
                placeholder="Pick a date"
              />
              <div className="min-h-[16px] text-xs text-red-600 mt-1">{!formData.dueDate && error ? "Due date is required." : ""}</div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="message">Optional Message to Supplier</Label>
              <Textarea id="message" value={formData.message} onChange={handleInputChange} rows={3} className="resize-y" />
              <div className="min-h-[16px]"></div>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Internal Reviewers</Label>
              <div className="flex flex-col gap-2">
                {internalReviewers.map(reviewer => (
                  <div key={reviewer.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={reviewer.id}
                      checked={formData.selectedReviewers.includes(reviewer.id)}
                      onCheckedChange={(checked) => handleReviewerToggle(reviewer.id, checked as boolean)}
                    />
                    <Label htmlFor={reviewer.id} className="text-sm font-normal text-gray-700 mb-0">{reviewer.name}</Label>
                  </div>
                ))}
              </div>
              <div className="min-h-[16px]"></div>
            </div>
          </div>
        );
      case 2: // Required Docs (Review based on selected type)
        return (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold mb-2">2. Required Documents Profile</h2>
            <p className="text-gray-600">Based on the selected supplier type "<span className="font-medium">{formData.type || "N/A"}</span>", the following documents will be requested:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {getRequiredDocs(formData.type as SupplierType).map(docType => (
                <li key={docType}>{docType.replace(/_/g, ' ')}</li>
              ))}
            </ul>
            {getRequiredDocs(formData.type as SupplierType).length === 0 && (
              <p className="text-gray-500">No specific documents required for this supplier type.</p>
            )}
          </div>
        );
      case 3: // Review
        return (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold mb-2">3. Review Invitation Details</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Legal Name:</strong> {formData.legal_name}</p>
              {formData.dba && <p><strong>DBA:</strong> {formData.dba}</p>}
              <p><strong>Type:</strong> {formData.type}</p>
              {formData.country && <p><strong>Country:</strong> {formData.country}</p>}
              <p><strong>Contact Email:</strong> {formData.email}</p>
              <p><strong>Preferred Language:</strong> {languages.find(l => l.value === formData.language)?.label}</p>
              <p><strong>Due Date:</strong> {format(formData.dueDate, "PPP")}</p>
              {formData.message && <p><strong>Message:</strong> {formData.message}</p>}
              {formData.selectedReviewers.length > 0 && (
                <p><strong>Internal Reviewers:</strong> {formData.selectedReviewers.map(id => internalReviewers.find(r => r.id === id)?.name).join(", ")}</p>
              )}
            </div>
          </div>
        );
      case 4: // Confirmation
        return (
          <div className="grid gap-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Invitation Sent!</h2>
            <p className="text-gray-700">The supplier has been invited. Share this link with them:</p>
            <div className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
              <Input readOnly value={inviteLink || ""} className="flex-1 border-none bg-transparent text-gray-900" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (inviteLink) {
                    void navigator.clipboard.writeText(inviteLink);
                    toast.info("Invite link copied to clipboard!");
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => navigate("/suppliers")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Go to Suppliers List
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const isStep1Valid = formData.legal_name && formData.type && formData.email && formData.dueDate;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible relative">
              <div className="px-6 pt-6 pb-2">
                <h1 className="text-2xl font-semibold">Invite Supplier</h1>
                <p className="text-gray-600 mt-1">Send a secure onboarding link with the required documents & questionnaire.</p>
              </div>

              <div className="flex justify-between mb-6 px-6 text-sm font-medium text-gray-500">
                {["Basics", "Required Docs", "Review", "Confirmation"].map((label, index) => (
                  <span key={label} className={cn(
                    step > index ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600",
                    step === index + 1 && "font-bold text-emerald-900"
                  )}>
                    Step {index + 1}: {label}
                  </span>
                ))}
              </div>

              <div className="px-6 pb-20"> {/* Added pb-20 to make space for sticky footer */}
                {renderStepContent()}
              </div>

              {error && <div className="text-rose-500 text-sm mt-4 px-6">{error}</div>}

              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                {step > 1 && step < 4 && (
                  <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={loading} className="px-4 h-10 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">
                    Previous
                  </Button>
                )}
                {step < 3 && (
                  <Button onClick={() => setStep(prev => prev + 1)} disabled={loading || !isStep1Valid} className="px-5 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                    Next
                  </Button>
                )}
                {step === 3 && (
                  <Button onClick={handleSubmit} disabled={loading} className="px-5 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                    {loading ? "Sending..." : "Send Invitation"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}