import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Kullanıcının tüm eşleşme isteklerini getir
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent', 'received', 'accepted'

    // Kendi petlerimi al
    const myPets = await prisma.pet.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    const myPetIds = myPets.map((p: { id: string }) => p.id);

    let where: Record<string, unknown> = {};

    if (type === 'sent') {
      where = { petId: { in: myPetIds } };
    } else if (type === 'received') {
      where = { targetPetId: { in: myPetIds }, status: 'pending' };
    } else if (type === 'accepted') {
      where = {
        OR: [
          { petId: { in: myPetIds }, status: 'accepted' },
          { targetPetId: { in: myPetIds }, status: 'accepted' },
        ],
      };
    } else {
      // Tüm istekler
      where = {
        OR: [
          { petId: { in: myPetIds } },
          { targetPetId: { in: myPetIds } },
        ],
      };
    }

    const requests = await prisma.petMatchRequest.findMany({
      where,
      include: {
        pet: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        targetPet: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      requests.map((r: typeof requests[0]) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get user match requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
