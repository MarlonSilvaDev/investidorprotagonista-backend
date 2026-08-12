# Investidor Protagonista — Backend

API **Node.js + TypeScript (Express)** entre o app Flutter e o **Supabase** (Auth + persistência remota).

```
Flutter (Drift local)  →  API Node.js  →  Supabase (Auth + Postgres)
```

| Camada | Responsabilidade |
|--------|------------------|
| **Flutter / Drift** | Banco local offline-first (documentado no README do app) |
| **Esta API** | JWT, licenciamento, RBAC, regras de negócio, integrações |
| **Supabase** | Auth, tabela `profiles` e demais dados remotos |

> O app Flutter **não** deve falar com o Supabase diretamente. Toda persistência remota passa por esta API.

---

## Comandos

```bash
npm install
npm run dev   # tsx watch → src/infra/http/server.ts
```

## Variáveis de ambiente

Arquivo `.env` na raiz do backend:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase (`https://...`) |
| `SUPABASE_KEY` | Anon key (ou service role, conforme o uso) |

Cliente: `src/infra/database/supabase.ts` (`@supabase/supabase-js`).

---

## Estrutura

```
├── src/
│   ├── config/                     # Configurações
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── index.ts
│   │
│   ├── modules/                    # Arquitetura por features (recomendado)
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.schema.ts      # Validação (Zod)
│   │   │   ├── users.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── ...
│   │   │
│   │   └── products/
│   │       └── ...
│   │
│   ├── shared/                     # Código compartilhado
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── helpers.ts
│   │   └── types/
│   │       └── express.d.ts         # Extensão de tipos do Express
│   │
│   ├── app.ts                      # Configuração do Express
│   └── server.ts                   # Ponto de entrada (sobe o servidor)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── supabase/                         
│   ├── schema.supabase
│   └── migrations/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── prettier.config.js
└── README.md

Scripts SQL na raiz:

| Arquivo | Uso |
|---------|-----|
| `supabase_schema.sql` | Cria schema inicial (tabelas, triggers) |
| `update_schema_roles.sql` | Adiciona RBAC (`profiles.role` + trigger) |

---

## Banco remoto (Supabase)

### Setup

1. No SQL Editor do Supabase, execute `supabase_schema.sql`.
2. Em seguida, execute `update_schema_roles.sql` (coluna `role` + trigger).

### Controle de acesso (RBAC)

Níveis: `padrao` · `administrador`.

| Item | Descrição |
|------|-----------|
| `profiles.role` | `text NOT NULL DEFAULT 'padrao'` |
| Trigger `handle_new_user` | Ao criar usuário no Auth, insere em `profiles` com `role` de `raw_user_meta_data.role` ou `'padrao'` |

Migração: `update_schema_roles.sql`.

### Middlewares

| Middleware | Função |
|------------|--------|
| `ensureAuthenticated` | Valida JWT via `supabase.auth.getUser(token)` e monta `request.user` (inclui `role` do perfil) |
| `checkLicensing` | Bloqueia se licença/trial expirou (**HTTP 402**). Role `administrador` ignora restrição de plano/expiração |

Trial padrão: **1 ano**.

### Rotas administrativas

Exigem autenticação + role `administrador`:

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/admin/users` | Lista usuários (nome, email, status da licença) |
| `GET` | `/admin/users/:id` | Detalhes (perfil, transações, investimentos) |

Implementação: `AdminController` + `admin.routes.ts`.

---

## Segurança e integrações

1. **JWT** — emitido/validado via Supabase Auth; a API confere o token em toda rota privada.
2. **Licenciamento** — `checkLicensing` nas rotas de features core.
3. **Integrações externas** (sempre nesta API, nunca no Flutter):
   - Stripe (Web/Desktop)
   - In-App Purchase (validação no servidor)
   - WhatsApp Chatbot
   - B3 / Brapi
   - Pluggy (Open Finance)
   - Notificações e dashboards consolidados

---

## Checklist de segurança

- [ ] `ensureAuthenticated` em todas as rotas privadas
- [ ] `checkLicensing` nas rotas de funcionalidades core
- [ ] Webhooks do Stripe validados com assinatura
- [ ] In-App Purchases validados no servidor antes de atualizar o perfil
- [ ] Rotas `/admin/*` restritas a role `administrador`
- [ ] Scripts SQL aplicados no projeto Supabase antes do deploy

---

## App Flutter

Documentação do banco **local (Drift)**, UI e feature flags de `role` no dispositivo:

→ [`investidorprotagonista/README.md`](../investidorprotagonista/README.md)
