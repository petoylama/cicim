import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { containsProfanity, getProfanityWarning } from '@/lib/profanity-filter';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// GET - Tek ilan
export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      lastSeenDate: listing.lastSeenDate?.toISOString() || null,
    });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - İlan güncelle
export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    if (listing.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status: newStatus, ...rest } = body;

    // Profanity check
    if (title && containsProfanity(title)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }
    if (description && containsProfanity(description)) {
      return NextResponse.json({ error: getProfanityWarning() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (newStatus && ['active', 'found', 'adopted', 'closed'].includes(newStatus)) {
      updateData.status = newStatus;
    }
    if (rest.lastSeenDate) {
      updateData.lastSeenDate = new Date(rest.lastSeenDate);
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastSeenDate: updated.lastSeenDate?.toISOString() || null,
    });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - İlan sil
export async function DELETE(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    if (listing.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
