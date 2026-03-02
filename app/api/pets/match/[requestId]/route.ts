import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ requestId: string }> };

// PATCH - İsteği kabul/reddet
export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const { status } = body; // 'accepted' veya 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 });
    }

    const matchRequest = await prisma.petMatchRequest.findUnique({
      where: { id: requestId },
      include: {
        pet: true,
        targetPet: true,
      },
    });

    if (!matchRequest) {
      return NextResponse.json({ error: 'İstek bulunamadı.' }, { status: 404 });
    }

    // Hedef pet sahibi mi?
    if (matchRequest.targetPet.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    if (matchRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Bu istek zaten yanıtlanmış.' }, { status: 400 });
    }

    const updated = await prisma.petMatchRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        type: 'match_response',
        title: status === 'accepted' ? 'Eşleşme Kabul Edildi! 🎉' : 'Eşleşme Reddedildi',
        message:
          status === 'accepted'
            ? `${matchRequest.targetPet.name}, ${matchRequest.pet.name} ile eşleşmeyi kabul etti!`
            : `${matchRequest.targetPet.name}, ${matchRequest.pet.name} ile eşleşmeyi reddetti.`,
        userId: matchRequest.userId,
        relatedId: requestId,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Update match request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - İsteği iptal et
export async function DELETE(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    const matchRequest = await prisma.petMatchRequest.findUnique({
      where: { id: requestId },
      include: { pet: true },
    });

    if (!matchRequest) {
      return NextResponse.json({ error: 'İstek bulunamadı.' }, { status: 404 });
    }

    // İstek sahibi mi?
    if (matchRequest.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    await prisma.petMatchRequest.delete({ where: { id: requestId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete match request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
