-- ============================================
-- salon_profiles テーブル（サロン基本情報）
-- ============================================
create table public.salon_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  salon_name text,
  salon_type text,
  target_customer text,
  menu text,
  commitment text,
  area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.salon_profiles enable row level security;

-- 本人のみ読み書き可能
create policy "本人のみ参照可能"
  on public.salon_profiles for select
  using (auth.uid() = user_id);

create policy "本人のみ更新可能"
  on public.salon_profiles for all
  using (auth.uid() = user_id);
