import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// Tüm hikayeleri listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const myStories = searchParams.get('myStories') === 'true';

    const where: any = {};
    if (myStories) {
      where.authorId = session.user.id;
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          pet: {
            select: { id: true, name: true, species: true, imageUrl: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.story.count({ where }),
    ]);

    // Kullanıcının beğendiği hikayeleri kontrol et
    const likedStoryIds = await prisma.like.findMany({
      where: {
        userId: session.user.id,
        storyId: { in: stories.map((s: { id: string }) => s.id) },
      },
      select: { storyId: true },
    });

    const likedSet = new Set(likedStoryIds.map((l: { storyId: string | null }) => l.storyId));

    const storiesWithLikeStatus = stories.map((story: typeof stories[number]) => ({
      ...story,
      isLiked: likedSet.has(story.id),
    }));

    return NextResponse.json({
      stories: storiesWithLikeStatus,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json({ error: 'Hikayeler getirilemedi' }, { status: 500 });
  }
}

// Yeni hikaye oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, petId, imageUrl, cloudStoragePath, isPublic } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'İçerik gerekli' }, { status: 400 });
    }

    // Küfür kontrolü
    if (containsProfanity(title) || containsProfanity(content)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    // Pet sahibi kontrolü
    if (petId) {
      const pet = await prisma.pet.findUnique({
        where: { id: petId },
        select: { ownerId: true },
      });

      if (!pet || pet.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Bu pet size ait değil' }, { status: 403 });
      }
    }

    const story = await prisma.story.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        author: { connect: { id: session.user.id } },
        ...(petId ? { pet: { connect: { id: petId } } } : {}),
        imageUrl: imageUrl || null,
        cloudStoragePath: cloudStoragePath || null,
        isPublic: isPublic ?? true,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        pet: {
          select: { id: true, name: true, species: true, imageUrl: true },
        },
      },
    });

    // Hikaye paylaşınca +20 puan ver
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 20 } },
    });

    // Puan geçmişine ekle
    await prisma.pointsHistory.create({
      data: {
        userId: session.user.id,
        amount: 20,
        type: 'EARNED',
        description: 'Hikaye paylaşma',
      },
    });

    return NextResponse.json({ story, pointsEarned: 20 });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({ error: 'Hikaye oluşturulamadı' }, { status: 500 });
  }
}
