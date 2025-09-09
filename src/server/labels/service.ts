import { supabase } from "@/integrations/supabase/client";
import { LabelSpec, LabelSpecWithContent, LabelSpecContentInput, Suggestion, ClaimValidationResult, ConsistencyCheckResult, RiskFlag, ExportResult, RecallReportRow } from "./types.ts";
import { sanitizeContent, validateContentBilingualCompleteness, validateClaim, validateRiskClaimCrossCheck, validateBatchConsistency, validateForExport } from "./validators.ts";
import { suggestFromIngredientsStub, mergeWarningSuggestions, generateRiskFlags } from "./rules.ts";
import { v4 as uuidv4 } from 'uuid'; // For generating unique file paths

/** Internal helper: activity logger */
async function logActivity(specId: string, field: string, action: string, old_value: any, new_value: any, actor?: string | null) {
  await supabase.from("label_spec_activity").insert({
    spec_id: specId,
    field,
    action,
    old_value,
    new_value,
    actor: actor ?? null,
  });
}

/** Get latest version number for a product */
async function getNextVersion(productId: string): Promise<number> {
  const { data, error } = await supabase
    .from("label_specs")
    .select("version")
    .eq("product_id", productId)
    .order("version", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const latest = data?.[0]?.version ?? 0;
  return latest + 1;
}

/** Create a new draft spec (version = last+1) */
export async function createDraft(productId: string, userId?: string | null): Promise<LabelSpec> {
  const version = await getNextVersion(productId);
  const { data, error } = await supabase
    .from("label_specs")
    .insert({
      product_id: productId,
      version,
      status: "draft",
      created_by: userId ?? null,
      qa_approved_flag: false, // Initialize new fields
      qa_approved_by: null,
      qa_approved_at: null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logActivity(data.id, "status", "create", null, { status: "draft", version }, userId ?? null);
  return data as LabelSpec;
}

/** Fetch spec header */
export async function getSpec(specId: string): Promise<LabelSpec> {
  const { data, error } = await supabase.from("label_specs").select("*").eq("id", specId).single();
  if (error) throw new Error(error.message);
  return data as LabelSpec;
}

/** Fetch spec + content (if any) */
export async function getSpecWithContent(specId: string): Promise<LabelSpecWithContent> {
  const { data: spec, error: e1 } = await supabase.from("label_specs").select("*").eq("id", specId).single();
  if (e1) throw new Error(e1.message);

  const { data: content, error: e2 } = await supabase
    .from("label_spec_content")
    .select("*")
    .eq("spec_id", specId)
    .single();

  // content may not exist yet (drafts)
  if (e2 && e2.code !== "PGRST116") {
    // PGRST116 = no rows found
    throw new Error(e2.message);
  }

  return {
    ...(spec as any),
    content: content ?? null,
  } as LabelSpecWithContent;
}

/** Upsert content for a spec (draft-only) */
export async function updateContent(specId: string, input: LabelSpecContentInput, userId?: string | null) {
  // Ensure spec is draft and not QA approved
  const spec = await getSpec(specId);
  if (spec.status !== "draft" || spec.qa_approved_flag) throw new Error("Only draft specs not yet QA approved can be edited.");

  // Sanitize content
  const cleanContent = sanitizeContent(input);

  // Generate risk flags
  const riskFlags = generateRiskFlags(cleanContent);
  cleanContent.risk_flags = riskFlags; // Attach generated flags to content

  // Upsert content
  const { data: existing, error: e0 } = await supabase
    .from("label_spec_content")
    .select("id")
    .eq("spec_id", specId)
    .single();

  if (e0 && e0.code !== "PGRST116") {
    throw new Error(e0.message);
  }

  if (existing?.id) {
    const { error: eUpd } = await supabase
      .from("label_spec_content")
      .update({ ...cleanContent })
      .eq("id", existing.id);
    if (eUpd) throw new Error(eUpd.message);
  } else {
    const { error: eIns } = await supabase
      .from("label_spec_content")
      .insert({ spec_id: specId, ...cleanContent });
    if (eIns) throw new Error(eIns.message);
  }

  await logActivity(specId, "content", "update", null, cleanContent, userId ?? null);
  return { ok: true };
}

/** Suggest additions from rules engine (non-mutating) */
export async function suggestFromIngredients(specId: string): Promise<Suggestion[]> {
  const data = await getSpecWithContent(specId);
  if (!data.content) throw new Error("No content found for this spec.");
  return suggestFromIngredientsStub(data.content as any);
}

/** Apply selected suggestions (example: merge warning lines) */
export async function applyWarningSuggestions(specId: string, proposedWarningEn: string, proposedWarningFr: string, userId?: string | null) {
  const { data: content, error } = await supabase
    .from("label_spec_content")
    .select("id, warning_en, warning_fr")
    .eq("spec_id", specId)
    .single();
  if (error) throw new Error(error.message);

  const mergedEn = mergeWarningSuggestions(content.warning_en, proposedWarningEn);
  const mergedFr = mergeWarningSuggestions(content.warning_fr, proposedWarningFr);

  const { error: eUpd } = await supabase
    .from("label_spec_content")
    .update({ warning_en: mergedEn, warning_fr: mergedFr })
    .eq("id", content.id);
  if (eUpd) throw new Error(eUpd.message);

  await logActivity(specId, "warning", "update", { en: content.warning_en, fr: content.warning_fr }, { en: mergedEn, fr: mergedFr }, userId ?? null);
  return { ok: true };
}

/** Get claim validation result */
export async function getClaimValidationResult(specId: string): Promise<ClaimValidationResult> {
  const specWithContent = await getSpecWithContent(specId);
  if (!specWithContent.content) throw new Error("No content found for this spec.");
  return validateClaim(specWithContent.content.claim_en, specWithContent.content.claim_fr);
}

/** Get risk-claim cross-check flags */
export async function getRiskClaimCrossCheckFlags(specId: string): Promise<RiskFlag[]> {
  const specWithContent = await getSpecWithContent(specId);
  if (!specWithContent.content) throw new Error("No content found for this spec.");
  return validateRiskClaimCrossCheck(specWithContent.content as any);
}

/** Get batch consistency check result */
export async function getBatchConsistencyCheck(specId: string): Promise<ConsistencyCheckResult> {
  const currentSpecWithContent = await getSpecWithContent(specId);
  if (!currentSpecWithContent.content) throw new Error("No content found for this spec.");

  // Fetch other approved specs for the same product
  const { data: otherSpecs, error } = await supabase
    .from("label_specs")
    .select(`*, content:label_spec_content(*)`)
    .eq("product_id", currentSpecWithContent.product_id)
    .eq("status", "approved")
    .neq("id", specId); // Exclude current spec

  if (error) throw new Error(error.message);

  const otherApprovedContents: LabelSpecContentInput[] = (otherSpecs || [])
    .map(s => s.content)
    .filter(c => c !== null) as LabelSpecContentInput[];

  return validateBatchConsistency(currentSpecWithContent.product_id, currentSpecWithContent.content, otherApprovedContents);
}


/** Approve spec (validates bilingual completeness and locks) */
export async function approveSpec(specId: string, approverId?: string | null) {
  const spec = await getSpecWithContent(specId);
  if (spec.status !== "draft") throw new Error("Only draft specs can be approved.");
  if (!spec.content) throw new Error("Cannot approve: spec has no content.");
  if (!spec.qa_approved_flag) throw new Error("Cannot approve: spec must be QA approved first.");


  // 1. Enforce bilingual completeness
  validateContentBilingualCompleteness(spec.content as any);

  // 2. Validate claims
  const claimValidation = validateClaim(spec.content.claim_en, spec.content.claim_fr);
  if (!claimValidation.isValid && claimValidation.severity === 'error') {
    throw new Error(`Claim validation failed: ${claimValidation.message_en}`);
  }

  // 3. Validate risk-claim cross-check
  const crossCheckFlags = validateRiskClaimCrossCheck(spec.content as any);
  const criticalCrossCheckErrors = crossCheckFlags.filter(f => f.severity === 'error');
  if (criticalCrossCheckErrors.length > 0) {
    throw new Error(`Risk-Claim cross-check failed: ${criticalCrossCheckErrors[0].message_en}`);
  }

  // 4. Validate batch consistency (mock)
  const batchConsistency = await getBatchConsistencyCheck(specId);
  if (!batchConsistency.isConsistent) {
    throw new Error(`Batch consistency check failed: ${batchConsistency.message_en}`);
  }

  const { error: eUpd } = await supabase
    .from("label_specs")
    .update({
      status: "approved",
      approved_by: approverId ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", specId);
  if (eUpd) throw new Error(eUpd.message);

  await logActivity(specId, "status", "approve", { status: "draft" }, { status: "approved" }, approverId ?? null);
  return { ok: true };
}

/** QA Sign-off for a spec */
export async function qaApproveSpec(specId: string, userId: string) {
  const spec = await getSpec(specId);
  if (spec.status !== "draft") throw new Error("Only draft specs can be QA approved.");
  if (spec.qa_approved_flag) throw new Error("Spec already QA approved.");

  const { error } = await supabase
    .from("label_specs")
    .update({
      qa_approved_flag: true, // Set the flag
      qa_approved_by: userId,
      qa_approved_at: new Date().toISOString(),
    })
    .eq("id", specId);

  if (error) throw new Error(error.message);
  await logActivity(specId, "qa_approval", "sign_off", { qa_approved_flag: false }, { qa_approved_flag: true, by: userId }, userId);
  return { ok: true };
}

/** Upload CoA File */
export async function uploadCoAFile(specId: string, file: File, userId?: string | null): Promise<string> {
  const filePath = `coa_files/${specId}/${uuidv4()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('label_spec_documents') // Assuming a bucket named 'label_spec_documents'
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage.from('label_spec_documents').getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  // Update label_spec_content with CoA path and name
  const { error: updateError } = await supabase
    .from('label_spec_content')
    .update({ coa_file_path: publicUrl, coa_file_name: file.name })
    .eq('spec_id', specId);

  if (updateError) throw new Error(updateError.message);

  await logActivity(specId, "coa_file", "upload", null, { path: publicUrl, name: file.name }, userId);
  return publicUrl;
}

/** Get CoA File URL (signed if private) */
export async function getCoAFileUrl(filePath: string): Promise<string> {
  // Assuming 'label_spec_documents' bucket is public for simplicity.
  // If private, you'd use createSignedUrl:
  // const { data, error } = await supabase.storage.from('label_spec_documents').createSignedUrl(filePath, 60);
  // if (error) throw new Error(error.message);
  // return data.signedUrl;
  const { data } = supabase.storage.from('label_spec_documents').getPublicUrl(filePath);
  return data.publicUrl;
}

/** Generate Recall Report */
export async function generateRecallReport(productId: string): Promise<RecallReportRow[]> {
  const { data, error } = await supabase
    .from("label_specs")
    .select(`
      product_id,
      version,
      qa_approved_at,
      approved_at,
      content:label_spec_content(
        product_name_en,
        product_name_fr,
        lot_number,
        batch_id,
        batch_date,
        expiry_date,
        coa_file_name,
        coa_file_path
      )
    `)
    .eq("product_id", productId)
    .eq("status", "approved")
    .eq("qa_approved_flag", true)
    .not("content.lot_number", "is", null); // Only include if lot number is present

  if (error) throw new Error(error.message);

  return (data || [])
    .filter(spec => spec.content && spec.content.length > 0) // Ensure content exists and is not empty
    .map(spec => ({
      product_id: spec.product_id,
      product_name_en: spec.content![0].product_name_en, // Access first element
      product_name_fr: spec.content![0].product_name_fr, // Access first element
      spec_version: spec.version,
      lot_number: spec.content![0].lot_number, // Access first element
      batch_id: spec.content![0].batch_id, // Access first element
      batch_date: spec.content![0].batch_date, // Access first element
      expiry_date: spec.content![0].expiry_date, // Access first element
      coa_file_name: spec.content![0].coa_file_name, // Access first element
      coa_file_path: spec.content![0].coa_file_path, // Access first element
      qa_approved_at: spec.qa_approved_at,
      approved_at: spec.approved_at,
    }));
}

/** Export spec to various formats */
export async function exportSpec(specId: string, formatType: 'pdf' | 'png' | 'json'): Promise<ExportResult> {
  const specWithContent = await getSpecWithContent(specId);
  await validateForExport(specWithContent); // Use the new validator

  const filenameBase = `LabelSpec_V${specWithContent.version}_${specWithContent.content?.product_name_en?.replace(/\s/g, '_') || 'Untitled'}`;

  switch (formatType) {
    case 'pdf':
      // In a real app, this would trigger a server-side PDF generation service
      // Mock URL for demonstration, assuming a service would return a downloadable URL
      return {
        url: `/mock-exports/${filenameBase}.pdf`,
        type: 'application/pdf',
        filename: `${filenameBase}.pdf`,
        data: null, // No direct data for file download
      };
    case 'png':
      // In a real app, this would trigger a server-side PNG generation service
      return {
        url: `/mock-exports/${filenameBase}.png`,
        type: 'image/png',
        filename: `${filenameBase}.png`,
        data: null, // No direct data for file download
      };
    case 'json':
      // For JSON, return the full structured spec data
      return {
        url: '#', // No direct URL for JSON, data is returned
        type: 'application/json',
        filename: `${filenameBase}.json`,
        data: specWithContent,
      };
    default:
      throw new Error("Unsupported export format.");
  }
}

/** List specs for a product (optional filters) */
export async function listSpecsByProduct(productId: string, status?: 'draft' | 'approved' | 'retired') {
  let q = supabase.from("label_specs").select("*").eq("product_id", productId).order("version", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as LabelSpec[];
}