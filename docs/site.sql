-- -----------------------------------------------------------------------------
-- RECRIAÇÃO COMPLETA DO BANCO SUPABASE DO SITE (SITE_SUPABASE_URL)
-- Tabelas: books, financial, investments, market_assets
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.market_assets CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.financial CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;

-- 1. BOOKS (Livros Recomendados)
create table public.books (
  id uuid not null default gen_random_uuid (),
  title text not null,
  author text not null,
  published_year integer not null,
  rating numeric(3, 1) null default 5.0,
  badge text null default 'Recomendado'::text,
  category text null default 'Finanças'::text,
  cover_url text null,
  summary text not null,
  key_takeaways jsonb null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint books_pkey primary key (id)
) TABLESPACE pg_default;

-- 2. FINANCIAL (Artigos e Posts de Finanças)
create table public.financial (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  content text not null,
  excerpt text not null,
  cover_image text not null,
  category text not null,
  author text null,
  views integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint financial_pkey primary key (id),
  constraint financial_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_financial_created_at on public.financial using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists idx_financial_category on public.financial using btree (category) TABLESPACE pg_default;
create index IF not exists idx_financial_slug on public.financial using btree (slug) TABLESPACE pg_default;

-- 3. INVESTMENTS (Artigos e Posts de Investimentos)
create table public.investments (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  content text not null,
  excerpt text not null,
  cover_image text not null,
  category text not null,
  author text null,
  views integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint investments_pkey primary key (id),
  constraint investments_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_investments_created_at on public.investments using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists idx_investments_category on public.investments using btree (category) TABLESPACE pg_default;
create index IF not exists idx_investments_slug on public.investments using btree (slug) TABLESPACE pg_default;

-- 4. MARKET ASSETS (Cotações / Ativos de Mercado)
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