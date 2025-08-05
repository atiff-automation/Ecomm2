/**
 * Product Reviews API Routes - Malaysian E-commerce Platform
 * Handles product review submission and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z
    .string()
    .min(1, 'Review title is required')
    .max(200, 'Title too long'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment too long'),
});

/**
 * GET /api/products/[slug]/reviews - Get product reviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Find product first
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Get reviews with pagination
    const [reviews, totalCount, ratingStats] = await Promise.all([
      // Get paginated reviews
      prisma.review.findMany({
        where: {
          productId: product.id,
          isApproved: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      // Get total count
      prisma.review.count({
        where: {
          productId: product.id,
          isApproved: true,
        },
      }),

      // Get rating statistics
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId: product.id,
          isApproved: true,
        },
        _count: {
          rating: true,
        },
      }),
    ]);

    // Calculate average rating and statistics
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Build rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const stat = ratingStats.find(s => s.rating === rating);
      return {
        rating,
        count: stat?._count.rating || 0,
        percentage:
          totalCount > 0
            ? Math.round(((stat?._count.rating || 0) / totalCount) * 100)
            : 0,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      reviews: reviews.map(review => ({
        ...review,
        user: {
          id: review.user.id,
          name: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
        },
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statistics: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: totalCount,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[slug]/reviews - Submit product review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = params;
    const body = await request.json();
    const reviewData = createReviewSchema.parse(body);

    // Find product
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: session.user.id,
          status: 'DELIVERED',
        },
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        ...reviewData,
        userId: session.user.id,
        productId: product.id,
        isVerifiedPurchase: !!hasPurchased,
        isApproved: false, // Reviews need admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'REVIEW',
        resourceId: review.id,
        details: {
          productName: product.name,
          rating: review.rating,
          isVerifiedPurchase: review.isVerifiedPurchase,
        },
      },
    });

    return NextResponse.json(
      {
        message:
          'Review submitted successfully. It will be published after admin approval.',
        review: {
          ...review,
          user: {
            id: review.user.id,
            name: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid review data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
