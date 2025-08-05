/**
 * Product Recommendations API - Malaysian E-commerce Platform
 * Provides personalized product recommendations based on user behavior
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/recommendations - Get personalized product recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const type = searchParams.get('type') || 'general'; // general, similar, trending
    const productId = searchParams.get('productId'); // for similar products
    const categoryId = searchParams.get('categoryId'); // for category-based

    let recommendations: any[] = [];

    if (session?.user) {
      // Personalized recommendations for logged-in users
      recommendations = await getPersonalizedRecommendations(
        session.user.id,
        limit,
        type,
        productId,
        categoryId
      );
    } else {
      // Generic recommendations for anonymous users
      recommendations = await getGenericRecommendations(
        limit,
        type,
        productId,
        categoryId
      );
    }

    // Format the response
    const formattedRecommendations = recommendations.map(product => {
      const reviews = product.reviews || [];
      const averageRating =
        reviews.length > 0
          ? reviews.reduce(
              (sum: number, review: any) => sum + review.rating,
              0
            ) / reviews.length
          : 0;

      return {
        ...product,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
        primaryImage:
          product.images?.find((img: any) => img.isPrimary) ||
          product.images?.[0] ||
          null,
        images: undefined, // Remove images array to keep response clean
        reviews: undefined, // Remove reviews array to keep response clean
      };
    });

    return NextResponse.json({
      recommendations: formattedRecommendations,
      totalCount: formattedRecommendations.length,
      type,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Get personalized recommendations for logged-in users
 */
async function getPersonalizedRecommendations(
  userId: string,
  limit: number,
  type: string,
  productId?: string,
  categoryId?: string
) {
  try {
    if (type === 'similar' && productId) {
      return await getSimilarProducts(productId, limit, userId);
    }

    if (type === 'category' && categoryId) {
      return await getCategoryRecommendations(categoryId, limit, userId);
    }

    // General personalized recommendations based on user behavior
    const userInteractions = await getUserInteractions(userId);

    if (userInteractions.categories.length > 0) {
      // Recommend products from user's favorite categories
      return await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          categoryId: {
            in: userInteractions.categories,
          },
          id: {
            notIn: userInteractions.viewedProducts,
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });
    }

    // Fallback to trending products
    return await getTrendingProducts(limit, userId);
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return await getTrendingProducts(limit, userId);
  }
}

/**
 * Get generic recommendations for anonymous users
 */
async function getGenericRecommendations(
  limit: number,
  type: string,
  productId?: string,
  categoryId?: string
) {
  try {
    if (type === 'similar' && productId) {
      return await getSimilarProducts(productId, limit);
    }

    if (type === 'category' && categoryId) {
      return await getCategoryRecommendations(categoryId, limit);
    }

    if (type === 'trending') {
      return await getTrendingProducts(limit);
    }

    // Default: featured and highly rated products
    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ featured: true }, { averageRating: { gte: 4.0 } }],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error getting generic recommendations:', error);
    return [];
  }
}

/**
 * Get similar products based on category and tags
 */
async function getSimilarProducts(
  productId: string,
  limit: number,
  excludeUserId?: string
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        categoryId: true,
        regularPrice: true,
      },
    });

    if (!product) {
      return [];
    }

    const excludeProducts = [productId];

    // Exclude products the user has already viewed if logged in
    if (excludeUserId) {
      const recentlyViewed = await prisma.recentlyViewed.findMany({
        where: { userId: excludeUserId },
        select: { productId: true },
        take: 20,
      });
      excludeProducts.push(...recentlyViewed.map(item => item.productId));
    }

    // Find products in the same category with similar price range
    const priceRange = product.regularPrice * 0.3; // 30% price range

    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId: product.categoryId,
        id: {
          notIn: excludeProducts,
        },
        regularPrice: {
          gte: product.regularPrice - priceRange,
          lte: product.regularPrice + priceRange,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
        { featured: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
}

/**
 * Get category-based recommendations
 */
async function getCategoryRecommendations(
  categoryId: string,
  limit: number,
  excludeUserId?: string
) {
  try {
    const excludeProducts: string[] = [];

    // Exclude products the user has already viewed if logged in
    if (excludeUserId) {
      const recentlyViewed = await prisma.recentlyViewed.findMany({
        where: { userId: excludeUserId },
        select: { productId: true },
        take: 20,
      });
      excludeProducts.push(...recentlyViewed.map(item => item.productId));
    }

    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId: categoryId,
        id: {
          notIn: excludeProducts,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error getting category recommendations:', error);
    return [];
  }
}

/**
 * Get trending products (most viewed, highest rated, recently added)
 */
async function getTrendingProducts(limit: number, excludeUserId?: string) {
  try {
    const excludeProducts: string[] = [];

    // Exclude products the user has already viewed if logged in
    if (excludeUserId) {
      const recentlyViewed = await prisma.recentlyViewed.findMany({
        where: { userId: excludeUserId },
        select: { productId: true },
        take: 20,
      });
      excludeProducts.push(...recentlyViewed.map(item => item.productId));
    }

    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        id: {
          notIn: excludeProducts,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: [
        { reviewCount: 'desc' },
        { averageRating: 'desc' },
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error getting trending products:', error);
    return [];
  }
}

/**
 * Get user interactions to understand preferences
 */
async function getUserInteractions(userId: string) {
  try {
    // Get user's recently viewed products and their categories
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            categoryId: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });

    // Get user's wishlist products and their categories
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            categoryId: true,
          },
        },
      },
      take: 20,
    });

    // Get user's cart items and their categories
    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    // Combine all interactions
    const allInteractions = [
      ...recentlyViewed.map(item => ({
        categoryId: item.product.categoryId,
        productId: item.productId,
      })),
      ...wishlist.map(item => ({
        categoryId: item.product.categoryId,
        productId: item.productId,
      })),
      ...cart.map(item => ({
        categoryId: item.product.categoryId,
        productId: item.productId,
      })),
    ];

    // Count category preferences
    const categoryCount: { [key: string]: number } = {};
    const viewedProducts: string[] = [];

    allInteractions.forEach(interaction => {
      categoryCount[interaction.categoryId] =
        (categoryCount[interaction.categoryId] || 0) + 1;
      if (!viewedProducts.includes(interaction.productId)) {
        viewedProducts.push(interaction.productId);
      }
    });

    // Sort categories by preference
    const preferredCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([categoryId]) => categoryId)
      .slice(0, 5); // Top 5 preferred categories

    return {
      categories: preferredCategories,
      viewedProducts,
    };
  } catch (error) {
    console.error('Error getting user interactions:', error);
    return {
      categories: [],
      viewedProducts: [],
    };
  }
}
