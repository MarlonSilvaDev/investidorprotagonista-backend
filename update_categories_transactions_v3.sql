-- ============================================================
-- Migration: categories para transactions e subscriptions
-- Versão: v3 — Rewrite total com arquitetura offline-first
-- Aplica sobre banco existente (incremental, idempotente)
--
-- Postgres não tem CREATE OR ALTER TABLE.
-- Padrão usado: CREATE TABLE IF NOT EXISTS +
--               ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABELA categories (CREATE se não existir)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon        TEXT DEFAULT '',
  color       TEXT DEFAULT '',
  is_default  BOOLEAN DEFAULT FALSE,
  source      TEXT DEFAULT 'transaction',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ DEFAULT NULL
);

-- ────────────────────────────────────────────────────────────
-- 2. ALTER categories — colunas / defaults / FK (se já existir)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id     UUID,
  ADD COLUMN IF NOT EXISTS name        TEXT,
  ADD COLUMN IF NOT EXISTS type        TEXT,
  ADD COLUMN IF NOT EXISTS icon        TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS color       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_default  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source      TEXT DEFAULT 'transaction',
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.categories
  ALTER COLUMN icon  SET DEFAULT '',
  ALTER COLUMN color SET DEFAULT '',
  ALTER COLUMN is_default SET DEFAULT FALSE,
  ALTER COLUMN source SET DEFAULT 'transaction',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Backfill: registros antigos sem source
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

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.categories DROP CONSTRAINT %I', fk_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. ALTER tabelas existentes — soft delete (+ cols subscriptions)
--    Só aplica se a tabela já existir
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    ALTER TABLE public.transactions
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS description TEXT        DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS start_date  TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS end_date    TIMESTAMPTZ DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS is_active   BOOLEAN     DEFAULT TRUE;
  END IF;

  IF to_regclass('public.goals') IS NOT NULL THEN
    ALTER TABLE public.goals
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE public.tasks
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF to_regclass('public.cards') IS NOT NULL THEN
    ALTER TABLE public.cards
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF to_regclass('public.investments') IS NOT NULL THEN
    ALTER TABLE public.investments
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. ÍNDICES (IF NOT EXISTS)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_user_id    ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_source     ON public.categories (source);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON public.categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories (deleted_at);

DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions (deleted_at);
  END IF;
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON public.subscriptions (deleted_at);
  END IF;
  IF to_regclass('public.goals') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON public.goals (deleted_at);
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks (deleted_at);
  END IF;
  IF to_regclass('public.cards') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON public.cards (deleted_at);
  END IF;
  IF to_regclass('public.investments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_investments_deleted_at ON public.investments (deleted_at);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. CONSTRAINT UNIQUE (user_id, name, type, source)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_key'
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_user_id_name_type_key;
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

-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. TRIGGER updated_at (CREATE OR REPLACE da função)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 8. FUNÇÃO seed_default_categories (CREATE OR REPLACE)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Renda Fixa',    'income',  'account_balance', '#4CAF50', TRUE, 'transaction'),
    (p_user_id, 'Renda Extra',   'income',  'add_circle',      '#8BC34A', TRUE, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Mercado',       'expense', 'shopping_cart',   '#FF9800', TRUE, 'transaction'),
    (p_user_id, 'Alimentação',   'expense', 'restaurant',      '#F44336', TRUE, 'transaction'),
    (p_user_id, 'Energia',       'expense', 'bolt',            '#FFEB3B', TRUE, 'transaction'),
    (p_user_id, 'Água',          'expense', 'water_drop',      '#2196F3', TRUE, 'transaction'),
    (p_user_id, 'Aluguel',       'expense', 'home',            '#795548', TRUE, 'transaction'),
    (p_user_id, 'Parcela Casa',  'expense', 'house',           '#607D8B', TRUE, 'transaction'),
    (p_user_id, 'Parcela Carro', 'expense', 'directions_car',  '#9E9E9E', TRUE, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  INSERT INTO public.categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Netflix',      'expense', 'tv',          '#E50914', TRUE, 'subscription'),
    (p_user_id, 'YouTube',      'expense', 'youtube',     '#FF0000', TRUE, 'subscription'),
    (p_user_id, 'Spotify',      'expense', 'music',       '#1DB954', TRUE, 'subscription'),
    (p_user_id, 'Amazon Prime', 'expense', 'shopping_bag','#00A8E1', TRUE, 'subscription'),
    (p_user_id, 'Disney+',     'expense', 'star',        '#113CCF', TRUE, 'subscription'),
    (p_user_id, 'Academia',     'expense', 'dumbbell',    '#FF6B00', TRUE, 'subscription'),
    (p_user_id, 'Internet',     'expense', 'wifi',        '#0288D1', TRUE, 'subscription'),
    (p_user_id, 'Celular',      'expense', 'smartphone',  '#7B1FA2', TRUE, 'subscription')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 9. SEED para o usuário atual (descomente se precisar)
-- ────────────────────────────────────────────────────────────
-- SELECT public.seed_default_categories(auth.uid());

-- ────────────────────────────────────────────────────────────
-- 10. BACKFILL: usuários sem nenhuma categoria ativa
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN public.categories c ON c.user_id = u.id AND c.deleted_at IS NULL
    WHERE c.id IS NULL
  LOOP
    PERFORM public.seed_default_categories(r.id);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 11. TABELA app_metadata (CREATE + ALTER se já existir)
--     Singleton: sempre uma linha com id = 1
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_metadata (
  id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  schema_version      INTEGER NOT NULL DEFAULT 1,
  minimum_app_version TEXT    NOT NULL DEFAULT '1.0.0',
  latest_app_version  TEXT    NOT NULL DEFAULT '1.0.0',
  maintenance_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_metadata
  ADD COLUMN IF NOT EXISTS schema_version      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS minimum_app_version TEXT    NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS latest_app_version  TEXT    NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS maintenance_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();

-- Consolida em uma única linha (id = 1), mesmo se veio de SERIAL antigo
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
    VALUES (1, GREATEST(max_ver, 2), '1.0.0', '1.0.0', FALSE);
  ELSE
    UPDATE public.app_metadata
    SET
      schema_version = GREATEST(schema_version, max_ver, 2),
      minimum_app_version = COALESCE(minimum_app_version, '1.0.0'),
      latest_app_version = COALESCE(latest_app_version, '1.0.0'),
      maintenance_mode = COALESCE(maintenance_mode, FALSE),
      updated_at = NOW()
    WHERE id = 1;
  END IF;

  -- Garante CHECK (id = 1) em tabelas antigas sem essa constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'app_metadata_singleton_chk'
  ) THEN
    ALTER TABLE public.app_metadata
      ADD CONSTRAINT app_metadata_singleton_chk CHECK (id = 1);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- ────────────────────────────────────────────────────────────
