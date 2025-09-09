// src/types/batches/types.ts
import type { Database } from "@/lib/db/schema";

export type Disposition = Database['public']['Enums']['disposition'];
export type ChainEventType = Database['public']['Enums']['chain_event_type'];

export type Batch = Database['public']['Tables']['batches']['Row'];
export type NewBatch = Database['public']['Tables']['batches']['Insert'];
export type UpdateBatch = Database['public']['Tables']['batches']['Update'];

export type BatchAttribute = Database['public']['Tables']['batch_attributes']['Row'];
export type NewBatchAttribute = Database['public']['Tables']['batch_attributes']['Insert'];
export type UpdateBatchAttribute = Database['public']['Tables']['batch_attributes']['Update'];

export type BatchTest = Database['public']['Tables']['batch_tests']['Row'];
export type NewBatchTest = Database['public']['Tables']['batch_tests']['Insert'];
export type UpdateBatchTest = Database['public']['Tables']['batch_tests']['Update'];

export type CoAFile = Database['public']['Tables']['coa_files']['Row'];
export type NewCoAFile = Database['public']['Tables']['coa_files']['Insert'];
export type UpdateCoAFile = Database['public']['Tables']['coa_files']['Update'];

export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type NewShipment = Database['public']['Tables']['shipments']['Insert'];
export type UpdateShipment = Database['public']['Tables']['shipments']['Update'];

export type ChainEvent = Database['public']['Tables']['chain_events']['Row'];
export type NewChainEvent = Database['public']['Tables']['chain_events']['Insert'];
export type UpdateChainEvent = Database['public']['Tables']['chain_events']['Update'];