import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public API - Get active affiliate products
export async function GET() {
  try {
    const products = await prisma.affiliateProduct.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get affiliate products error:', error);
    return NextResponse.json({ error: 'Ürünler getirilemedi' }, { status: 500 });
  }
}
