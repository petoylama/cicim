import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body; // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: params.id },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet bulunamadı' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.pet.update({
      where: { id: params.id },
      data: { moderationStatus: newStatus },
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        userId: pet.ownerId,
        type: 'pet_approved',
        title: action === 'approve' ? 'Petin Onaylandı! 🎉' : 'Pet Reddedildi',
        message:
          action === 'approve'
            ? `${pet.name} adlı petin başarıyla onaylandı ve artık herkes tarafından görülebilir.`
            : `${pet.name} adlı petin reddedildi. Sebep: ${reason || 'Belirtilmedi'}`,
        relatedId: pet.id,
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Moderate pet error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
