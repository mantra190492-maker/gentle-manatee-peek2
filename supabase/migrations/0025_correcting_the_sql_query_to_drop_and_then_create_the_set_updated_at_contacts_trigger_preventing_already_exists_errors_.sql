-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_name on public.contacts using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(email,'')));

-- Add optional contact link to CRM tasks
alter table if exists public.crm_tasks
  add column if not exists contact_id uuid null references public.contacts(id) on delete set null;

-- Add optional contact link to complaints
alter table if exists public.complaints
  add column if not exists crm_contact_id uuid null references public.contacts(id) on delete set null;

-- RLS (simple permissive for authenticated users; tighten later)
alter table public.contacts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_select_auth') then
    create policy contacts_select_auth on public.contacts for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_ins_auth') then
    create policy contacts_ins_auth on public.contacts for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contacts' and policyname='contacts_upd_auth') then
    create policy contacts_upd_auth on public.contacts for update to authenticated using (true) with check (true);
  end if;
end $$;

-- Drop the trigger if it already exists before creating it
DROP TRIGGER IF EXISTS set_updated_at_contacts ON public.contacts;
CREATE TRIGGER set_updated_at_contacts
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();