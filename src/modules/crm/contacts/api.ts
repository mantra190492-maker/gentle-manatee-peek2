import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/lib/db/schema"; // Import Database type

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type NewContact = Database['public']['Tables']['contacts']['Insert'];
export type UpdateContact = Database['public']['Tables']['contacts']['Update'];

export async function listContacts(q?: string): Promise<Contact[]> {
  let query = supabase.from("contacts").select("*").order("created_at", { ascending: false });
  if (q?.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data, error } = await query;
  if (error) {
    console.error("Error listing contacts:", error);
    throw error;
  }
  return data || [];
}

export async function getContact(id: string): Promise<Contact | null> {
  const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
  if (error) {
    console.error("Error getting contact:", error);
    return null;
  }
  return data;
}

export async function upsertContact(body: NewContact | UpdateContact): Promise<Contact> {
  const { data, error } = await supabase.from("contacts").upsert(body).select().single();
  if (error) {
    console.error("Error upserting contact:", error);
    throw error;
  }
  return data!;
}