-- Create stability_studies table
CREATE TABLE public.stability_studies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL DEFAULT '',
  batch_no TEXT NOT NULL DEFAULT '',
  chamber TEXT DEFAULT '',
  storage_condition TEXT DEFAULT '',
  start_date DATE,
  duration_days INT DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- 'Draft', 'Active', 'Closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stability_studies
ALTER TABLE public.stability_studies ENABLE ROW LEVEL SECURITY;

-- Policies for stability_studies (assuming authenticated users can manage their own studies)
CREATE POLICY "Authenticated users can view stability studies" ON public.stability_studies
FOR SELECT TO authenticated USING (true); -- For now, allow all authenticated users to view

CREATE POLICY "Authenticated users can create stability studies" ON public.stability_studies
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stability studies" ON public.stability_studies
FOR UPDATE TO authenticated USING (true); -- For now, allow all authenticated users to update

CREATE POLICY "Authenticated users can delete stability studies" ON public.stability_studies
FOR DELETE TO authenticated USING (true); -- For now, allow all authenticated users to delete

-- Create stability_protocols table
CREATE TABLE public.stability_protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_id UUID NOT NULL REFERENCES public.stability_studies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Protocol',
  description TEXT DEFAULT '',
  version INT DEFAULT 1,
  tests JSONB NOT NULL DEFAULT '[]', -- e.g., ["Appearance","Assay","Moisture"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stability_protocols
ALTER TABLE public.stability_protocols ENABLE ROW LEVEL SECURITY;

-- Policies for stability_protocols
CREATE POLICY "Authenticated users can view stability protocols" ON public.stability_protocols
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create stability protocols" ON public.stability_protocols
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stability protocols" ON public.stability_protocols
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stability protocols" ON public.stability_protocols
FOR DELETE TO authenticated USING (true);

-- Create stability_timepoints table
CREATE TABLE public.stability_timepoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_id UUID NOT NULL REFERENCES public.stability_studies(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES public.stability_protocols(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  planned_date DATE,
  tests JSONB NOT NULL DEFAULT '[]', -- tests at this pull (overrides protocol default if set)
  status TEXT DEFAULT 'Planned', -- Planned, Completed, Missed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stability_timepoints
ALTER TABLE public.stability_timepoints ENABLE ROW LEVEL SECURITY;

-- Policies for stability_timepoints
CREATE POLICY "Authenticated users can view stability timepoints" ON public.stability_timepoints
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create stability timepoints" ON public.stability_timepoints
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stability timepoints" ON public.stability_timepoints
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stability timepoints" ON public.stability_timepoints
FOR DELETE TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stability_timepoints_study ON public.stability_timepoints(study_id);
CREATE INDEX IF NOT EXISTS idx_stability_timepoints_protocol ON public.stability_timepoints(protocol_id);

-- Add triggers for updated_at columns
CREATE TRIGGER set_stability_studies_updated_at
BEFORE UPDATE ON public.stability_studies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_stability_protocols_updated_at
BEFORE UPDATE ON public.stability_protocols
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_stability_timepoints_updated_at
BEFORE UPDATE ON public.stability_timepoints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();