import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Yarışmada oy ver
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { petId } = body;

    if (!petId) {
      return NextResponse.json({ error: 'Pet seçimi gerekli' }, { status: 400 });
    }

    // Yarışmayı kontrol et
    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
    });

    if (!competition) {
      return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 404 });
    }

    const now = new Date();
    if (now < competition.startDate || now > competition.endDate) {
      return NextResponse.json({ error: 'Oylama süresi geçti' }, { status: 400 });
    }

    // Entry kontrol et
    const entry = await prisma.competitionEntry.findFirst({
      where: {
        competitionId: params.id,
        petId,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Bu pet yarışmada değil' }, { status: 400 });
    }

    // Daha önce oy verilmiş mi?
    const existingVote = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        competitionId: params.id,
        petId,
      },
    });

    if (existingVote) {
      // Oyu geri çek
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existingVote.id } }),
        prisma.competitionEntry.update({
          where: { id: entry.id },
          data: { votesCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ voted: false, votesCount: entry.votesCount - 1 });
    } else {
      // Oy ver
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: session.user.id,
            competitionId: params.id,
            petId,
          },
        }),
        prisma.competitionEntry.update({
          where: { id: entry.id },
          data: { votesCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ voted: true, votesCount: entry.votesCount + 1 });
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Oy verme başarısız' }, { status: 500 });
  }
}
