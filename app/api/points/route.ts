import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Kullanıcının puan geçmişini getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [history, total, user] = await Promise.all([
      prisma.pointsHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointsHistory.count({
        where: { userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true },
      }),
    ]);

    // İstatistikler
    const stats = await prisma.pointsHistory.groupBy({
      by: ['type'],
      where: { userId: session.user.id },
      _sum: { amount: true },
    });

    const earned = stats.find((s: { type: string; _sum: { amount: number | null } }) => s.type === 'EARNED')?._sum.amount || 0;
    const spent = stats.find((s: { type: string; _sum: { amount: number | null } }) => s.type === 'SPENT')?._sum.amount || 0;

    return NextResponse.json({
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      currentPoints: user?.points || 0,
      totalEarned: earned,
      totalSpent: Math.abs(spent),
    });
  } catch (error) {
    console.error('Get points history error:', error);
    return NextResponse.json({ error: 'Puan geçmişi getirilemedi' }, { status: 500 });
  }
}
