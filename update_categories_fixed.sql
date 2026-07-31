-- Categorias e Rendimentos Fixos

-- 1. Tabela de Categorias Customizadas
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name, type)
);

alter table public.categories enable row level security;

create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Atualizar a função handle_new_user para inserir categorias padrão
CREATE OR REPLACE FUNCTION public.handle_new_user_with_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
BEGIN
  -- Inserir Perfil
  INSERT INTO public.profiles (id, name, email, subscription_status, trial_started_at, subscription_expires_at, role, email_registrado, provider_type)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'trial', NOW(), NOW() + interval '1 year', COALESCE(new.raw_user_meta_data->>'role', 'padrao'), false, COALESCE(new.raw_user_meta_data->>'provider', 'email'));

  -- Inserir Categorias Padrão (Entradas)
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
  VALUES 
    (new.id, 'Renda Fixa', 'income', 'account_balance', '#4CAF50', true),
    (new.id, 'Renda Extra', 'income', 'add_circle', '#8BC34A', true);

  -- Inserir Categorias Padrão (Saídas)
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
  VALUES 
    (new.id, 'Mercado', 'expense', 'shopping_cart', '#FF9800', true),
    (new.id, 'Food', 'expense', 'restaurant', '#F44336', true),
    (new.id, 'Energia', 'expense', 'bolt', '#FFEB3B', true),
    (new.id, 'Agua', 'expense', 'water_drop', '#2196F3', true),
    (new.id, 'Aluguel', 'expense', 'home', '#795548', true),
    (new.id, 'Parcela Casa', 'expense', 'house', '#607D8B', true),
    (new.id, 'Parcela Carro', 'expense', 'directions_car', '#9E9E9E', true);

  RETURN new;
END;
\$\$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_categories();

-- 3. Adicionar campo is_fixed_monthly em subscriptions para identificar rendas fixas que não precisam atualizar todo mês
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_fixed_monthly boolean NOT NULL DEFAULT false;

