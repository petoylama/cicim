import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import NewStoryClient from './new-story-client';

export const dynamic = 'force-dynamic';

export default async function NewStoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  // Kullanıcının petlerini getir
  const pets = await prisma.pet.findMany({
    where: {
      ownerId: session.user.id,
      moderationStatus: 'approved',
    },
    select: {
      id: true,
      name: true,
      species: true,
      imageUrl: true,
    },
  });

  return <NewStoryClient pets={pets} />;
}
