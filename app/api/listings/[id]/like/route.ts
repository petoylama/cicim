import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - İlanı beğen/beğeniyi kaldır
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

    // İlan var mı kontrol et
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    }

    // Mevcut beğeni kontrol et
    const existingLike = await prisma.listingLike.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.$transaction([
        prisma.listingLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ liked: false, likesCount: listing.likesCount - 1 });
    } else {
      // Beğen
      await prisma.$transaction([
        prisma.listingLike.create({
          data: {
            userId: session.user.id,
            listingId,
          },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      // Bildirim gönder (kendi ilanı değilse)
      if (listing.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: 'listing_like',
            title: 'İlanınız Beğenildi',
            message: `${session.user.name || 'Birisi'} "${listing.title}" ilanınızı beğendi.`,
            userId: listing.userId,
            relatedId: listingId,
          },
        });
      }

      return NextResponse.json({ liked: true, likesCount: listing.likesCount + 1 });
    }
  } catch (error) {
    console.error('Listing like error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// GET - Beğeni durumunu kontrol et
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    const listingId = params.id;

    const existingLike = await prisma.listingLike.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    return NextResponse.json({ liked: !!existingLike });
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json({ liked: false });
  }
}
