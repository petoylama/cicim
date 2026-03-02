import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: params?.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json(pet);
  } catch (error: any) {
    console.error('Get pet error:', error);
    return NextResponse.json({ error: 'Failed to fetch pet' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingPet = await prisma.pet.findUnique({
      where: { id: params?.id },
    });

    if (!existingPet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    if (existingPet.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, species, breed, gender, age, description, imageUrl, cloudStoragePath, isPublic } = body;

    const pet = await prisma.pet.update({
      where: { id: params?.id },
      data: {
        name,
        species,
        breed,
        gender,
        age: age ? parseInt(age) : null,
        description,
        imageUrl,
        cloudStoragePath,
        isPublic,
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

    return NextResponse.json(pet);
  } catch (error: any) {
    console.error('Update pet error:', error);
    return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: params?.id },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    if (pet.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from S3
    if (pet?.cloudStoragePath) {
      try {
        await deleteFile(pet.cloudStoragePath);
      } catch (e) {
        console.error('Failed to delete file from S3:', e);
      }
    }

    await prisma.pet.delete({
      where: { id: params?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete pet error:', error);
    return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 });
  }
}
