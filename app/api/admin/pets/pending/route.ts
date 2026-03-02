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

    const pets = await prisma.pet.findMany({
      where: { moderationStatus: 'pending' },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Get pending pets error:', error);
    return NextResponse.json({ error: 'Petler getirilemedi' }, { status: 500 });
  }
}
