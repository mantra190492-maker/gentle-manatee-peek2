// src/lib/suppliers/scorecard.ts
import type { Supplier, Scorecard, NewScorecard } from "./types";
import type { Json } from "@/lib/db/schema"; // Import Json type

interface KPI {
  name: string;
  value: number;
  target: number;
  weight: number;
}

/**
 * Generates a monthly scorecard for a supplier.
 * This is a conceptual function that would integrate with actual performance data.
 *
 * @param supplier The supplier object.
 * @param month The month for the scorecard (1-12).
 * @param year The year for the scorecard.
 * @returns A new Scorecard object.
 */
export function generateSupplierScorecard(
  supplier: Supplier,
  month: number,
  year: number,
): NewScorecard {
  // Placeholder KPIs - in a real app, these would come from performance data
  const kpis: KPI[] = [
    { name: "On-Time Delivery", value: Math.floor(Math.random() * 20) + 80, target: 95, weight: 0.3 },
    { name: "Quality Defects", value: Math.floor(Math.random() * 5), target: 2, weight: 0.3 },
    { name: "Responsiveness", value: Math.floor(Math.random() * 10) + 85, target: 90, weight: 0.2 },
    { name: "Cost Competitiveness", value: Math.floor(Math.random() * 10) + 90, target: 92, weight: 0.2 },
  ];

  let totalScore = 0;
  kpis.forEach(kpi => {
    // Simple scoring: if value meets/exceeds target, full points; otherwise, proportional
    let kpiScore = 0;
    if (kpi.name === "Quality Defects") { // Lower is better for defects
      kpiScore = (kpi.value <= kpi.target) ? 100 : Math.max(0, 100 - ((kpi.value - kpi.target) * 10));
    } else {
      kpiScore = (kpi.value >= kpi.target) ? 100 : (kpi.value / kpi.target) * 100;
    }
    totalScore += (kpiScore / 100) * (kpi.weight * 100);
  });

  const finalScore = Math.round(totalScore);
  let grade: string;
  if (finalScore >= 90) grade = "A";
  else if (finalScore >= 80) grade = "B";
  else if (finalScore >= 70) grade = "C";
  else if (finalScore >= 60) grade = "D";
  else grade = "F";

  return {
    supplier_id: supplier.id,
    period_month: month,
    period_year: year,
    kpis_json: kpis as unknown as Json, // Cast to Json to satisfy type
    score: finalScore,
    grade: grade,
  };
}

/**
 * Exports scorecard data to CSV format (conceptual).
 * @param scorecards Array of scorecard objects.
 * @returns CSV string.
 */
export function exportScorecardsToCsv(scorecards: Scorecard[]): string {
  if (scorecards.length === 0) return "No data to export.";

  const headers = ["Supplier ID", "Period", "Score", "Grade", "KPIs"];
  const rows = scorecards.map(sc => {
    const period = `${sc.period_month}/${sc.period_year}`;
    const kpis = sc.kpis_json ? JSON.stringify(sc.kpis_json) : "";
    return `"${sc.supplier_id}","${period}",${sc.score},"${sc.grade}","${kpis}"`;
  });

  return [headers.join(","), ...rows].join("\n");
}