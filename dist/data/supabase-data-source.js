"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseDataSource = void 0;
const database_1 = require("./database");
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
exports.supabaseDataSource = (0, database_1.createDatabase)({
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
});
exports.default = exports.supabaseDataSource;
//# sourceMappingURL=supabase-data-source.js.map