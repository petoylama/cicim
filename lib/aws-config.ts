import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client (service role - tam yetki)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage bucket adı
export const STORAGE_BUCKET = 'cicipet-uploads';

export function getStorageConfig() {
  return {
    bucket: STORAGE_BUCKET,
    url: supabaseUrl,
  };
}
