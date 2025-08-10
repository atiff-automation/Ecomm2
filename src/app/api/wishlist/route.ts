/**
 * Wishlist API - Malaysian E-commerce Platform
 * Handles user wishlist operations with membership integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

const removeFromWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

/**
 * GET /api/wishlist - Get user's wishlist with product details
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average ratings and format response
    const formattedWishlist = wishlistItems.map(item => {
      const reviews = item.product.reviews;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      return {
        id: item.id,
        createdAt: item.createdAt,
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
      items: formattedWishlist,
      totalCount: formattedWishlist.length,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { message: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist - Add item to wishlist
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
    const { productId } = addToWishlistSchema.parse(body);

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

    // Check if already in wishlist
    const existingWishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    if (existingWishlistItem) {
      return NextResponse.json(
        { message: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId: productId,
      },
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
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Added to wishlist successfully',
        wishlistItem: {
          ...wishlistItem,
          product: {
            ...wishlistItem.product,
            primaryImage: wishlistItem.product.images[0] || null,
            images: undefined,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid wishlist data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist - Remove item from wishlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = removeFromWishlistSchema.parse(body);

    // Remove from wishlist
    const deletedItem = await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId: productId,
      },
    });

    if (deletedItem.count === 0) {
      return NextResponse.json(
        { message: 'Item not found in wishlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Removed from wishlist successfully',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid wishlist data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
