import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, description, imageUrl, contactPhone, contactEmail, isActive } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Ad ve konum gerekli' }, { status: 400 });
    }

    const shelter = await prisma.shelter.create({
      data: {
        name,
        location,
        description: description || null,
        imageUrl: imageUrl || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ shelter });
  } catch (error) {
    console.error('Create shelter error:', error);
    return NextResponse.json({ error: 'Barınak oluşturulamadı' }, { status: 500 });
  }
}
