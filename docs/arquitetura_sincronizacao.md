Essa arquitetura é praticamente o que apps como Notion, Todoist, Linear, Obsidian Sync e alguns módulos do WhatsApp utilizam: offline-first. O banco principal do aplicativo é o Drift (SQLite) e o Supabase é apenas a fonte de sincronização.



O maior desafio não é sincronizar os dados, e sim sincronizar mudanças de estrutura (schema).



Arquitetura

&#x20;               Flutter

&#x20;                  │

&#x20;       ┌──────────┴──────────┐

&#x20;       │                     │

&#x20;    Drift(SQLite)      Sync Service

&#x20;       │                     │

&#x20;       │              Background Worker

&#x20;       │                     │

&#x20;       └──────────┬──────────┘

&#x20;                  │

&#x20;              Supabase



O usuário sempre grava e lê do Drift.



Nunca grava diretamente no Supabase.



Fluxo normal



Usuário cria uma categoria.



INSERT Drift



Ao mesmo tempo:



sync\_queue



id

table\_name = categories

operation = INSERT

record\_id

payload

status=PENDING



O worker roda a cada poucos segundos ou quando a internet volta.



SELECT \* FROM sync\_queue

WHERE status='PENDING'



Envia



upsert categories



Se deu certo



status = SENT

Agora imagine uma atualização



Versão 1



categories



id

name

color



Depois você lança versão 2



categories



id

name

color

icon



O Supabase já possui



icon



Mas o usuário ainda está na versão antiga.



Ele possui



id

name

color



O que acontece?



Nada.



Porque o Supabase aceita que o aplicativo envie apenas



id

name

color



A coluna



icon



fica



NULL



ou



DEFAULT



desde que ela não seja obrigatória.



Por isso toda evolução de schema precisa ser compatível.



Problema



Agora imagine



Você removeu



color



do Supabase.



O aplicativo antigo envia



color



Resultado



column color does not exist



Falha.



Por isso nunca se remove coluna imediatamente.



O processo correto é



Versão 1



color



Versão 2



color

themeColor



Backend aceita ambos.



Depois de alguns meses



Remove



color

Alteração obrigatória



Exemplo



categories



name TEXT NOT NULL



Depois



icon TEXT NOT NULL



Aplicativo antigo envia



name



Erro



null value violates constraint



Por isso o certo é



icon TEXT DEFAULT ''



Nunca



NOT NULL



sem default.



Alterando Drift



Drift possui migrations.



schemaVersion => 2



No



MigrationStrategy

if (from < 2) {

&#x20;   await m.addColumn(categories, categories.icon);

}



Quando o usuário atualizar o aplicativo



Drift executa



ALTER TABLE



automaticamente.



Depois disso o worker sincroniza normalmente.



E se o usuário ficar meses sem atualizar?



Exemplo



Usuário



Schema 3



Servidor



Schema 8



Você pode armazenar uma tabela



app\_metadata



schema\_version

minimum\_app\_version



O aplicativo consulta



app\_metadata



Na inicialização.



Se



minimum\_app\_version > app.version



Mostra



Atualize o aplicativo para continuar usando.



Assim evita incompatibilidades graves.



Worker de sincronização



Normalmente ele faz:



1 - verifica internet



2 - baixa alterações



3 - aplica no Drift



4 - envia alterações locais



5 - remove fila enviada



6 - espera alguns segundos



7 - repete



Nunca faz



Enviar

↓



Baixar



Porque pode gerar conflitos.



Normalmente faz



Baixar primeiro



↓



Enviar depois



ou utiliza controle de versões/timestamps para resolver conflitos.



Como detectar alterações do servidor?



Cada tabela possui



updated\_at

id

name

updated\_at

deleted\_at



O app salva



last\_sync



Depois consulta



updated\_at > last\_sync



Baixa somente registros alterados.



Exclusões



Nunca utilize



DELETE



Use



deleted\_at



Exemplo



deleted\_at



NULL



↓



2026-07-31



Na sincronização



deleted\_at != NULL



Remove do Drift.



Isso evita perder informação caso um dispositivo ainda não tenha sincronizado.



Controle de versões do banco



Uma estratégia robusta é criar uma tabela no Supabase:



app\_metadata

\-------------

schema\_version

minimum\_app\_version

latest\_app\_version

maintenance\_mode



O app, ao iniciar:



1\. Consulta app\_metadata

2\. Compara sua versão local

3\. Executa migrations do Drift

4\. Inicia o worker



Se houver uma mudança incompatível (breaking change), basta aumentar minimum\_app\_version. Versões antigas são impedidas de sincronizar até serem atualizadas.



Arquitetura recomendada para Flutter + Drift + Supabase

Flutter

│

├── Drift (SQLite)

│     ├── Migrations

│     ├── Sync Queue

│     └── Metadata (last\_sync, schema\_version)

│

├── Repository

│     ├── Sempre lê/escreve no Drift

│     └── Nunca acessa Supabase diretamente

│

├── Sync Worker

│     ├── Detecta conexão

│     ├── Busca alterações do servidor

│     ├── Resolve conflitos

│     ├── Envia alterações pendentes

│     └── Atualiza last\_sync

│

└── Supabase

&#x20;     ├── Tabelas

&#x20;     ├── Realtime (opcional)

&#x20;     ├── Soft Delete (deleted\_at)

&#x20;     ├── updated\_at

&#x20;     └── app\_metadata



Essa abordagem permite que o aplicativo funcione completamente offline, sincronize automaticamente quando houver conexão e evolua o esquema do banco de forma segura, desde que as alterações sejam feitas de maneira compatível (adicionando colunas com valores padrão, evitando remover colunas imediatamente e usando migrações versionadas tanto no Drift quanto no banco do Supabase). Ela escala bem mesmo quando usuários ficam semanas ou meses sem atualizar o aplicativo.

