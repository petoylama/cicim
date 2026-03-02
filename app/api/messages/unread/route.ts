import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Okunmamış mesaj sayısını getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
