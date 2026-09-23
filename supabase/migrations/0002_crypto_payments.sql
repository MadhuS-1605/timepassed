-- USDC-on-Base payment requests. Each row reserves a unique amount (base price
-- + a few extra micro-cents) so the watcher can match an on-chain transfer to a
-- user without a memo field. Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.crypto_payment_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  plan         text not null,
  amount_usdc  numeric(12, 6) not null,
  status       text not null default 'pending', -- 'pending' | 'confirmed' | 'expired'
  tx_hash      text,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);

-- Only one pending request may claim a given amount at a time, so the watcher's
-- amount-based match is unambiguous.
create unique index if not exists crypto_payment_requests_pending_amount
  on public.crypto_payment_requests (amount_usdc)
  where status = 'pending';

alter table public.crypto_payment_requests enable row level security;

-- Users may create and view their own requests, but never confirm one
-- (status flips only via the watcher edge function using the service-role key).
drop policy if exists "crypto_requests_select_own" on public.crypto_payment_requests;
create policy "crypto_requests_select_own" on public.crypto_payment_requests
  for select using (auth.uid() = user_id);

drop policy if exists "crypto_requests_insert_own" on public.crypto_payment_requests;
create policy "crypto_requests_insert_own" on public.crypto_payment_requests
  for insert with check (auth.uid() = user_id);
