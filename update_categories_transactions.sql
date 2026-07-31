-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION V2: Adicionar source à tabela categories (INCREMENTAL)
-- Arquivo: update_categories_transactions_v2.sql
-- Execute no: Supabase Dashboard → SQL Editor → New query → Run
--
-- Contexto: A tabela `categories` JÁ EXISTE (criada pelo script anterior)
-- mas SEM a coluna `source`. Este script adiciona a coluna incrementalmente.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. ADICIONAR COLUNA source na tabela categories existente
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'transaction';

-- Atualiza todos os registros existentes para source = 'transaction'
UPDATE public.categories
SET source = 'transaction'
WHERE source IS NULL;

-- Adiciona CHECK constraint na coluna source
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_source_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_source_check
      CHECK (source IN ('transaction', 'subscription'));
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 2. RECREAR CONSTRAINT UNIQUE para incluir source
-- ─────────────────────────────────────────────────────────────────
-- O constraint original era UNIQUE(user_id, name, type).
-- Removemos e recriamos incluindo source.
DO $$
BEGIN
  -- Remove o constraint antigo
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_key'
  ) THEN
    ALTER TABLE public.categories
      DROP CONSTRAINT categories_user_id_name_type_key;
  END IF;

  -- Cria o novo constraint incluindo source
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_source_key'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_id_name_type_source_key
      UNIQUE (user_id, name, type, source);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS (idempotente)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_all_own" ON public.categories;

CREATE POLICY "categories_all_own" ON public.categories
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. FUNÇÃO AUXILIAR: semear categorias padrão
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ── Categorias de Transações (Entradas) ──
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Renda Fixa',  'income', 'account_balance', '#4CAF50', true, 'transaction'),
    (p_user_id, 'Renda Extra', 'income', 'add_circle',      '#8BC34A', true, 'transaction')
  ON CONFLICT ON CONSTRAINT categories_user_id_name_type_source_key DO NOTHING;

  -- ── Categorias de Transações (Saídas) ──
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Mercado',       'expense', 'shopping_cart',  '#FF9800', true, 'transaction'),
    (p_user_id, 'Alimentação',   'expense', 'restaurant',     '#F44336', true, 'transaction'),
    (p_user_id, 'Energia',       'expense', 'bolt',           '#FFEB3B', true, 'transaction'),
    (p_user_id, 'Água',          'expense', 'water_drop',     '#2196F3', true, 'transaction'),
    (p_user_id, 'Aluguel',       'expense', 'home',           '#795548', true, 'transaction'),
    (p_user_id, 'Parcela Casa',  'expense', 'house',          '#607D8B', true, 'transaction'),
    (p_user_id, 'Parcela Carro', 'expense', 'directions_car', '#9E9E9E', true, 'transaction')
  ON CONFLICT ON CONSTRAINT categories_user_id_name_type_source_key DO NOTHING;

  -- ── Categorias de Assinaturas (Saídas) ──
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Netflix',       'expense', 'tv',          '#E50914', true, 'subscription'),
    (p_user_id, 'YouTube',       'expense', 'youtube',     '#FF0000', true, 'subscription'),
    (p_user_id, 'Spotify',       'expense', 'music',       '#1DB954', true, 'subscription'),
    (p_user_id, 'Amazon Prime',  'expense', 'shopping_bag','#00A8E1', true, 'subscription'),
    (p_user_id, 'Disney+',       'expense', 'star',        '#113CCF', true, 'subscription'),
    (p_user_id, 'Academia',      'expense', 'dumbbell',    '#FF6B00', true, 'subscription'),
    (p_user_id, 'Internet',      'expense', 'wifi',        '#0288D1', true, 'subscription'),
    (p_user_id, 'Celular',       'expense', 'smartphone',  '#7B1FA2', true, 'subscription')
  ON CONFLICT ON CONSTRAINT categories_user_id_name_type_source_key DO NOTHING;

  -- ── Categorias de Assinaturas (Entradas) ──
  -- Nenhuma padrão — usuário cria as suas (ex: salário, aluguel recebido)
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 5. TRIGGER: semeia categorias em cada novo cadastro
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_with_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, email, subscription_status,
    trial_started_at, subscription_expires_at,
    role, email_registrado, provider_type
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
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.seed_default_categories(new.id);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_categories();

-- ─────────────────────────────────────────────────────────────────
-- 6. BACKFILL: semeia categorias de assinatura para usuários
--    que já existem mas não têm nenhuma categoria de subscription
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.id
    FROM   public.profiles p
    WHERE  NOT EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.user_id = p.id AND c.source = 'subscription'
    )
  LOOP
    PERFORM public.seed_default_categories(rec.id);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 7. CAMPOS FALTANTES NA TABELA subscriptions
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS start_date timestamptz DEFAULT now();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS end_date timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ativar todas as subscriptions existentes que estão NULL
UPDATE public.subscriptions
SET is_active = true
WHERE is_active IS NULL;
