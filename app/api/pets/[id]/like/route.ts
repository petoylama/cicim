import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const petId = params?.id;
    const userId = session.user.id;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_petId: {
          userId,
          petId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      await prisma.pet.update({
        where: { id: petId },
        data: { likesCount: { decrement: 1 } },
      });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          petId,
        },
      });
      await prisma.pet.update({
        where: { id: petId },
        data: { likesCount: { increment: 1 } },
      });
      liked = true;

      // Award points
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 5 } },
      });
      await prisma.pointsHistory.create({
        data: {
          userId,
          amount: 5,
          type: 'pet_like',
          description: 'Pet beğeni',
        },
      });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { likesCount: true },
    });

    return NextResponse.json({ liked, likesCount: pet?.likesCount ?? 0 });
  } catch (error: any) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to process like' }, { status: 500 });
  }
}
