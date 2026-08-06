-- ═══════════════════════════════════════════
-- MARKET ASSETS — cotação diária (home /#ativos)
-- Rode no SQL Editor do Supabase.
--
-- Atualize todos os dias:
--   price           = cotação atual
--   change_percent  = variação % (positivo = aumentou, negativo = diminuiu)
-- ═══════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_market_assets_active_sort
  ON public.market_assets (is_active, sort_order ASC, symbol ASC);

COMMENT ON TABLE public.market_assets IS
  'Ativos da home. Atualizar price e change_percent diariamente.';
COMMENT ON COLUMN public.market_assets.symbol IS
  'Ticker (ex.: PETR4, VALE3, BTC, IBOV).';
COMMENT ON COLUMN public.market_assets.price IS
  'Cotação atual.';
COMMENT ON COLUMN public.market_assets.change_percent IS
  'Variação % do dia. > 0 aumentou | < 0 diminuiu | 0 estável.';

-- Exemplo de carga / atualização diária (upsert por symbol):
-- INSERT INTO public.market_assets (symbol, name, price, change_percent, sort_order)
-- VALUES
--   ('IBOV',  'Ibovespa',      128450.00,  0.85, 1),
--   ('PETR4', 'Petrobras PN',      38.45,  1.23, 2),
--   ('VALE3', 'Vale ON',           62.10, -0.74, 3),
--   ('ITUB4', 'Itaú PN',           34.20,  0.41, 4),
--   ('BTC',   'Bitcoin',        612345.00, -1.10, 5)
-- ON CONFLICT (symbol) DO UPDATE SET
--   name = EXCLUDED.name,
--   price = EXCLUDED.price,
--   change_percent = EXCLUDED.change_percent,
--   sort_order = EXCLUDED.sort_order,
--   is_active = true,
--   updated_at = now();
