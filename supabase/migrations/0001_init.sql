-- TimePassed backend schema: Pro entitlements + per-user cloud backup storage.
-- Run via the Supabase SQL editor or `supabase db push`.

-- ── profiles: one row per user, holds Pro entitlement ──────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  is_pro     boolean     not null default false,
  plan       text,
  pro_since  timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may READ and INSERT their own profile, but NOT update it
-- (is_pro is only ever set server-side by the verify edge function via the
-- service-role key — so a user can never grant themselves Pro).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── backups bucket: each user can only touch files under their own uid/ ─────
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

drop policy if exists "backups_own_objects" on storage.objects;
create policy "backups_own_objects" on storage.objects
  for all
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
