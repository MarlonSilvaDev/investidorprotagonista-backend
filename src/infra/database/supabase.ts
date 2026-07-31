import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '');
const supabaseKey = process.env.SUPABASE_KEY;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error(
    'SUPABASE_URL inválida. Use a URL do projeto (ex: https://xxxx.supabase.co), sem /rest/v1/'
  );
}

const isPlaceholderKey =
  !supabaseKey ||
  supabaseKey === 'YOUR_SUPABASE_ANON_KEY' ||
  !supabaseKey.startsWith('eyJ');

if (isPlaceholderKey) {
  throw new Error(
    'SUPABASE_KEY inválida. Configure a chave JWT do projeto no arquivo .env'
  );
}

if (
  !serviceRoleKey ||
  !serviceRoleKey.startsWith('eyJ') ||
  serviceRoleKey.includes('COLE_AQUI')
) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY inválida. No Dashboard → API Keys → legacy service_role, cole no .env'
  );
}

/** Cliente geral (login/getUser). Preferir service role no backend. */
export const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/** Alias explícito para operações admin (createUser, updateUserById). */
export const supabaseAdmin = supabase;
