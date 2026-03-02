import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Şüpheli e-posta kalıpları
const SUSPICIOUS_PATTERNS = [
  'example.com',
  '@doe.com',
  'test@test',
  'admin@admin',
  'user@user',
  'fake@',
  'bot@',
  '@mailinator.com',
  '@tempmail.com',
  '@guerrillamail.com',
  '@10minutemail.com',
  '@throwaway.com',
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    // Şüpheli kullanıcıları bul
    const suspiciousUsers = await prisma.user.findMany({
      where: {
        OR: SUSPICIOUS_PATTERNS.map(pattern => ({
          email: { contains: pattern, mode: 'insensitive' }
        }))
      },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true }
    });

    return NextResponse.json({ users: suspiciousUsers, count: suspiciousUsers.length });
  } catch (error) {
    console.error('Get suspicious users error:', error);
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    // Şüpheli kullanıcıları bul
    const suspiciousUsers = await prisma.user.findMany({
      where: {
        OR: SUSPICIOUS_PATTERNS.map(pattern => ({
          email: { contains: pattern, mode: 'insensitive' }
        }))
      },
      select: { id: true }
    });

    const userIds = suspiciousUsers.map((u: { id: string }) => u.id);
    
    if (userIds.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'Şüpheli kullanıcı bulunamadı' });
    }

    // Önce admin yetkilerini kaldır
    await prisma.user.updateMany({
      where: { id: { in: userIds }, isAdmin: true },
      data: { isAdmin: false }
    });

    // İlişkili kayıtları sil
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } });
    await prisma.like.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.listingLike.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.listingComment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.petMatchRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.pointsHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.dailySpin.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.donation.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.report.deleteMany({ where: { reporterId: { in: userIds } } });
    await prisma.listing.deleteMany({ where: { userId: { in: userIds } } });
    
    // Petler ve ilişkili kayıtları sil
    const petIds = (await prisma.pet.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } })).map((p: { id: string }) => p.id);
    if (petIds.length > 0) {
      await prisma.competitionEntry.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.petMatchRequest.deleteMany({ where: { OR: [{ petId: { in: petIds } }, { targetPetId: { in: petIds } }] } });
      await prisma.like.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.comment.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.story.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.pet.deleteMany({ where: { id: { in: petIds } } });
    }
    
    // Hikayeleri sil
    const storyIds = (await prisma.story.findMany({ where: { authorId: { in: userIds } }, select: { id: true } })).map((s: { id: string }) => s.id);
    if (storyIds.length > 0) {
      await prisma.like.deleteMany({ where: { storyId: { in: storyIds } } });
      await prisma.comment.deleteMany({ where: { storyId: { in: storyIds } } });
      await prisma.story.deleteMany({ where: { id: { in: storyIds } } });
    }
    
    // Session ve Account kayıtlarını sil
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    
    // Kullanıcıları sil
    const deleteResult = await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    return NextResponse.json({ 
      deleted: deleteResult.count, 
      message: `${deleteResult.count} şüpheli kullanıcı silindi` 
    });
  } catch (error) {
    console.error('Delete suspicious users error:', error);
    return NextResponse.json({ error: 'Silme işlemi başarısız' }, { status: 500 });
  }
}
