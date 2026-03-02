import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Eşleşme önerileri (aynı tür, onaylı petler)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');
    const species = searchParams.get('species');

    // Kendi petlerimi al
    const myPets = await prisma.pet.findMany({
      where: { ownerId: session.user.id, moderationStatus: 'approved' },
    });

    const myPetIds = myPets.map((p: { id: string }) => p.id);

    // Mevcut istekleri al (zaten istek gönderilmiş petleri filtrele)
    const sentRequests = await prisma.petMatchRequest.findMany({
      where: { petId: { in: myPetIds } },
      select: { targetPetId: true },
    });
    const excludeIds = [...myPetIds, ...sentRequests.map((r: { targetPetId: string }) => r.targetPetId)];

    const where: Record<string, unknown> = {
      id: { notIn: excludeIds },
      ownerId: { not: session.user.id },
      moderationStatus: 'approved',
    };

    if (species) {
      where.species = species;
    }

    const suggestions = await prisma.pet.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(
      suggestions.map((p: typeof suggestions[0]) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get match suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
