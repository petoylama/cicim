import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import CompetitionDetailClient from './competition-detail-client';

export const dynamic = 'force-dynamic';

export default async function CompetitionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
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
    notFound();
  }

  // Kullanıcının petlerini getir
  const userPets = await prisma.pet.findMany({
    where: { ownerId: session.user.id, moderationStatus: 'approved' },
    select: { id: true, name: true, imageUrl: true, species: true },
  });

  // Kullanıcının oy verdiği petleri kontrol et
  const userVotes = await prisma.like.findMany({
    where: {
      userId: session.user.id,
      competitionId: params.id,
    },
    select: { petId: true },
  });

  const votedPetIds = userVotes.map((v) => v.petId);

  // Kullanıcının katılımı var mı?
  const userEntryPetIds = competition.entries
    .filter((e) => e.pet.ownerId === session.user.id)
    .map((e) => e.petId);

  // Serialize
  const serializedCompetition = {
    ...competition,
    startDate: competition.startDate.toISOString(),
    endDate: competition.endDate.toISOString(),
    createdAt: competition.createdAt.toISOString(),
    updatedAt: competition.updatedAt.toISOString(),
    entries: competition.entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      hasVoted: votedPetIds.includes(entry.petId),
      pet: {
        ...entry.pet,
        createdAt: entry.pet.createdAt.toISOString(),
        updatedAt: entry.pet.updatedAt.toISOString(),
      },
    })),
  };

  // Kullanıcı puanını getir
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true },
  });

  return (
    <CompetitionDetailClient
      competition={serializedCompetition}
      userPets={userPets}
      userEntryPetIds={userEntryPetIds}
      userPoints={user?.points || 0}
    />
  );
}
