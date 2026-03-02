import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const [totalUsers, totalPets, pendingPets, totalStories, activeCompetitions, totalReports, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.pet.count({ where: { moderationStatus: 'pending' } }),
      prisma.story.count(),
      prisma.competition.count({ where: { status: 'active' } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPets,
      pendingPets,
      totalStories,
      activeCompetitions,
      totalReports,
      pendingReports,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'İstatistikler getirilemedi' }, { status: 500 });
  }
}
