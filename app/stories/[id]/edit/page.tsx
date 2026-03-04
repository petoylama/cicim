import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import EditStoryClient from './edit-story-client';

export const dynamic = 'force-dynamic';

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      pet: { select: { id: true, name: true, species: true } },
    },
  });

  if (!story) {
    notFound();
  }

  // Only owner can edit
  if (story.authorId !== session.user.id) {
    redirect('/stories');
  }

  // Get user's pets for selection
  const pets = await prisma.pet.findMany({
    where: { ownerId: session.user.id, moderationStatus: 'approved' },
    select: { id: true, name: true, species: true, imageUrl: true },
  });

  return <EditStoryClient story={story} pets={pets} />;
}
