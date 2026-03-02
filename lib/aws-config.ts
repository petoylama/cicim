import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_BUCKET = 'cicipet-uploads';

// Singleton: sadece ilk çağrıda oluşturulur, module yüklenirken ASLA değil
let _admin: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}
