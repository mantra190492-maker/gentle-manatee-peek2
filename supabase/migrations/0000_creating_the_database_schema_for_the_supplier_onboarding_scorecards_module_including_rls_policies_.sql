-- Create doc_types enum
CREATE TYPE doc_type AS ENUM (
  'GMP_CERT',
  'INSURANCE_COI',
  'QA_QUESTIONNAIRE',
  'RECALL_SOP',
  'ALLERGEN_STATEMENT',
  'HACCP_PCP',
  'HEAVY_METALS_POLICY',
  'TRACEABILITY_SOP',
  'STABILITY_POLICY',
  'COA_SAMPLE',
  'TAX_W8_W9',
  'BANKING_INFO'
);

-- Create supplier_status enum
CREATE TYPE supplier_status AS ENUM (
  'Pending Invite',
  'Invited',
  'Drafting',
  'Submitted',
  'Under Review',
  'Approved',
  'Conditional',
  'Rejected',
  'Inactive'
);

-- Create approval_decision enum
CREATE TYPE approval_decision AS ENUM (
  'approved',
  'conditional',
  'rejected'
);

-- Create supplier_type enum
CREATE TYPE supplier_type AS ENUM (
  'manufacturer',
  'packer',
  'lab',
  'broker',
  '3PL'
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legal_name TEXT NOT NULL,
  dba TEXT,
  type supplier_type NOT NULL,
  bn TEXT, -- Business Number
  country TEXT,
  status supplier_status DEFAULT 'Pending Invite' NOT NULL,
  risk_score INTEGER DEFAULT 0 NOT NULL,
  po_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
FOR SELECT TO authenticated USING (true); -- Adjust based on role-based access later

CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their own suppliers" ON public.suppliers
FOR UPDATE TO authenticated USING (auth.uid() = created_by); -- More granular policies for roles will be added

CREATE POLICY "Admins can update all suppliers" ON public.suppliers
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

-- Create supplier_sites table
CREATE TABLE public.supplier_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  role TEXT, -- e.g., 'main', 'manufacturing', 'warehouse'
  address TEXT NOT NULL,
  city TEXT,
  region TEXT,
  country TEXT,
  gmp_status TEXT, -- e.g., 'Certified', 'Pending', 'Not Applicable'
  last_audit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.supplier_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier sites" ON public.supplier_sites
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_sites.supplier_id AND (true))); -- Adjust based on supplier access

CREATE POLICY "Authenticated users can manage their supplier sites" ON public.supplier_sites
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_sites.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create supplier_contacts table
CREATE TABLE public.supplier_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- e.g., 'Primary', 'QA', 'Sales'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier contacts" ON public.supplier_contacts
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_contacts.supplier_id AND (true)));

CREATE POLICY "Authenticated users can manage their supplier contacts" ON public.supplier_contacts
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_contacts.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create documents table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.supplier_sites(id) ON DELETE SET NULL,
  type doc_type NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_hash TEXT, -- SHA-256 hash of the file
  issued_on DATE,
  expires_on DATE,
  status TEXT DEFAULT 'Pending Review' NOT NULL, -- e.g., 'Pending Review', 'Valid', 'Expiring', 'Expired', 'Rejected'
  version TEXT DEFAULT '1.0' NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents" ON public.documents
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = documents.supplier_id AND (true)));

CREATE POLICY "Authenticated users can upload documents" ON public.documents
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = documents.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can update their documents" ON public.documents
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = documents.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create questionnaires table
CREATE TABLE public.questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  locale TEXT DEFAULT 'en' NOT NULL,
  json_schema JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for questionnaires" ON public.questionnaires
FOR SELECT USING (true);

CREATE POLICY "Admins can manage questionnaires" ON public.questionnaires
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));


-- Create responses table
CREATE TABLE public.responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  json JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view responses" ON public.responses
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = responses.supplier_id AND (true)));

CREATE POLICY "Authenticated users can submit responses" ON public.responses
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = responses.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can update their responses" ON public.responses
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = responses.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create approvals table
CREATE TABLE public.approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL, -- e.g., 'Initial Review', 'QA Approval', 'Final Approval'
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision approval_decision,
  comment TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  esign_name TEXT,
  esign_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvals" ON public.approvals
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = approvals.supplier_id AND (true)));

CREATE POLICY "Authenticated users can create approvals" ON public.approvals
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = approvals.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can update approvals" ON public.approvals
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = approvals.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create changes table
CREATE TABLE public.changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  linked_capa_id UUID, -- Placeholder for linking to CAPA module
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view changes" ON public.changes
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = changes.supplier_id AND (true)));

CREATE POLICY "Authenticated users can create changes" ON public.changes
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = changes.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can update changes" ON public.changes
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = changes.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create scorecards table
CREATE TABLE public.scorecards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  kpis_json JSONB,
  score NUMERIC(5, 2) NOT NULL,
  grade TEXT NOT NULL, -- e.g., 'A', 'B', 'C', 'D'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scorecards" ON public.scorecards
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = scorecards.supplier_id AND (true)));

CREATE POLICY "Admins can manage scorecards" ON public.scorecards
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));


-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Open' NOT NULL, -- e.g., 'Open', 'In Progress', 'Completed'
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON public.tasks
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = tasks.supplier_id AND (true)));

CREATE POLICY "Authenticated users can create tasks" ON public.tasks
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = tasks.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can update tasks" ON public.tasks
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = tasks.supplier_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))));


-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, -- Can be null for global activities
  action TEXT NOT NULL,
  meta_json JSONB,
  at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activity logs" ON public.activity_log
FOR SELECT TO authenticated USING (true); -- Admins can view all, others can view relevant to their suppliers

CREATE POLICY "Admins can insert activity logs" ON public.activity_log
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

-- Add triggers for updated_at columns
CREATE TRIGGER handle_updated_at_suppliers BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_supplier_sites BEFORE UPDATE ON public.supplier_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_supplier_contacts BEFORE UPDATE ON public.supplier_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_responses BEFORE UPDATE ON public.responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_changes BEFORE UPDATE ON public.changes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();