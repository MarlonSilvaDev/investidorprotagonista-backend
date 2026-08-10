import 'dotenv/config';
import { SupabaseClient } from '@supabase/supabase-js';
/** Cliente geral (login/getUser). Preferir service role no backend. */
export declare const supabase: SupabaseClient;
/** Alias explícito para operações admin (createUser, updateUserById). */
export declare const supabaseAdmin: SupabaseClient<any, "public", "public", any, any>;
//# sourceMappingURL=supabase.d.ts.map