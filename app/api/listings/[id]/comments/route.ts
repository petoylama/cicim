import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// GET - İlan yorumlarını getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    const comments = await prisma.listingComment.findMany({
      where: { listingId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yorum ekle
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const listingId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Yorum içeriği zorunludur' }, { status: 400 });
    }

    // Küfür kontrolü
    if (containsProfanity(content)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    // İlan var mı kontrol et
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    }

    // Transaction ile yorum ekle ve sayıyı güncelle
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.listingComment.create({
        data: {
          content: content.trim(),
          userId: session.user.id,
          listingId,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      await tx.listing.update({
        where: { id: listingId },
        data: { commentsCount: { increment: 1 } },
      });

      return newComment;
    });

    // Bildirim gönder (kendi ilanı değilse)
    if (listing.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'listing_comment',
          title: 'İlanınıza Yorum Yapıldı',
          message: `${session.user.name || 'Birisi'} "${listing.title}" ilanınıza yorum yaptı.`,
          userId: listing.userId,
          relatedId: listingId,
        },
      });
    }

    // Puan ver (günde max 5 yorum puanı)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayComments = await prisma.pointsHistory.count({
      where: {
        userId: session.user.id,
        type: 'listing_comment',
        createdAt: { gte: today },
      },
    });

    if (todayComments < 5) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { points: { increment: 5 } },
        }),
        prisma.pointsHistory.create({
          data: {
            userId: session.user.id,
            amount: 5,
            type: 'listing_comment',
            description: `"${listing.title}" ilanına yorum`,
          },
        }),
      ]);
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
