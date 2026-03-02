import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// Tek hikaye getir
export async function GET(
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
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        pet: {
          select: { id: true, name: true, species: true, imageUrl: true, breed: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Hikaye bulunamadı' }, { status: 404 });
    }

    // Beğeni durumunu kontrol et
    const like = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId: params.id,
      },
    });

    return NextResponse.json({
      story: {
        ...story,
        isLiked: !!like,
      },
    });
  } catch (error) {
    console.error('Get story error:', error);
    return NextResponse.json({ error: 'Hikaye getirilemedi' }, { status: 500 });
  }
}

// Hikaye güncelle
export async function PUT(
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
      select: { authorId: true },
    });

    if (!story) {
      return NextResponse.json({ error: 'Hikaye bulunamadı' }, { status: 404 });
    }

    if (story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, imageUrl, cloudStoragePath, isPublic, petId } = body;

    // Küfür kontrolü
    if ((title && containsProfanity(title)) || (content && containsProfanity(content))) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    const updatedStory = await prisma.story.update({
      where: { id: params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(cloudStoragePath !== undefined && { cloudStoragePath }),
        ...(isPublic !== undefined && { isPublic }),
        ...(petId !== undefined && { petId }),
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

    return NextResponse.json({ story: updatedStory });
  } catch (error) {
    console.error('Update story error:', error);
    return NextResponse.json({ error: 'Hikaye güncellenemedi' }, { status: 500 });
  }
}

// Hikaye güncelle (PATCH - aynı işlem)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// Hikaye sil
export async function DELETE(
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
      select: { authorId: true },
    });

    if (!story) {
      return NextResponse.json({ error: 'Hikaye bulunamadı' }, { status: 404 });
    }

    if (story.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    // Önce yorumları ve beğenileri sil
    await prisma.comment.deleteMany({ where: { storyId: params.id } });
    await prisma.like.deleteMany({ where: { storyId: params.id } });

    await prisma.story.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json({ error: 'Hikaye silinemedi' }, { status: 500 });
  }
}
