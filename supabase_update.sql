-- Investidor Protagonista — Update schema
-- Cole em: Supabase Dashboard → SQL Editor → Run
-- Adiciona controle de confirmação de e-mail feito pelo nosso backend (não pelo Supabase Auth e-mail).
-- Adiciona controle do tipo de provedor (email / google) para bloquear recuperação de senha de contas Google.

-- ═══════════════════════════════════════════
-- profiles.provider_type
-- 'email'  = cadastro com email e senha
-- 'google' = cadastro com Google Sign-In
-- ═══════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'email';

COMMENT ON COLUMN public.profiles.provider_type IS
  'Tipo de provedor usado no cadastro: "email" (login/senha) ou "google" (Google Sign-In). Contas "google" não podem usar recuperação de senha.';

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_profiles_provider_type ON public.profiles (provider_type);

-- ═══════════════════════════════════════════
-- profiles.email_registrado
-- false = cadastrou, ainda não confirmou o e-mail (nosso fluxo SMTP)
-- true  = e-mail confirmado; login liberado na API
-- ═══════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_registrado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.email_registrado IS
  'true quando o usuário confirmou o e-mail pelo link enviado pelo backend';

-- Atualiza o trigger de novo usuário para gravar email_registrado e provider_type
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
-- Atualiza profiles existentes: se não tem senha (identity type não é 'email'),
-- marca como 'google'.
-- ═══════════════════════════════════════════
UPDATE public.profiles
SET provider_type = 'google'
WHERE id IN (
  SELECT u.id FROM auth.users u
  LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
  WHERE i.id IS NULL
);

-- ═══════════════════════════════════════════
-- Índices auxiliares para consultas por e-mail no backend
-- ═══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_email_registrado
  ON public.profiles (email_registrado)
  WHERE email_registrado = false;

-- ═══════════════════════════════════════════
-- profiles.nickname
-- profiles.phone_number (already exists, but ensuring meta-data sync)
-- ═══════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text;

COMMENT ON COLUMN public.profiles.nickname IS 'Nickname do usuário para exibição no app';

-- Atualiza o trigger de novo usuário para gravar nickname e phone_number
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
    nickname
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
    COALESCE(new.raw_user_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nickname'
  );
  RETURN new;
END;
$$;

-- ═══════════════════════════════════════════
-- SMS VERIFICATIONS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_sms_verifications_email ON public.sms_verifications (email);

-- ═══════════════════════════════════════════
-- POSTS (blog — gerenciados pelo app admin via API)
-- ═══════════════════════════════════════════
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

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts (slug);

COMMENT ON TABLE public.posts IS
  'Posts do blog. CRUD apenas via backend (service role) por usuários com role administrador.';
