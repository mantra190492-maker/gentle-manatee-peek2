import { supabase } from "@/integrations/supabase/client.ts";
import type {
  Supplier, NewSupplier, UpdateSupplier,
  SupplierWithDetails,
  Task, NewTask,
  Approval, NewApproval,
  Change, NewChange,
  ActivityLog, NewActivityLog,
  Invite, NewInvite,
  PortalUploadedFile, PortalSubmissionData,
  Document, NewDocument,
} from "./types.ts";
import type { Json } from "@/lib/db/schema";
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from 'js-sha256';

export const getSuppliers = async (): Promise<Supplier[] | null> => {
  const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching suppliers:", error);
    return null;
  }
  return data;
};

export const getSupplier = async (id: string): Promise<Supplier | null> => {
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching supplier:", error);
    return null;
  }
  return data;
};

export const getSupplierDetails = async (id: string): Promise<SupplierWithDetails | null> => {
  const { data, error } = await supabase
    .from("suppliers")
    .select(
      `
      *,
      supplier_sites(*),
      supplier_contacts(*),
      documents(*),
      responses(*),
      approvals(*),
      changes(*),
      scorecards(*),
      tasks(*),
      activity_log(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching supplier details:", error);
    return null;
  }
  return data;
};

export const createSupplier = async (supplier: NewSupplier): Promise<Supplier | null> => {
  const { data, error } = await supabase.from("suppliers").insert(supplier).select().single();
  if (error) {
    console.error("Error creating supplier:", error);
    return null;
  }
  return data;
};

export const updateSupplier = async (id: string, updates: UpdateSupplier): Promise<Supplier | null> => {
  const { data, error } = await supabase.from("suppliers").update(updates).eq("id", id).select().single();
  if (error) {
    console.error("Error updating supplier:", error);
    return null;
  }
  return data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) {
    console.error("Error deleting supplier:", error);
  }
};

export const createTask = async (task: NewTask): Promise<Task | null> => {
  const { data, error } = await supabase.from("tasks").insert(task).select().single();
  if (error) {
    console.error("Error creating task:", error);
    return null;
  }
  return data;
};

export const createApproval = async (approval: NewApproval): Promise<Approval | null> => {
  const { data, error } = await supabase.from("approvals").insert(approval).select().single();
  if (error) {
    console.error("Error creating approval:", error);
    return null;
  }
  return data;
};

export const createChange = async (change: NewChange): Promise<Change | null> => {
  const { data, error } = await supabase.from("changes").insert(change).select().single();
  if (error) {
    console.error("Error creating change:", error);
    return null;
  }
  return data;
};

export const createActivityLog = async (log: NewActivityLog): Promise<ActivityLog | null> => {
  const { data, error } = await supabase.from("activity_log").insert(log).select().single();
  if (error) {
    console.error("Error creating activity log:", error);
    return null;
  }
  return data;
};

// Placeholder for signed URL generation
export const getSignedUrlForDocument = async (filePath: string): Promise<string | null> => {
  // In a real implementation, you'd call Supabase storage API here
  console.log("Generating signed URL for:", filePath);
  // Mock URL for demonstration
  return `https://example.com/signed-url/${filePath}`;
};

// Invite functions
export const createInvite = async (
  supplierData: Omit<NewSupplier, 'created_by' | 'status' | 'risk_score' | 'po_blocked'>,
  email: string,
  requiredDocs: { type: string; status: string }[],
  language: string,
  expiresAt: string,
  selectedReviewers: string[], // Not used in DB, but kept for potential future use
  message: string, // Not used in DB, but kept for potential future use
): Promise<{ supplier: Supplier | null; invite: Invite | null; error: string | null }> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Error getting authenticated user:", userError);
      return { supplier: null, invite: null, error: userError?.message || "User not authenticated." };
    }

    // 1. Create the supplier
    const { data: newSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        ...supplierData,
        status: 'Pending Invite', // Default status for new invite
        risk_score: 0,
        po_blocked: true,
        created_by: user.id, // Set the created_by to the current user's ID
      })
      .select()
      .single();

    if (supplierError || !newSupplier) {
      console.error("Error creating supplier for invite:", supplierError);
      return { supplier: null, invite: null, error: supplierError?.message || "Failed to create supplier." };
    }

    // 2. Create the invite
    const token = uuidv4(); // Generate a unique token
    const { data: newInvite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        supplier_id: newSupplier.id,
        email: email,
        token: token,
        expires_at: expiresAt,
        required_docs: requiredDocs as Json, // Cast to Json
        language: language,
        created_by: user.id, // Set the created_by to the current user's ID
      })
      .select()
      .single();

    if (inviteError || !newInvite) {
      console.error("Error creating invite:", inviteError);
      // Optionally delete the created supplier if invite creation fails
      await supabase.from('suppliers').delete().eq('id', newSupplier.id);
      return { supplier: null, invite: null, error: inviteError?.message || "Failed to create invite." };
    }

    // 3. Log activity
    await createActivityLog({
      supplier_id: newSupplier.id,
      action: `Supplier invited: ${email}`,
      meta_json: { invite_id: newInvite.id, email, language, expiresAt },
      actor_id: user.id, // Log the actor who sent the invite
    });

    // In a real app, you'd send an email here with the invite link
    console.log(`Invite link for ${email}: ${window.location.origin}/portal/invite/${token}`);

    return { supplier: newSupplier, invite: newInvite, error: null };
  } catch (err: any) {
    console.error("createInvite unexpected error:", err);
    return { supplier: null, invite: null, error: err.message || "An unexpected error occurred." };
  }
};

export const verifyInviteToken = async (token: string): Promise<{ isValid: boolean; invite: Invite | null; supplier: Supplier | null; error: string | null }> => {
  try {
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select(`*, suppliers(*)`)
      .eq('token', token)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !inviteData) {
      console.error("Error verifying invite token:", inviteError);
      return { isValid: false, invite: null, supplier: null, error: inviteError?.message || "Invalid or expired token." };
    }

    return { isValid: true, invite: inviteData, supplier: inviteData.suppliers as Supplier, error: null };
  } catch (err: any) {
    console.error("verifyInviteToken unexpected error:", err);
    return { isValid: false, invite: null, supplier: null, error: err.message || "An unexpected error occurred." };
  }
};

export const submitPortalResponse = async (
  inviteId: string,
  supplierId: string,
  formData: PortalSubmissionData,
  uploadedFiles: PortalUploadedFile[],
  questionnaireId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Update supplier details from form data
    const { error: updateSupplierError } = await supabase
      .from('suppliers')
      .update({
        legal_name: formData.legal_name,
        dba: formData.dba,
        country: formData.country,
        status: 'Submitted', // Change status to submitted
      })
      .eq('id', supplierId);

    if (updateSupplierError) {
      console.error("Error updating supplier from portal submission:", updateSupplierError);
      return { success: false, error: updateSupplierError.message };
    }

    // 2. Insert/Update contacts using upsert
    const contactInserts = formData.contacts.map(contact => ({ ...contact, supplier_id: supplierId }));
    const { error: contactError } = await supabase.from('supplier_contacts').upsert(contactInserts, { onConflict: 'email,supplier_id' });
    if (contactError) {
      console.error("Error inserting/updating contacts:", contactError);
      return { success: false, error: contactError.message };
    }

    // 3. Insert/Update sites using upsert
    const siteInserts = formData.sites.map(site => ({ ...site, supplier_id: supplierId }));
    const { error: siteError } = await supabase.from('supplier_sites').upsert(siteInserts, { onConflict: 'address,supplier_id' });
    if (siteError) {
      console.error("Error inserting/updating sites:", siteError);
      return { success: false, error: siteError.message };
    }

    // 4. Handle document uploads
    for (const fileData of uploadedFiles) {
      const file = fileData.file;
      const filePath = `${supplierId}/${fileData.type}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('supplier_documents') // Assuming a bucket named 'supplier_documents'
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        return { success: false, error: `Failed to upload ${file.name}: ${uploadError.message}` };
      }

      // Calculate file hash
      const fileBuffer = await file.arrayBuffer();
      const fileHash = sha256(fileBuffer);

      // Insert document record into database
      const newDocument: NewDocument = {
        supplier_id: supplierId,
        type: fileData.type,
        file_path: filePath,
        issued_on: fileData.issuedOn || null,
        expires_on: fileData.expiresOn || null,
        status: 'Pending Review',
        version: '1.0',
        file_hash: fileHash,
      };
      const { error: docInsertError } = await supabase.from('documents').insert(newDocument);
      if (docInsertError) {
        console.error("Error inserting document record:", docInsertError);
        return { success: false, error: docInsertError.message };
      }
    }

    // 5. Record questionnaire response
    const { error: responseError } = await supabase
      .from('responses')
      .insert({
        questionnaire_id: questionnaireId,
        supplier_id: supplierId,
        json: formData as unknown as Json, // Cast form data to Json
        submitted_at: new Date().toISOString(),
      });

    if (responseError) {
      console.error("Error inserting response:", responseError);
      return { success: false, error: responseError.message };
    }

    // 6. Mark invite as used
    const { error: updateInviteError } = await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (updateInviteError) {
      console.error("Error marking invite as used:", updateInviteError);
      return { success: false, error: updateInviteError.message };
    }

    // 7. Log activity
    await createActivityLog({
      supplier_id: supplierId,
      action: `Supplier portal submission completed`,
      meta_json: { invite_id: inviteId, questionnaire_id: questionnaireId },
    });

    return { success: true, error: null };
  } catch (err: any) {
    console.error("submitPortalResponse unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred during submission." };
  }
};