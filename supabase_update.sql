-- Investidor Protagonista — Update schema
-- Cole em: Supabase Dashboard → SQL Editor → Run
-- Adiciona controle de confirmação de e-mail feito pelo nosso backend (não pelo Supabase Auth e-mail).

-- ═══════════════════════════════════════════
-- profiles.email_registrado
-- false = cadastrou, ainda não confirmou o e-mail (nosso fluxo SMTP)
-- true  = e-mail confirmado; login liberado na API
-- ═══════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_registrado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.email_registrado IS
  'true quando o usuário confirmou o e-mail pelo link enviado pelo backend';

-- Atualiza o trigger de novo usuário para gravar email_registrado = false
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
    email_registrado
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'trial',
    NOW(),
    NOW() + interval '1 year',
    COALESCE(new.raw_user_meta_data->>'role', 'padrao'),
    false
  );
  RETURN new;
END;
$$;

-- Índice auxiliar para consultas por e-mail no backend
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_email_registrado
  ON public.profiles (email_registrado)
  WHERE email_registrado = false;
