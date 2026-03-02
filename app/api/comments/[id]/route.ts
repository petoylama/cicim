import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Yorum sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Yorum bulunamadı' }, { status: 404 });
    }

    // Sadece yorum sahibi veya admin silebilir
    if (comment.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    // İlgili içeriğin commentsCount'unu güncelle
    if (comment.petId) {
      await prisma.pet.update({
        where: { id: comment.petId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
    if (comment.storyId) {
      await prisma.story.update({
        where: { id: comment.storyId },
        data: { commentsCount: { decrement: 1 } },
      });
    }

    await prisma.comment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment delete error:', error);
    return NextResponse.json({ error: 'Yorum silinemedi' }, { status: 500 });
  }
}
