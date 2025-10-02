/**

export const dynamic = 'force-dynamic';

 * Recently Viewed Products API - Malaysian E-commerce Platform
 * Tracks and retrieves user's recently viewed products for personalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const addRecentlyViewedSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

/**
 * GET /api/recently-viewed - Get user's recently viewed products
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const recentlyViewedItems = await prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    // Filter out inactive products and calculate ratings
    const formattedItems = recentlyViewedItems
      .filter(item => item.product.status === 'ACTIVE')
      .map(item => {
        const reviews = item.product.reviews;
        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            : 0;

        return {
          id: item.id,
          viewedAt: item.viewedAt,
          product: {
            ...item.product,
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviews.length,
            primaryImage: item.product.images[0] || null,
            images: undefined, // Remove images array to keep response clean
            reviews: undefined, // Remove reviews array to keep response clean
          },
        };
      });

    return NextResponse.json({
      items: formattedItems,
      totalCount: formattedItems.length,
    });
  } catch (error) {
    console.error('Error fetching recently viewed:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recently viewed products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recently-viewed - Add product to recently viewed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = addRecentlyViewedSchema.parse(body);

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Remove existing entry if it exists, then add new one
    await prisma.recentlyViewed.deleteMany({
      where: {
        userId: session.user.id,
        productId: productId,
      },
    });

    const recentlyViewedItem = await prisma.recentlyViewed.create({
      data: {
        userId: session.user.id,
        productId: productId,
        viewedAt: new Date(),
      },
    });

    // Keep only the last 50 recently viewed items per user
    const recentItems = await prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: 'desc' },
      select: { id: true },
      take: 50,
    });

    // Delete older items beyond the limit
    await prisma.recentlyViewed.deleteMany({
      where: {
        userId: session.user.id,
        id: {
          notIn: recentItems.map(item => item.id),
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Added to recently viewed',
        recentlyViewedItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to recently viewed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to add to recently viewed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recently-viewed - Clear all recently viewed products
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await prisma.recentlyViewed.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      message: 'Recently viewed cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
    return NextResponse.json(
      { message: 'Failed to clear recently viewed' },
      { status: 500 }
    );
  }
}
