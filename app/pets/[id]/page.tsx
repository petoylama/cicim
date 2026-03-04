import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PetDetailClient from './pet-detail-client';

export const dynamic = 'force-dynamic';

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!pet) {
    notFound();
  }

  // Beğeni durumunu kontrol et
  const like = await prisma.like.findFirst({
    where: {
      userId: session.user.id,
      petId: params.id,
    },
  });

  // Serialize dates for client component
  const serializedComments = pet.comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  }));

  return (
    <PetDetailClient
      pet={{
        ...pet,
        createdAt: pet.createdAt.toISOString(),
        updatedAt: pet.updatedAt.toISOString(),
      }}
      initialComments={serializedComments}
      initialIsLiked={!!like}
    />
  );
}
