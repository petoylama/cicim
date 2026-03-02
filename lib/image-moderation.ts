'use client';

// NSFW ve evcil hayvan kontrolü için LLM API kullanımı
export async function checkImageContent(imageBase64: string): Promise<{
  isAppropriate: boolean;
  hasPet: boolean;
  message: string;
}> {
  try {
    const response = await fetch('/api/image-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      // API başarısız olursa izin ver
      return { isAppropriate: true, hasPet: true, message: '' };
    }

    return await response.json();
  } catch (error) {
    console.error('Image check error:', error);
    // Hata durumunda izin ver
    return { isAppropriate: true, hasPet: true, message: '' };
  }
}
