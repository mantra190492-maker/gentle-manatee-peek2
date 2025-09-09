-- ============ ENUMS ============
create type disposition as enum ('Pending','Released','Quarantined','On Hold','Rejected','Recalled');
create type chain_event_type as enum (
  'Manufactured','Received','QC Sampled','QC Passed','QC Failed',
  'Labeled','Packed','Shipped','Return','Destroyed'
);

-- ============ PARENT: BATCHES ============
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  lot_code text not null unique,
  sku text not null,
  manufacturer text not null,
  mfg_site text,
  mfg_date date not null,
  expiry_date date,
  quantity numeric not null default 0,
  uom text not null default 'units',
  disposition disposition not null default 'Pending',
  spec_id uuid references public.label_specs(id) on delete set null, -- Added FK to label_specs
  owner uuid references auth.users(id) on delete set null, -- Added FK to auth.users
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index batches_sku_idx on public.batches (sku);
create index batches_lot_code_idx on public.batches (lot_code);
create index batches_disposition_idx on public.batches (disposition);

-- trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_batches_updated_at on public.batches;
create trigger trg_batches_updated_at before update on public.batches
for each row execute function public.set_updated_at();

-- ============ CHILD: ATTRIBUTES (aka packaging/labeling extras) ============
create table public.batch_attributes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  key text not null, -- Renamed from 'name' to 'key' to avoid conflict with reserved words
  value text not null,
  created_at timestamptz not null default now()
);
create index batch_attributes_batch_id_idx on public.batch_attributes (batch_id);

-- ============ CHILD: TESTS ============
create table public.batch_tests (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  analyte text not null, -- Renamed from 'test_name' to 'analyte'
  method text,
  result text,
  unit text,
  spec_min text, -- Changed to text to match existing data/flexibility
  spec_max text, -- Changed to text to match existing data/flexibility
  pass boolean, -- Renamed from 'passed' to 'pass'
  tested_on date,
  lab_name text, -- Renamed from 'lab' to 'lab_name'
  created_at timestamptz not null default now()
);
create index batch_tests_batch_id_idx on public.batch_tests (batch_id);

-- ============ CHILD: COA FILES ============
create table public.coa_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  storage_path text not null,          -- storage object key (private bucket)
  file_name text not null, -- Renamed from 'filename' to 'file_name'
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index coa_files_batch_id_idx on public.coa_files (batch_id);

-- ============ CHILD: SHIPMENTS ============
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  to_party text not null,
  to_address text,
  shipped_on date not null,
  qty numeric not null,
  uom text not null default 'units',
  reference text,                  -- PO, tracking, etc.
  created_at timestamptz not null default now()
);
create index shipments_batch_id_idx on public.shipments (batch_id);

-- ============ CHILD: CHAIN EVENTS ============
create table public.chain_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  type chain_event_type not null,
  detail text,
  actor uuid references auth.users(id) on delete set null, -- Renamed from 'created_by' to 'actor'
  created_at timestamptz not null default now()
);
create index chain_events_batch_id_idx on public.chain_events (batch_id);
create index chain_events_type_idx on public.chain_events (type);

-- ============ RLS ============
alter table public.batches enable row level security;
alter table public.batch_attributes enable row level security;
alter table public.batch_tests enable row level security;
alter table public.coa_files enable row level security;
alter table public.shipments enable row level security;
alter table public.chain_events enable row level security;

-- Policies for batches
create policy "batches_read_authenticated" on public.batches
  for select to authenticated using (true);
create policy "batches_insert_authenticated" on public.batches
  for insert to authenticated with check (auth.uid() = owner);
create policy "batches_update_owner_or_admin" on public.batches
  for update to authenticated using (auth.uid() = owner OR is_admin()) with check (auth.uid() = owner OR is_admin());
create policy "batches_delete_owner_or_admin" on public.batches
  for delete to authenticated using (auth.uid() = owner OR is_admin());

-- Policies for batch_attributes
create policy "batch_attributes_read_authenticated" on public.batch_attributes
  for select to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_attributes.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_attributes_insert_owner_or_admin" on public.batch_attributes
  for insert to authenticated with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_attributes.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_attributes_update_owner_or_admin" on public.batch_attributes
  for update to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_attributes.batch_id AND (b.owner = auth.uid() OR is_admin()))) with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_attributes.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_attributes_delete_owner_or_admin" on public.batch_attributes
  for delete to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_attributes.batch_id AND (b.owner = auth.uid() OR is_admin())));

-- Policies for batch_tests
create policy "batch_tests_read_authenticated" on public.batch_tests
  for select to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_tests.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_tests_insert_owner_or_admin" on public.batch_tests
  for insert to authenticated with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_tests.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_tests_update_owner_or_admin" on public.batch_tests
  for update to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_tests.batch_id AND (b.owner = auth.uid() OR is_admin()))) with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_tests.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "batch_tests_delete_owner_or_admin" on public.batch_tests
  for delete to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_tests.batch_id AND (b.owner = auth.uid() OR is_admin())));

-- Policies for coa_files
create policy "coa_files_read_authenticated" on public.coa_files
  for select to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = coa_files.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "coa_files_insert_owner_or_admin" on public.coa_files
  for insert to authenticated with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = coa_files.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "coa_files_update_owner_or_admin" on public.coa_files
  for update to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = coa_files.batch_id AND (b.owner = auth.uid() OR is_admin()))) with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = coa_files.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "coa_files_delete_owner_or_admin" on public.coa_files
  for delete to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = coa_files.batch_id AND (b.owner = auth.uid() OR is_admin())));

-- Policies for shipments
create policy "shipments_read_authenticated" on public.shipments
  for select to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = shipments.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "shipments_insert_owner_or_admin" on public.shipments
  for insert to authenticated with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = shipments.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "shipments_update_owner_or_admin" on public.shipments
  for update to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = shipments.batch_id AND (b.owner = auth.uid() OR is_admin()))) with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = shipments.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "shipments_delete_owner_or_admin" on public.shipments
  for delete to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = shipments.batch_id AND (b.owner = auth.uid() OR is_admin())));

-- Policies for chain_events
create policy "chain_events_read_authenticated" on public.chain_events
  for select to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = chain_events.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "chain_events_insert_owner_or_admin" on public.chain_events
  for insert to authenticated with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = chain_events.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "chain_events_update_owner_or_admin" on public.chain_events
  for update to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = chain_events.batch_id AND (b.owner = auth.uid() OR is_admin()))) with check (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = chain_events.batch_id AND (b.owner = auth.uid() OR is_admin())));
create policy "chain_events_delete_owner_or_admin" on public.chain_events
  for delete to authenticated using (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = chain_events.batch_id AND (b.owner = auth.uid() OR is_admin())));

-- ============ OPTIONAL: seed one batch to test ============
insert into public.batches (lot_code, sku, manufacturer, mfg_site, mfg_date, expiry_date, quantity, uom, owner)
values ('TEST-LOT-001','SKU-100','Demo Labs','Toronto','2025-08-01','2027-08-01',1000,'units', (SELECT id from auth.users limit 1))
on conflict do nothing;

-- ============ OPTIONAL: force PostgREST to reload schema cache ============
notify pgrst, 'reload schema';