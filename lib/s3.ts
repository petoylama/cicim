import { supabaseAdmin, STORAGE_BUCKET } from './aws-config';

/**
 * Supabase Storage'a dosya yüklemek için signed upload URL üretir.
 * Eski AWS S3 presigned URL mantığıyla aynı arayüzü korur.
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = true
) {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folder = isPublic ? 'public/uploads' : 'private/uploads';
  const cloud_storage_path = `${folder}/${timestamp}-${sanitizedFileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(cloud_storage_path);

  if (error || !data) {
    throw new Error(`Supabase Storage upload URL hatası: ${error?.message}`);
  }

  return { uploadUrl: data.signedUrl, cloud_storage_path };
}

/**
 * Yüklenen dosyanın public URL'ini döndürür.
 * Private dosyalar için signed download URL üretir (1 saatlik).
 */
export async function getFileUrl(cloud_storage_path: string, isPublic: boolean = true) {
  if (isPublic) {
    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(cloud_storage_path);
    return data.publicUrl;
  } else {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(cloud_storage_path, 3600); // 1 saat
    if (error || !data) {
      throw new Error(`Signed URL oluşturulamadı: ${error?.message}`);
    }
    return data.signedUrl;
  }
}

/**
 * Dosyayı Supabase Storage'dan siler.
 */
export async function deleteFile(cloud_storage_path: string) {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([cloud_storage_path]);
  if (error) {
    throw new Error(`Dosya silinemedi: ${error.message}`);
  }
}

// Multipart upload Supabase'de desteklenmiyor, doğrudan presigned URL kullan.
// Eski AWS multipart fonksiyonları stub olarak korunuyor (uyumluluk için):
export async function initiateMultipartUpload(fileName: string, isPublic: boolean = true) {
  return generatePresignedUploadUrl(fileName, 'application/octet-stream', isPublic);
}

export async function getPresignedUrlForPart() {
  throw new Error('Supabase Storage multipart upload desteklemiyor, generatePresignedUploadUrl kullanın.');
}

export async function completeMultipartUpload() {
  // Supabase'de gerekli değil - presigned URL ile upload tamamlandığında otomatik biter
}
