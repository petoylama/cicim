import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const competitions = await prisma.competition.findMany({
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('Get competitions error:', error);
    return NextResponse.json({ error: 'Yarışmalar getirilemedi' }, { status: 500 });
  }
}
