"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Download,
  FileUp,
  FileWarning,
  FileJson,
  FileBadge2,
  FileText,
} from "lucide-react";
import {
  getSpecWithContent,
  updateContent,
  suggestFromIngredients,
  applyWarningSuggestions,
  approveSpec,
  getClaimValidationResult,
  getRiskClaimCrossCheckFlags,
  getBatchConsistencyCheck,
  qaApproveSpec,
  uploadCoAFile,
  getCoAFileUrl,
  generateRecallReport,
  exportSpec,
} from "@/server/labels/service.ts";
import type {
  LabelSpecWithContent,
  LabelSpecContentInput,
  Suggestion,
  ClaimValidationResult,
  RiskFlag,
  ConsistencyCheckResult,
  RecallReportRow,
} from "@/server/labels/types.ts";
import { toast } from "sonner";
import { useForm, useFieldArray, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isBefore, addDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import DateInput from "@/components/common/DateInput";
import { getGlobalCompanyInfo, mergeWarningSuggestions } from "@/server/labels/rules";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LabelActivityLog from "@/components/labels/LabelActivityLog";

/* -------------------- Zod Schemas for Validation -------------------- */
// Helper: coerce numbers from inputs safely, allow "", null, undefined → null
const asNullableNumber = (val: unknown) => {
  if (val === "" || val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "" && !Number.isNaN(Number(val))) return Number(val);
  return val; // let zod catch invalid cases
};

const medicinalItemSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_fr: z.string().min(1, "French name is required"),
  part: z.string().optional().nullable(),
  extract_ratio: z.string().optional().nullable(),
  // Coerce number so resolver outputs number|null (not unknown)
  strength_mg: z
    .preprocess(asNullableNumber, z.number().min(0, "Must be non-negative").nullable())
    .optional(),
  per_serving: z.string().optional().nullable(),
  claim_reference_id: z.string().optional().nullable(),
});

const labelSpecContentSchema = z.object({
  product_name_en: z.string().min(1, "English product name is required"),
  product_name_fr: z.string().min(1, "French product name is required"),
  dosage_form: z.string().optional().nullable(),

  medicinal: z.array(medicinalItemSchema).min(1, "At least one medicinal ingredient is required"),

  non_medicinal_en: z.string().optional().nullable(),
  non_medicinal_fr: z.string().optional().nullable(),

  claim_en: z.string().min(1, "English claim is required"),
  claim_fr: z.string().min(1, "French claim is required"),

  directions_en: z.string().min(1, "English directions are required"),
  directions_fr: z.string().min(1, "French directions are required"),

  duration_en: z.string().optional().nullable(),
  duration_fr: z.string().optional().nullable(),

  warning_en: z.string().min(1, "English warning is required"),
  warning_fr: z.string().min(1, "French warning is required"),

  storage_en: z.string().optional().nullable(),
  storage_fr: z.string().optional().nullable(),
  override_storage_flag: z.boolean().optional(),

  company_en: z.string().optional().nullable(),
  company_fr: z.string().optional().nullable(),
  company_website: z.string().optional().nullable(),

  made_in_en: z.string().optional().nullable(),
  made_in_fr: z.string().optional().nullable(),
  distributed_by_en: z.string().optional().nullable(),
  distributed_by_fr: z.string().optional().nullable(),
  npn_number: z.string().optional().nullable(),

  // Traceability
  batch_id: z.string().optional().nullable(),
  batch_date: z.string().optional().nullable(),
  shelf_life_months: z
    .preprocess(asNullableNumber, z.number().min(0, "Must be non-negative").nullable())
    .optional(),
  lot_number: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  coa_file_path: z.string().optional().nullable(),
  coa_file_name: z.string().optional().nullable(),
  override_lot_expiry_flag: z.boolean().optional(),

  risk_flags: z.array(z.any()).optional().nullable(),
});

type FormFields = z.infer<typeof labelSpecContentSchema>;

/* ----------------------- Component ----------------------- */
export default function LabelSpecDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spec, setSpec] = useState<LabelSpecWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [claimValidation, setClaimValidation] = useState<ClaimValidationResult | null>(null);
  const [riskCrossCheckFlags, setRiskCrossCheckFlags] = useState<RiskFlag[]>([]);
  const [batchConsistency, setBatchConsistency] = useState<ConsistencyCheckResult | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isUploadingCoA, setIsUploadingCoA] = useState(false);
  const [isQAApproving, setIsQAApproving] = useState(false);
  const [qaSignature, setQaSignature] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormFields>({
    // Important: make the resolver typed to the same FormFields
    resolver: zodResolver(labelSpecContentSchema) as Resolver<FormFields>,
    defaultValues: {
      product_name_en: "",
      product_name_fr: "",
      dosage_form: "",
      medicinal: [{ name_en: "", name_fr: "" }],
      non_medicinal_en: "",
      non_medicinal_fr: "",
      claim_en: "",
      claim_fr: "",
      directions_en: "",
      directions_fr: "",
      duration_en: "",
      duration_fr: "",
      warning_en: "",
      warning_fr: "",
      storage_en: "",
      storage_fr: "",
      override_storage_flag: false,
      company_en: "",
      company_fr: "",
      company_website: "",
      made_in_en: "",
      made_in_fr: "",
      distributed_by_en: "",
      distributed_by_fr: "",
      npn_number: "",
      batch_id: "",
      batch_date: "",
      shelf_life_months: null,
      lot_number: "",
      expiry_date: "",
      coa_file_path: "",
      coa_file_name: "",
      override_lot_expiry_flag: false,
      risk_flags: [],
    },
  });

  const { fields: medicinalFields, append: appendMedicinal, remove: removeMedicinal } =
    useFieldArray<FormFields>({ control, name: "medicinal" });

  const currentContent = watch();

  const fetchSpecData = useCallback(async () => {
    if (!id) {
      setError("Label Spec ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedSpec = await getSpecWithContent(id);
      if (fetchedSpec) {
        setSpec(fetchedSpec);
        reset(
          fetchedSpec.content
            ? ({
                ...fetchedSpec.content,
                non_medicinal_en: fetchedSpec.content.non_medicinal_en || "",
                non_medicinal_fr: fetchedSpec.content.non_medicinal_fr || "",
                override_lot_expiry_flag: fetchedSpec.content.override_lot_expiry_flag ?? false,
                override_storage_flag: fetchedSpec.content.override_storage_flag ?? false,
                shelf_life_months: fetchedSpec.content.shelf_life_months ?? null,
                storage_en: fetchedSpec.content.storage_en || "",
                storage_fr: fetchedSpec.content.storage_fr || "",
                company_en: fetchedSpec.content.company_en || "",
                company_fr: fetchedSpec.content.company_fr || "",
                company_website: fetchedSpec.content.company_website || "",
                made_in_en: fetchedSpec.content.made_in_en || "",
                made_in_fr: fetchedSpec.content.made_in_fr || "",
                distributed_by_en: fetchedSpec.content.distributed_by_en || "",
                distributed_by_fr: fetchedSpec.content.distributed_by_fr || "",
                npn_number: fetchedSpec.content.npn_number || "",
                batch_id: fetchedSpec.content.batch_id || "",
                batch_date: fetchedSpec.content.batch_date || "",
                lot_number: fetchedSpec.content.lot_number || "",
                expiry_date: fetchedSpec.content.expiry_date || "",
                coa_file_path: fetchedSpec.content.coa_file_path || "",
                coa_file_name: fetchedSpec.content.coa_file_name || "",
                risk_flags: fetchedSpec.content.risk_flags || [],
              } as FormFields)
            : ({
                product_name_en: "",
                product_name_fr: "",
                dosage_form: "",
                medicinal: [{ name_en: "", name_fr: "" }],
                non_medicinal_en: "",
                non_medicinal_fr: "",
                claim_en: "",
                claim_fr: "",
                directions_en: "",
                directions_fr: "",
                duration_en: "",
                duration_fr: "",
                warning_en: "",
                warning_fr: "",
                storage_en: "",
                storage_fr: "",
                override_storage_flag: false,
                company_en: "",
                company_fr: "",
                company_website: "",
                made_in_en: "",
                made_in_fr: "",
                distributed_by_en: "",
                distributed_by_fr: "",
                npn_number: "",
                batch_id: "",
                batch_date: "",
                shelf_life_months: null,
                lot_number: "",
                expiry_date: "",
                coa_file_path: "",
                coa_file_name: "",
                override_lot_expiry_flag: false,
                risk_flags: [],
              } as FormFields)
        );

        const [sugs, claimVal, riskFlags, batchConsist] = await Promise.all([
          suggestFromIngredients(id),
          getClaimValidationResult(id),
          getRiskClaimCrossCheckFlags(id),
          getBatchConsistencyCheck(id),
        ]);
        setSuggestions(sugs);
        setClaimValidation(claimVal);
        setRiskCrossCheckFlags(riskFlags);
        setBatchConsistency(batchConsist);
      } else {
        setError("Failed to fetch label spec details.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load spec data.");
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    void fetchSpecData();
  }, [fetchSpecData]);

  const handleSave: SubmitHandler<FormFields> = async (data) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const contentToSave: LabelSpecContentInput = {
        ...data,
        non_medicinal_en: data.non_medicinal_en || null,
        non_medicinal_fr: data.non_medicinal_fr || null,
        override_lot_expiry_flag: data.override_lot_expiry_flag ?? false,
        override_storage_flag: data.override_storage_flag ?? false,
        storage_en: data.storage_en || null,
        storage_fr: data.storage_fr || null,
        company_en: data.company_en || null,
        company_fr: data.company_fr || null,
        company_website: data.company_website || null,
        made_in_en: data.made_in_en || null,
        made_in_fr: data.made_in_fr || null,
        distributed_by_en: data.distributed_by_en || null,
        distributed_by_fr: data.distributed_by_fr || null,
        npn_number: data.npn_number || null,
        batch_id: data.batch_id || null,
        batch_date: data.batch_date || null,
        shelf_life_months: data.shelf_life_months ?? null,
        lot_number: data.lot_number || null,
        expiry_date: data.expiry_date || null,
        coa_file_path: data.coa_file_path || null,
        coa_file_name: data.coa_file_name || null,
      };
      await updateContent(id, contentToSave, (await supabase.auth.getUser()).data.user?.id);
      toast.success("Label spec content saved!");
      void fetchSpecData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplySuggestion = async (
    field: keyof LabelSpecContentInput,
    suggestionEn?: string,
    suggestionFr?: string
  ) => {
    if (!id || !suggestionEn) return;
    setIsSaving(true);
    try {
      if (
        field === "warning_en" ||
        field === "warning_fr" ||
        field === "storage_en" ||
        field === "storage_fr"
      ) {
        const currentEn = watch(field === "warning_en" ? "warning_en" : "storage_en");
        const currentFr = watch(field === "warning_fr" ? "warning_fr" : "storage_fr");
        const mergedEn = mergeWarningSuggestions(currentEn, suggestionEn);
        const mergedFr = mergeWarningSuggestions(currentFr, suggestionFr || "");
        setValue(field === "warning_en" ? "warning_en" : "storage_en", mergedEn);
        setValue(field === "warning_fr" ? "warning_fr" : "storage_fr", mergedFr);
      } else if (
        field === "company_en" ||
        field === "company_fr" ||
        field === "company_website" ||
        field === "made_in_en" ||
        field === "made_in_fr" ||
        field === "distributed_by_en" ||
        field === "distributed_by_fr" ||
        field === "npn_number" ||
        field === "lot_number" ||
        field === "expiry_date"
      ) {
        setValue(field, suggestionEn as any);
        if (suggestionFr) {
          const correspondingFrField = (field as string).replace("_en", "_fr") as keyof FormFields;
          if (correspondingFrField !== field) {
            setValue(correspondingFrField, suggestionFr as any);
          }
        }
      } else {
        setValue(field, suggestionEn as any);
        if (suggestionFr) {
          const correspondingFrField = (field as string).replace("_en", "_fr") as keyof FormFields;
          if (correspondingFrField !== field) {
            setValue(correspondingFrField, suggestionFr as any);
          }
        }
      }

      const currentFormData = watch();
      const contentToSave: LabelSpecContentInput = {
        ...currentFormData,
        non_medicinal_en: currentFormData.non_medicinal_en || null,
        non_medicinal_fr: currentFormData.non_medicinal_fr || null,
        override_lot_expiry_flag: currentFormData.override_lot_expiry_flag ?? false,
        override_storage_flag: currentFormData.override_storage_flag ?? false,
        storage_en: currentFormData.storage_en || null,
        storage_fr: currentFormData.storage_fr || null,
        company_en: currentFormData.company_en || null,
        company_fr: currentFormData.company_fr || null,
        company_website: currentFormData.company_website || null,
        made_in_en: currentFormData.made_in_en || null,
        made_in_fr: currentFormData.made_in_fr || null,
        distributed_by_en: currentFormData.distributed_by_en || null,
        distributed_by_fr: currentFormData.distributed_by_fr || null,
        npn_number: currentFormData.npn_number || null,
        batch_id: currentFormData.batch_id || null,
        batch_date: currentFormData.batch_date || null,
        shelf_life_months: currentFormData.shelf_life_months ?? null,
        lot_number: currentFormData.lot_number || null,
        expiry_date: currentFormData.expiry_date || null,
        coa_file_path: currentFormData.coa_file_path || null,
        coa_file_name: currentFormData.coa_file_name || null,
      };
      await updateContent(id, contentToSave, (await supabase.auth.getUser()).data.user?.id);
      toast.success("Suggestion applied and saved!");
      void fetchSpecData();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply suggestion.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setIsApproving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await approveSpec(id, user?.id);
      toast.success("Label spec approved successfully!");
      void fetchSpecData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve spec.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleQAApprove = async () => {
    if (!id || !qaSignature.trim()) {
      toast.error("QA signature is required.");
      return;
    }
    setIsQAApproving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");
      await qaApproveSpec(id, user.id);
      toast.success("Label spec QA approved!");
      void fetchSpecData();
    } catch (err: any) {
      toast.error(err.message || "Failed to QA approve spec.");
    } finally {
      setIsQAApproving(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!id) return;
    setIsGeneratingSuggestions(true);
    try {
      const sugs = await suggestFromIngredients(id);
      setSuggestions(sugs);
      toast.success("Suggestions generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate suggestions.");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleCoAUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !event.target.files?.[0]) return;
    setIsUploadingCoA(true);
    try {
      const file = event.target.files[0];
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const publicUrl = await uploadCoAFile(id, file, user?.id);
      setValue("coa_file_name", file.name);
      setValue("coa_file_path", publicUrl);
      toast.success("CoA uploaded successfully!");
      void fetchSpecData();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload CoA.");
    } finally {
      setIsUploadingCoA(false);
      event.target.value = "";
    }
  };

  const handleDownloadCoA = async () => {
    if (!spec?.content?.coa_file_path) {
      toast.error("No CoA file available for download.");
      return;
    }
    try {
      const signedUrl = await getCoAFileUrl(spec.content.coa_file_path);
      window.open(signedUrl, "_blank");
      toast.success("CoA download started.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download CoA.");
    }
  };

  const handleExport = async (type: "pdf" | "png" | "json") => {
    if (!id || !spec) return;
    try {
      const result = await exportSpec(id, type);
      if (type === "pdf" || type === "png") {
        window.open(result.url, "_blank");
        toast.success(`${type.toUpperCase()} export generated!`);
      } else if (type === "json") {
        const jsonString = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("JSON export generated!");
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to export to ${type.toUpperCase()}.`);
    }
  };

  const handleRecallTrigger = async () => {
    if (!spec?.product_id) {
      toast.error("Product ID is missing for recall report.");
      return;
    }
    try {
      const reportData: RecallReportRow[] = await generateRecallReport(spec.product_id);
      if (reportData.length === 0) {
        toast.info("No approved and QA-approved specs found for recall report.");
        return;
      }
      const headers = Object.keys(reportData[0]).join(",");
      const csvRows = reportData.map((row) =>
        Object.values(row)
          .map((value) => {
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
              return `"${String(value).replace(/"/g, '""')}"`;
            }
            if (value === null || value === undefined) {
              return "";
            }
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      );
      const csvContent = [headers, ...csvRows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recall_report_${spec.product_id}_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recall report generated and downloaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate recall report.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">
            Loading label spec details...
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-rose-500">{error}</main>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto text-center text-gray-500">Label spec not found.</main>
        </div>
      </div>
    );
  }

  const isDraft = spec.status === "draft";
  const isApproved = spec.status === "approved";
  const isQAApproved = spec.qa_approved_flag;

  const expiryDate = spec.content?.expiry_date ? new Date(spec.content.expiry_date) : null;
  const today = new Date();
  const sixMonthsFromNow = addDays(today, 180);
  const isExpiringSoon = expiryDate && isBefore(expiryDate, sixMonthsFromNow) && isBefore(today, expiryDate);
  const isExpired = expiryDate && isBefore(expiryDate, today);

  const globalCompanyInfo = getGlobalCompanyInfo();
  const madeInEn = spec.content?.made_in_en || globalCompanyInfo.made_in_en;
  const madeInFr = spec.content?.made_in_fr || globalCompanyInfo.made_in_fr;
  const distributedByEn = spec.content?.distributed_by_en || globalCompanyInfo.distributed_by_en;
  const distributedByFr = spec.content?.distributed_by_fr || globalCompanyInfo.distributed_by_fr;
  const npn = spec.content?.npn_number || globalCompanyInfo.npn_number;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Label Spec V{spec.version}</h1>
          <div className="flex items-center gap-3">
            <span
              className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", {
                "bg-blue-100 text-blue-800 border-blue-200": spec.status === "draft",
                "bg-emerald-100 text-emerald-800 border-emerald-200": spec.status === "approved",
                "bg-gray-100 text-gray-800 border-gray-200": spec.status === "retired",
              })}
            >
              Status: {spec.status}
            </span>
            {isQAApproved && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                QA Approved
              </span>
            )}
            <Button onClick={() => navigate("/labels")} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto rounded-md border-b border-gray-200 bg-gray-50 p-0">
              <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
                Content
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
                Suggestions ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
                Compliance
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 rounded-none text-gray-600 hover:text-gray-900 py-3">
                Activity Log
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <TabsContent value="content">
                <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="product_name_en">Product Name (EN)</Label>
                      <Input id="product_name_en" {...register("product_name_en")} disabled={!isDraft} />
                      {errors.product_name_en && (
                        <p className="text-rose-500 text-sm">{errors.product_name_en.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product_name_fr">Product Name (FR)</Label>
                      <Input id="product_name_fr" {...register("product_name_fr")} disabled={!isDraft} />
                      {errors.product_name_fr && (
                        <p className="text-rose-500 text-sm">{errors.product_name_fr.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dosage_form">Dosage Form</Label>
                      <Input id="dosage_form" {...register("dosage_form")} disabled={!isDraft} />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Medicinal Ingredients</h3>
                  <div className="space-y-4">
                    {medicinalFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-md relative bg-gray-50"
                      >
                        <div className="grid gap-2">
                          <Label htmlFor={`medicinal.${index}.name_en`}>Ingredient Name (EN)</Label>
                          <Input id={`medicinal.${index}.name_en`} {...register(`medicinal.${index}.name_en`)} disabled={!isDraft} />
                          {errors.medicinal?.[index]?.name_en && (
                            <p className="text-rose-500 text-sm">{errors.medicinal[index]?.name_en?.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`medicinal.${index}.name_fr`}>Ingredient Name (FR)</Label>
                          <Input id={`medicinal.${index}.name_fr`} {...register(`medicinal.${index}.name_fr`)} disabled={!isDraft} />
                          {errors.medicinal?.[index]?.name_fr && (
                            <p className="text-rose-500 text-sm">{errors.medicinal[index]?.name_fr?.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`medicinal.${index}.strength_mg`}>Strength (mg/serving)</Label>
                          <Input
                            id={`medicinal.${index}.strength_mg`}
                            type="number"
                            // valueAsNumber ensures RHF passes numbers to schema
                            {...register(`medicinal.${index}.strength_mg`, { valueAsNumber: true })}
                            disabled={!isDraft}
                          />
                          {errors.medicinal?.[index]?.strength_mg && (
                            <p className="text-rose-500 text-sm">
                              {errors.medicinal[index]?.strength_mg?.message as string}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`medicinal.${index}.per_serving`}>Per Serving (e.g., 1 capsule)</Label>
                          <Input id={`medicinal.${index}.per_serving`} {...register(`medicinal.${index}.per_serving`)} disabled={!isDraft} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`medicinal.${index}.claim_reference_id`}>Claim Reference ID</Label>
                          <Input id={`medicinal.${index}.claim_reference_id`} {...register(`medicinal.${index}.claim_reference_id`)} disabled={!isDraft} />
                        </div>
                        {isDraft && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMedicinal(index)}
                            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-md"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {isDraft && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendMedicinal({ name_en: "", name_fr: "" })}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        + Add Medicinal Ingredient
                      </Button>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Non-Medicinal Ingredients</h3>
                  <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="non_medicinal_en">Non-Medicinal (EN)</Label>
                      <Textarea
                        id="non_medicinal_en"
                        {...register("non_medicinal_en")}
                        rows={4}
                        className="resize-y"
                        placeholder="Enter each ingredient on a new line"
                        disabled={!isDraft}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="non_medicinal_fr">Non-Medicinal (FR)</Label>
                      <Textarea
                        id="non_medicinal_fr"
                        {...register("non_medicinal_fr")}
                        rows={4}
                        className="resize-y"
                        placeholder="Entrez chaque ingrédient sur une nouvelle ligne"
                        disabled={!isDraft}
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Claims & Directions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="claim_en">Claim (EN)</Label>
                      <Textarea id="claim_en" {...register("claim_en")} rows={3} className="resize-y" disabled={!isDraft} />
                      {errors.claim_en && <p className="text-rose-500 text-sm">{errors.claim_en.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="claim_fr">Claim (FR)</Label>
                      <Textarea id="claim_fr" {...register("claim_fr")} rows={3} className="resize-y" disabled={!isDraft} />
                      {errors.claim_fr && <p className="text-rose-500 text-sm">{errors.claim_fr.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="directions_en">Directions (EN)</Label>
                      <Textarea id="directions_en" {...register("directions_en")} rows={4} className="resize-y" disabled={!isDraft} />
                      {errors.directions_en && (
                        <p className="text-rose-500 text-sm">{errors.directions_en.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="directions_fr">Directions (FR)</Label>
                      <Textarea id="directions_fr" {...register("directions_fr")} rows={4} className="resize-y" disabled={!isDraft} />
                      {errors.directions_fr && (
                        <p className="text-rose-500 text-sm">{errors.directions_fr.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration_en">Duration of Use (EN)</Label>
                      <Input id="duration_en" {...register("duration_en")} disabled={!isDraft} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration_fr">Duration of Use (FR)</Label>
                      <Input id="duration_fr" {...register("duration_fr")} disabled={!isDraft} />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Warnings & Storage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="warning_en">Warnings (EN)</Label>
                      <Textarea id="warning_en" {...register("warning_en")} rows={5} className="resize-y" disabled={!isDraft} />
                      {errors.warning_en && <p className="text-rose-500 text-sm">{errors.warning_en.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="warning_fr">Warnings (FR)</Label>
                      <Textarea id="warning_fr" {...register("warning_fr")} rows={5} className="resize-y" disabled={!isDraft} />
                      {errors.warning_fr && <p className="text-rose-500 text-sm">{errors.warning_fr.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="storage_en">Storage Conditions (EN)</Label>
                      <Textarea
                        id="storage_en"
                        {...register("storage_en")}
                        rows={2}
                        className="resize-y"
                        disabled={!isDraft || !watch("override_storage_flag")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="storage_fr">Storage Conditions (FR)</Label>
                      <Textarea
                        id="storage_fr"
                        {...register("storage_fr")}
                        rows={2}
                        className="resize-y"
                        disabled={!isDraft || !watch("override_storage_flag")}
                      />
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <input
                        type="checkbox"
                        id="override_storage_flag"
                        {...register("override_storage_flag")}
                        disabled={!isDraft}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="override_storage_flag">Override Auto Storage</Label>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Traceability & CoA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="batch_id">Batch ID</Label>
                      <Input id="batch_id" {...register("batch_id")} disabled={!isDraft} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="batch_date">Batch Date</Label>
                      <DateInput
                        value={watch("batch_date") ? new Date(watch("batch_date")!) : undefined}
                        onChange={(date) => setValue("batch_date", date ? format(date, "yyyy-MM-dd") : undefined)}
                        placeholder="Pick a date"
                        disabled={!isDraft}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shelf_life_months">Shelf Life (Months)</Label>
                      <Input
                        id="shelf_life_months"
                        type="number"
                        {...register("shelf_life_months", { valueAsNumber: true })}
                        disabled={!isDraft}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lot_number">Lot Number</Label>
                      <Input
                        id="lot_number"
                        {...register("lot_number")}
                        disabled={!isDraft || !watch("override_lot_expiry_flag")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <DateInput
                        value={watch("expiry_date") ? new Date(watch("expiry_date")!) : undefined}
                        onChange={(date) => setValue("expiry_date", date ? format(date, "yyyy-MM-dd") : undefined)}
                        placeholder="Pick a date"
                        disabled={!isDraft || !watch("override_lot_expiry_flag")}
                        buttonClassName={cn(
                          isExpiringSoon && "bg-amber-50 text-amber-800 border-amber-200",
                          isExpired && "bg-rose-50 text-rose-800 border-rose-200"
                        )}
                      />
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <input
                        type="checkbox"
                        id="override_lot_expiry_flag"
                        {...register("override_lot_expiry_flag")}
                        disabled={!isDraft}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="override_lot_expiry_flag">Override Auto Lot/Expiry</Label>
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="coa_file_name">CoA File</Label>
                      <div className="flex items-center gap-2">
                        <Input id="coa_file_name" value={watch("coa_file_name") || ""} readOnly disabled={!isDraft} placeholder="No file uploaded" />
                        {spec.content?.coa_file_path ? (
                          <Button variant="outline" size="icon" onClick={handleDownloadCoA} className="text-blue-600 hover:text-blue-800">
                            <Download className="w-4 h-4" />
                          </Button>
                        ) : (
                          <label htmlFor="coa-upload" className="cursor-pointer">
                            <Button variant="outline" size="icon" asChild disabled={!isDraft || isUploadingCoA}>
                              <FileUp className="w-4 h-4" />
                            </Button>
                            <input id="coa-upload" type="file" className="hidden" onChange={handleCoAUpload} disabled={!isDraft || isUploadingCoA} />
                          </label>
                        )}
                        {spec.content?.coa_file_path ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company_en">Company Info (EN)</Label>
                      <Textarea id="company_en" {...register("company_en")} rows={4} className="resize-y bg-gray-100" readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company_fr">Company Info (FR)</Label>
                      <Textarea id="company_fr" {...register("company_fr")} rows={4} className="resize-y bg-gray-100" readOnly />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4">Mandatory Regulatory Blocks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Made in (EN)</Label>
                      <Input value={madeInEn} readOnly className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Made in (FR)</Label>
                      <Input value={madeInFr} readOnly className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Distributed by (EN)</Label>
                      <Input value={distributedByEn} readOnly className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Distributed by (FR)</Label>
                      <Input value={distributedByFr} readOnly className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Lot Number</Label>
                      <Input value={spec.content?.lot_number || "N/A"} readOnly className="bg-gray-100" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Expiry Date</Label>
                      <Input
                        value={spec.content?.expiry_date ? format(new Date(spec.content.expiry_date), "yyyy-MM-dd") : "N/A"}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>NPN</Label>
                      <Input value={npn} readOnly className="bg-gray-100" />
                    </div>
                  </div>

                  {isDraft && (
                    <div className="flex justify-end gap-2 mt-8">
                      <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="suggestions">
                <h3 className="text-lg font-semibold mb-4">Automated Suggestions</h3>
                <p className="text-gray-600 mb-4">
                  Suggestions are generated based on ingredients, dosage form, and market rules. Review and apply as needed.
                </p>
                <Button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions || !isDraft} className="mb-6 bg-blue-600 hover:bg-blue-700 text-white">
                  {isGeneratingSuggestions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Generate Suggestions
                </Button>

                <ScrollArea className="h-[calc(100vh-450px)] pr-4">
                  <div className="space-y-4">
                    {suggestions.length === 0 ? (
                      <p className="text-gray-500">No suggestions available. Try generating them.</p>
                    ) : (
                      suggestions.map((s, index) => (
                        <div
                          key={index}
                          className={cn("border p-4 rounded-md bg-white shadow-sm", {
                            "border-blue-200": s.severity === "info",
                            "border-amber-200": s.severity === "warning",
                            "border-rose-200": s.severity === "error",
                          })}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {s.severity === "info" && <AlertCircle className="w-4 h-4 text-blue-600" />}
                            {s.severity === "warning" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                            {s.severity === "error" && <XCircle className="w-4 h-4 text-rose-600" />}
                            <span className="font-medium text-gray-900 capitalize">
                              {s.from.replace(/_/g, " ")}: {s.field.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">{s.note}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-gray-500">Suggested (EN):</p>
                              <p className="font-medium text-gray-800 whitespace-pre-wrap">
                                {s.suggestion_en || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Suggested (FR):</p>
                              <p className="font-medium text-gray-800 whitespace-pre-wrap">
                                {s.suggestion_fr || "N/A"}
                              </p>
                            </div>
                          </div>
                          {isDraft && (
                            <Button
                              size="sm"
                              onClick={() => handleApplySuggestion(s.field, s.suggestion_en, s.suggestion_fr)}
                              disabled={isSaving}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compliance">
                <h3 className="text-lg font-semibold mb-4">Compliance & Risk Overview</h3>

                {/* Claim Validation */}
                <div
                  className={cn("border p-4 rounded-md bg-white shadow-sm mb-4", {
                    "border-emerald-200": claimValidation?.isValid && claimValidation?.severity === "info",
                    "border-amber-200": claimValidation?.isValid && claimValidation?.severity === "warning",
                    "border-rose-200": !claimValidation?.isValid && claimValidation?.severity === "error",
                  })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {claimValidation?.isValid && claimValidation?.severity === "info" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {claimValidation?.isValid && claimValidation?.severity === "warning" && (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    {!claimValidation?.isValid && claimValidation?.severity === "error" && (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="font-medium text-gray-900">Claim Validation:</span>
                    <span className="text-sm text-gray-700">{claimValidation?.message_en || "N/A"}</span>
                  </div>
                  {claimValidation?.reference_id && (
                    <p className="text-xs text-gray-500 ml-6">Reference: {claimValidation.reference_id}</p>
                  )}
                </div>

                {/* Risk-Claim Cross Check */}
                <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Risk-Claim Cross Check Flags ({riskCrossCheckFlags.length})
                  </h4>
                  {riskCrossCheckFlags.length === 0 ? (
                    <p className="text-gray-500 text-sm">No critical risk-claim cross-check flags found.</p>
                  ) : (
                    <div className="space-y-2">
                      {riskCrossCheckFlags.map((flag, index) => (
                        <div
                          key={index}
                          className={cn("flex items-center gap-2 text-sm", {
                            "text-amber-700": flag.severity === "warning",
                            "text-rose-700": flag.severity === "error",
                          })}
                        >
                          {flag.severity === "warning" && <AlertCircle className="w-4 h-4" />}
                          {flag.severity === "error" && <XCircle className="w-4 h-4" />}
                          <span>{flag.message_en}</span>
                          {flag.ingredient && <span className="text-xs text-gray-500">({flag.ingredient})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-Generated Risk Flags */}
                <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Auto-Generated Risk Flags ({spec.content?.risk_flags?.length || 0})
                  </h4>
                  {spec.content?.risk_flags?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No auto-generated risk flags.</p>
                  ) : (
                    <div className="space-y-2">
                      {spec.content?.risk_flags?.map((flag, index) => (
                        <div
                          key={index}
                          className={cn("flex items-center gap-2 text-sm", {
                            "text-amber-700": flag.severity === "warning",
                            "text-rose-700": flag.severity === "error",
                          })}
                        >
                          {flag.severity === "warning" && <AlertCircle className="w-4 h-4" />}
                          {flag.severity === "error" && <XCircle className="w-4 h-4" />}
                          <span>{flag.message_en}</span>
                          {flag.ingredient && <span className="text-xs text-gray-500">({flag.ingredient})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Consistency Guard */}
                <div
                  className={cn("border p-4 rounded-md bg-white shadow-sm mb-4", {
                    "border-emerald-200": batchConsistency?.isConsistent,
                    "border-rose-200": !batchConsistency?.isConsistent,
                  })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {batchConsistency?.isConsistent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="font-medium text-gray-900">Batch Consistency Check:</span>
                    <span className="text-sm text-gray-700">{batchConsistency?.message_en || "N/A"}</span>
                  </div>
                  {!batchConsistency?.isConsistent && batchConsistency?.deviations && (
                    <div className="mt-2 ml-6 text-sm text-rose-700">
                      <p className="font-medium">Deviations:</p>
                      <ul className="list-disc pl-5">
                        {batchConsistency.deviations.map((dev, index) => (
                          <li key={index}>
                            SKU: {dev.sku}, Field: {dev.field}, Expected: {dev.expected}, Actual: {dev.actual}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* QA Approval Panel */}
                <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">QA Approval</h4>
                  {isQAApproved ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        QA Approved by {spec.qa_approved_by || "N/A"} on{" "}
                        {spec.qa_approved_at ? format(new Date(spec.qa_approved_at), "PPP p") : "N/A"}
                      </span>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <p className="text-sm text-gray-700">This spec requires QA sign-off before final export.</p>
                      <div className="grid gap-2">
                        <Label htmlFor="qaSignature">Your Full Name (for e-signature)</Label>
                        <Input
                          id="qaSignature"
                          value={qaSignature}
                          onChange={(e) => setQaSignature(e.target.value)}
                          disabled={!isApproved || isQAApproving}
                        />
                      </div>
                      <Button
                        onClick={handleQAApprove}
                        disabled={!isApproved || isQAApproving || !qaSignature.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isQAApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} QA Approve
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-8">
                  {isDraft && (
                    <Button onClick={handleApprove} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Approve Spec
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={!isQAApproved} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={!isQAApproved}>
                        <FileText className="w-4 h-4 mr-2" /> Export as PDF (Print-Ready)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("png")} disabled={!isQAApproved}>
                        <FileBadge2 className="w-4 h-4 mr-2" /> Export as PNG (E-commerce)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("json")} disabled={!isQAApproved}>
                        <FileJson className="w-4 h-4 mr-2" /> Export as JSON (System Sync)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleRecallTrigger} disabled={!isQAApproved}>
                        <FileWarning className="w-4 h-4 mr-2 text-rose-600" /> Recall Trigger (CSV)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <LabelActivityLog specId={id} itemTitle={`Label Spec V${spec.version}`} />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
