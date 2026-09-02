-- Step 3: Bank API integration (Mono)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query

-- Table to store connected bank accounts per user
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mono_account_id text not null unique,
  institution_name text,
  account_number text,
  account_type text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;

create policy "Users can view their own bank accounts"
  on public.bank_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank accounts"
  on public.bank_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bank accounts"
  on public.bank_accounts for delete
  using (auth.uid() = user_id);

-- Extend transactions to track where each row came from
alter table public.transactions
  add column if not exists source text not null default 'manual' check (source in ('manual', 'mono')),
  add column if not exists external_id text,
  add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete cascade;

-- Prevent the same bank transaction from being synced twice
create unique index if not exists transactions_external_id_unique
  on public.transactions (external_id)
  where external_id is not null;
