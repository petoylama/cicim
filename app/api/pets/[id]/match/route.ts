import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// GET - Bu pet için gelen eşleşme isteklerini getir
export async function GET(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' veya 'received'

    // Pet sahibi mi kontrol et
    const pet = await prisma.pet.findUnique({ where: { id } });
    if (!pet) {
      return NextResponse.json({ error: 'Pet bulunamadı.' }, { status: 404 });
    }

    if (pet.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requests: any[];
    if (type === 'sent') {
      requests = await prisma.petMatchRequest.findMany({
        where: { petId: id },
        include: {
          targetPet: {
            include: {
              owner: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      requests = await prisma.petMatchRequest.findMany({
        where: { targetPetId: id },
        include: {
          pet: {
            include: {
              owner: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(
      requests.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get match requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Eşleşme isteği gönder
export async function POST(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetPetId } = await params;
    const body = await request.json();
    const { petId, message } = body;

    if (!petId) {
      return NextResponse.json({ error: 'Pet seçilmedi.' }, { status: 400 });
    }

    // Kendi petim mi kontrol et
    const myPet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!myPet || myPet.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Bu pet size ait değil.' }, { status: 403 });
    }

    // Hedef pet var mı?
    const targetPet = await prisma.pet.findUnique({ where: { id: targetPetId } });
    if (!targetPet) {
      return NextResponse.json({ error: 'Hedef pet bulunamadı.' }, { status: 404 });
    }

    // Kendi petine istek gönderemez
    if (targetPet.ownerId === session.user.id) {
      return NextResponse.json({ error: 'Kendi petinize istek gönderemezsiniz.' }, { status: 400 });
    }

    // Aynı tür mü?
    if (myPet.species !== targetPet.species) {
      return NextResponse.json({ error: 'Farklı türler eşleşemez.' }, { status: 400 });
    }

    // Zaten istek var mı?
    const existing = await prisma.petMatchRequest.findUnique({
      where: { petId_targetPetId: { petId, targetPetId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Bu pet için zaten bir istek gönderilmiş.' }, { status: 400 });
    }

    const matchRequest = await prisma.petMatchRequest.create({
      data: {
        petId,
        targetPetId,
        message,
        userId: session.user.id,
      },
      include: {
        pet: true,
        targetPet: {
          include: {
            owner: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        type: 'match_request',
        title: 'Yeni Eşleşme İsteği',
        message: `${myPet.name}, ${targetPet.name} ile eşleşmek istiyor!`,
        userId: targetPet.ownerId,
        relatedId: matchRequest.id,
      },
    });

    return NextResponse.json({
      ...matchRequest,
      createdAt: matchRequest.createdAt.toISOString(),
      updatedAt: matchRequest.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Create match request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
