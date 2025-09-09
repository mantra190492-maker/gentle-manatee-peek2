// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, XCircle, CheckCircle2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { verifyInviteToken, submitPortalResponse } from "@/lib/suppliers/api";
import type { Invite, Supplier, DocType, SupplierType } from "@/lib/suppliers/types"; // Corrected import for Invite
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getTranslation, t } from "@/lib/i18n";
import DateInput from "@/components/common/DateInput"; // Import the new DateInput

// Runtime array of DocType values for Zod enum
const docTypeValues: DocType[] = [
  "GMP_CERT", "INSURANCE_COI", "QA_QUESTIONNAIRE", "RECALL_SOP", "ALLERGEN_STATEMENT",
  "HACCP_PCP", "HEAVY_METALS_POLICY", "TRACEABILITY_SOP", "STABILITY_POLICY",
  "COA_SAMPLE", "TAX_W8_W9", "BANKING_INFO"
];

// Runtime array of SupplierType values for Zod enum
const supplierTypeValues: SupplierType[] = ["manufacturer", "packer", "lab", "broker", "3PL"];

// --- Zod Schemas for Validation ---
const contactSchema = z.object({
  role: z.string().min(1, "Role is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const siteSchema = z.object({
  role: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  region: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  gmp_status: z.string().optional(),
  last_audit_date: z.string().optional(), // YYYY-MM-DD
});

const documentUploadSchema = z.object({
  type: z.enum(docTypeValues as [DocType, ...DocType[]]), // Use z.enum with runtime values
  file: z.any().refine(file => file instanceof File, "File is required."),
  issuedOn: z.string().optional(),
  expiresOn: z.string().optional(),
});

const portalFormSchema = z.object({
  legal_name: z.string().min(1, "Legal name is required"),
  dba: z.string().optional(),
  type: z.enum(supplierTypeValues as [SupplierType, ...SupplierType[]]), // Use z.enum with runtime values
  country: z.string().min(1, "Country is required"),
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
  sites: z.array(siteSchema).min(1, "At least one site is required"),
  // Placeholder for quality/compliance fields
  gmp_certified: z.boolean().optional(),
  last_audit_date: z.string().optional(),
  // Placeholder for products/ingredients
  product_list: z.string().optional(),
  documents: z.array(documentUploadSchema).optional(),
  code_of_conduct_agreed: z.boolean().refine(val => val === true, "Must agree to Code of Conduct"),
  anti_bribery_agreed: z.boolean().refine(val => val === true, "Must confirm Anti-Bribery compliance"),
  data_protection_agreed: z.boolean().refine(val => val === true, "Must agree to Data Protection Agreement"),
});

type PortalFormData = z.infer<typeof portalFormSchema>;

// --- Main Portal Component ---

export default function SupplierPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger, // Import trigger for manual validation
    formState: { errors, isDirty },
  } = useForm<PortalFormData>({
    resolver: zodResolver(portalFormSchema),
    defaultValues: {
      legal_name: "",
      dba: "",
      type: "" as SupplierType, // Initialize with a valid SupplierType or empty string if allowed by schema
      country: "",
      contacts: [{ role: "", name: "", email: "", phone: "" }],
      sites: [{ address: "", city: "", country: "", gmp_status: "", last_audit_date: "" }],
      documents: [],
      code_of_conduct_agreed: false,
      anti_bribery_agreed: false,
      data_protection_agreed: false,
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: "contacts",
  });

  const { fields: siteFields, append: appendSite, remove: removeSite } = useFieldArray({
    control,
    name: "sites",
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control,
    name: "documents",
  });

  const watchAllFields = watch(); // Watch all fields for autosave

  // --- Autosave Logic ---
  const autosave = useCallback(async () => {
    if (!isDirty || !invite || !supplier) return;
    console.log("Autosaving draft...");
    // In a real application, this would save the form data to a draft table
    // or update the supplier's JSONB field for draft data.
    // For this example, we'll just log it.
    const currentFormData = watchAllFields;
    console.log("Draft saved:", currentFormData);
    toast.info(t(language, "portal.buttons.saveDraft") + "...");
    // Example: await updateSupplier(supplier.id, { draft_data: currentFormData });
  }, [isDirty, invite, supplier, watchAllFields, language]);

  useEffect(() => {
    const handler = setTimeout(() => {
      void autosave();
    }, 5000); // Autosave every 5 seconds of inactivity
    return () => clearTimeout(handler);
  }, [watchAllFields, autosave]);

  // --- Initial Data Fetch & Token Verification ---
  useEffect(() => {
    const verifyAndLoad = async () => {
      if (!token) {
        setError(t(language, "portal.invalidToken"));
        setLoading(false);
        return;
      }

      const { isValid, invite: fetchedInvite, supplier: fetchedSupplier, error: verifyError } = await verifyInviteToken(token);

      if (!isValid || !fetchedInvite || !fetchedSupplier) {
        setError(verifyError || t(language, "portal.invalidToken"));
        setLoading(false);
        return;
      }

      setInvite(fetchedInvite);
      setSupplier(fetchedSupplier);
      setLanguage(fetchedInvite.language as 'en' | 'fr'); // Set portal language from invite

      // Pre-fill form with existing supplier data if available
      setValue("legal_name", fetchedSupplier.legal_name);
      setValue("dba", fetchedSupplier.dba || "");
      setValue("type", fetchedSupplier.type); // This will now correctly set the enum type
      setValue("country", fetchedSupplier.country || "");

      // Pre-fill contacts and sites if they exist (requires fetching from API)
      // For this example, we'll assume they are empty on first load or fetched separately.

      setLoading(false);
    };
    void verifyAndLoad();
  }, [token, setValue, language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">{t(language, "portal.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(language, "portal.invalidToken")}</h1>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <Button onClick={() => console.log("Resend invite logic (stub)")}>{t(language, "portal.resendInvite")}</Button>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(language, "portal.success")}</h1>
        <p className="text-gray-600 text-center">Thank you for your submission. We will review it shortly.</p>
      </div>
    );
  }

  const requiredDocsProfile = invite?.required_docs as DocType[] || [];

  const onSubmit = async (data: PortalFormData) => {
    if (!invite || !supplier) {
      toast.error(t(language, "portal.error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedFilesData = data.documents?.map(doc => ({
        file: doc.file,
        type: doc.type,
        issuedOn: doc.issuedOn,
        expiresOn: doc.expiresOn,
      })) || [];

      const { success, error: apiError } = await submitPortalResponse(
        invite.id,
        supplier.id,
        data, // All form data as JSON
        uploadedFilesData,
        "mock-questionnaire-id-123" // Placeholder for a questionnaire ID
      );

      if (success) {
        setSubmissionSuccess(true);
      } else {
        toast.error(apiError || t(language, "portal.error"));
      }
    } catch (err: any) {
      console.error("Portal submission error:", err);
      toast.error(err.message || t(language, "portal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: t(language, "portal.steps.companyContacts"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.companyInfo.title")}</h2>
          <div className="grid gap-2">
            <Label htmlFor="legal_name">{t(language, "portal.companyInfo.legalName")}</Label>
            <Input id="legal_name" {...register("legal_name")} />
            {errors.legal_name && <p className="text-rose-500 text-sm">{errors.legal_name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dba">{t(language, "portal.companyInfo.dba")}</Label>
            <Input id="dba" {...register("dba")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">{t(language, "portal.companyInfo.type")}</Label>
            <Input id="type" value={supplier?.type || ""} readOnly className="bg-gray-100" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">{t(language, "portal.companyInfo.country")}</Label>
            <Input id="country" {...register("country")} />
            {errors.country && <p className="text-rose-500 text-sm">{errors.country.message}</p>}
          </div>

          <h3 className="text-lg font-semibold mt-6">{t(language, "portal.companyInfo.contactPerson")}</h3>
          {contactFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-md relative bg-white shadow-sm">
              <div className="grid gap-2">
                <Label htmlFor={`contacts.${index}.name`}>{t(language, "portal.companyInfo.contactPerson")}</Label>
                <Input id={`contacts.${index}.name`} {...register(`contacts.${index}.name`)} />
                {errors.contacts?.[index]?.name && <p className="text-rose-500 text-sm">{errors.contacts[index]?.name?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`contacts.${index}.role`}>{t(language, "portal.companyInfo.contactRole")}</Label>
                <Input id={`contacts.${index}.role`} {...register(`contacts.${index}.role`)} />
                {errors.contacts?.[index]?.role && <p className="text-rose-500 text-sm">{errors.contacts[index]?.role?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`contacts.${index}.email`}>{t(language, "portal.companyInfo.contactEmail")}</Label>
                <Input id={`contacts.${index}.email`} type="email" {...register(`contacts.${index}.email`)} />
                {errors.contacts?.[index]?.email && <p className="text-rose-500 text-sm">{errors.contacts[index]?.email?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`contacts.${index}.phone`}>{t(language, "portal.companyInfo.contactPhone")}</Label>
                <Input id={`contacts.${index}.phone`} {...register(`contacts.${index}.phone`)} />
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeContact(index)} className="absolute top-2 right-2 h-8 w-8 p-0 rounded-md">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => appendContact({ role: "", name: "", email: "", phone: "" })} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            {t(language, "portal.siteInfo.addSite")}
          </Button>
          {errors.contacts && <p className="text-rose-500 text-sm">{errors.contacts.message}</p>}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.sitesRoles"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.siteInfo.title")}</h2>
          {siteFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-md relative bg-white shadow-sm">
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.address`}>{t(language, "portal.siteInfo.address")}</Label>
                <Input id={`sites.${index}.address`} {...register(`sites.${index}.address`)} />
                {errors.sites?.[index]?.address && <p className="text-rose-500 text-sm">{errors.sites[index]?.address?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.city`}>{t(language, "portal.siteInfo.city")}</Label>
                <Input id={`sites.${index}.city`} {...register(`sites.${index}.city`)} />
                {errors.sites?.[index]?.city && <p className="text-rose-500 text-sm">{errors.sites[index]?.city?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.region`}>{t(language, "portal.siteInfo.region")}</Label>
                <Input id={`sites.${index}.region`} {...register(`sites.${index}.region`)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.country`}>{t(language, "portal.siteInfo.country")}</Label>
                <Input id={`sites.${index}.country`} {...register(`sites.${index}.country`)} />
                {errors.sites?.[index]?.country && <p className="text-rose-500 text-sm">{errors.sites[index]?.country?.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.gmp_status`}>{t(language, "portal.siteInfo.gmpStatus")}</Label>
                <Input id={`sites.${index}.gmp_status`} {...register(`sites.${index}.gmp_status`)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sites.${index}.last_audit_date`}>{t(language, "portal.siteInfo.lastAuditDate")}</Label>
                <DateInput
                  value={watch(`sites.${index}.last_audit_date`) ? new Date(watch(`sites.${index}.last_audit_date`)!) : undefined}
                  onChange={(date) => setValue(`sites.${index}.last_audit_date`, date ? format(date, "yyyy-MM-dd") : undefined)}
                  placeholder="Pick a date"
                />
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeSite(index)} className="absolute top-2 right-2 h-8 w-8 p-0 rounded-md">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => appendSite({ address: "", city: "", country: "", gmp_status: "", last_audit_date: "" })} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            {t(language, "portal.siteInfo.addSite")}
          </Button>
          {errors.sites && <p className="text-rose-500 text-sm">{errors.sites.message}</p>}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.qualityCompliance"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.steps.qualityCompliance")}</h2>
          <div className="flex items-center space-x-2">
            <Checkbox id="gmp_certified" {...register("gmp_certified")} />
            <Label htmlFor="gmp_certified">GMP Certified?</Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_audit_date">Last Audit Date (if GMP Certified)</Label>
            <DateInput
              value={watch("last_audit_date") ? new Date(watch("last_audit_date")!) : undefined}
              onChange={(date) => setValue("last_audit_date", date ? format(date, "yyyy-MM-dd") : undefined)}
              placeholder="Pick a date"
            />
          </div>
          {/* Add more quality/compliance fields as needed */}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.productsIngredients"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.steps.productsIngredients")}</h2>
          <div className="grid gap-2">
            <Label htmlFor="product_list">List of Products/Ingredients Supplied</Label>
            <Textarea id="product_list" {...register("product_list")} rows={5} placeholder="e.g., Product A (Binomial Name), Product B (Binomial Name)" className="resize-y" />
          </div>
          {/* Add fields for specs, CoA example upload if needed */}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.documentsUpload"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.documentUpload.title")}</h2>
          <p className="text-gray-600">{t(language, "portal.documentUpload.description")}</p>

          {requiredDocsProfile.map((docType, index) => {
            const currentDoc = watch(`documents.${index}`);
            const file = currentDoc?.file;
            const fileName = file?.name || t(language, "portal.documentUpload.selectFile");

            return (
              <div key={docType} className="border border-gray-200 p-4 rounded-md bg-white shadow-sm grid gap-3">
                <Label className="font-semibold">{docType.replace(/_/g, ' ')}</Label>
                <input type="hidden" {...register(`documents.${index}.type`)} value={docType} />

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id={`doc-file-${docType}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setValue(`documents.${index}.file`, e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor={`doc-file-${docType}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors h-11"
                  >
                    <Upload className="w-4 h-4" /> {fileName}
                  </label>
                  {file && (
                    <Button variant="destructive" size="icon" onClick={() => setValue(`documents.${index}.file`, undefined)} className="h-8 w-8 p-0 rounded-md">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {errors.documents?.[index]?.file && <p className="text-rose-500 text-sm">{errors.documents[index]?.file?.message as string}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`doc-issued-${docType}`}>{t(language, "portal.documentUpload.issuedOn")}</Label>
                    <DateInput
                      value={watch(`documents.${index}.issuedOn`) ? new Date(watch(`documents.${index}.issuedOn`)!) : undefined}
                      onChange={(date) => setValue(`documents.${index}.issuedOn`, date ? format(date, "yyyy-MM-dd") : undefined)}
                      placeholder="Pick a date"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`doc-expires-${docType}`}>{t(language, "portal.documentUpload.expiresOn")}</Label>
                    <DateInput
                      value={watch(`documents.${index}.expiresOn`) ? new Date(watch(`documents.${index}.expiresOn`)!) : undefined}
                      onChange={(date) => setValue(`documents.${index}.expiresOn`, date ? format(date, "yyyy-MM-dd") : undefined)}
                      placeholder="Pick a date"
                    />
                  </div>
                </div>
                {errors.documents?.[index]?.issuedOn && <p className="text-rose-500 text-sm">{errors.documents[index]?.issuedOn?.message as string}</p>}
                {errors.documents?.[index]?.expiresOn && <p className="text-rose-500 text-sm">{errors.documents[index]?.expiresOn?.message as string}</p>}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.legalEthics"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.legalEthics.title")}</h2>
          <div className="flex items-center space-x-2">
            <Checkbox id="code_of_conduct_agreed" {...register("code_of_conduct_agreed")} />
            <Label htmlFor="code_of_conduct_agreed">{t(language, "portal.legalEthics.codeOfConduct")}</Label>
          </div>
          {errors.code_of_conduct_agreed && <p className="text-rose-500 text-sm">{errors.code_of_conduct_agreed.message}</p>}
          <div className="flex items-center space-x-2">
            <Checkbox id="anti_bribery_agreed" {...register("anti_bribery_agreed")} />
            <Label htmlFor="anti_bribery_agreed">{t(language, "portal.legalEthics.antiBribery")}</Label>
          </div>
          {errors.anti_bribery_agreed && <p className="text-rose-500 text-sm">{errors.anti_bribery_agreed.message}</p>}
          <div className="flex items-center space-x-2">
            <Checkbox id="data_protection_agreed" {...register("data_protection_agreed")} />
            <Label htmlFor="data_protection_agreed">{t(language, "portal.legalEthics.dataProtection")}</Label>
          </div>
          {errors.data_protection_agreed && <p className="text-rose-500 text-sm">{errors.data_protection_agreed.message}</p>}
        </div>
      ),
    },
    {
      title: t(language, "portal.steps.reviewSubmit"),
      content: (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-2">{t(language, "portal.reviewSubmit.title")}</h2>
          <p className="text-gray-700">{t(language, "portal.reviewSubmit.confirmation")}</p>
          {/* Display a summary of all form data here */}
          <div className="border border-gray-200 p-4 rounded-md bg-gray-50 space-y-2 text-sm text-gray-700 shadow-sm">
            <p><strong>{t(language, "portal.companyInfo.legalName")}:</strong> {watch("legal_name")}</p>
            <p><strong>{t(language, "portal.companyInfo.contactEmail")}:</strong> {watch("contacts.0.email")}</p>
            {/* Add more summary fields */}
            <p className="font-semibold mt-2">Documents Uploaded:</p>
            <ul className="list-disc pl-5">
              {watch("documents")?.map((doc, i) => (
                <li key={i}>{doc.type.replace(/_/g, ' ')}: {doc.file?.name}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="declaration" required />
            <Label htmlFor="declaration">{t(language, "portal.reviewSubmit.declaration")}</Label>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    // Validate current step before proceeding
    const isValid = await trigger(); // Trigger validation for all fields
    if (!isValid) {
      toast.error("Please fix the errors before proceeding.");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    // Initialize documents array with required types
    if (requiredDocsProfile.length > 0 && documentFields.length === 0) {
      requiredDocsProfile.forEach(docType => {
        appendDocument({ type: docType, file: undefined, issuedOn: undefined, expiresOn: undefined });
      });
    }
  }, [requiredDocsProfile, documentFields.length, appendDocument]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t(language, "portal.welcome")}</h1>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <Select value={language} onValueChange={(val: 'en' | 'fr') => setLanguage(val)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t(language, "portal.languageToggle")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-gray-600 mb-8">{t(language, "portal.description")}</p>

        <div className="flex justify-between mb-8 text-sm font-medium text-gray-500">
          {steps.map((stepItem, index) => (
            <span key={index} className={cn(
              "px-3 py-1 rounded-full",
              currentStep >= index ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600",
              currentStep === index && "font-bold text-emerald-900" // Changed to index for current step
            )}>
              {index + 1}. {stepItem.title}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {steps[currentStep].content}

          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                {t(language, "portal.buttons.previous")}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext} disabled={isSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {t(language, "portal.buttons.next")}
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {isSubmitting ? t(language, "portal.loading") : t(language, "portal.buttons.submit")}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}