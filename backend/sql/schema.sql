-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan_tier text not null default 'basic' check (plan_tier in ('basic', 'pro', 'agency')),
  stripe_customer_id text unique,

  twitch_token text,
  twitch_refresh_token text,
  twitch_token_expires_at timestamptz,
  twitch_user_id text,
  twitch_user_login text,
  twitch_connected boolean not null default false,

  kick_token text,
  kick_channel_name text,
  kick_connected boolean not null default false,

  keyword_triggers text[] not null default '{}',
  chat_spike_threshold integer not null default 20,
  watermark_text text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clips (
  clip_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('twitch', 'kick')),
  stream_id text,
  stream_date timestamptz not null,
  duration integer,
  status text not null default 'processing',
  storage_path text,
  storage_url text,
  thumbnail_path text,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clips_user_created on public.clips (user_id, created_at desc);
create index if not exists idx_clips_user_stream on public.clips (user_id, stream_id);
create index if not exists idx_profiles_stripe_customer on public.profiles (stripe_customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_clips_updated on public.clips;
create trigger trg_clips_updated
before update on public.clips
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clips enable row level security;

create policy if not exists "Profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = user_id);

create policy if not exists "Profiles are writable by owner"
on public.profiles
for update
using (auth.uid() = user_id);

create policy if not exists "Profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy if not exists "Clips readable by owner"
on public.clips
for select
using (auth.uid() = user_id);

create policy if not exists "Clips writable by owner"
on public.clips
for update
using (auth.uid() = user_id);

create policy if not exists "Clips insertable by owner"
on public.clips
for insert
with check (auth.uid() = user_id);

create policy if not exists "Clips deletable by owner"
on public.clips
for delete
using (auth.uid() = user_id);

create or replace function public.get_expired_clips(retention_days integer)
returns setof public.clips
language sql
stable
as $$
  select *
  from public.clips
  where created_at < now() - make_interval(days => retention_days);
$$;

insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do nothing;

create policy if not exists "Public read clips bucket"
on storage.objects
for select
using (bucket_id = 'clips');

create policy if not exists "Authenticated upload clips bucket"
on storage.objects
for insert
with check (
  bucket_id = 'clips'
  and auth.role() = 'authenticated'
);

create policy if not exists "Authenticated delete clips bucket"
on storage.objects
for delete
using (
  bucket_id = 'clips'
  and auth.role() = 'authenticated'
);
