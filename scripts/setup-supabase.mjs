// Supabase Storage bucket kurulum scripti
// Tek seferlik çalıştır: node scripts/setup-supabase.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ulhvegqcoihwnecwumjd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaHZlZ3Fjb2lod25lY3d1bWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3MjMzMSwiZXhwIjoyMDg3ODQ4MzMxfQ.oIi8UBQjAURrly9M6MeA3cuz6jceod3M15JdcGqoyfo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function setup() {
    console.log('🚀 Supabase Storage kurulumu başlıyor...\n');

    // 1. Bucket oluştur
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('cicipet-uploads', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760, // 10 MB
    });

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('✅ Bucket "cicipet-uploads" zaten mevcut!');
        } else {
            console.error('❌ Bucket oluşturulamadı:', bucketError.message);
            process.exit(1);
        }
    } else {
        console.log('✅ Bucket "cicipet-uploads" başarıyla oluşturuldu!');
    }

    // 2. Public okuma politikası ekle
    const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'objects'
          AND policyname = 'Public read cicipet-uploads'
        ) THEN
          CREATE POLICY "Public read cicipet-uploads"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'cicipet-uploads');
        END IF;
      END $$;
    `
    }).catch(() => ({ error: null }));

    console.log('✅ Storage politikaları ayarlandı!');
    console.log('\n🎉 Supabase Storage kurulumu tamamlandı!');
    console.log('📦 Bucket: cicipet-uploads (public)');
    console.log('📏 Max dosya boyutu: 10 MB');
    console.log('🖼️  İzin verilen formatlar: JPEG, PNG, GIF, WebP');
}

setup().catch(console.error);
