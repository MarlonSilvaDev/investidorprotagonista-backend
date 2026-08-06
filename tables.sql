-- =============================================================================
-- Investidor Protagonista — Schema consolidado (tables.sql)
-- Rodar no SQL Editor do Supabase (Dashboard → SQL Editor → New query → Run).
-- Idempotente: seguro reexecutar (CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
-- DROP POLICY IF EXISTS + CREATE / CREATE OR REPLACE FUNCTION).
-- Depende de auth.users (Supabase Auth).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PROFILES (ligado ao Auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text,
  email text,
  cpf text,
  phone_number text,
  nickname text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  subscription_status text NOT NULL DEFAULT 'trial', -- trial | active | canceled | expired
  subscription_expires_at timestamptz,
  trial_started_at timestamptz DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  notification_channel text DEFAULT 'app', -- app | whatsapp
  notification_time text DEFAULT '08:00',
  whatsapp_session_state text DEFAULT 'idle',
  email_registrado boolean NOT NULL DEFAULT false,
  provider_type text NOT NULL DEFAULT 'email', -- email | google
  role text NOT NULL DEFAULT 'padrao',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS notification_channel text,
  ADD COLUMN IF NOT EXISTS notification_time text,
  ADD COLUMN IF NOT EXISTS whatsapp_session_state text,
  ADD COLUMN IF NOT EXISTS email_registrado boolean,
  ADD COLUMN IF NOT EXISTS provider_type text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'free',
  ALTER COLUMN subscription_status SET DEFAULT 'trial',
  ALTER COLUMN trial_started_at SET DEFAULT now(),
  ALTER COLUMN notification_channel SET DEFAULT 'app',
  ALTER COLUMN notification_time SET DEFAULT '08:00',
  ALTER COLUMN whatsapp_session_state SET DEFAULT 'idle',
  ALTER COLUMN email_registrado SET DEFAULT false,
  ALTER COLUMN provider_type SET DEFAULT 'email',
  ALTER COLUMN role SET DEFAULT 'padrao',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

COMMENT ON COLUMN public.profiles.cpf IS
  'CPF normalizado (11 dígitos). Identificador único da conta.';
COMMENT ON COLUMN public.profiles.email_registrado IS
  'true quando o usuário confirmou o e-mail pelo link enviado pelo backend.';
COMMENT ON COLUMN public.profiles.provider_type IS
  'Tipo de provedor: "email" (login/senha) ou "google". Contas google não usam recuperação de senha.';
COMMENT ON COLUMN public.profiles.nickname IS
  'Nickname do usuário para exibição no app.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_unique
  ON public.profiles (cpf)
  WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_provider_type ON public.profiles (provider_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email_registrado
  ON public.profiles (email_registrado)
  WHERE email_registrado = false;

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  external_id text UNIQUE,
  title text,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  category text,
  description text,
  date timestamptz NOT NULL DEFAULT now(),
  attachment_url text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_rule_id text,
  is_shared boolean NOT NULL DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS amount numeric(14, 2),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS date timestamptz,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS is_recurring boolean,
  ADD COLUMN IF NOT EXISTS recurring_rule_id text,
  ADD COLUMN IF NOT EXISTS is_shared boolean,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions (deleted_at);

-- =============================================================================
-- INVESTMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  external_id text UNIQUE,
  asset_name text,
  asset_class text,
  ticker text,
  quantity numeric(18, 6) NOT NULL DEFAULT 0,
  average_price numeric(14, 4) NOT NULL DEFAULT 0,
  current_price numeric(14, 4) NOT NULL DEFAULT 0,
  total_invested numeric(14, 2) NOT NULL DEFAULT 0,
  current_total numeric(14, 2) NOT NULL DEFAULT 0,
  daily_change numeric(14, 4),
  daily_change_percent numeric(10, 4),
  total_profit numeric(14, 2),
  total_profit_percent numeric(10, 4),
  last_sync_date timestamptz,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS asset_name text,
  ADD COLUMN IF NOT EXISTS asset_class text,
  ADD COLUMN IF NOT EXISTS ticker text,
  ADD COLUMN IF NOT EXISTS quantity numeric(18, 6),
  ADD COLUMN IF NOT EXISTS average_price numeric(14, 4),
  ADD COLUMN IF NOT EXISTS current_price numeric(14, 4),
  ADD COLUMN IF NOT EXISTS total_invested numeric(14, 2),
  ADD COLUMN IF NOT EXISTS current_total numeric(14, 2),
  ADD COLUMN IF NOT EXISTS daily_change numeric(14, 4),
  ADD COLUMN IF NOT EXISTS daily_change_percent numeric(10, 4),
  ADD COLUMN IF NOT EXISTS total_profit numeric(14, 2),
  ADD COLUMN IF NOT EXISTS total_profit_percent numeric(10, 4),
  ADD COLUMN IF NOT EXISTS last_sync_date timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments (user_id);
CREATE INDEX IF NOT EXISTS idx_investments_ticker ON public.investments (ticker);
CREATE INDEX IF NOT EXISTS idx_investments_deleted_at ON public.investments (deleted_at);

-- =============================================================================
-- GOALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_amount numeric(14, 2) NOT NULL DEFAULT 0,
  current_amount numeric(14, 2) NOT NULL DEFAULT 0,
  deadline timestamptz,
  icon text,
  color text,
  is_shared boolean NOT NULL DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS target_amount numeric(14, 2),
  ADD COLUMN IF NOT EXISTS current_amount numeric(14, 2),
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS is_shared boolean,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON public.goals (deleted_at);

-- =============================================================================
-- TASKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed boolean NOT NULL DEFAULT false,
  linked_transaction_id uuid REFERENCES public.transactions (id) ON DELETE SET NULL,
  completed_at timestamptz,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS is_completed boolean,
  ADD COLUMN IF NOT EXISTS linked_transaction_id uuid,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks (deleted_at);

-- =============================================================================
-- CARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  masked_number text,
  "limit" numeric(14, 2) NOT NULL DEFAULT 0,
  available_limit numeric(14, 2) NOT NULL DEFAULT 0,
  closing_day integer CHECK (closing_day BETWEEN 1 AND 31),
  due_day integer CHECK (due_day BETWEEN 1 AND 31),
  color text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS masked_number text,
  ADD COLUMN IF NOT EXISTS "limit" numeric(14, 2),
  ADD COLUMN IF NOT EXISTS available_limit numeric(14, 2),
  ADD COLUMN IF NOT EXISTS closing_day integer,
  ADD COLUMN IF NOT EXISTS due_day integer,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON public.cards (deleted_at);

-- =============================================================================
-- SUBSCRIPTIONS (recorrências / rendimentos fixos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  category text,
  description text,
  day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  linked_card_id uuid REFERENCES public.cards (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_fixed_monthly boolean NOT NULL DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS amount numeric(14, 2),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS day_of_month integer,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS linked_card_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS is_fixed_monthly boolean,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.subscriptions
  ALTER COLUMN start_date SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_fixed_monthly SET DEFAULT false;

UPDATE public.subscriptions
SET is_active = true
WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON public.subscriptions (deleted_at);

-- =============================================================================
-- CATEGORIES (transaction | subscription)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT '',
  color text DEFAULT '',
  is_default boolean DEFAULT false,
  source text DEFAULT 'transaction',
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS is_default boolean,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.categories
  ALTER COLUMN icon SET DEFAULT '',
  ALTER COLUMN color SET DEFAULT '',
  ALTER COLUMN is_default SET DEFAULT false,
  ALTER COLUMN source SET DEFAULT 'transaction',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.categories
SET source = 'transaction'
WHERE source IS NULL;

-- FK user_id → profiles (recria se apontava para auth.users)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'categories'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%user_id%';

  IF fk_name IS NOT NULL AND fk_name <> 'categories_user_id_fkey' THEN
    EXECUTE format('ALTER TABLE public.categories DROP CONSTRAINT %I', fk_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_source_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_source_check
      CHECK (source IN ('transaction', 'subscription'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_key'
  ) THEN
    ALTER TABLE public.categories
      DROP CONSTRAINT categories_user_id_name_type_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_source_key'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_id_name_type_source_key
      UNIQUE (user_id, name, type, source);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_source ON public.categories (source);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON public.categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories (deleted_at);

-- =============================================================================
-- SHARED ACCOUNTS + INVITES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.shared_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  partner_name text,
  partner_email text,
  partner_avatar_url text,
  owner_permission text NOT NULL DEFAULT 'full',
  partner_permission text NOT NULL DEFAULT 'full',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_accounts
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS partner_email text,
  ADD COLUMN IF NOT EXISTS partner_avatar_url text,
  ADD COLUMN IF NOT EXISTS owner_permission text,
  ADD COLUMN IF NOT EXISTS partner_permission text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_shared_accounts_owner ON public.shared_accounts (owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_accounts_partner ON public.shared_accounts (partner_id);

CREATE TABLE IF NOT EXISTS public.shared_account_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  partner_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | cancelled | expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_account_invites
  ADD COLUMN IF NOT EXISTS partner_email text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_shared_account_invites_owner
  ON public.shared_account_invites (owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_account_invites_email
  ON public.shared_account_invites (partner_email);

-- =============================================================================
-- OPEN FINANCE ITEMS (metadado de conexão; extrato só no app/Drift)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.open_finance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'pluggy',
  item_id text NOT NULL,
  institution_id text,
  institution_name text,
  status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, item_id)
);

ALTER TABLE public.open_finance_items
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS item_id text,
  ADD COLUMN IF NOT EXISTS institution_id text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS open_finance_items_user_id_idx
  ON public.open_finance_items (user_id);
CREATE INDEX IF NOT EXISTS open_finance_items_item_id_idx
  ON public.open_finance_items (item_id);

-- =============================================================================
-- SMS VERIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.sms_verifications
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS verified boolean,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sms_verifications_email
  ON public.sms_verifications (email);

-- =============================================================================
-- POSTS (blog — CRUD via backend / service_role)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  cover_image text NOT NULL,
  category text NOT NULL,
  author text,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS views integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts (slug);

COMMENT ON TABLE public.posts IS
  'Posts do blog. CRUD via backend (service role) por usuários com role administrador.';

-- =============================================================================
-- MARKET ASSETS (cotação diária — home)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.market_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  price numeric(18, 6) NOT NULL,
  change_percent numeric(10, 4) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_assets
  ADD COLUMN IF NOT EXISTS symbol text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS price numeric(18, 6),
  ADD COLUMN IF NOT EXISTS change_percent numeric(10, 4),
  ADD COLUMN IF NOT EXISTS sort_order integer,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_market_assets_active_sort
  ON public.market_assets (is_active, sort_order ASC, symbol ASC);

COMMENT ON TABLE public.market_assets IS
  'Ativos da home. Atualizar price e change_percent diariamente.';

-- =============================================================================
-- APP METADATA (singleton id = 1)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.app_metadata (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  schema_version integer NOT NULL DEFAULT 1,
  minimum_app_version text NOT NULL DEFAULT '1.0.0',
  latest_app_version text NOT NULL DEFAULT '1.0.0',
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_metadata
  ADD COLUMN IF NOT EXISTS schema_version integer,
  ADD COLUMN IF NOT EXISTS minimum_app_version text,
  ADD COLUMN IF NOT EXISTS latest_app_version text,
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DO $$
DECLARE
  max_ver integer;
BEGIN
  SELECT COALESCE(MAX(schema_version), 1) INTO max_ver FROM public.app_metadata;

  DELETE FROM public.app_metadata WHERE id IS DISTINCT FROM 1;

  IF NOT EXISTS (SELECT 1 FROM public.app_metadata WHERE id = 1) THEN
    INSERT INTO public.app_metadata (
      id, schema_version, minimum_app_version, latest_app_version, maintenance_mode
    )
    VALUES (1, GREATEST(max_ver, 2), '1.0.0', '1.0.0', false);
  ELSE
    UPDATE public.app_metadata
    SET
      schema_version = GREATEST(schema_version, max_ver, 2),
      minimum_app_version = COALESCE(minimum_app_version, '1.0.0'),
      latest_app_version = COALESCE(latest_app_version, '1.0.0'),
      maintenance_mode = COALESCE(maintenance_mode, false),
      updated_at = now()
    WHERE id = 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_metadata_singleton_chk'
  ) THEN
    ALTER TABLE public.app_metadata
      ADD CONSTRAINT app_metadata_singleton_chk CHECK (id = 1);
  END IF;
END $$;

-- =============================================================================
-- FUNÇÕES E TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- categories.user_id → profiles(id); sem profile, não seeda (evita FK 23503)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_user_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Renda Fixa',  'income', 'account_balance', '#4CAF50', true, 'transaction'),
    (p_user_id, 'Renda Extra', 'income', 'add_circle',      '#8BC34A', true, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Mercado',       'expense', 'shopping_cart',  '#FF9800', true, 'transaction'),
    (p_user_id, 'Alimentação',   'expense', 'restaurant',     '#F44336', true, 'transaction'),
    (p_user_id, 'Energia',       'expense', 'bolt',           '#FFEB3B', true, 'transaction'),
    (p_user_id, 'Água',          'expense', 'water_drop',     '#2196F3', true, 'transaction'),
    (p_user_id, 'Aluguel',       'expense', 'home',           '#795548', true, 'transaction'),
    (p_user_id, 'Parcela Casa',  'expense', 'house',          '#607D8B', true, 'transaction'),
    (p_user_id, 'Parcela Carro', 'expense', 'directions_car', '#9E9E9E', true, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Netflix',      'expense', 'tv',          '#E50914', true, 'subscription'),
    (p_user_id, 'YouTube',      'expense', 'youtube',     '#FF0000', true, 'subscription'),
    (p_user_id, 'Spotify',      'expense', 'music',       '#1DB954', true, 'subscription'),
    (p_user_id, 'Amazon Prime', 'expense', 'shopping_bag','#00A8E1', true, 'subscription'),
    (p_user_id, 'Disney+',     'expense', 'star',        '#113CCF', true, 'subscription'),
    (p_user_id, 'Academia',     'expense', 'dumbbell',    '#FF6B00', true, 'subscription'),
    (p_user_id, 'Internet',     'expense', 'wifi',        '#0288D1', true, 'subscription'),
    (p_user_id, 'Celular',      'expense', 'smartphone',  '#7B1FA2', true, 'subscription')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;
END;
$$;

-- Signup: cria profile (cpf/nickname/phone/role/...) + categorias padrão
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
    provider_type,
    phone_number,
    nickname,
    cpf
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'trial',
    now(),
    now() + interval '1 year',
    COALESCE(new.raw_user_meta_data->>'role', 'padrao'),
    false,
    COALESCE(new.raw_user_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nickname',
    NULLIF(regexp_replace(COALESCE(new.raw_user_meta_data->>'cpf', ''), '\D', '', 'g'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.seed_default_categories(new.id);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_account_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_finance_items ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sync entities
DROP POLICY IF EXISTS "transactions_all_own" ON public.transactions;
CREATE POLICY "transactions_all_own" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_all_own" ON public.investments;
CREATE POLICY "investments_all_own" ON public.investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_all_own" ON public.goals;
CREATE POLICY "goals_all_own" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_all_own" ON public.tasks;
CREATE POLICY "tasks_all_own" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cards_all_own" ON public.cards;
CREATE POLICY "cards_all_own" ON public.cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_all_own" ON public.subscriptions;
CREATE POLICY "subscriptions_all_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "categories_all_own" ON public.categories;
CREATE POLICY "categories_all_own" ON public.categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared accounts
DROP POLICY IF EXISTS "shared_accounts_select" ON public.shared_accounts;
DROP POLICY IF EXISTS "shared_accounts_insert_owner" ON public.shared_accounts;
DROP POLICY IF EXISTS "shared_accounts_update_owner" ON public.shared_accounts;
CREATE POLICY "shared_accounts_select" ON public.shared_accounts
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "shared_accounts_insert_owner" ON public.shared_accounts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "shared_accounts_update_owner" ON public.shared_accounts
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "shared_account_invites_select" ON public.shared_account_invites;
DROP POLICY IF EXISTS "shared_account_invites_insert_owner" ON public.shared_account_invites;
DROP POLICY IF EXISTS "shared_account_invites_update_owner" ON public.shared_account_invites;
CREATE POLICY "shared_account_invites_select" ON public.shared_account_invites
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "shared_account_invites_insert_owner" ON public.shared_account_invites
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "shared_account_invites_update_owner" ON public.shared_account_invites
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "open_finance_items_all_own" ON public.open_finance_items;
CREATE POLICY "open_finance_items_all_own" ON public.open_finance_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- service_role bypassa RLS automaticamente (backend)

-- =============================================================================
-- BACKFILLS SEGUROS (idempotentes)
-- =============================================================================

-- Contas sem identity email → google
UPDATE public.profiles
SET provider_type = 'google'
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
  WHERE i.id IS NULL
)
AND (provider_type IS DISTINCT FROM 'google');

-- Profiles sem nenhuma categoria ativa recebem seed padrão
-- (não iterar auth.users órfãos: categories.user_id referencia profiles)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.categories c
      WHERE c.user_id = p.id
        AND c.deleted_at IS NULL
    )
  LOOP
    PERFORM public.seed_default_categories(r.id);
  END LOOP;
END $$;

-- =============================================================================
-- LIMPEZA OPCIONAL (legado Pluggy sync gravado em transactions/investments)
-- Descomente se quiser soft-delete do lixo antigo.
-- =============================================================================
-- UPDATE public.transactions
--   SET deleted_at = now(), updated_at = now()
--   WHERE deleted_at IS NULL
--     AND (
--       external_id IS NOT NULL
--       OR description ILIKE '%Sincronizado via Pluggy%'
--       OR category = 'Open Finance'
--     );
-- UPDATE public.investments
--   SET deleted_at = now(), updated_at = now()
--   WHERE deleted_at IS NULL AND external_id IS NOT NULL;

-- =============================================================================
-- FIM
-- =============================================================================
