import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

// GET - İlanları listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // lost, adoption
    const species = searchParams.get('species');
    const gender = searchParams.get('gender');
    const location = searchParams.get('location');
    const status = searchParams.get('status') || 'active';
    const userId = searchParams.get('userId');
    const myListings = searchParams.get('myListings') === 'true';

    const where: Record<string, unknown> = {};
    
    if (myListings && session?.user?.id) {
      where.userId = session.user.id;
    } else {
      where.status = status;
      if (userId) where.userId = userId;
    }
    
    if (type && type !== 'all') where.type = type;
    if (species && species !== 'all') where.species = species;
    if (gender && gender !== 'all') where.gender = gender;
    if (location && location !== 'all') where.location = location;

    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      listings.map((l: typeof listings[0]) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        lastSeenDate: l.lastSeenDate?.toISOString() || null,
      }))
    );
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Yeni ilan oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      petName,
      species,
      breed,
      gender,
      age,
      color,
      location,
      contactPhone,
      contactEmail,
      imageUrl,
      cloudStoragePath,
      isPublic,
      lastSeenDate,
    } = body;

    // Validasyon
    if (!type || !title || !description || !petName || !species || !location) {
      return NextResponse.json(
        { error: 'Tip, başlık, açıklama, pet adı, tür ve konum zorunludur.' },
        { status: 400 }
      );
    }

    if (!['lost', 'adoption'].includes(type)) {
      return NextResponse.json(
        { error: 'Geçersiz ilan tipi.' },
        { status: 400 }
      );
    }

    // Profanity check
    if (containsProfanity(title) || containsProfanity(description)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        type,
        title,
        description,
        petName,
        species,
        breed,
        gender,
        age,
        color,
        location,
        contactPhone,
        contactEmail,
        imageUrl,
        cloudStoragePath,
        isPublic: isPublic ?? false,
        lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : null,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      lastSeenDate: listing.lastSeenDate?.toISOString() || null,
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
