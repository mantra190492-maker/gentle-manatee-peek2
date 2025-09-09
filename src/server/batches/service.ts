// src/server/batches/service.ts
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  Batch,
  BatchAttribute,
  BatchTest,
  CoAFile,
  Shipment,
  ChainEvent,
  Disposition,
  ChainEventType,
  NewBatch,
  NewBatchTest,
  NewShipment,
} from "@/types/batches/types";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { format } from "date-fns";

/* ===================== Helpers ===================== */

async function logBatchActivity(
  batchId: string,
  type: ChainEventType,
  actorId: string | null,
  detail?: string
) {
  await supabase.from("chain_events").insert({
    batch_id: batchId,
    type,
    actor: actorId,
    detail: detail ?? null,
  });
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

async function isUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
  return data ?? false;
}

/** Extract product names/version regardless of how the spec row is shaped. */
async function getSpecNames(
  specId?: string | null
): Promise<{ productNameEn: string; productNameFr: string; version: string | number | "N/A" }> {
  if (!specId) return { productNameEn: "N/A", productNameFr: "N/A", version: "N/A" };

  const { data: specRow, error } = await supabase
    .from("label_specs")
    .select("version, content, label_spec_content(product_name_en, product_name_fr)")
    .eq("id", specId)
    .single();

  if (error || !specRow) {
    console.error("getSpecNames: spec fetch error", error);
    return { productNameEn: "N/A", productNameFr: "N/A", version: "N/A" };
  }

  const version = specRow.version ?? "N/A";
  let productNameEn = "N/A";
  let productNameFr = "N/A";

  // Case 1: JSONB content with names
  if (specRow.content && typeof specRow.content === "object" && !Array.isArray(specRow.content)) {
    productNameEn = (specRow.content as any)?.product_name_en ?? productNameEn;
    productNameFr = (specRow.content as any)?.product_name_fr ?? productNameFr;
  }

  // Case 2: joined rows in label_spec_content[]
  const arr = (specRow as any)?.label_spec_content;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    productNameEn = first?.product_name_en ?? productNameEn;
    productNameFr = first?.product_name_fr ?? productNameFr;
  }

  return { productNameEn, productNameFr, version };
}

/* ===================== Public API ===================== */

/** List batches (filters + paging). */
export async function listBatches(params: {
  q?: string;
  sku?: string;
  specId?: string;
  disposition?: Disposition | "All";
  page?: number;
  pageSize?: number;
}): Promise<Batch[]> {
  let query = supabase
    .from("batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(
      `lot_code.ilike.%${params.q}%,manufacturer.ilike.%${params.q}%,sku.ilike.%${params.q}%`
    );
  }
  if (params.sku) query = query.eq("sku", params.sku);
  if (params.specId) query = query.eq("spec_id", params.specId);
  if (params.disposition && params.disposition !== "All") {
    query = query.eq("disposition", params.disposition);
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 100;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) {
    console.error("Error listing batches:", error);
    toast.error("Failed to load batches: " + error.message);
    return [];
  }
  return data as Batch[];
}

/** Get one batch + children. */
export async function getBatch(
  id: string
): Promise<
  (Batch & {
    batch_attributes: BatchAttribute[];
    batch_tests: BatchTest[];
    coa_files: CoAFile[];
    shipments: Shipment[];
    chain_events: ChainEvent[];
  }) | null
> {
  const { data, error } = await supabase
    .from("batches")
    .select(
      `
      *,
      batch_attributes(*),
      batch_tests(*),
      coa_files(*),
      shipments(*),
      chain_events(*)
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching batch details:", error);
    toast.error("Failed to load batch details: " + error.message);
    return null;
  }
  return data as any;
}

/** Create a batch. */
export async function createBatch(input: NewBatch): Promise<Batch | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to create a batch.");
    return null;
  }

  if (!/^[A-Z0-9._-]+$/.test(input.lot_code || "")) {
    toast.error("Lot Code must contain only uppercase letters, numbers, periods, underscores, or hyphens.");
    return null;
  }

  if (input.mfg_date && input.expiry_date) {
    const mfgDate = new Date(input.mfg_date);
    const expiryDate = new Date(input.expiry_date);
    if (expiryDate < mfgDate) {
      toast.error("Expiry Date cannot be before Manufacturing Date.");
      return null;
    }
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({ ...input, owner: userId })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating batch:", error);
    toast.error("Failed to create batch: " + error.message);
    return null;
  }

  await logBatchActivity(data.id, "Manufactured", userId, `Batch ${data.lot_code} created.`);
  toast.success(`Batch ${data.lot_code} created successfully!`);
  return data as Batch;
}

/** Update batch metadata. */
export async function updateBatchMeta(
  id: string,
  patch: Partial<Batch>  // ✅ fix: 'UpdateBatch' → Partial<Batch>
): Promise<Batch | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to update a batch.");
    return null;
  }

  if (patch.lot_code && !/^[A-Z0-9._-]+$/.test(patch.lot_code)) {
    toast.error("Lot Code must contain only uppercase letters, numbers, periods, underscores, or hyphens.");
    return null;
  }

  if (patch.mfg_date || patch.expiry_date) {
    const existing = await getBatch(id);
    const mfgDate = new Date(patch.mfg_date || (existing as any)?.mfg_date || "");
    const expiryDate = new Date(patch.expiry_date || (existing as any)?.expiry_date || "");
    if (
      mfgDate.toString() !== "Invalid Date" &&
      expiryDate.toString() !== "Invalid Date" &&
      expiryDate < mfgDate
    ) {
      toast.error("Expiry Date cannot be before Manufacturing Date.");
      return null;
    }
  }

  const { data, error } = await supabase
    .from("batches")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating batch:", error);
    toast.error("Failed to update batch: " + error.message);
    return null;
  }

  await logBatchActivity(data.id, "Received", userId, `Batch metadata updated.`);
  toast.success(`Batch ${data.lot_code} updated successfully!`);
  return data as Batch;
}

/** Set disposition (QA/admin only). */
export async function setDisposition(
  id: string,
  disposition: Disposition,
  note?: string
): Promise<Batch | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to change disposition.");
    return null;
  }

  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    toast.error("Only QA personnel can change batch disposition.");
    return null;
  }

  // Release guard: require CoA + critical tests pass
  if (disposition === "Released") {
    const batchDetails = await getBatch(id);
    if (!batchDetails) {
      toast.error("Batch not found.");
      return null;
    }

    const hasCoA = (batchDetails.coa_files ?? []).length > 0;
    if (!hasCoA) {
      toast.error("Cannot release batch: Certificate of Analysis (CoA) is missing.");
      return null;
    }

    const criticalAnalytes = ["Identity", "Microbial", "Heavy Metals"];
    const allCriticalTestsPassed = criticalAnalytes.every((analyte) =>
      (batchDetails.batch_tests ?? []).some((t) => t.analyte === analyte && t.pass)
    );
    if (!allCriticalTestsPassed) {
      toast.error("Cannot release batch: Not all critical QC tests have passed.");
      return null;
    }
  }

  const { data, error } = await supabase
    .from("batches")
    .update({ disposition, last_updated: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error setting disposition:", error);
    toast.error("Failed to set disposition: " + error.message);
    return null;
  }

  await logBatchActivity(
    data.id,
    disposition === "Released" ? "QC Passed" : "QC Sampled",
    userId,
    `Disposition changed to ${disposition}. Note: ${note || "N/A"}`
  );
  toast.success(`Batch disposition set to ${disposition}.`);
  return data as Batch;
}

/** Add a batch test. */
export async function addBatchTest(batchId: string, test: NewBatchTest): Promise<BatchTest | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to add a batch test.");
    return null;
  }

  const { data, error } = await supabase
    .from("batch_tests")
    .insert({ ...test, batch_id: batchId })
    .select("*")
    .single();

  if (error) {
    console.error("Error adding batch test:", error);
    toast.error("Failed to add batch test: " + error.message);
    return null;
  }

  await logBatchActivity(
    batchId,
    test.pass ? "QC Passed" : "QC Failed",
    userId,
    `Test for ${test.analyte} added. Result: ${test.result}.`
  );
  toast.success(`Batch test for ${test.analyte} added.`);
  return data as BatchTest;
}

/** Import tests from CSV. */
export async function importBatchTestsCSV(
  batchId: string,
  csvFile: File
): Promise<{ added: number; errors?: string[] }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { added: 0, errors: ["Authentication required to import tests."] };
  }

  const text = await csvFile.text();
  const results = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (results.errors.length > 0) {
    console.error("CSV parsing errors:", results.errors);
    return { added: 0, errors: results.errors.map((e) => e.message) };
  }

  const errors: string[] = [];
  let addedCount = 0;

  for (const row of results.data as any[]) {
    const newTest: NewBatchTest = {
      batch_id: batchId,
      analyte: row.analyte,
      method: row.method || null,
      result: row.result,
      unit: row.unit || null,
      spec_min: row.spec_min || null,
      spec_max: row.spec_max || null,
      pass: String(row.pass).toLowerCase().trim() === "true",
      tested_on: row.tested_on || null,
      lab_name: row.lab_name || null,
    };

    const { error } = await supabase.from("batch_tests").insert(newTest);
    if (error) {
      console.error("Error inserting test row:", row, error);
      errors.push(`Failed to import row for analyte '${row.analyte}': ${error.message}`);
    } else {
      addedCount++;
    }
  }

  if (addedCount > 0) {
    await logBatchActivity(batchId, "QC Sampled", userId, `Imported ${addedCount} tests from CSV.`);
    toast.success(`Successfully imported ${addedCount} tests.`);
  }
  return { added: addedCount, errors: errors.length ? errors : undefined };
}

/** Upload CoA to private bucket & record DB row. */
export async function uploadCoAFile(
  batchId: string,
  file: File
): Promise<{ path: string; id: string } | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to upload CoA.");
    return null;
  }

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const BLOCKED_MIME_TYPES = /^(audio|video)\//i;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error(`File size exceeds 5MB limit. Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    return null;
  }
  if (BLOCKED_MIME_TYPES.test(file.type)) {
    toast.error("Audio and video files are not allowed.");
    return null;
  }

  const objectKey = `coa_files/${batchId}/${uuidv4()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("coa")
    .upload(objectKey, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("Error uploading CoA file:", uploadError);
    toast.error("Failed to upload CoA file: " + uploadError.message);
    return null;
  }

  const { data: coaFileRecord, error: recordError } = await supabase
    .from("coa_files")
    .insert({
      batch_id: batchId,
      file_name: file.name,
      storage_path: uploadData.path,
      size_bytes: file.size,
      uploaded_by: userId,
    })
    .select("*")
    .single();

  if (recordError) {
    console.error("Error recording CoA file in DB:", recordError);
    toast.error("Failed to record CoA file in database: " + recordError.message);
    await supabase.storage.from("coa").remove([uploadData.path]);
    return null;
  }

  await logBatchActivity(batchId, "QC Sampled", userId, `CoA file '${file.name}' uploaded.`);
  toast.success(`CoA file '${file.name}' uploaded successfully!`);
  return { path: uploadData.path, id: coaFileRecord.id as string };
}

/** Signed URL for CoA (private bucket). */
export async function getCoAFileUrl(fileId: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to download CoA.");
    return null;
  }

  const { data: coaFile, error: fetchError } = await supabase
    .from("coa_files")
    .select("storage_path, batch_id")
    .eq("id", fileId)
    .single();

  if (fetchError || !coaFile) {
    console.error("Error fetching CoA file record:", fetchError);
    toast.error("CoA file not found.");
    return null;
  }

  const { data, error } = await supabase.storage
    .from("coa")
    .createSignedUrl(coaFile.storage_path, 60 * 60);

  if (error) {
    console.error("Error creating signed URL:", error);
    toast.error("Failed to generate download link: " + error.message);
    return null;
  }

  await logBatchActivity(coaFile.batch_id, "Received", userId, `CoA file downloaded.`);
  return data.signedUrl;
}

/** Add shipment. */
export async function addShipment(batchId: string, payload: NewShipment): Promise<Shipment | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to add a shipment.");
    return null;
  }

  const batch = await getBatch(batchId);
  if (!batch) {
    toast.error("Batch not found.");
    return null;
  }

  const currentShippedQty = (batch.shipments ?? []).reduce((sum, s) => sum + Number(s.qty), 0);
  const totalBatchQty = Number(batch.quantity);
  const newShipmentQty = Number(payload.qty);

  if (currentShippedQty + newShipmentQty > totalBatchQty) {
    toast.error(`Cannot ship ${newShipmentQty} units. Only ${totalBatchQty - currentShippedQty} units remaining in batch.`);
    return null;
  }

  const { data, error } = await supabase
    .from("shipments")
    .insert({ ...payload, batch_id: batchId })
    .select("*")
    .single();

  if (error) {
    console.error("Error adding shipment:", error);
    toast.error("Failed to add shipment: " + error.message);
    return null;
  }

  await logBatchActivity(
    batchId,
    "Shipped",
    userId,
    `Shipped ${data.qty} ${data.uom} to ${data.to_party}. Ref: ${data.reference || "N/A"}.`
  );
  toast.success(`Shipment added for ${data.qty} units.`);
  return data as Shipment;
}

/** Add chain event. */
export async function addChainEvent(
  batchId: string,
  type: ChainEventType,
  detail?: string
): Promise<ChainEvent | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    toast.error("Authentication required to add a chain event.");
    return null;
  }

  const { data, error } = await supabase
    .from("chain_events")
    .insert({ batch_id: batchId, type, actor: userId, detail: detail || null })
    .select("*")
    .single();

  if (error) {
    console.error("Error adding chain event:", error);
    toast.error("Failed to add chain event: " + error.message);
    return null;
  }
  toast.success(`Chain event '${type}' added.`);
  return data as ChainEvent;
}

/** Trace report for a batch. */
export async function generateTraceReport(batchId: string): Promise<{ rows: any[] }> {
  const batch = await getBatch(batchId);
  if (!batch) {
    toast.error("Batch not found for trace report.");
    return { rows: [] };
  }

  const { productNameEn, productNameFr, version } = await getSpecNames(batch.spec_id);

  const fmt = (d?: string | null) => (d ? format(new Date(d), "yyyy-MM-dd HH:mm:ss") : "N/A");

  const rows: any[] = [
    {
      Lot: batch.lot_code,
      SKU: batch.sku,
      "Product Name (EN)": productNameEn,
      "Product Name (FR)": productNameFr,
      "Spec Version": version ?? "N/A",
      Disposition: batch.disposition,
      "Mfg Date": fmt(batch.mfg_date),
      "Expiry Date": fmt(batch.expiry_date),
      Quantity: batch.quantity,
      UOM: batch.uom,
      Manufacturer: batch.manufacturer,
      "Mfg Site": batch.mfg_site || "N/A",
      "Chain Events Count": (batch.chain_events ?? []).length,
      "Last Updated": fmt(batch.last_updated),
    },
    {},
    { "Event Type": "Chain of Custody Events", Actor: "", Detail: "", Timestamp: "" },
  ];

  (batch.chain_events ?? []).forEach((event) => {
    rows.push({
      "Event Type": event.type,
      Actor: (event as any).actor || "System",
      Detail: event.detail || "N/A",
      Timestamp: fmt((event as any).created_at),
    });
  });

  toast.success(`Trace report generated for batch ${batch.lot_code}.`);
  return { rows };
}

/** Recall report for all lots of a SKU. */
export async function generateRecallReportForSKU(sku: string): Promise<{ rows: any[] }> {
  const { data: batches, error } = await supabase
    .from("batches")
    .select(`id, sku, lot_code, disposition, mfg_date, expiry_date, quantity, uom, shipments(*), spec_id`)
    .eq("sku", sku)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching batches for recall report:", error);
    toast.error("Failed to generate recall report: " + error.message);
    return { rows: [] };
  }

  const fmt = (d?: string | null) => (d ? format(new Date(d), "yyyy-MM-dd") : "N/A");

  const rows: any[] = [];
  for (const batch of batches ?? []) {
    const { productNameEn, productNameFr, version } = await getSpecNames((batch as any).spec_id);

    const shipments = (batch.shipments ?? []) as Array<{
      shipped_on: string;
      to_party: string;
      qty: number | string;
      uom: string;
      reference?: string | null;
    }>;

    if (!shipments.length) {
      rows.push({
        SKU: batch.sku,
        "Product Name (EN)": productNameEn,
        "Product Name (FR)": productNameFr,
        "Lot Code": batch.lot_code,
        "Spec Version": version ?? "N/A",
        Disposition: batch.disposition,
        "Mfg Date": fmt(batch.mfg_date),
        "Expiry Date": fmt(batch.expiry_date),
        "Shipped On": "N/A",
        "To Party": "N/A",
        "Quantity Shipped": "N/A",
        UOM: batch.uom ?? "N/A",
        Reference: "N/A",
        "Contact Placeholder": "N/A",
      });
    } else {
      for (const s of shipments) {
        rows.push({
          SKU: batch.sku,
          "Product Name (EN)": productNameEn,
          "Product Name (FR)": productNameFr,
          "Lot Code": batch.lot_code,
          "Spec Version": version ?? "N/A",
          Disposition: batch.disposition,
          "Mfg Date": fmt(batch.mfg_date),
          "Expiry Date": fmt(batch.expiry_date),
          "Shipped On": fmt(s.shipped_on),
          "To Party": s.to_party,
          "Quantity Shipped": s.qty,
          UOM: s.uom,
          Reference: s.reference || "N/A",
          "Contact Placeholder": "N/A",
        });
      }
    }
  }

  toast.success(`Recall report generated for SKU ${sku}.`);
  return { rows };
}
