import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandParam = searchParams.get('brand')?.trim();
    const bestsellerParam = searchParams.get('bestseller');
    const featuredParam = searchParams.get('featured');
    const limitParam = Number(searchParams.get('limit') || 30);

    const whereClause: any = {
      status: 'ACTIVE',
    };

    if (brandParam && brandParam !== 'ALL') {
      whereClause.brand = {
        equals: brandParam,
        mode: 'insensitive',
      };
    }

    if (bestsellerParam === 'true') {
      whereClause.isBestSeller = true;
    }

    if (featuredParam === 'true') {
      whereClause.isFeatured = true;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: limitParam,
      include: {
        images: {
          orderBy: { isPrimary: 'desc' },
        },
      },
      orderBy: [
        { isBestSeller: 'desc' },
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formattedProducts = products.map((p) => {
      const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || '';
      const mrpNum = Number(p.mrp || p.price);
      const priceNum = Number(p.price || 0);
      const discountPct = mrpNum > priceNum ? `${Math.round(((mrpNum - priceNum) / mrpNum) * 100)}% OFF` : undefined;

      return {
        id: p.id,
        brand: p.brand,
        name: p.name,
        slug: p.slug,
        price: priceNum,
        mrp: mrpNum,
        discount: discountPct,
        rating: 4.8,
        reviewsCount: 150,
        image: primaryImage,
        isBestSeller: p.isBestSeller,
        isFeatured: p.isFeatured,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedProducts,
    });
  } catch (error: any) {
    console.error('API Products GET Error:', error);
    return NextResponse.json(
      { success: false, data: [], error: error?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
