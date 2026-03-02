import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const myPets = searchParams.get('myPets');
    const status = searchParams.get('status') || 'approved';
    const species = searchParams.get('species');
    const gender = searchParams.get('gender');
    const location = searchParams.get('location');
    const lookingForMatch = searchParams.get('lookingForMatch');

    const session = await getServerSession(authOptions);

    const where: any = { moderationStatus: status };
    
    if (myPets === 'true' && session?.user?.id) {
      where.ownerId = session.user.id;
      delete where.moderationStatus; // Kendi petleri için tüm durumları göster
    } else if (userId) {
      where.ownerId = userId;
    }

    if (species && species !== 'all') {
      where.species = species;
    }
    if (gender && gender !== 'all') {
      where.gender = gender;
    }
    if (location && location !== 'all') {
      where.location = location;
    }
    if (lookingForMatch === 'true') {
      where.lookingForMatch = true;
    }

    const pets = await prisma.pet.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pets ?? []);
  } catch (error: any) {
    console.error('Get pets error:', error);
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, species, breed, gender, age, location, description, imageUrl, cloudStoragePath, isPublic, lookingForMatch } = body;

    if (!name || !species) {
      return NextResponse.json({ error: 'Name and species required' }, { status: 400 });
    }

    const pet = await prisma.pet.create({
      data: {
        name,
        species,
        breed,
        gender,
        age: age ? parseInt(age) : null,
        location,
        description,
        imageUrl,
        cloudStoragePath,
        isPublic: isPublic ?? true,
        lookingForMatch: lookingForMatch ?? false,
        moderationStatus: 'pending',
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(pet, { status: 201 });
  } catch (error: any) {
    console.error('Create pet error:', error);
    return NextResponse.json({ error: 'Failed to create pet' }, { status: 500 });
  }
}
