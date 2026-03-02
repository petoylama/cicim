import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Storage bucket adı
export const STORAGE_BUCKET = 'cicipet-uploads';

// Lazy singleton: modül yüklenirken değil, ilk kullanımda oluşturulur.
// Bu şekilde build sırasında env var undefined olsa bile hata vermez.
let _admin: SupabaseClient | undefined;

function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}

// Proxy ile backward-compat: supabaseAdmin.storage.xxx gibi çağrılar çalışmaya devam eder
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(getAdmin(), prop, receiver);
  },
});

export function getStorageConfig() {
  return { bucket: STORAGE_BUCKET, url: process.env.SUPABASE_URL };
}
