import 'dotenv/config';
import { Database } from './database';
/**
 * Retorna a instância do banco de dados do SITE (SITE_SUPABASE_URL).
 * NÃO utiliza o SUPABASE_URL do app como fallback.
 */
export declare function getSiteDatabase(): Database;
export declare function resetSiteDatabase(): void;
//# sourceMappingURL=siteDatabase.d.ts.map