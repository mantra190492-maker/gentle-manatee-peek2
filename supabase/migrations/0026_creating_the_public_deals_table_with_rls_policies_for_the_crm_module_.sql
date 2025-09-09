-- Deals
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage text not null default 'New',        -- New, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
  amount numeric(12,2) not null default 0,  -- in CAD by default (you can add currency if needed)
  close_date date,
  contact_id uuid null references public.contacts(id) on delete set null,
  owner uuid null,                          -- user id (optional)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_stage on public.deals(stage);
create index if not exists idx_deals_close_date on public.deals(close_date desc);

-- Simple RLS for now (tighten later)
alter table public.deals enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname='deals_select_auth') then
    create policy deals_select_auth on public.deals for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='deals_ins_auth') then
    create policy deals_ins_auth on public.deals for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname='deals_upd_auth') then
    create policy deals_upd_auth on public.deals for update to authenticated using (true) with check (true);
  end if;
end $$;

-- Trigger to update 'updated_at' timestamp on changes
CREATE TRIGGER set_updated_at_deals
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();