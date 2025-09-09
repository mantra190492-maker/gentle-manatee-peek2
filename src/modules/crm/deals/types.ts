import type { Database } from "@/lib/db/schema";
import type { Contact } from "@/modules/crm/contacts/api";

export type DealStage = Database['public']['Enums']['deal_stage'];

export type Deal = Database['public']['Tables']['deals']['Row'];
export type NewDeal = Database['public']['Tables']['deals']['Insert'];
export type UpdateDeal = Database['public']['Tables']['deals']['Update'];

export interface DealWithContact extends Deal {
  contacts: Contact | null;
}