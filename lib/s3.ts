import { getSupabaseAdmin, STORAGE_BUCKET } from './aws-config';

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = true
) {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folder = isPublic ? 'public/uploads' : 'private/uploads';
  const cloud_storage_path = `${folder}/${timestamp}-${sanitizedFileName}`;

  const { data, error } = await getSupabaseAdmin().storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(cloud_storage_path);

  if (error || !data) {
    throw new Error(`Supabase Storage upload URL hatası: ${error?.message}`);
  }

  return { uploadUrl: data.signedUrl, cloud_storage_path };
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean = true) {
  if (isPublic) {
    const { data } = getSupabaseAdmin().storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(cloud_storage_path);
    return data.publicUrl;
  } else {
    const { data, error } = await getSupabaseAdmin().storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(cloud_storage_path, 3600);
    if (error || !data) throw new Error(`Signed URL oluşturulamadı: ${error?.message}`);
    return data.signedUrl;
  }
}

export async function deleteFile(cloud_storage_path: string) {
  const { error } = await getSupabaseAdmin().storage
    .from(STORAGE_BUCKET)
    .remove([cloud_storage_path]);
  if (error) throw new Error(`Dosya silinemedi: ${error.message}`);
}

// Stubs (backward compat)
export async function initiateMultipartUpload(fileName: string, isPublic: boolean = true) {
  return generatePresignedUploadUrl(fileName, 'application/octet-stream', isPublic);
}
export async function getPresignedUrlForPart() {
  throw new Error('Multipart upload desteklenmiyor');
}
export async function completeMultipartUpload() { }
