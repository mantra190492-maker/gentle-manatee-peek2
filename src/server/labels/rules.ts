import { LabelSpecContentInput, Suggestion, RiskProfile, DosageRecommendation, RiskFlag, MedicinalItem } from './types'; // Added MedicinalItem
import { validateRiskClaimCrossCheck } from './validators'; // Import for cross-check
import { addMonths, format } from 'date-fns'; // Import for date calculations

/**
 * Mock Ingredient Risk Library. In a real system, this would query a database.
 */
export function getIngredientRiskProfile(ingredientName: string): RiskProfile {
  const lowerName = ingredientName.toLowerCase();
  if (lowerName.includes("ashwagandha")) {
    return {
      contraindications_en: ["Consult a health care practitioner prior to use if you are pregnant or breastfeeding.", "Consult a health care practitioner if you have a benign prostate hypertrophy or androgen-sensitive prostate cancer.", "Avoid taking with alcohol or products with sedative properties."],
      contraindications_fr: ["Consultez un professionnel de la santé avant d’utiliser si vous êtes enceinte ou allaitez.", "Consultez un professionnel de la santé si vous souffrez d'hypertrophie bénigne de la prostate ou de cancer de la prostate sensible aux androgènes.", "Évitez de prendre avec de l'alcool ou des produits aux propriétés sédatives."],
      allergens_en: [],
      allergens_fr: [],
      heavy_metals_thresholds: { lead: 0.5, cadmium: 0.3 }, // Example thresholds in ppm
      microbial_thresholds: { e_coli: 10, salmonella: 0 }, // Example thresholds in CFU/g
    };
  }
  // Default empty profile
  return { contraindications_en: [], contraindications_fr: [], allergens_en: [], allergens_fr: [] }; // Fixed: allergens_fr should be an array
}

/**
 * Mock Dosage Recommendation Library. In a real system, this would query a database.
 */
export function getDosageRecommendations(dosageForm: string, medicinalItems: MedicinalItem[]): DosageRecommendation {
  const lowerForm = dosageForm.toLowerCase();
  const hasAshwagandha = medicinalItems.some(m => /ashwagandha/i.test(m.name_en));

  if (lowerForm.includes("capsule") && hasAshwagandha) {
    return {
      dosage_form: "Capsule",
      adult_use_en: "Adults: Take 1 capsule 2 times daily.",
      adult_use_fr: "Adultes : Prendre 1 capsule 2 fois par jour.",
      duration_en: "Consult a health care practitioner for use beyond 7 days.",
      duration_fr: "Consultez un professionnel de la santé pour un usage au-delà de 7 jours.",
    };
  }
  if (lowerForm.includes("gummy")) {
    return {
      dosage_form: "Gummy",
      adult_use_en: "Adults: Take 2 gummies once daily.",
      adult_use_fr: "Adultes : Prendre 2 gommes une fois par jour.",
    };
  }
  return {};
}

/**
 * Generates risk flags based on ingredients and their profiles.
 */
export function generateRiskFlags(content: LabelSpecContentInput): RiskFlag[] {
  const flags: RiskFlag[] = [];
  content.medicinal.forEach(item => {
    const riskProfile = getIngredientRiskProfile(item.name_en); // Use EN name for lookup

    if (riskProfile.contraindications_en.length > 0) {
      flags.push({
        type: 'contraindication',
        ingredient: item.name_en,
        message_en: `Contraindications for ${item.name_en}: ${riskProfile.contraindications_en.join('; ')}`,
        message_fr: `Contre-indications pour ${item.name_fr}: ${riskProfile.contraindications_fr.join('; ')}`,
        severity: 'warning',
        reference: `Health Canada Monograph: ${item.name_en}`,
      });
    }
    // Add more checks for allergens, heavy metals, etc.
  });
  return flags;
}

/**
 * Returns standard storage recommendations.
 */
export function getStandardStorageRecommendations() {
  return {
    en: "Store in a cool, dry place.",
    fr: "Conserver dans un endroit frais et sec.",
  };
}

/**
 * Returns global company information.
 */
export function getGlobalCompanyInfo() {
  return {
    name_en: "Sattva Leaf Inc.",
    name_fr: "Sattva Leaf Inc.",
    address_en: "123 Wellness Way, Toronto, ON, Canada M1M 1M1",
    address_fr: "123 Chemin du Bien-être, Toronto, ON, Canada M1M 1M1",
    contact_en: "info@sattvaleaf.com",
    contact_fr: "info@sattvaleaf.com",
    website: "www.sattvaleaf.com",
    made_in_en: "Made in Canada", // Added
    made_in_fr: "Fabriqué au Canada", // Added
    distributed_by_en: "Distributed by Sattva Leaf Inc.", // Added
    distributed_by_fr: "Distribué par Sattva Leaf Inc.", // Added
    npn_number: "80000000", // Added
  };
}

/**
 * Returns mandatory regulatory defaults.
 */
export function getRegulatoryDefaults() {
  return {
    made_in_en: "Made in Canada",
    made_in_fr: "Fabriqué au Canada",
    distributed_by_en: "Distributed by Sattva Leaf Inc.",
    distributed_by_fr: "Distribué par Sattva Leaf Inc.",
    npn_prefix: "800", // Example NPN prefix
  };
}


/**
 * Very light, pluggable rules engine stubs.
 * Batch 2 returns suggestions; Batch 3+ can fetch from DB (ingredients) and market configs.
 */
export function suggestFromIngredientsStub(content: LabelSpecContentInput): Suggestion[] {
  let suggestions: Suggestion[] = [];

  // --- Ingredient-based suggestions (from risk library) ---
  content.medicinal.forEach(item => {
    const riskProfile = getIngredientRiskProfile(item.name_en);
    if (riskProfile.contraindications_en.length > 0) {
      suggestions.push({
        field: 'warning_en',
        from: 'ingredient_rule',
        suggestion_en: riskProfile.contraindications_en.join('\n'),
        suggestion_fr: riskProfile.contraindications_fr.join('\n'),
        note: `Contraindications for ${item.name_en}`,
        severity: 'warning',
      });
    }
    // Add suggestions for allergens, heavy metals etc.
  });

  // --- Dosage auto-population ---
  if (content.dosage_form) {
    const dosageRecs = getDosageRecommendations(content.dosage_form, content.medicinal);
    if (dosageRecs.adult_use_en && !content.directions_en) {
      suggestions.push({
        field: 'directions_en',
        from: 'dosage_auto_fill',
        suggestion_en: dosageRecs.adult_use_en,
        suggestion_fr: dosageRecs.adult_use_fr,
        note: 'Auto-filled adult dosage based on form and ingredients.',
        severity: 'info',
      });
    }
    if (dosageRecs.duration_en && !content.duration_en) {
      suggestions.push({
        field: 'duration_en',
        from: 'dosage_auto_fill',
        suggestion_en: dosageRecs.duration_en,
        suggestion_fr: dosageRecs.duration_fr,
        note: 'Auto-filled duration based on form and ingredients.',
        severity: 'info',
      });
    }
  }

  // --- Existing rules ---
  const hasAshwagandha = (content.medicinal || []).some(m =>
    /ashwagandha|withania\s+somnifera/i.test(`${m.name_en} ${m.name_fr}`)
  );

  if (hasAshwagandha) {
    suggestions.push({
      field: 'warning_en',
      from: 'ingredient_rule',
      suggestion_en: 'Consult a health care practitioner prior to use if you are pregnant or breastfeeding.',
      suggestion_fr: 'Consultez un professionnel de la santé avant d’utiliser si vous êtes enceinte ou allaitez.',
      note: 'Ashwagandha pregnancy/breastfeeding caution',
      severity: 'warning',
    });
  }

  // Dosage form example
  if (content.dosage_form && /gummy|gumm(y|ies)/i.test(content.dosage_form)) {
    suggestions.push({
      field: 'warning_en',
      from: 'form_rule',
      suggestion_en: 'Keep out of reach of children.',
      suggestion_fr: 'Garder hors de la portée des enfants.',
      note: 'Gummy form general caution',
      severity: 'info',
    });
  }

  // --- Storage Suggestions ---
  const standardStorage = getStandardStorageRecommendations();
  if (!content.override_storage_flag && !content.storage_en) {
    suggestions.push({
      field: 'storage_en',
      from: 'storage_auto',
      suggestion_en: standardStorage.en,
      suggestion_fr: standardStorage.fr,
      note: 'Standard storage statement.',
      severity: 'info',
    });
  }

  // --- Company Info Suggestions (if not already set by sanitize) ---
  const companyInfo = getGlobalCompanyInfo();
  if (!content.company_en) {
    suggestions.push({
      field: 'company_en',
      from: 'company_auto',
      suggestion_en: companyInfo.name_en + '\n' + companyInfo.address_en + '\n' + companyInfo.contact_en,
      suggestion_fr: companyInfo.name_fr + '\n' + companyInfo.address_fr + '\n' + companyInfo.contact_fr,
      note: 'Auto-filled company name, address, and contact.',
      severity: 'info',
    });
  }
  if (!content.company_website) {
    suggestions.push({
      field: 'company_website',
      from: 'company_auto',
      suggestion_en: companyInfo.website,
      suggestion_fr: companyInfo.website, // Website is usually not translated
      note: 'Auto-filled company website.',
      severity: 'info',
    });
  }

  // --- Regulatory Suggestions ---
  const regulatoryDefaults = getRegulatoryDefaults();
  if (!content.made_in_en) {
    suggestions.push({
      field: 'made_in_en',
      from: 'regulatory_auto',
      suggestion_en: regulatoryDefaults.made_in_en,
      suggestion_fr: regulatoryDefaults.made_in_fr,
      note: 'Auto-filled "Made In" statement.',
      severity: 'info',
    });
  }
  if (!content.distributed_by_en) {
    suggestions.push({
      field: 'distributed_by_en',
      from: 'regulatory_auto',
      suggestion_en: regulatoryDefaults.distributed_by_en,
      suggestion_fr: regulatoryDefaults.distributed_by_fr,
      note: 'Auto-filled "Distributed By" statement.',
      severity: 'info',
    });
  }
  if (!content.npn_number) {
    suggestions.push({
      field: 'npn_number',
      from: 'regulatory_auto',
      suggestion_en: `${regulatoryDefaults.npn_prefix}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      note: 'Auto-generated NPN number.',
      severity: 'info',
    });
  }

  // --- Lot/Expiry Auto-fill Suggestions ---
  if (!content.override_lot_expiry_flag && content.batch_date && content.shelf_life_months !== null && content.shelf_life_months !== undefined) {
    const batchDate = new Date(content.batch_date);
    const expiryDate = addMonths(batchDate, content.shelf_life_months);
    const formattedExpiry = format(expiryDate, 'yyyy-MM-dd');

    if (!content.expiry_date || content.expiry_date !== formattedExpiry) {
      suggestions.push({
        field: 'expiry_date',
        from: 'lot_expiry_auto',
        suggestion_en: formattedExpiry,
        note: 'Auto-calculated expiry date based on batch date and shelf life.',
        severity: 'info',
      });
    }
    if (!content.lot_number) {
      suggestions.push({
        field: 'lot_number',
        from: 'lot_expiry_auto',
        suggestion_en: `LOT-${format(batchDate, 'yyMMdd')}-01`, // Example lot number format
        note: 'Auto-generated lot number based on batch date.',
        severity: 'info',
      });
    }
  }


  // --- Risk-Claim Cross Check suggestions (if any validation errors) ---
  const crossCheckFlags = validateRiskClaimCrossCheck(content);
  crossCheckFlags.forEach(flag => {
    suggestions.push({
      field: 'warning_en', // Suggest adding to warnings
      from: 'risk_cross_check',
      suggestion_en: flag.message_en,
      suggestion_fr: flag.message_fr,
      note: `Risk-Claim cross-check: ${flag.ingredient || ''} ${flag.type}`,
      severity: flag.severity,
    });
  });


  return suggestions;
}

/**
 * Merge simple suggestions by concatenating unique lines; UI can handle richer diffs later.
 */
export function mergeWarningSuggestions(current: string | null | undefined, proposed: string): string {
  const lines = new Set(
    [ ...(current || '').split('\n'), ...(proposed || '').split('\n') ]
      .map(s => s.trim())
      .filter(Boolean)
  );
  return Array.from(lines).join('\n');
}