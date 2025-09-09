-- Ensure RLS is ON and policies exist for both reads and inserts.
-- First, drop any conflicting policies (ignore if they don't exist).
drop policy if exists "updates_read_all"   on public.task_updates;
drop policy if exists "updates_insert_all" on public.task_updates;
drop policy if exists "updates_read_auth"  on public.task_updates;
drop policy if exists "updates_insert_auth"on public.task_updates;

drop policy if exists "replies_read_all"   on public.task_replies;
drop policy if exists "replies_insert_all" on public.task_replies;

-- Turn RLS on (safe if already on)
alter table public.task_updates  enable row level security;
alter table public.task_replies  enable row level security;

-- ✅ Allow SELECT + INSERT for BOTH anon and authenticated users.
-- (If you require auth later, swap TRUE with auth.role() = 'authenticated')
create policy "task_updates_select_public" on public.task_updates
for select using (true);

create policy "task_updates_insert_public" on public.task_updates
for insert with check (true);

create policy "task_replies_select_public" on public.task_replies
for select using (true);

create policy "task_replies_insert_public" on public.task_replies
for insert with check (true);