import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Tek yarışma detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
      include: {
        winner: {
          select: { id: true, name: true, imageUrl: true, species: true },
        },
        entries: {
          include: {
            pet: {
              include: {
                owner: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
          orderBy: { votesCount: 'desc' },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 404 });
    }

    // Kullanıcının katılım durumunu kontrol et
    const userPets = await prisma.pet.findMany({
      where: { ownerId: session.user.id, moderationStatus: 'approved' },
      select: { id: true, name: true, imageUrl: true, species: true },
    });

    const userEntries = competition.entries.filter(
      (entry) => entry.pet.ownerId === session.user.id
    );

    // Kullanıcının oy verdiği petleri kontrol et
    const userVotes = await prisma.like.findMany({
      where: {
        userId: session.user.id,
        competitionId: params.id,
      },
      select: { petId: true },
    });

    const votedPetIds = new Set(userVotes.map((v) => v.petId));

    const entriesWithVoteStatus = competition.entries.map((entry) => ({
      ...entry,
      hasVoted: votedPetIds.has(entry.petId),
    }));

    return NextResponse.json({
      competition: {
        ...competition,
        entries: entriesWithVoteStatus,
      },
      userPets,
      userEntries,
      userPoints: session.user.points,
    });
  } catch (error) {
    console.error('Get competition error:', error);
    return NextResponse.json({ error: 'Yarışma getirilemedi' }, { status: 500 });
  }
}
