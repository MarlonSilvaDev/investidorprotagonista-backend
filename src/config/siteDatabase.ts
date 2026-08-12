import 'dotenv/config';
import { createDatabase, Database } from './database';

let siteInstance: Database | null = null;

/**
 * Retorna a instância do banco de dados do SITE (SITE_SUPABASE_URL).
 * NÃO utiliza o SUPABASE_URL do app como fallback.
 */
export function getSiteDatabase(): Database {
  if (!siteInstance) {
    const url = process.env.SITE_SUPABASE_URL || '';
    const serviceRoleKey =
      process.env.SITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SITE_SUPABASE_KEY ||
      '';

    if (!url || !url.startsWith('http')) {
      throw new Error(
        'SITE_SUPABASE_URL não configurada no arquivo .env. Defina a URL do projeto do site.'
      );
    }

    if (!serviceRoleKey || !serviceRoleKey.startsWith('eyJ')) {
      throw new Error(
        'SITE_SUPABASE_SERVICE_ROLE_KEY não configurada no arquivo .env.'
      );
    }

    siteInstance = createDatabase({
      url: url.replace(/\/rest\/v1\/?$/, ''),
      anonKey: process.env.SITE_SUPABASE_KEY,
      serviceRoleKey,
    });
  }

  return siteInstance;
}

export function resetSiteDatabase(): void {
  siteInstance = null;
}
