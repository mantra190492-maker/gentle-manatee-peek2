-- supabase/migrations/0027_create_label_spec_tables_and_add_traceability_qa_fields.sql

-- Create the label_specs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.label_specs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'retired'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  -- New QA approval fields
  qa_approved_flag BOOLEAN DEFAULT FALSE,
  qa_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qa_approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (product_id, version)
);

-- Enable RLS on label_specs (REQUIRED)
ALTER TABLE public.label_specs ENABLE ROW LEVEL SECURITY;

-- Policies for label_specs
-- Allow authenticated users to read all specs
CREATE POLICY "label_specs_select_all" ON public.label_specs
FOR SELECT TO authenticated USING (true);
-- Allow authenticated users to create new draft specs
CREATE POLICY "label_specs_insert_owner" ON public.label_specs
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
-- Allow creator to update their own draft specs
CREATE POLICY "label_specs_update_owner_draft" ON public.label_specs
FOR UPDATE TO authenticated USING (created_by = auth.uid() AND status = 'draft')
WITH CHECK (created_by = auth.uid() AND status = 'draft');
-- Allow admins to update any spec (e.g., approve, retire)
CREATE POLICY "label_specs_admin_update" ON public.label_specs
FOR UPDATE TO authenticated USING (public.is_admin());
-- Allow admins to delete any spec
CREATE POLICY "label_specs_admin_delete" ON public.label_specs
FOR DELETE TO authenticated USING (public.is_admin());
-- Allow authenticated users to update qa_approved_flag, qa_approved_by, qa_approved_at if they are an admin
CREATE POLICY "label_specs_qa_approve_admin" ON public.label_specs
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- Create the label_spec_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.label_spec_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_id UUID NOT NULL REFERENCES public.label_specs(id) ON DELETE CASCADE,
  product_name_en TEXT NOT NULL,
  product_name_fr TEXT NOT NULL,
  dosage_form TEXT,
  medicinal JSONB NOT NULL,
  non_medicinal_en TEXT,
  non_medicinal_fr TEXT,
  claim_en TEXT NOT NULL,
  claim_fr TEXT NOT NULL,
  directions_en TEXT NOT NULL,
  directions_fr TEXT NOT NULL,
  duration_en TEXT,
  duration_fr TEXT,
  warning_en TEXT NOT NULL,
  warning_fr TEXT NOT NULL,
  storage_en TEXT,
  storage_fr TEXT,
  company_en TEXT,
  company_fr TEXT,
  risk_flags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to label_spec_content for traceability and CoA if they don't exist
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS batch_date DATE;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS shelf_life_months INTEGER DEFAULT 24;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS coa_file_path TEXT;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS coa_file_name TEXT;
ALTER TABLE public.label_spec_content ADD COLUMN IF NOT EXISTS override_lot_expiry_flag BOOLEAN DEFAULT FALSE;

-- Enable RLS on label_spec_content (REQUIRED)
ALTER TABLE public.label_spec_content ENABLE ROW LEVEL SECURITY;

-- Policies for label_spec_content
-- Allow authenticated users to read content for specs they can access (e.g., created by them or approved)
CREATE POLICY "label_spec_content_select" ON public.label_spec_content
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.label_specs ls WHERE ls.id = label_spec_content.spec_id AND (ls.created_by = auth.uid() OR ls.status = 'approved'))
);
-- Allow creator to insert/update their own draft spec content
CREATE POLICY "label_spec_content_insert_update_owner" ON public.label_spec_content
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.label_specs ls WHERE ls.id = label_spec_content.spec_id AND ls.created_by = auth.uid() AND ls.status = 'draft')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.label_specs ls WHERE ls.id = label_spec_content.spec_id AND ls.created_by = auth.uid() AND ls.status = 'draft')
);
-- Admins can manage all content
CREATE POLICY "label_spec_content_admin_all" ON public.label_spec_content
FOR ALL TO authenticated USING (public.is_admin());


-- Create label_spec_activity table for audit logging if it doesn't exist
CREATE TABLE IF NOT EXISTS public.label_spec_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_id UUID NOT NULL REFERENCES public.label_specs(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'update', 'create', 'approve'
  old_value JSONB,
  new_value JSONB,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on label_spec_activity (REQUIRED)
ALTER TABLE public.label_spec_activity ENABLE ROW LEVEL SECURITY;

-- Policies for label_spec_activity
-- Users can view activity for specs they can access
CREATE POLICY "label_spec_activity_select" ON public.label_spec_activity
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.label_specs ls WHERE ls.id = label_spec_activity.spec_id AND (ls.created_by = auth.uid() OR ls.status = 'approved'))
);
-- Only authenticated users can insert activity (via service functions)
CREATE POLICY "label_spec_activity_insert" ON public.label_spec_activity
FOR INSERT TO authenticated WITH CHECK (true);
-- Admins can manage all activity
CREATE POLICY "label_spec_activity_admin_all" ON public.label_spec_activity
FOR ALL TO authenticated USING (public.is_admin());

-- Create a storage bucket for CoA files
INSERT INTO storage.buckets (id, name, public)
VALUES ('label-coas', 'label-coas', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the 'label-coas' storage bucket
-- Allow authenticated users to upload files to their specs
CREATE POLICY "Allow authenticated uploads for label-coas" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'label-coas');
-- Allow authenticated users to view/download files for specs they can access
CREATE POLICY "Allow authenticated reads for label-coas" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'label-coas' AND
  EXISTS (
    SELECT 1 FROM public.label_spec_content lsc
    JOIN public.label_specs ls ON lsc.spec_id = ls.id
    WHERE lsc.coa_file_path = name AND (ls.created_by = auth.uid() OR ls.status = 'approved')
  )
);
-- Allow authenticated users to update/delete their own uploaded CoA files (if spec is draft)
CREATE POLICY "Allow authenticated updates/deletes for label-coas" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'label-coas' AND
  EXISTS (
    SELECT 1 FROM public.label_spec_content lsc
    JOIN public.label_specs ls ON lsc.spec_id = ls.id
    WHERE lsc.coa_file_path = name AND ls.created_by = auth.uid() AND ls.status = 'draft'
  )
);

-- Trigger to update `updated_at` column for `label_spec_content`
CREATE TRIGGER update_label_spec_content_updated_at
BEFORE UPDATE ON public.label_spec_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update `updated_at` column for `label_specs`
CREATE TRIGGER update_label_specs_updated_at
BEFORE UPDATE ON public.label_specs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();