-- Create qms_updates table
CREATE TABLE public.qms_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL, -- The ID of the QMS entity (SOP, CAPA, etc.)
  module_type TEXT NOT NULL, -- e.g., 'sop-register', 'capa', 'change-control'
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qms_updates ENABLE ROW LEVEL SECURITY;

-- Policies for qms_updates
CREATE POLICY "Authenticated users can view QMS updates" ON public.qms_updates
FOR SELECT TO authenticated USING (true); -- Public read for now, can be refined

CREATE POLICY "Authenticated users can insert QMS updates" ON public.qms_updates
FOR INSERT TO authenticated WITH CHECK (true); -- Allow any authenticated user to insert

-- Create qms_replies table
CREATE TABLE public.qms_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES public.qms_updates(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qms_replies ENABLE ROW LEVEL SECURITY;

-- Policies for qms_replies
CREATE POLICY "Authenticated users can view QMS replies" ON public.qms_replies
FOR SELECT TO authenticated USING (true); -- Public read for now

CREATE POLICY "Authenticated users can insert QMS replies" ON public.qms_replies
FOR INSERT TO authenticated WITH CHECK (true); -- Allow any authenticated user to insert