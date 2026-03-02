import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Tüm yarışmaları listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const now = new Date();

    let whereClause: any = {};
    if (status === 'active') {
      whereClause = {
        startDate: { lte: now },
        endDate: { gte: now },
        status: 'active',
      };
    } else if (status === 'upcoming') {
      whereClause = {
        startDate: { gt: now },
        status: 'active',
      };
    } else if (status === 'completed') {
      whereClause = {
        OR: [
          { endDate: { lt: now } },
          { status: 'completed' },
        ],
      };
    }

    const competitions = await prisma.competition.findMany({
      where: whereClause,
      include: {
        winner: {
          select: { id: true, name: true, imageUrl: true, species: true },
        },
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('Get competitions error:', error);
    return NextResponse.json({ error: 'Yarışmalar getirilemedi' }, { status: 500 });
  }
}

// Yeni yarışma oluştur (sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, entryPoints, imageUrl, cloudStoragePath, topic, category, maxParticipants } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    const competition = await prisma.competition.create({
      data: {
        title,
        description: description || '',
        imageUrl: imageUrl || null,
        cloudStoragePath: cloudStoragePath || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        entryPoints: entryPoints || 50,
        status: 'active',
        topic: topic || null,
        category: category || 'appearance',
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      },
    });

    return NextResponse.json({ competition });
  } catch (error) {
    console.error('Create competition error:', error);
    return NextResponse.json({ error: 'Yarışma oluşturulamadı' }, { status: 500 });
  }
}
