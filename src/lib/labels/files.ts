import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COA_BUCKET_NAME = 'label-coa-files';

/**
 * Uploads a CoA file to Supabase storage and returns its public URL.
 * @param specId The ID of the label spec this CoA belongs to.
 * @param file The File object to upload.
 * @param userId The ID of the user performing the upload.
 * @returns The public URL of the uploaded file.
 */
export async function uploadCoAFile(specId: string, file: File, userId?: string | null): Promise<string> {
  if (!specId) throw new Error("Spec ID is required to upload CoA.");
  if (!file) throw new Error("No file provided for upload.");

  const filePath = `${specId}/${file.name}`; // Store files under specId folder
  const { data, error } = await supabase.storage
    .from(COA_BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if file with same name exists
    });

  if (error) {
    console.error("Error uploading CoA file:", error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage.from(COA_BUCKET_NAME).getPublicUrl(data.path);
  if (!publicUrlData.publicUrl) {
    throw new Error("Failed to get public URL for uploaded CoA.");
  }

  // Log activity (optional, but good for audit)
  // This would typically be done in the service layer, but for direct upload, it's here.
  // You might want to move this to the service layer if the upload is part of a larger transaction.
  await supabase.from("label_spec_activity").insert({
    spec_id: specId,
    field: "coa_file",
    action: "upload",
    new_value: { name: file.name, path: publicUrlData.publicUrl },
    actor: userId ?? null,
  });

  return publicUrlData.publicUrl;
}

/**
 * Retrieves a signed URL for downloading a CoA file.
 * @param filePath The path to the file in Supabase storage.
 * @returns A signed URL for download.
 */
export async function getCoAFileUrl(filePath: string): Promise<string> {
  if (!filePath) throw new Error("File path is required to get download URL.");

  // Assuming the bucket is public, we can just return the direct URL.
  // If the bucket were private, we'd use createSignedUrl.
  const { data } = supabase.storage.from(COA_BUCKET_NAME).getPublicUrl(filePath);
  if (!data.publicUrl) {
    throw new Error("Failed to get public URL for CoA file.");
  }
  return data.publicUrl;
}