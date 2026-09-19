import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const reviews = await (prisma as any).productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    const reviewCount = reviews.length;
    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avgRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

    const distribution = {
      5: reviews.filter((r: any) => r.rating === 5).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      1: reviews.filter((r: any) => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      reviews,
      avgRating,
      reviewCount,
      distribution,
    });
  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product reviews.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const body = await request.json();
    const { rating, reviewerName, comment } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    const nameStr = (reviewerName || '').toString().trim() || 'Verified Customer';

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 }
      );
    }

    const newReview = await (prisma as any).productReview.create({
      data: {
        productId,
        rating: Math.round(numericRating),
        reviewerName: nameStr,
        comment: comment ? comment.toString().trim() : null,
      },
    });

    // Fetch updated aggregate summary
    const allReviews = await (prisma as any).productReview.findMany({
      where: { productId },
    });

    const reviewCount = allReviews.length;
    const totalRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avgRating = Number((totalRating / reviewCount).toFixed(1));

    const distribution = {
      5: allReviews.filter((r: any) => r.rating === 5).length,
      4: allReviews.filter((r: any) => r.rating === 4).length,
      3: allReviews.filter((r: any) => r.rating === 3).length,
      2: allReviews.filter((r: any) => r.rating === 2).length,
      1: allReviews.filter((r: any) => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      review: newReview,
      avgRating,
      reviewCount,
      distribution,
      message: 'Thank you! Your rating and review have been submitted.',
    });
  } catch (error: any) {
    console.error('Error submitting product review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    );
  }
}
