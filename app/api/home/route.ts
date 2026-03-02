import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // Aktif yarışma (featured)
    const featuredCompetition = await prisma.competition.findFirst({
      where: {
        status: 'active',
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
      include: {
        entries: {
          take: 3,
          orderBy: { votesCount: 'desc' },
          include: {
            pet: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        _count: { select: { entries: true } },
      },
    });

    // Güncel yarışmalar (3 adet)
    const competitions = await prisma.competition.findMany({
      where: {
        status: 'active',
        endDate: { gte: now },
      },
      take: 3,
      orderBy: { endDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        startDate: true,
        endDate: true,
        entryPoints: true,
        _count: { select: { entries: true } },
      },
    });

    // Devam eden etkinlikler
    const currentEvents = await prisma.event.findMany({
      where: {
        status: 'active',
        eventDate: { lte: now },
        OR: [
          { endDate: { gte: now } },
          { endDate: null },
        ],
      },
      take: 2,
      orderBy: { eventDate: 'asc' },
    });

    // Gelecek etkinlikler
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: 'upcoming',
        eventDate: { gt: now },
      },
      take: 3,
      orderBy: { eventDate: 'asc' },
    });

    // Son hikayeler (3 adet)
    const stories = await prisma.story.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        pet: {
          select: { id: true, name: true, imageUrl: true, species: true },
        },
      },
    });

    // Eş arayan petler (3 adet) - Son match request alan petler
    const matchingPets = await prisma.pet.findMany({
      where: {
        moderationStatus: 'approved',
        gender: { in: ['erkek', 'dişi'] },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true },
        },
      },
    });

    // Kayıp/Sahiplendirme ilanları (3 adet)
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Makaleler (3 adet)
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    // Satış ortaklığı ürünleri (6 adet)
    const affiliateProducts = await prisma.affiliateProduct.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      featuredCompetition,
      competitions,
      currentEvents,
      upcomingEvents,
      stories,
      matchingPets,
      listings,
      articles,
      affiliateProducts,
    });
  } catch (error) {
    console.error('Home API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
