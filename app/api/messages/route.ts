import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// Konuşmaları listele (her kullanıcıyla son mesaj)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const userId = session.user.id;

    // Tüm mesajları al (gönderilen ve alınan)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Konuşmaları grupla (her kullanıcıyla son mesaj)
    const conversationsMap = new Map<string, {
      otherUser: { id: string; name: string | null; image: string | null };
      lastMessage: typeof messages[0];
      unreadCount: number;
    }>();

    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        // Okunmamış mesaj sayısını hesapla
        const unreadCount = messages.filter(
          (m) => m.senderId === otherUserId && m.receiverId === userId && !m.isRead
        ).length;

        conversationsMap.set(otherUserId, {
          otherUser,
          lastMessage: message,
          unreadCount
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// Yeni mesaj gönder
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Alıcı ve mesaj içeriği gerekli' }, { status: 400 });
    }

    // Küfür kontrolü
    if (containsProfanity(content)) {
      return NextResponse.json({ error: 'Mesajınızda uygunsuz içerik tespit edildi' }, { status: 400 });
    }

    // Kendine mesaj göndermeyi engelle
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Kendinize mesaj gönderemezsiniz' }, { status: 400 });
    }

    // Alıcı var mı kontrol et
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Alıcı bulunamadı' }, { status: 404 });
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } }
      }
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        type: 'new_message',
        title: 'Yeni Mesaj',
        message: `${session.user.name || 'Birisi'} size mesaj gönderdi`,
        userId: receiverId,
        relatedId: session.user.id
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
