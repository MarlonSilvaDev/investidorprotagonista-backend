-- ============================================================
-- Migration: categories para transactions e subscriptions
-- Versão: v3 — conformidade total com arquitetura offline-first
-- Aplica sobre banco existente (incremental, idempotente)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABELA categories (se não existir, cria do zero)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- 2. ADICIONAR COLUNAS FALTANTES (se já existir a tabela)
--    Todas as novas colunas têm DEFAULT para compatibilidade
--    com versões antigas do app (nunca NOT NULL sem DEFAULT)
-- ────────────────────────────────────────────────────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'transaction',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Garante que colunas existentes também têm DEFAULT seguro
ALTER TABLE categories
  ALTER COLUMN icon  SET DEFAULT '',
  ALTER COLUMN color SET DEFAULT '';

-- Backfill: registros antigos sem source recebem 'transaction'
UPDATE categories
  SET source = 'transaction'
  WHERE source IS NULL;

-- ────────────────────────────────────────────────────────────
-- 3. ADICIONAR deleted_at em TODAS as tabelas (soft delete)
--    Conforme arquitetura: nunca usar DELETE físico
-- ────────────────────────────────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_date  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS end_date    TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN     DEFAULT TRUE;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 4. ÍNDICES para performance de sync incremental
--    (updated_at > last_sync e deleted_at IS NULL)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_user_id    ON categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_source     ON categories (source);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories (deleted_at);

CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at   ON transactions (deleted_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at  ON subscriptions (deleted_at);
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at          ON goals (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at          ON tasks (deleted_at);
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at          ON cards (deleted_at);
CREATE INDEX IF NOT EXISTS idx_investments_deleted_at    ON investments (deleted_at);

-- ────────────────────────────────────────────────────────────
-- 5. CONSTRAINT UNIQUE atualizado para incluir source
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Remove constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_key'
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT categories_user_id_name_type_key;
  END IF;

  -- Cria constraint nova com source
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_source_key'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_user_id_name_type_source_key
      UNIQUE (user_id, name, type, source);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. TRIGGER updated_at automático
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 8. FUNÇÃO seed_default_categories (reutilizável)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- ── Categorias de Transações ──
  -- Entradas
  INSERT INTO categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Renda Fixa',    'income',  'account_balance', '#4CAF50', TRUE, 'transaction'),
    (p_user_id, 'Renda Extra',   'income',  'add_circle',      '#8BC34A', TRUE, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  -- Saídas
  INSERT INTO categories (user_id, name, type, icon, color, is_default, source)
  VALUES
    (p_user_id, 'Mercado',       'expense', 'shopping_cart',   '#FF9800', TRUE, 'transaction'),
    (p_user_id, 'Alimentação',   'expense', 'restaurant',      '#F44336', TRUE, 'transaction'),
    (p_user_id, 'Energia',       'expense', 'bolt',            '#FFEB3B', TRUE, 'transaction'),
    (p_user_id, 'Água',          'expense', 'water_drop',      '#2196F3', TRUE, 'transaction'),
    (p_user_id, 'Aluguel',       'expense', 'home',            '#795548', TRUE, 'transaction'),
    (p_user_id, 'Parcela Casa',  'expense', 'house',           '#607D8B', TRUE, 'transaction'),
    (p_user_id, 'Parcela Carro', 'expense', 'directions_car',  '#9E9E9E', TRUE, 'transaction')
  ON CONFLICT (user_id, name, type, source) DO NOTHING;

  -- ── Categorias de Assinaturas ──
  -- Saídas (serviços recorrentes populares)
  INSERT INTO categories (user_id, name, type, icon, color, is_default, source)
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
  -- Entradas de assinaturas: nenhuma padrão (usuário cria as suas)
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 9. SEED para o usuário atual (se autenticado via SQL Editor)
--    Descomente se quiser semear para o usuário logado agora:
-- ────────────────────────────────────────────────────────────
-- SELECT seed_default_categories(auth.uid());

-- ────────────────────────────────────────────────────────────
-- 10. BACKFILL: semeia categorias para usuários legados
--     que ainda não têm nenhuma categoria
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN categories c ON c.user_id = u.id AND c.deleted_at IS NULL
    WHERE c.id IS NULL
  LOOP
    PERFORM seed_default_categories(r.id);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 11. TABELA app_metadata (controle de versão do schema)
--     Conforme arquitetura de escalabilidade
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_metadata (
  id                  SERIAL PRIMARY KEY,
  schema_version      INTEGER NOT NULL DEFAULT 1,
  minimum_app_version TEXT    NOT NULL DEFAULT '1.0.0',
  latest_app_version  TEXT    NOT NULL DEFAULT '1.0.0',
  maintenance_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Insere registro inicial se não existir
INSERT INTO app_metadata (schema_version, minimum_app_version, latest_app_version)
VALUES (2, '1.0.0', '1.0.0')
ON CONFLICT DO NOTHING;

-- Atualiza schema_version para 2 (adição de categories + deleted_at)
UPDATE app_metadata SET schema_version = 2, updated_at = NOW()
WHERE schema_version < 2;

-- ────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- ────────────────────────────────────────────────────────────
