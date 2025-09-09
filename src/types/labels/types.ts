import type { Batch } from "@/types/batches/types"; // Import Batch type

export type MedicinalItem = {
  name_en: string;
  name_fr: string;
  part?: string | null;
  extract_ratio?: string | null;        // e.g., "10:1"
  strength_mg?: number | null;          // per serving
  per_serving?: string | null;          // e.g., "1 capsule"
  claim_reference_id?: string | null;   // e.g., NPN monograph ID
};

export type LabelSpecContentInput = {
  product_name_en: string;
  product_name_fr: string;
  dosage_form?: string | null;

  medicinal: MedicinalItem[];

  non_medicinal_en?: string | null;
  non_medicinal_fr?: string | null;

  claim_en: string;
  claim_fr: string;

  directions_en: string;
  directions_fr: string;

  duration_en?: string | null;
  duration_fr?: string | null;

  warning_en: string;
  warning_fr: string;

  // New: Storage Conditions
  storage_en?: string | null; // Added
  storage_fr?: string | null; // Added
  override_storage_flag?: boolean;

  // New: Company Information Block (fixed template)
  company_en?: string | null; // Added
  company_fr?: string | null; // Added
  company_website?: string | null; // Added

  // New: Mandatory Regulatory Blocks
  made_in_en?: string | null; // Added
  made_in_fr?: string | null; // Added
  distributed_by_en?: string | null; // Added
  distributed_by_fr?: string | null; // Added
  npn_number?: string | null; // Natural Product Number // Added

  // New fields for traceability and lot/expiry automation
  batch_id?: string | null;
  batch_date?: string | null; // YYYY-MM-DD
  shelf_life_months?: number | null; // e.g., 24
  lot_number?: string | null; // Auto-generated or overridden
  expiry_date?: string | null; // Auto-calculated or overridden
  coa_file_path?: string | null; // Link to CoA PDF in storage
  coa_file_name?: string | null; // Original file name of CoA
  override_lot_expiry_flag?: boolean; // Flag to allow manual override

  // New fields for automation layer
  risk_flags?: RiskFlag[]; // Auto-generated risk flags
};

export type LabelSpec = {
  id: string;
  product_id: string;
  version: number;
  status: 'draft' | 'approved' | 'retired';
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
  // New: QA Approval Gate
  qa_approved_flag: boolean; // Added
  qa_approved_by: string | null;
  qa_approved_at: string | null;
};

export type LabelSpecWithContent = LabelSpec & {
  content?: {
    id: string;
    product_name_en: string;
    product_name_fr: string;
    dosage_form: string | null;
    medicinal: MedicinalItem[];
    non_medicinal_en: string | null;
    non_medicinal_fr: string | null;
    claim_en: string;
    claim_fr: string;
    directions_en: string;
    directions_fr: string;
    duration_en: string | null;
    duration_fr: string | null;
    warning_en: string;
    warning_fr: string;
    // New: Storage Conditions
    storage_en: string | null; // Added
    storage_fr: string | null; // Added
    override_storage_flag: boolean;
    // New: Company Information Block (fixed template)
    company_en: string | null; // Added
    company_fr: string | null; // Added
    company_website: string | null; // Added
    // New: Mandatory Regulatory Blocks
    made_in_en: string | null; // Added
    made_in_fr: string | null; // Added
    distributed_by_en: string | null; // Added
    distributed_by_fr: string | null; // Added
    npn_number: string | null; // Added
    batch_id: string | null;
    batch_date: string | null;
    shelf_life_months: number | null;
    lot_number: string | null;
    expiry_date: string | null;
    coa_file_path: string | null;
    coa_file_name: string | null;
    override_lot_expiry_flag: boolean;
    risk_flags: RiskFlag[] | null;
  } | null;
  lots?: Batch[]; // Added: Link to active lots
};

export type Suggestion = {
  field: keyof LabelSpecContentInput;
  from: 'ingredient_rule' | 'form_rule' | 'market_rule' | 'risk_cross_check' | 'dosage_auto_fill' | 'lot_expiry_auto' | 'storage_auto' | 'company_auto' | 'regulatory_auto';
  suggestion_en?: string;
  suggestion_fr?: string;
  note?: string;
  severity?: 'info' | 'warning' | 'error'; // New: for UI flags
};

export type RiskProfile = {
  contraindications_en: string[];
  contraindications_fr: string[];
  allergens_en: string[];
  allergens_fr: string[];
  heavy_metals_thresholds?: Record<string, number>; // e.g., { lead: 0.5 }
  microbial_thresholds?: Record<string, number>;
};

export type RiskFlag = {
  type: 'contraindication' | 'allergen' | 'heavy_metal' | 'microbial' | 'general_warning' | 'expiry_warning';
  ingredient?: string;
  message_en: string;
  message_fr: string;
  severity: 'warning' | 'error';
  reference?: string;
};

export type ClaimValidationResult = {
  isValid: boolean;
  message_en: string;
  message_fr: string;
  reference_id?: string;
  severity: 'info' | 'warning' | 'error'; // Added 'info'
};

export type DosageRecommendation = {
  dosage_form?: string;
  adult_use_en?: string;
  adult_use_fr?: string;
  pediatric_use_en?: string;
  pediatric_use_fr?: string;
  duration_en?: string;
  duration_fr?: string;
};

export type ConsistencyCheckResult = {
  isConsistent: boolean;
  message_en: string;
  message_fr: string;
  deviations?: { sku: string; field: string; expected: string; actual: string }[];
};

export type LabelSpecActivity = {
  id: string;
  spec_id: string;
  field: string;
  action: string;
  old_value: any;
  new_value: any;
  actor: string | null;
  created_at: string;
};

export type ExportResult = {
  url: string;
  type: string;
  filename: string;
  data?: any; // For JSON export
};

export type RecallReportRow = {
  product_id: string;
  product_name_en: string;
  product_name_fr: string;
  spec_version: number;
  lot_number: string | null;
  batch_id: string | null;
  batch_date: string | null;
  expiry_date: string | null;
  coa_file_name: string | null;
  coa_file_path: string | null;
  qa_approved_at: string | null;
  approved_at: string | null;
};