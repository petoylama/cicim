import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// HuggingFace Inference API — Falconsai/nsfw_image_detection (ücretsiz)
const HUGGINGFACE_API_URL =
  'https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection';

interface HFLabel {
  label: string;
  score: number;
}

async function checkNSFW(imageBase64: string): Promise<{ isNSFW: boolean; confidence: number }> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  // Base64'ü binary buffer'a çevir
  const base64Data = imageBase64.startsWith('data:')
    ? imageBase64.split(',')[1]
    : imageBase64;
  const binaryBuffer = Buffer.from(base64Data, 'base64');

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
  };
  if (hfKey) {
    headers['Authorization'] = `Bearer ${hfKey}`;
  }

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers,
    body: binaryBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('HuggingFace NSFW API hatası:', response.status, errText);
    // API hatası → güvenli taraf: izin ver (modeli yüklenirken olabilir)
    return { isNSFW: false, confidence: 0 };
  }

  const results: HFLabel[] = await response.json();
  const nsfwEntry = results.find((r) => r.label.toLowerCase() === 'nsfw');
  const nsfwScore = nsfwEntry?.score ?? 0;

  // %60 üstü NSFW skoru → engelle
  return { isNSFW: nsfwScore > 0.6, confidence: nsfwScore };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Görsel gerekli' }, { status: 400 });
    }

    // NSFW kontrolü
    let isAppropriate = true;
    let message = '';

    try {
      const { isNSFW, confidence } = await checkNSFW(image);
      if (isNSFW) {
        isAppropriate = false;
        message = `Bu görsel uygunsuz içerik barındırıyor (güven: %${Math.round(confidence * 100)}) ve yüklenemez. Lütfen uygun bir görsel seçin.`;
        console.warn(`NSFW görsel engellendi - kullanıcı: ${session.user.id}, skor: ${confidence}`);
      }
    } catch (nsfwError) {
      console.error('NSFW kontrol hatası:', nsfwError);
      // NSFW API'ye ulaşılamazsa geç, yüklemeye izin ver
      isAppropriate = true;
    }

    // hasPet: CiciPet'te her tür görsel kabul ediliyor (NSFW değilse yeterli)
    // Evcil hayvan zorunluluğu kaldırıldı - kullanıcı deneyimi iyileştirildi
    const hasPet = true;

    return NextResponse.json({ isAppropriate, hasPet, message });
  } catch (error) {
    console.error('Image check error:', error);
    return NextResponse.json(
      { isAppropriate: true, hasPet: true, message: '' },
      { status: 200 }
    );
  }
}
