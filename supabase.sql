-- -----------------------------------------------------------------------------
-- RECRIAÇÃO COMPLETA DO BANCO SUPABASE (SEM ALTER TABLE / SEM MIGRAÇÕES)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.bank_connections CASCADE;
DROP TABLE IF EXISTS public.shared_account_invites CASCADE;
DROP TABLE IF EXISTS public.shared_accounts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.market_assets CASCADE;
DROP TABLE IF EXISTS public.open_finance_items CASCADE;
DROP TABLE IF EXISTS public.sms_verifications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.app_metadata CASCADE;

-- 1. APP METADATA
create table public.app_metadata (
  id serial not null,
  schema_version integer not null default 1,
  minimum_app_version text not null default '1.0.0'::text,
  latest_app_version text not null default '1.0.0'::text,
  maintenance_mode boolean not null default false,
  updated_at timestamp with time zone null default now(),
  constraint app_metadata_pkey primary key (id),
  constraint app_metadata_singleton_chk check ((id = 1))
) TABLESPACE pg_default;

-- 2. PROFILES (Com tipo de usuário, país e identificador de documento)
create table public.profiles (
  id uuid not null,
  name text null,
  email text null,
  phone_number text null,
  avatar_url text null,
  user_type text not null default 'usuario'::text,
  country text not null default 'BR'::text,
  document_type text null,
  document_number text null,
  cpf text null,
  nickname text null,
  plan text not null default 'usuario'::text,
  subscription_status text not null default 'trial'::text,
  subscription_expires_at timestamp with time zone null,
  trial_started_at timestamp with time zone null default now(),
  stripe_customer_id text null,
  stripe_subscription_id text null,
  notification_channel text null default 'app'::text,
  notification_time text null default '08:00'::text,
  whatsapp_session_state text null default 'idle'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  role text not null default 'padrao'::text,
  email_registrado boolean not null default false,
  provider_type text not null default 'email'::text,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_user_type_check check (
    (user_type = any (array['usuario'::text, 'empresa'::text]))
  ),
  constraint profiles_plan_check check (
    (plan = any (array['usuario'::text, 'empresa'::text, 'free'::text, 'plus'::text, 'premium'::text, 'casal'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_provider_type on public.profiles using btree (provider_type) TABLESPACE pg_default;
create unique INDEX IF not exists idx_profiles_email_unique on public.profiles using btree (email) TABLESPACE pg_default where (email is not null);
create index IF not exists idx_profiles_email_registrado on public.profiles using btree (email_registrado) TABLESPACE pg_default where (email_registrado = false);
create unique INDEX IF not exists idx_profiles_cpf_unique on public.profiles using btree (cpf) TABLESPACE pg_default where (cpf is not null);
create unique INDEX IF not exists idx_profiles_document_number_unique on public.profiles using btree (document_number) TABLESPACE pg_default where (document_number is not null);

-- 3. BANK CONNECTIONS
create table public.bank_connections (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  institution_id text not null,
  institution_name text not null,
  logo_key text null,
  status text not null default 'connected'::text,
  account_balance numeric(14, 2) null default 0,
  connected_at timestamp with time zone not null default now(),
  last_sync_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint bank_connections_pkey primary key (id),
  constraint bank_connections_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_bank_connections_user_id on public.bank_connections using btree (user_id) TABLESPACE pg_default;

-- 4. CARDS (Com data_origin, institution_id, institution_name, brand)
create table public.cards (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  type text not null,
  masked_number text null,
  "limit" numeric(14, 2) not null default 0,
  available_limit numeric(14, 2) not null default 0,
  closing_day integer null,
  due_day integer null,
  color text null,
  icon text null,
  is_active boolean not null default true,
  data_origin text not null default 'manual'::text,
  institution_id text null,
  institution_name text null,
  brand text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint cards_pkey primary key (id),
  constraint cards_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint cards_closing_day_check check (
    (
      (closing_day >= 1)
      and (closing_day <= 31)
    )
  ),
  constraint cards_due_day_check check (
    (
      (due_day >= 1)
      and (due_day <= 31)
    )
  ),
  constraint cards_type_check check (
    (type = any (array['credit'::text, 'debit'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_cards_user_id on public.cards using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_cards_deleted_at on public.cards using btree (deleted_at) TABLESPACE pg_default;

-- 5. CATEGORIES
create table public.categories (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  type text not null,
  icon text null default ''::text,
  color text null default ''::text,
  is_default boolean null default false,
  source text null default 'transaction'::text,
  deleted_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_user_id_name_type_source_key unique (user_id, name, type, source),
  constraint categories_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint categories_source_check check (
    (
      source = any (array['transaction'::text, 'subscription'::text])
    )
  ),
  constraint categories_type_check check (
    (
      type = any (array['income'::text, 'expense'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_categories_user_id on public.categories using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_categories_source on public.categories using btree (source) TABLESPACE pg_default;
create index IF not exists idx_categories_updated_at on public.categories using btree (updated_at) TABLESPACE pg_default;
create index IF not exists idx_categories_deleted_at on public.categories using btree (deleted_at) TABLESPACE pg_default;

-- 6. GOALS
create table public.goals (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  description text null,
  target_amount numeric(14, 2) not null default 0,
  current_amount numeric(14, 2) not null default 0,
  deadline timestamp with time zone null,
  icon text null,
  color text null,
  is_shared boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint goals_pkey primary key (id),
  constraint goals_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_goals_user_id on public.goals using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_goals_deleted_at on public.goals using btree (deleted_at) TABLESPACE pg_default;

-- 7. INVESTMENTS
create table public.investments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  external_id text null,
  asset_name text null,
  asset_class text null,
  ticker text null,
  quantity numeric(18, 6) not null default 0,
  average_price numeric(14, 4) not null default 0,
  current_price numeric(14, 4) not null default 0,
  total_invested numeric(14, 2) not null default 0,
  current_total numeric(14, 2) not null default 0,
  daily_change numeric(14, 4) null,
  daily_change_percent numeric(10, 4) null,
  total_profit numeric(14, 2) null,
  total_profit_percent numeric(10, 4) null,
  last_sync_date timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint investments_pkey primary key (id),
  constraint investments_external_id_key unique (external_id),
  constraint investments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_investments_user_id on public.investments using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_investments_ticker on public.investments using btree (ticker) TABLESPACE pg_default;
create index IF not exists idx_investments_deleted_at on public.investments using btree (deleted_at) TABLESPACE pg_default;

-- 8. MARKET ASSETS
create table public.market_assets (
  id uuid not null default gen_random_uuid (),
  symbol text not null,
  name text not null,
  price numeric(18, 6) not null,
  change_percent numeric(10, 4) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint market_assets_pkey primary key (id),
  constraint market_assets_symbol_key unique (symbol)
) TABLESPACE pg_default;

create index IF not exists idx_market_assets_active_sort on public.market_assets using btree (is_active, sort_order, symbol) TABLESPACE pg_default;

-- 9. OPEN FINANCE ITEMS
create table public.open_finance_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  provider text not null default 'pluggy'::text,
  item_id text not null,
  institution_id text null,
  institution_name text null,
  status text not null default 'pending'::text,
  last_sync_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint open_finance_items_pkey primary key (id),
  constraint open_finance_items_provider_item_id_key unique (provider, item_id),
  constraint open_finance_items_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists open_finance_items_user_id_idx on public.open_finance_items using btree (user_id) TABLESPACE pg_default;
create index IF not exists open_finance_items_item_id_idx on public.open_finance_items using btree (item_id) TABLESPACE pg_default;

-- 10. SHARED ACCOUNT INVITES
create table public.shared_account_invites (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  partner_email text not null,
  status text not null default 'pending'::text,
  expires_at timestamp with time zone not null default (now() + '7 days'::interval),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint shared_account_invites_pkey primary key (id),
  constraint shared_account_invites_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_shared_account_invites_owner on public.shared_account_invites using btree (owner_id) TABLESPACE pg_default;
create index IF not exists idx_shared_account_invites_email on public.shared_account_invites using btree (partner_email) TABLESPACE pg_default;

-- 11. SHARED ACCOUNTS
create table public.shared_accounts (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  partner_id uuid not null,
  partner_name text null,
  partner_email text null,
  partner_avatar_url text null,
  owner_permission text not null default 'full'::text,
  partner_permission text not null default 'full'::text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint shared_accounts_pkey primary key (id),
  constraint shared_accounts_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE,
  constraint shared_accounts_partner_id_fkey foreign KEY (partner_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_shared_accounts_owner on public.shared_accounts using btree (owner_id) TABLESPACE pg_default;
create index IF not exists idx_shared_accounts_partner on public.shared_accounts using btree (partner_id) TABLESPACE pg_default;

-- 12. SMS VERIFICATIONS
create table public.sms_verifications (
  id uuid not null default gen_random_uuid (),
  email text not null,
  phone text not null,
  code text not null,
  verified boolean not null default false,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + '00:10:00'::interval),
  constraint sms_verifications_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_sms_verifications_email on public.sms_verifications using btree (email) TABLESPACE pg_default;

-- 13. SUBSCRIPTIONS (Com data_origin, is_fixed_monthly)
create table public.subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  type text not null,
  amount numeric(14, 2) not null default 0,
  category text null,
  description text null,
  day_of_month integer not null,
  start_date timestamp with time zone not null default now(),
  end_date timestamp with time zone null,
  linked_card_id uuid null,
  is_active boolean not null default true,
  is_fixed_monthly boolean not null default false,
  data_origin text not null default 'manual'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_linked_card_id_fkey foreign KEY (linked_card_id) references cards (id) on delete set null,
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint subscriptions_day_of_month_check check (
    (
      (day_of_month >= 1)
      and (day_of_month <= 31)
    )
  ),
  constraint subscriptions_type_check check (
    (
      type = any (array['income'::text, 'expense'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_user_id on public.subscriptions using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_subscriptions_deleted_at on public.subscriptions using btree (deleted_at) TABLESPACE pg_default;

-- 14. TASKS
create table public.tasks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  description text null,
  due_date timestamp with time zone null,
  priority text not null default 'medium'::text,
  is_completed boolean not null default false,
  linked_transaction_id uuid null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint tasks_pkey primary key (id),
  constraint tasks_linked_transaction_id_fkey foreign KEY (linked_transaction_id) references transactions (id) on delete set null,
  constraint tasks_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint tasks_priority_check check (
    (
      priority = any (array['low'::text, 'medium'::text, 'high'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tasks_user_id on public.tasks using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_tasks_deleted_at on public.tasks using btree (deleted_at) TABLESPACE pg_default;

-- 15. TRANSACTIONS (Com data_origin, institution_id, institution_name)
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  external_id text null,
  title text null,
  type text not null,
  amount numeric(14, 2) not null default 0,
  category text null,
  description text null,
  date timestamp with time zone not null default now(),
  attachment_url text null,
  is_recurring boolean not null default false,
  recurring_rule_id text null,
  is_shared boolean not null default false,
  data_origin text not null default 'manual'::text,
  institution_id text null,
  institution_name text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone null,
  constraint transactions_pkey primary key (id),
  constraint transactions_external_id_key unique (external_id),
  constraint transactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint transactions_type_check check (
    (
      type = any (array['income'::text, 'expense'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_date on public.transactions using btree (date desc) TABLESPACE pg_default;
create index IF not exists idx_transactions_deleted_at on public.transactions using btree (deleted_at) TABLESPACE pg_default;