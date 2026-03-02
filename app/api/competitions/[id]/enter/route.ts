import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Yarışmaya katıl
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
      return NextResponse.json({ error: 'Yarışma aktif değil' }, { status: 400 });
    }

    // Pet'i kontrol et
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Bu pet size ait değil' }, { status: 403 });
    }

    if (pet.moderationStatus !== 'approved') {
      return NextResponse.json({ error: 'Petiniz henüz onaylı değil' }, { status: 400 });
    }

    // Zaten katılım var mı?
    const existingEntry = await prisma.competitionEntry.findFirst({
      where: {
        competitionId: params.id,
        petId,
      },
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'Bu pet zaten yarışmada' }, { status: 400 });
    }

    // Puan kontrolü
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true },
    });

    const entryPoints = competition.entryPoints || 50;

    if ((user?.points || 0) < entryPoints) {
      return NextResponse.json(
        { error: `Yeterli puanınız yok. Gerekli: ${entryPoints} CiciPuan` },
        { status: 400 }
      );
    }

    // Katılım oluştur ve puan düş
    const [entry] = await prisma.$transaction([
      prisma.competitionEntry.create({
        data: {
          competitionId: params.id,
          petId,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { points: { decrement: entryPoints } },
      }),
      prisma.pointsHistory.create({
        data: {
          userId: session.user.id,
          amount: -entryPoints,
          type: 'SPENT',
          description: `Yarışmaya katılım: ${competition.title}`,
        },
      }),
    ]);

    return NextResponse.json({ entry, pointsSpent: entryPoints });
  } catch (error) {
    console.error('Enter competition error:', error);
    return NextResponse.json({ error: 'Katılım başarısız' }, { status: 500 });
  }
}
