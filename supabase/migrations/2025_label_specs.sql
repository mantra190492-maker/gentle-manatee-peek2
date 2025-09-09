-- PRODUCTS (use or ignore if you already have products)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name_en text not null,
  name_fr text not null,
  npn text,
  dosage_form text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INGREDIENT LIBRARY (for defaults + rules)
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_fr text not null,
  nhpid_id text,
  default_claim_en text,
  default_claim_fr text,
  default_warning_en text,
  default_warning_fr text
);

-- LABEL SPECS (versioned header, one or more per product)
create table if not exists public.label_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft', -- draft|approved|retired
  created_by uuid,
  approved_by uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (product_id, version)
);

-- LABEL SPEC CONTENT (bilingual body for a specific version)
create table if not exists public.label_spec_content (
  id uuid primary key default gen_random_uuid(),
  spec_id uuid not null references public.label_specs(id) on delete cascade,

  -- snapshot of product names to freeze wording per version
  product_name_en text not null,
  product_name_fr text not null,
  dosage_form text,

  -- medicinal ingredients snapshot (JSON array of objects)
  medicinal jsonb not null default '[]', -- [{name_en,name_fr,part,extract_ratio,strength_mg,per_serving}]

  -- non-medicinal lists
  non_medicinal_en jsonb not null default '[]', -- string[]
  non_medicinal_fr jsonb not null default '[]', -- string[]

  -- claims & directions (bilingual)
  claim_en text not null,
  claim_fr text not null,
  directions_en text not null,
  directions_fr text not null,
  duration_en text,
  duration_fr text,

  -- risk / warnings (bilingual)
  warning_en text not null,
  warning_fr text not null,

  -- storage & company blocks (optional but commonly present)
  storage_en text,
  storage_fr text,
  company_en text,
  company_fr text
);

-- ACTIVITY (audit log)
create table if not exists public.label_spec_activity (
  id uuid primary key default gen_random_uuid(),
  spec_id uuid not null references public.label_specs(id) on delete cascade,
  field text not null,
  action text not null, -- create|update|approve|export
  old_value jsonb,
  new_value jsonb,
  actor uuid,
  created_at timestamptz not null default now()
);

-- EXPORT ARCHIVE (stored files + checksum)
create table if not exists public.label_spec_exports (
  id uuid primary key default gen_random_uuid(),
  spec_id uuid not null references public.label_specs(id) on delete cascade,
  format text not null, -- pdf|docx|json|csv
  url text not null,    -- storage path or signed URL
  checksum_sha256 text not null,
  created_at timestamptz not null default now()
);

-- INDEXES
create index if not exists idx_label_specs_product on public.label_specs(product_id);
create index if not exists idx_label_specs_status on public.label_specs(status);
create index if not exists idx_label_spec_exports_spec on public.label_spec_exports(spec_id);

-- RLS enablement (permissive baseline; tighten later)
alter table public.label_specs enable row level security;
alter table public.label_spec_content enable row level security;
alter table public.label_spec_activity enable row level security;
alter table public.label_spec_exports enable row level security;
alter table public.products enable row level security;
alter table public.ingredients enable row level security;

do $$
begin
  -- products
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_select_auth') then
    create policy products_select_auth on public.products for select to authenticated using (true);
    create policy products_ins_auth on public.products for insert to authenticated with check (true);
    create policy products_upd_auth on public.products for update to authenticated using (true) with check (true);
  end if;

  -- ingredients
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ingredients' and policyname='ingredients_select_auth') then
    create policy ingredients_select_auth on public.ingredients for select to authenticated using (true);
    create policy ingredients_ins_auth on public.ingredients for insert to authenticated with check (true);
    create policy ingredients_upd_auth on public.ingredients for update to authenticated using (true) with check (true);
  end if;

  -- label_specs
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='label_specs' and policyname='ls_select') then
    create policy ls_select on public.label_specs for select to authenticated using (true);
    create policy ls_ins on public.label_specs for insert to authenticated with check (true);
    create policy ls_upd on public.label_specs for update to authenticated using (true) with check (true);
  end if;

  -- label_spec_content
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='label_spec_content' and policyname='lsc_select') then
    create policy lsc_select on public.label_spec_content for select to authenticated using (true);
    create policy lsc_ins on public.label_spec_content for insert to authenticated with check (true);
    create policy lsc_upd on public.label_spec_content for update to authenticated using (true) with check (true);
  end if;

  -- label_spec_activity
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='label_spec_activity' and policyname='lsa_select') then
    create policy lsa_select on public.label_spec_activity for select to authenticated using (true);
    create policy lsa_ins on public.label_spec_activity for insert to authenticated with check (true);
  end if;

  -- label_spec_exports
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='label_spec_exports' and policyname='lse_select') then
    create policy lse_select on public.label_spec_exports for select to authenticated using (true);
    create policy lse_ins on public.label_spec_exports for insert to authenticated with check (true);
  end if;
end $$;