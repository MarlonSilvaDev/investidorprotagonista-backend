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
import { getDatabase } from '../../data/database';

/** @deprecated use `getDatabase()` de `src/data/database` */
export const supabase = getDatabase();

/** @deprecated use `getDatabase()` de `src/data/database` */
export const supabaseAdmin = getDatabase();
