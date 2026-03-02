import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Barınakları listele
export async function GET() {
  try {
    const shelters = await prisma.shelter.findMany({
      where: { isActive: true },
      orderBy: { totalDonations: 'desc' },
    });

    return NextResponse.json({ shelters });
  } catch (error) {
    console.error('Get shelters error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni barınak ekle (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { name, description, location, imageUrl, contactPhone, contactEmail, website } = await request.json();

    if (!name || !location) {
      return NextResponse.json({ error: 'Barınak adı ve konum zorunludur' }, { status: 400 });
    }

    const shelter = await prisma.shelter.create({
      data: {
        name,
        description,
        location,
        imageUrl,
        contactPhone,
        contactEmail,
        website,
      },
    });

    return NextResponse.json(shelter, { status: 201 });
  } catch (error) {
    console.error('Create shelter error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
