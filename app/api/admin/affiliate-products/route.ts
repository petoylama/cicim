import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Admin API - Get all affiliate products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const products = await prisma.affiliateProduct.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get affiliate products error:', error);
    return NextResponse.json({ error: 'Ürünler getirilemedi' }, { status: 500 });
  }
}

// Admin API - Create affiliate product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, imageUrl, affiliateUrl, platform, price, sortOrder } = body;

    if (!name || !affiliateUrl) {
      return NextResponse.json({ error: 'Ad ve link gerekli' }, { status: 400 });
    }

    const product = await prisma.affiliateProduct.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        affiliateUrl,
        platform: platform || 'trendyol',
        price: price || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Create affiliate product error:', error);
    return NextResponse.json({ error: 'Ürün oluşturulamadı' }, { status: 500 });
  }
}
