import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Hikaye beğen/beğeniyi kaldır
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const story = await prisma.story.findUnique({
      where: { id: params.id },
    });

    if (!story) {
      return NextResponse.json({ error: 'Hikaye bulunamadı' }, { status: 404 });
    }

    // Mevcut beğeniyi kontrol et
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId: params.id,
      },
    });

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      await prisma.story.update({
        where: { id: params.id },
        data: { likesCount: { decrement: 1 } },
      });

      const updatedStory = await prisma.story.findUnique({
        where: { id: params.id },
        select: { likesCount: true },
      });

      return NextResponse.json({
        liked: false,
        likesCount: updatedStory?.likesCount ?? 0,
      });
    } else {
      // Beğen
      await prisma.like.create({
        data: {
          userId: session.user.id,
          storyId: params.id,
        },
      });

      await prisma.story.update({
        where: { id: params.id },
        data: { likesCount: { increment: 1 } },
      });

      const updatedStory = await prisma.story.findUnique({
        where: { id: params.id },
        select: { likesCount: true },
      });

      return NextResponse.json({
        liked: true,
        likesCount: updatedStory?.likesCount ?? 0,
      });
    }
  } catch (error) {
    console.error('Like story error:', error);
    return NextResponse.json({ error: 'Beğeni işlemi başarısız' }, { status: 500 });
  }
}
