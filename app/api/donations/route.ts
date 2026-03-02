import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Bağış oranı: 50 CiciPuan = 1 kap mama
const POINTS_PER_BOWL = 50;

// GET - Bağışları listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const shelterId = searchParams.get('shelterId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (shelterId) where.shelterId = shelterId;
    if (userId) where.userId = userId;

    const donations = await prisma.donation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
        shelter: { select: { id: true, name: true, location: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // İstatistikler
    const stats = await prisma.donation.aggregate({
      _sum: { foodBowls: true, pointsSpent: true },
      _count: { id: true },
    });

    return NextResponse.json({
      donations,
      stats: {
        totalBowls: stats._sum.foodBowls || 0,
        totalPoints: stats._sum.pointsSpent || 0,
        totalDonations: stats._count.id || 0,
      },
    });
  } catch (error) {
    console.error('Get donations error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni bağış yap
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { shelterId, foodBowls, message, type = 'points' } = await request.json();

    if (!shelterId || !foodBowls || foodBowls < 1) {
      return NextResponse.json({ error: 'Barınak ve mama kapı sayısı zorunludur' }, { status: 400 });
    }

    // Barınak var mı kontrol et
    const shelter = await prisma.shelter.findUnique({
      where: { id: shelterId },
    });

    if (!shelter || !shelter.isActive) {
      return NextResponse.json({ error: 'Barınak bulunamadı' }, { status: 404 });
    }

    // Puan hesapla
    const pointsNeeded = foodBowls * POINTS_PER_BOWL;

    // Kullanıcı puanını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true },
    });

    if (!user || user.points < pointsNeeded) {
      return NextResponse.json(
        { error: `Yeterli puanınız yok. ${foodBowls} kap mama için ${pointsNeeded} CiciPuan gerekli.` },
        { status: 400 }
      );
    }

    // Transaction ile bağışı gerçekleştir
    const result = await prisma.$transaction(async (tx) => {
      // Kullanıcı puanını düş
      await tx.user.update({
        where: { id: session.user.id },
        data: { points: { decrement: pointsNeeded } },
      });

      // Barınak toplam bağışını artır
      await tx.shelter.update({
        where: { id: shelterId },
        data: { totalDonations: { increment: foodBowls } },
      });

      // Bağış kaydı oluştur
      const donation = await tx.donation.create({
        data: {
          userId: session.user.id,
          shelterId,
          pointsSpent: pointsNeeded,
          foodBowls,
          type,
          message,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          shelter: { select: { id: true, name: true, location: true } },
        },
      });

      // Puan geçmişi kaydı
      await tx.pointsHistory.create({
        data: {
          userId: session.user.id,
          amount: -pointsNeeded,
          type: 'donation',
          description: `${shelter.name} barınağına ${foodBowls} kap mama bağışı`,
        },
      });

      return donation;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create donation error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
