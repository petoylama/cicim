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
    const { action } = body; // action: 'dismiss' | 'remove_content'

    if (!action || !['dismiss', 'remove_content'].includes(action)) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Şikayet bulunamadı' }, { status: 404 });
    }

    // Şikayeti çözümle
    await prisma.report.update({
      where: { id: params.id },
      data: { status: action === 'dismiss' ? 'dismissed' : 'resolved' },
    });

    // İçeriği kaldır (eğer seçildiyse)
    if (action === 'remove_content') {
      if (report.petId) {
        await prisma.pet.update({
          where: { id: report.petId },
          data: { moderationStatus: 'rejected' },
        });
      }
      if (report.storyId) {
        await prisma.story.delete({ where: { id: report.storyId } });
      }
      if (report.commentId) {
        await prisma.comment.delete({ where: { id: report.commentId } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resolve report error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
