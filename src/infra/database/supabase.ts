import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error(
    'SUPABASE_URL inválida. Configure uma URL real (https://...) no arquivo .env'
  );
}

if (!supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error(
    'SUPABASE_KEY inválida. Configure a anon key real no arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
