-- Investidor Protagonista — Schema Supabase
-- Cole este arquivo em: Supabase Dashboard → SQL Editor → New query → Run
-- (O Supabase não importa schema via JSON; use este SQL.)

-- Extensões
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════
-- PROFILES (ligado ao Auth)
-- ═══════════════════════════════════════════
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  phone_number text,
  nickname text,
  avatar_url text,
  plan text not null default 'free',
  subscription_status text not null default 'trial', -- trial | active | canceled | expired
  subscription_expires_at timestamptz,
  trial_started_at timestamptz default now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  notification_channel text default 'app', -- app | whatsapp
  notification_time text default '08:00',
  whatsapp_session_state text default 'idle',
  -- Confirmado pelo link do nosso backend (SMTP próprio), não pelo e-mail do Supabase
  email_registrado boolean not null default false,
  -- Tipo de provedor: 'email' (login/senha) ou 'google' (Google Sign-In)
  provider_type text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria profile automaticamente no signup (trial de 1 ano)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    subscription_status,
    trial_started_at,
    subscription_expires_at,
    email_registrado,
    provider_type,
    phone_number,
    nickname
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'trial',
    now(),
    now() + interval '1 year',
    false,
    coalesce(new.raw_user_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nickname'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════
-- TRANSACTIONS
-- ═══════════════════════════════════════════
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  external_id text unique,
  title text,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null default 0,
  category text,
  description text,
  date timestamptz not null default now(),
  attachment_url text,
  is_recurring boolean not null default false,
  recurring_rule_id text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_date on public.transactions (date desc);

-- ═══════════════════════════════════════════
-- INVESTMENTS
-- ═══════════════════════════════════════════
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  external_id text unique,
  asset_name text,
  asset_class text,
  ticker text,
  quantity numeric(18, 6) not null default 0,
  average_price numeric(14, 4) not null default 0,
  current_price numeric(14, 4) not null default 0,
  total_invested numeric(14, 2) not null default 0,
  current_total numeric(14, 2) not null default 0,
  daily_change numeric(14, 4),
  daily_change_percent numeric(10, 4),
  total_profit numeric(14, 2),
  total_profit_percent numeric(10, 4),
  last_sync_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_investments_user_id on public.investments (user_id);
create index if not exists idx_investments_ticker on public.investments (ticker);

-- ═══════════════════════════════════════════
-- GOALS
-- ═══════════════════════════════════════════
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  target_amount numeric(14, 2) not null default 0,
  current_amount numeric(14, 2) not null default 0,
  deadline timestamptz,
  icon text,
  color text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_id on public.goals (user_id);

-- ═══════════════════════════════════════════
-- TASKS
-- ═══════════════════════════════════════════
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_completed boolean not null default false,
  linked_transaction_id uuid references public.transactions (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_id on public.tasks (user_id);

-- ═══════════════════════════════════════════
-- CARDS
-- ═══════════════════════════════════════════
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit', 'debit')),
  masked_number text,
  "limit" numeric(14, 2) not null default 0,
  available_limit numeric(14, 2) not null default 0,
  closing_day integer check (closing_day between 1 and 31),
  due_day integer check (due_day between 1 and 31),
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_user_id on public.cards (user_id);

-- ═══════════════════════════════════════════
-- SUBSCRIPTIONS (recorrências)
-- ═══════════════════════════════════════════
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null default 0,
  category text,
  description text,
  day_of_month integer not null check (day_of_month between 1 and 31),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  linked_card_id uuid references public.cards (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

-- ═══════════════════════════════════════════
-- SHARED ACCOUNTS
-- ═══════════════════════════════════════════
create table if not exists public.shared_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  partner_name text,
  partner_email text,
  partner_avatar_url text,
  owner_permission text not null default 'full',
  partner_permission text not null default 'full',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shared_accounts_owner on public.shared_accounts (owner_id);
create index if not exists idx_shared_accounts_partner on public.shared_accounts (partner_id);

-- ═══════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.cards enable row level security;
alter table public.subscriptions enable row level security;
alter table public.shared_accounts enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Helper: dono da linha
create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investments_all_own" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_all_own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cards_all_own" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_all_own" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shared_accounts_select" on public.shared_accounts
  for select using (auth.uid() = owner_id or auth.uid() = partner_id);

create policy "shared_accounts_insert_owner" on public.shared_accounts
  for insert with check (auth.uid() = owner_id);

create policy "shared_accounts_update_owner" on public.shared_accounts
  for update using (auth.uid() = owner_id);

-- service_role bypassa RLS automaticamente (use no backend)


-- Adicionar coluna role na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'padrao';

-- Confirmação de e-mail pelo backend (SMTP próprio)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_registrado boolean NOT NULL DEFAULT false;

-- Tipo de provedor: 'email' (login/senha) ou 'google' (Google Sign-In)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'email';

-- Atualizar funcao handle_new_user para incluir role + email_registrado + provider_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    subscription_status,
    trial_started_at,
    subscription_expires_at,
    role,
    email_registrado,
    provider_type
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'trial',
    NOW(),
    NOW() + interval '1 year',
    COALESCE(new.raw_user_meta_data->>'role', 'padrao'),
    false,
    COALESCE(new.raw_user_meta_data->>'provider', 'email')
  );
  RETURN new;
END;
$$;

-- ═══════════════════════════════════════════
-- SMS VERIFICATIONS
-- ═══════════════════════════════════════════
create table if not exists public.sms_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null,
  code text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_sms_verifications_email on public.sms_verifications (email);

-- ═══════════════════════════════════════════
-- POSTS (blog)
-- ═══════════════════════════════════════════
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  excerpt text not null,
  cover_image text not null,
  category text not null,
  author text,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_slug on public.posts (slug);

-- ═══════════════════════════════════════════
-- MARKET ASSETS (cotação diária — seção Ativos)
-- ═══════════════════════════════════════════
create table if not exists public.market_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  price numeric(18, 6) not null,
  change_percent numeric(10, 4) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_market_assets_active_sort
  on public.market_assets (is_active, sort_order asc, symbol asc);
