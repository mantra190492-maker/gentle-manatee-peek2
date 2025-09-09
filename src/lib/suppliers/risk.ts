// src/lib/suppliers/risk.ts
import type { Supplier, Document, Approval, Response } from "./types";
import type { Json } from "@/lib/db/schema"; // Import Json type

interface RiskFactors {
  quality: number; // e.g., audit results, CAPA history
  compliance: number; // e.g., document completeness, expiry status
  commercial: number; // e.g., financial stability, performance history
  esg: number; // Environmental, Social, Governance
}

// Weights for each factor (can be adjusted)
const RISK_WEIGHTS = {
  quality: 0.40,
  compliance: 0.30,
  commercial: 0.20,
  esg: 0.10,
};

/**
 * Calculates a comprehensive risk score for a supplier.
 * This is a simplified example; a real system would involve more complex logic
 * pulling from various data points (e.g., audit findings, CAPA records, performance metrics).
 *
 * @param supplier The supplier object.
 * @param documents Related documents for compliance checks.
 * @param approvals Related approvals for quality status.
 * @param responses Related questionnaire responses.
 * @returns A numeric risk score (0-100).
 */
export function calculateRiskScore(
  supplier: Supplier,
  documents: Document[],
  approvals: Approval[],
  responses: Response[],
): number {
  let qualityScore = 0; // Higher is better
  let complianceScore = 0;
  let commercialScore = 0;
  let esgScore = 0;

  // --- Quality Score (example logic) ---
  // Based on approval history, CAPA status (if available)
  const latestApproval = approvals.find(a => a.decision === 'approved' || a.decision === 'conditional');
  if (latestApproval?.decision === 'approved') {
    qualityScore += 30;
  } else if (latestApproval?.decision === 'conditional') {
    qualityScore += 15;
  }
  // Placeholder: integrate CAPA data if available
  // if (supplier.open_capas === 0) qualityScore += 10;

  // --- Compliance Score (example logic) ---
  // Based on document completeness and expiry
  const requiredDocsCount = (supplier.type === 'manufacturer' ? 5 : 3); // Simplified example
  const validDocsCount = documents.filter(doc => {
    const expires = doc.expires_on ? new Date(doc.expires_on) : null;
    return doc.status === 'Approved' && (!expires || expires > new Date());
  }).length;
  complianceScore = (validDocsCount / requiredDocsCount) * 50; // Max 50 points for docs

  // --- Commercial Score (example logic) ---
  // Placeholder: based on supplier's type, historical performance, etc.
  if (supplier.type === 'manufacturer') commercialScore += 20;
  if (supplier.po_blocked) commercialScore -= 10; // Penalty for PO block

  // --- ESG Score (example logic) ---
  // Placeholder: based on specific questionnaire responses or certifications
  const esgResponse = responses.find(r => r.json && typeof r.json === 'object' && 'esg_policy' in r.json);
  if (esgResponse) esgScore += 10;

  // Combine scores, normalize to 0-100, and invert for risk (higher score = higher risk)
  const totalWeightedScore =
    (qualityScore * RISK_WEIGHTS.quality) +
    (complianceScore * RISK_WEIGHTS.compliance) +
    (commercialScore * RISK_WEIGHTS.commercial) +
    (esgScore * RISK_WEIGHTS.esg);

  // Invert and scale to 0-100 for risk (assuming max possible score is 100 for each factor)
  // This is a very basic inversion. A more robust model would be trained.
  const maxPossibleScore = 100 * (RISK_WEIGHTS.quality + RISK_WEIGHTS.compliance + RISK_WEIGHTS.compliance + RISK_WEIGHTS.esg); // Corrected sum of weights
  const normalizedRisk = 100 - (totalWeightedScore / maxPossibleScore) * 100;

  return Math.round(Math.max(0, Math.min(100, normalizedRisk)));
}