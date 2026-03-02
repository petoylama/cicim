import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// Yeni yorum oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { content, petId, storyId, competitionId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Yorum içeriği gerekli' }, { status: 400 });
    }

    // Küfür kontrolü
    if (containsProfanity(content)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    // En az bir hedef olmalı
    if (!petId && !storyId && !competitionId) {
      return NextResponse.json({ error: 'Yorum hedefi gerekli' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        petId: petId || null,
        storyId: storyId || null,
        competitionId: competitionId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // İlgili içeriğin commentsCount'unu güncelle ve içerik sahibini bul
    let contentOwnerId: string | null = null;

    if (petId) {
      const pet = await prisma.pet.update({
        where: { id: petId },
        data: { commentsCount: { increment: 1 } },
        select: { ownerId: true },
      });
      contentOwnerId = pet.ownerId;
    }
    if (storyId) {
      const story = await prisma.story.update({
        where: { id: storyId },
        data: { commentsCount: { increment: 1 } },
        select: { authorId: true },
      });
      contentOwnerId = story.authorId;
    }

    // Kendi içeriğine yorum yapınca puan vermiyoruz
    // Sadece başkalarının içeriklerine yorum yapınca +5 puan ver
    let pointsEarned = 0;
    if (contentOwnerId && contentOwnerId !== session.user.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { points: { increment: 5 } },
      });

      await prisma.pointsHistory.create({
        data: {
          userId: session.user.id,
          amount: 5,
          type: 'EARNED',
          description: 'Yorum yapma',
        },
      });
      pointsEarned = 5;
    }

    return NextResponse.json({ comment, pointsEarned });
  } catch (error) {
    console.error('Comment create error:', error);
    return NextResponse.json({ error: 'Yorum oluşturulamadı' }, { status: 500 });
  }
}
