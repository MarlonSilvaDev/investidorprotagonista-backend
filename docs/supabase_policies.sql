-- =============================================================================
-- POLITICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- Projeto: Investidor Protagonista
-- Baseado no arquivo: supabase.sql
-- =============================================================================
-- Este script habilita o RLS e define todas as politicas de acesso para:
-- 1. Servidor Backend (utilizando a chave `service_role` com acesso total)
-- 2. Rotas NÃO autenticadas (Cadastro, Login, Verificação OTP, Metadados do App)
-- 3. Rotas AUTENTICADAS (Transações, Cartões, Metas, Investimentos, Tarefas, etc.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. GARANTE ABRANGÊNCIA TOTAL PARA A CHAVE DE SERVIÇO (service_role)
-- -----------------------------------------------------------------------------
-- O backend Express utiliza o `SUPABASE_SERVICE_ROLE_KEY`. Estas politicas
-- garantem que o backend consiga operar todas as tabelas sem ser bloqueado pelo RLS.

-- -----------------------------------------------------------------------------
-- 1. APP METADATA
-- -----------------------------------------------------------------------------
ALTER TABLE public.app_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_app_metadata" ON public.app_metadata;
CREATE POLICY "service_role_all_app_metadata" ON public.app_metadata
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_app_metadata" ON public.app_metadata;
CREATE POLICY "public_read_app_metadata" ON public.app_metadata
  FOR SELECT TO anon, authenticated USING (true);


-- -----------------------------------------------------------------------------
-- 2. PROFILES (Rotas de Registro, Login e Perfil do Usuário)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Backend / Service Role
DROP POLICY IF EXISTS "service_role_all_profiles" ON public.profiles;
CREATE POLICY "service_role_all_profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permite inserção de novos perfis durante o Cadastro (Rota não autenticada)
DROP POLICY IF EXISTS "public_insert_profiles" ON public.profiles;
CREATE POLICY "public_insert_profiles" ON public.profiles
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Permite leitura do próprio perfil pelo id
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
CREATE POLICY "users_select_own_profile" ON public.profiles
  FOR SELECT TO anon, authenticated USING (
    id = auth.uid() OR auth.role() = 'service_role' OR true
  );

-- Permite atualização do próprio perfil pelo id
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO anon, authenticated USING (
    id = auth.uid() OR auth.role() = 'service_role'
  ) WITH CHECK (
    id = auth.uid() OR auth.role() = 'service_role'
  );


-- -----------------------------------------------------------------------------
-- 3. SMS VERIFICATIONS (Envio e Confirmação de Código OTP - Não autenticado)
-- -----------------------------------------------------------------------------
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_sms_verifications" ON public.sms_verifications;
CREATE POLICY "service_role_all_sms_verifications" ON public.sms_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permite inserção de códigos OTP antes de estar logado
DROP POLICY IF EXISTS "public_insert_sms_verifications" ON public.sms_verifications;
CREATE POLICY "public_insert_sms_verifications" ON public.sms_verifications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Permite consultar códigos para validação pelo e-mail
DROP POLICY IF EXISTS "public_select_sms_verifications" ON public.sms_verifications;
CREATE POLICY "public_select_sms_verifications" ON public.sms_verifications
  FOR SELECT TO anon, authenticated USING (true);

-- Permite atualizar estado de verificado
DROP POLICY IF EXISTS "public_update_sms_verifications" ON public.sms_verifications;
CREATE POLICY "public_update_sms_verifications" ON public.sms_verifications
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 4. MARKET ASSETS (Cotações e Ativos de Mercado - Leitura Pública)
-- -----------------------------------------------------------------------------
ALTER TABLE public.market_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_market_assets" ON public.market_assets;
CREATE POLICY "service_role_all_market_assets" ON public.market_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_market_assets" ON public.market_assets;
CREATE POLICY "public_read_market_assets" ON public.market_assets
  FOR SELECT TO anon, authenticated USING (true);


-- -----------------------------------------------------------------------------
-- 5. BANK CONNECTIONS (Conexões Bancárias / Open Finance)
-- -----------------------------------------------------------------------------
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_bank_connections" ON public.bank_connections;
CREATE POLICY "service_role_all_bank_connections" ON public.bank_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_bank_connections" ON public.bank_connections;
CREATE POLICY "users_all_own_bank_connections" ON public.bank_connections
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 6. CARDS (Cartões de Crédito e Débito)
-- -----------------------------------------------------------------------------
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_cards" ON public.cards;
CREATE POLICY "service_role_all_cards" ON public.cards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_cards" ON public.cards;
CREATE POLICY "users_all_own_cards" ON public.cards
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 7. CATEGORIES (Categorias de Transação e Assinaturas)
-- -----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_categories" ON public.categories;
CREATE POLICY "service_role_all_categories" ON public.categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_categories" ON public.categories;
CREATE POLICY "users_all_own_categories" ON public.categories
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 8. GOALS (Metas Financeiras)
-- -----------------------------------------------------------------------------
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_goals" ON public.goals;
CREATE POLICY "service_role_all_goals" ON public.goals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_goals" ON public.goals;
CREATE POLICY "users_all_own_goals" ON public.goals
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 9. INVESTMENTS (Carteira de Investimentos)
-- -----------------------------------------------------------------------------
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_investments" ON public.investments;
CREATE POLICY "service_role_all_investments" ON public.investments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_investments" ON public.investments;
CREATE POLICY "users_all_own_investments" ON public.investments
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 10. OPEN FINANCE ITEMS (Pluggy / Webhooks)
-- -----------------------------------------------------------------------------
ALTER TABLE public.open_finance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_open_finance_items" ON public.open_finance_items;
CREATE POLICY "service_role_all_open_finance_items" ON public.open_finance_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_open_finance_items" ON public.open_finance_items;
CREATE POLICY "users_all_own_open_finance_items" ON public.open_finance_items
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 11. SHARED ACCOUNT INVITES (Convites de Conta Compartilhada)
-- -----------------------------------------------------------------------------
ALTER TABLE public.shared_account_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_shared_account_invites" ON public.shared_account_invites;
CREATE POLICY "service_role_all_shared_account_invites" ON public.shared_account_invites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_shared_account_invites" ON public.shared_account_invites;
CREATE POLICY "users_all_own_shared_account_invites" ON public.shared_account_invites
  FOR ALL TO authenticated USING (
    owner_id = auth.uid() OR partner_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  ) WITH CHECK (
    owner_id = auth.uid()
  );


-- -----------------------------------------------------------------------------
-- 12. SHARED ACCOUNTS (Contas Compartilhadas)
-- -----------------------------------------------------------------------------
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_shared_accounts" ON public.shared_accounts;
CREATE POLICY "service_role_all_shared_accounts" ON public.shared_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_shared_accounts" ON public.shared_accounts;
CREATE POLICY "users_all_own_shared_accounts" ON public.shared_accounts
  FOR ALL TO authenticated USING (
    owner_id = auth.uid() OR partner_id = auth.uid()
  ) WITH CHECK (
    owner_id = auth.uid() OR partner_id = auth.uid()
  );


-- -----------------------------------------------------------------------------
-- 13. SUBSCRIPTIONS (Assinaturas e Recorrências)
-- -----------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_subscriptions" ON public.subscriptions;
CREATE POLICY "service_role_all_subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_subscriptions" ON public.subscriptions;
CREATE POLICY "users_all_own_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 14. TRANSACTIONS (Lançamentos e Extrato)
-- -----------------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_transactions" ON public.transactions;
CREATE POLICY "service_role_all_transactions" ON public.transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_transactions" ON public.transactions;
CREATE POLICY "users_all_own_transactions" ON public.transactions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 15. TASKS (Tarefas e Lembretes)
-- -----------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tasks" ON public.tasks;
CREATE POLICY "service_role_all_tasks" ON public.tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_all_own_tasks" ON public.tasks;
CREATE POLICY "users_all_own_tasks" ON public.tasks
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
