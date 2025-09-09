-- Add missing columns to the 'suppliers' table if they don't exist
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS po_blocked BOOLEAN DEFAULT TRUE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS risk_score NUMERIC DEFAULT 0;

-- Create the 'invites' table
CREATE TABLE public.invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  required_docs JSONB DEFAULT '[]'::jsonb,
  language TEXT DEFAULT 'en' NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for 'invites' table (REQUIRED)
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Policies for 'invites' table
-- Admins can manage all invites
CREATE POLICY "Admins can manage invites" ON public.invites
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Suppliers can view their own invite (via token, handled in application logic)
CREATE POLICY "Suppliers can view their own invite" ON public.invites
FOR SELECT USING (true); -- Token verification will happen in application logic, not directly via RLS for this public-facing table.

-- Only authenticated users (admins or creators) can insert invites
CREATE POLICY "Authenticated users can insert invites" ON public.invites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- Only authenticated users (admins or creators) can update invites
CREATE POLICY "Authenticated users can update invites" ON public.invites
FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- Only authenticated users (admins or creators) can delete invites
CREATE POLICY "Authenticated users can delete invites" ON public.invites
FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- Update RLS policies for 'suppliers' table to include 'created_by'
-- Existing policies:
-- Authenticated users can view suppliers (true)
-- Authenticated users can create suppliers (null)
-- Authenticated users can update their own suppliers (auth.uid() = created_by)
-- Admins can update all suppliers (is_admin())

-- Ensure 'created_by' is set on insert for suppliers
CREATE OR REPLACE FUNCTION public.set_supplier_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_supplier_insert_set_created_by ON public.suppliers;
CREATE TRIGGER on_supplier_insert_set_created_by
BEFORE INSERT ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.set_supplier_created_by();

-- Add a trigger to update 'updated_at' for the 'invites' table
CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed required document types (example, this would typically be managed in application logic or a separate config table)
-- For now, we'll assume the application logic handles the 'required_docs' JSONB based on supplier type.