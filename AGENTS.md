# Investidor Protagonista - Backend Rules

## Fluxo de Dados
**Flutter App** (Offline-first / Drift) <-> **API Node.js** (Lógica/Segurança) <-> **Supabase** (Persistência/Auth)

## Segurança & Licenciamento
1. **JWT**: Autenticação via Supabase Auth, validada pela API.
2. **checkLicensing Middleware**:
   - Bloqueia acesso a recursos se a licença expirou.
   - Período de avaliação (Trial) padrão: **1 ano**.
   - Retorna HTTP 402 (Payment Required) quando a licença vence.
3. **Pagamentos & Integrações**:
   - **Web/Desktop**: Stripe (via Checkout Session).
   - **Mobile**: In-App Purchase (verificado pelo backend).
   - **WhatsApp Chatbot**: Fluxo interativo para registro de transações (Entrada/Saída) e consulta de ativos via mensagens.
   - **B3 (Brapi)**: Cotações, dividendos e indicadores via `brapi.dev`.
   - **Bancos (Pluggy)**: Agregação de contas e cartões via Open Finance.
   - **Notificações**: Personalizáveis por canal (App/WhatsApp) e horário definido pelo usuário.
   - **Dashboards**: Endpoints consolidados para gráficos de alocação, gastos por categoria e progresso de metas.
   - **Obrigatório**: Nenhuma chamada direta do front para provedores externos; tudo passa pela API Node.js.

## Estrutura de Pastas Backend
- src/core: Auth helpers, global errors, utils
- src/infra/database: Supabase client
- src/infra/http: Express setup, controllers, routes, middlewares
- src/modules: Business logic per module

## Comandos Backend
- npm run dev: Iniciar servidor em modo desenvolvimento.
- supabase_schema.sql: Executar este script no SQL Editor do Supabase para criar as tabelas.

## Checklist de Segurança
- [ ] Middleware `ensureAuthenticated` em todas as rotas privadas.
- [ ] Middleware `checkLicensing` em todas as rotas de funcionalidades core.
- [ ] Webhooks do Stripe validados com assinatura.
- [ ] In-App Purchases validados no servidor antes de atualizar o perfil.
