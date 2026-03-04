import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import StoryDetailClient from './story-detail-client';

export const dynamic = 'force-dynamic';

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      pet: {
        select: { id: true, name: true, species: true, imageUrl: true, breed: true },
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

  if (!story) {
    notFound();
  }

  // Beğeni durumunu kontrol et
  const like = await prisma.like.findFirst({
    where: {
      userId: session.user.id,
      storyId: id,
    },
  });

  // Serialize dates for client component
  const serializedComments = story.comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  }));

  const storyWithLikeStatus = {
    ...story,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    comments: serializedComments,
    isLiked: !!like,
  };

  return <StoryDetailClient story={storyWithLikeStatus} />;
}
