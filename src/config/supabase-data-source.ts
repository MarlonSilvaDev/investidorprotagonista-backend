import { createDatabase } from './database';

/**
 * Implementação Supabase da camada de dados.
 *
 * Esta é a única implementação "oficial" do banco de dados atualmente.
 * Se o projeto migrar para outro banco (Postgres puro via Prisma/Drizzle,
 * MongoDB, etc.), crie um novo arquivo (ex.: `postgres-data-source.ts`) e
 * aponte `createDatabase`/o singleton em `database.ts` para ele.
 *
 * Exporta também a instância global pronta para uso, mantendo compatibilidade
 * com o código que antes importava `supabase`/`supabaseAdmin` diretamente.
 */
export const supabaseDataSource = createDatabase({
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
});

export default supabaseDataSource;
