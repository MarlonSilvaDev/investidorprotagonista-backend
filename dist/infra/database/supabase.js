"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
/**
 * ⚠️ LEGADO — ponte de compatibilidade.
 *
 * Este módulo existe apenas para não quebrar imports antigos durante a
 * migração. Toda nova referência deve importar de `../../data/database`
 * (`getDatabase()` / `setDatabase()`).
 *
 * A camada de dados real e isolada vive em `src/data/database.ts`, com a
 * implementação Supabase em `src/data/supabase-data-source.ts`.
 */
const database_1 = require("../../data/database");
/** @deprecated use `getDatabase()` de `src/data/database` */
exports.supabase = (0, database_1.getDatabase)();
/** @deprecated use `getDatabase()` de `src/data/database` */
exports.supabaseAdmin = (0, database_1.getDatabase)();
//# sourceMappingURL=supabase.js.map