-- Create Enums for Batch Disposition and Chain Event Types
CREATE TYPE public.disposition AS ENUM (
  'Pending',
  'Released',
  'Quarantined',
  'On Hold',
  'Rejected',
  'Recalled'
);

CREATE TYPE public.chain_event_type AS ENUM (
  'Manufactured',
  'Received',
  'QC Sampled',
  'QC Passed',
  'QC Failed',
  'Labeled',
  'Packed',
  'Shipped',
  'Return',
  'Destroyed'
);

-- Table: batches
CREATE TABLE public.batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_id UUID NOT NULL REFERENCES public.label_specs(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  lot_code TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  mfg_site TEXT,
  mfg_date DATE NOT NULL,
  expiry_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  uom TEXT NOT NULL DEFAULT 'units',
  disposition public.disposition NOT NULL DEFAULT 'Pending',
  owner UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to auth.users
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for batches table
CREATE UNIQUE INDEX batches_lot_code_spec_id_sku_idx ON public.batches (lot_code, spec_id, sku);
CREATE INDEX batches_disposition_idx ON public.batches (disposition);
CREATE INDEX batches_mfg_date_desc_idx ON public.batches (mfg_date DESC);
CREATE INDEX batches_expiry_date_idx ON public.batches (expiry_date);

-- Trigger to update last_updated column on batches table
CREATE TRIGGER set_last_updated_batches
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Table: batch_attributes
CREATE TABLE public.batch_attributes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX batch_attributes_batch_id_idx ON public.batch_attributes (batch_id);

-- Table: batch_tests
CREATE TABLE public.batch_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  analyte TEXT NOT NULL,
  method TEXT,
  result TEXT NOT NULL,
  unit TEXT,
  spec_min TEXT,
  spec_max TEXT,
  pass BOOLEAN NOT NULL DEFAULT FALSE,
  tested_on DATE,
  lab_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX batch_tests_batch_id_idx ON public.batch_tests (batch_id);

-- Table: coa_files
CREATE TABLE public.coa_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes INT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX coa_files_batch_id_idx ON public.coa_files (batch_id);

-- Table: shipments
CREATE TABLE public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  to_party TEXT NOT NULL,
  to_address TEXT,
  shipped_on DATE NOT NULL,
  qty NUMERIC NOT NULL,
  uom TEXT NOT NULL DEFAULT 'units',
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX shipments_batch_id_idx ON public.shipments (batch_id);

-- Table: chain_events
CREATE TABLE public.chain_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  type public.chain_event_type NOT NULL,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX chain_events_batch_id_idx ON public.chain_events (batch_id);

-- Enable RLS on all new tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coa_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batches
CREATE POLICY "Authenticated users can view batches" ON public.batches
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can insert their own batches" ON public.batches
FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner);

CREATE POLICY "Owners can update their own batches" ON public.batches
FOR UPDATE TO authenticated USING (auth.uid() = owner);

CREATE POLICY "Owners can delete their own batches" ON public.batches
FOR DELETE TO authenticated USING (auth.uid() = owner);

-- RLS Policy: QA role can update disposition
CREATE POLICY "QA role can update batch disposition" ON public.batches
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) -- Assuming is_admin() function for QA role check
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for child tables (batch_attributes, batch_tests, coa_files, shipments, chain_events)
-- General policy: authenticated users can select if they own the parent batch
CREATE POLICY "Authenticated users can view batch attributes" ON public.batch_attributes
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_attributes.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Owners can manage their batch attributes" ON public.batch_attributes
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_attributes.batch_id AND batches.owner = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_attributes.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Authenticated users can view batch tests" ON public.batch_tests
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_tests.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Owners can manage their batch tests" ON public.batch_tests
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_tests.batch_id AND batches.owner = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = batch_tests.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Authenticated users can view coa files" ON public.coa_files
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = coa_files.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Owners can manage their coa files" ON public.coa_files
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = coa_files.batch_id AND batches.owner = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = coa_files.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Authenticated users can view shipments" ON public.shipments
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = shipments.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Owners can manage their shipments" ON public.shipments
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = shipments.batch_id AND batches.owner = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = shipments.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Authenticated users can view chain events" ON public.chain_events
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = chain_events.batch_id AND batches.owner = auth.uid()));

CREATE POLICY "Owners can manage their chain events" ON public.chain_events
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = chain_events.batch_id AND batches.owner = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.batches WHERE batches.id = chain_events.batch_id AND batches.owner = auth.uid()));

-- Storage Bucket: coa
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('coa', 'coa', FALSE, ARRAY['application/pdf', 'image/*', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], 5242880) -- 5MB limit
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policy for 'coa' bucket
CREATE POLICY "Authenticated users can upload CoA files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'coa'
  AND auth.uid() IS NOT NULL
  AND (SELECT COUNT(*) FROM public.batches WHERE id = (regexp_match(name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.*$'))[1]::uuid AND owner = auth.uid()) = 1
  AND (storage.extension(name) = ANY (ARRAY['pdf', 'csv', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'webp', 'svg']))
  AND NOT (storage.mime_type(name) = ANY (ARRAY['audio/mpeg', 'video/mp4']))
  AND size <= 5242880 -- 5MB
);

CREATE POLICY "Authenticated users can read CoA files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'coa'
  AND auth.uid() IS NOT NULL
  AND (SELECT COUNT(*) FROM public.batches WHERE id = (regexp_match(name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.*$'))[1]::uuid AND owner = auth.uid()) = 1
);

-- Seed data (requires an existing label_spec.id)
-- You might need to replace 'your-existing-spec-id' with an actual ID from your label_specs table.
-- If no label_specs exist, this insert will fail.
INSERT INTO public.batches (spec_id, sku, lot_code, manufacturer, quantity, uom, disposition, owner, mfg_date)
SELECT id, 'SL-ASHWA-60', 'SL-ASHWA-60-001', 'Sattva Leaf Mfg', 10000, 'units', 'Pending', auth.uid(), '2024-01-01'
FROM public.label_specs
WHERE product_id = 'mock-product-id-123' -- Link to the mock product ID used in label specs
LIMIT 1
ON CONFLICT (lot_code, spec_id, sku) DO NOTHING;