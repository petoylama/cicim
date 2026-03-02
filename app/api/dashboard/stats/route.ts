import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user stats
    const [totalPets, totalStories, totalLikes, activeCompetitions] = await Promise.all([
      prisma.pet.count({ where: { ownerId: userId } }),
      prisma.story.count({ where: { authorId: userId } }),
      prisma.like.count({
        where: {
          OR: [
            { pet: { ownerId: userId } },
            { story: { authorId: userId } },
          ],
        },
      }),
      prisma.competition.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      totalPets: totalPets ?? 0,
      totalStories: totalStories ?? 0,
      totalLikes: totalLikes ?? 0,
      activeCompetitions: activeCompetitions ?? 0,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
