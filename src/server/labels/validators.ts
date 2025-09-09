import { LabelSpecContentInput, RiskFlag, ClaimValidationResult, ConsistencyCheckResult, LabelSpecWithContent } from './types.ts';
import { getIngredientRiskProfile } from './rules.ts'; // Import for risk profile fetching
import { supabase } from "@/integrations/supabase/client"; // Added: Import supabase

export function requireBilingual(value?: string | null, fieldLabel?: string): void {
  if (!value || !value.toString().trim()) {
    throw new Error(`${fieldLabel ?? 'Field'} (EN/FR) is required.`);
  }
}

export function validateClaim(claimEn: string, claimFr: string): ClaimValidationResult {
  // Mock claim validation against an "approved monograph database"
  const blockedKeywords = [/cures anxiety/i, /treats cancer/i, /eliminates all disease/i];
  const allowedKeywords = [/helps reduce stress/i, /supports healthy sleep/i, /promotes relaxation/i];

  if (blockedKeywords.some(keyword => keyword.test(claimEn) || keyword.test(claimFr))) {
    return {
      isValid: false,
      message_en: "Claim contains unapproved medical language. Please revise.",
      message_fr: "L'allégation contient un langage médical non approuvé. Veuillez réviser.",
      severity: 'error',
    };
  }

  if (allowedKeywords.some(keyword => keyword.test(claimEn) || keyword.test(claimFr))) {
    return {
      isValid: true,
      message_en: "Claim appears to be within approved scope.",
      message_fr: "L'allégation semble être dans le cadre approuvé.",
      reference_id: "MOCK-MONOGRAPH-REF-123",
      severity: 'info',
    };
  }

  return {
    isValid: true,
    message_en: "Claim requires manual review for approval.",
    message_fr: "L'allégation nécessite un examen manuel pour approbation.",
    severity: 'warning',
  };
}

export function validateRiskClaimCrossCheck(content: LabelSpecContentInput): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Example: If Ashwagandha is present, check for pregnancy/breastfeeding warning
  const hasAshwagandha = content.medicinal.some(m =>
    /ashwagandha|withania\s+somnifera/i.test(`${m.name_en} ${m.name_fr}`)
  );

  if (hasAshwagandha) {
    const riskProfile = getIngredientRiskProfile("Ashwagandha"); // Fetch mock risk profile
    const requiresPregnancyWarning = riskProfile.contraindications_en.some(c => /pregnant|breastfeeding/i.test(c));

    if (requiresPregnancyWarning) {
      const warningPresent = content.warning_en?.toLowerCase().includes("pregnant") ||
                             content.warning_fr?.toLowerCase().includes("enceinte");
      if (!warningPresent) {
        flags.push({
          type: 'contraindication',
          ingredient: 'Ashwagandha',
          message_en: "Warning for pregnancy/breastfeeding is missing for Ashwagandha.",
          message_fr: "L'avertissement pour la grossesse/l'allaitement est manquant pour l'Ashwagandha.",
          severity: 'error',
          reference: "Health Canada Monograph: Ashwagandha",
        });
      }
    }
  }

  // Add more cross-checks as needed
  return flags;
}

export function validateBatchConsistency(productId: string, currentContent: LabelSpecContentInput, otherApprovedContents: LabelSpecContentInput[]): ConsistencyCheckResult {
  let isConsistent = true;
  const deviations: { sku: string; field: string; expected: string; actual: string }[] = [];

  // Example: Check if dosage form is consistent across all SKUs
  const expectedDosageForm = currentContent.dosage_form;
  for (const otherContent of otherApprovedContents) {
    if (otherContent.dosage_form !== expectedDosageForm) {
      isConsistent = false;
      deviations.push({
        sku: productId, // Using current product ID as SKU for simplicity
        field: "dosage_form",
        expected: expectedDosageForm || "N/A",
        actual: otherContent.dosage_form || "N/A",
      });
    }
    // Add more consistency checks for other critical fields
    if (otherContent.shelf_life_months !== currentContent.shelf_life_months) {
      isConsistent = false;
      deviations.push({
        sku: productId,
        field: "shelf_life_months",
        expected: String(currentContent.shelf_life_months || "N/A"),
        actual: String(otherContent.shelf_life_months || "N/A"),
      });
    }
    // Compare medicinal ingredients (simplified: just check names for now)
    const currentMedicinalNames = currentContent.medicinal.map(m => m.name_en).sort().join(',');
    const otherMedicinalNames = otherContent.medicinal.map(m => m.name_en).sort().join(',');
    if (currentMedicinalNames !== otherMedicinalNames) {
      isConsistent = false;
      deviations.push({
        sku: productId,
        field: "medicinal_ingredients",
        expected: currentMedicinalNames || "N/A",
        actual: otherMedicinalNames || "N/A",
      });
    }
  }

  if (!isConsistent) {
    return {
      isConsistent: false,
      message_en: "Batch consistency check failed. Deviations found in template format.",
      message_fr: "Le contrôle de cohérence par lot a échoué. Des écarts ont été trouvés dans le format du modèle.",
      deviations,
    };
  }

  return {
    isConsistent: true,
    message_en: "Batch consistency check passed.",
    message_fr: "Le contrôle de cohérence par lot a réussi.",
  };
}


export function validateContentBilingualCompleteness(input: LabelSpecContentInput) {
  // Required blocks
  requireBilingual(input.product_name_en, 'Product name EN');
  requireBilingual(input.product_name_fr, 'Product name FR');

  if (!Array.isArray(input.medicinal) || input.medicinal.length === 0) {
    throw new Error('At least one medicinal ingredient is required.');
  }

  requireBilingual(input.claim_en, 'Claim EN');
  requireBilingual(input.claim_fr, 'Claim FR');

  requireBilingual(input.directions_en, 'Directions EN');
  requireBilingual(input.directions_fr, 'Directions FR');

  requireBilingual(input.warning_en, 'Warning EN');
  requireBilingual(input.warning_fr, 'Warning FR');

  // Non-medicinal bilingual fields are now single strings
  // requireBilingual(input.non_medicinal_en, 'Non-medicinal EN'); // Made optional
  // requireBilingual(input.non_medicinal_fr, 'Non-medicinal FR'); // Made optional
}

export function sanitizeContent(input: LabelSpecContentInput): LabelSpecContentInput {
  const trim = (s?: string | null) => (s == null ? null : s.toString().trim() || null);

  return {
    product_name_en: input.product_name_en.trim(),
    product_name_fr: input.product_name_fr.trim(),
    dosage_form: trim(input.dosage_form),

    medicinal: (input.medicinal || []).map(m => ({
      name_en: m.name_en?.trim() || '',
      name_fr: m.name_fr?.trim() || '',
      part: trim(m.part),
      extract_ratio: trim(m.extract_ratio),
      strength_mg: typeof m.strength_mg === 'number' ? m.strength_mg : (m.strength_mg ? Number(m.strength_mg) : null),
      per_serving: trim(m.per_serving),
      claim_reference_id: trim(m.claim_reference_id),
    })),

    non_medicinal_en: trim(input.non_medicinal_en),
    non_medicinal_fr: trim(input.non_medicinal_fr),

    claim_en: input.claim_en.trim(),
    claim_fr: input.claim_fr.trim(),
    directions_en: input.directions_en.trim(),
    directions_fr: input.directions_fr.trim(),
    duration_en: trim(input.duration_en),
    duration_fr: trim(input.duration_fr),
    warning_en: input.warning_en.trim(),
    warning_fr: input.warning_fr.trim(),
    storage_en: trim(input.storage_en),
    storage_fr: trim(input.storage_fr),
    override_storage_flag: input.override_storage_flag ?? false, // Sanitize new flag
    company_en: trim(input.company_en),
    company_fr: trim(input.company_fr),
    company_website: trim(input.company_website),
    made_in_en: trim(input.made_in_en),
    made_in_fr: trim(input.made_in_fr),
    distributed_by_en: trim(input.distributed_by_en),
    distributed_by_fr: trim(input.distributed_by_fr),
    npn_number: trim(input.npn_number),
    risk_flags: input.risk_flags || [],
    batch_id: trim(input.batch_id),
    batch_date: trim(input.batch_date),
    shelf_life_months: typeof input.shelf_life_months === 'number' ? input.shelf_life_months : (input.shelf_life_months ? Number(input.shelf_life_months) : null),
    lot_number: trim(input.lot_number),
    expiry_date: trim(input.expiry_date),
    coa_file_path: trim(input.coa_file_path),
    coa_file_name: trim(input.coa_file_name),
    override_lot_expiry_flag: input.override_lot_expiry_flag ?? false,
  };
}

/**
 * Validates if a spec is ready for export.
 * Throws an error with a user-friendly message if not ready.
 */
export async function validateForExport(spec: LabelSpecWithContent): Promise<void> {
  if (spec.status !== 'approved') {
    throw new Error("Spec must be 'approved' before export.");
  }
  if (!spec.qa_approved_flag) {
    throw new Error("QA sign-off is required before export.");
  }
  if (!spec.content) {
    throw new Error("Spec content is missing.");
  }
  if (!spec.content.coa_file_path) {
    throw new Error("Certificate of Analysis (CoA) is missing. Please upload it.");
  }

  // Re-run batch consistency check
  const { data: otherSpecs, error } = await supabase
    .from("label_specs")
    .select(`*, content:label_spec_content(*)`)
    .eq("product_id", spec.product_id)
    .eq("status", "approved")
    .neq("id", spec.id);

  if (error) throw new Error(error.message);

  const otherApprovedContents: LabelSpecContentInput[] = (otherSpecs || [])
    .map(s => s.content)
    .filter(c => c !== null) as LabelSpecContentInput[];

  const batchConsistency = validateBatchConsistency(spec.product_id, spec.content, otherApprovedContents);
  if (!batchConsistency.isConsistent) {
    throw new Error(`Batch consistency check failed: ${batchConsistency.message_en}. Export blocked.`);
  }
}