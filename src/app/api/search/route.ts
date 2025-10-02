/**

export const dynamic = 'force-dynamic';

 * Advanced Search API - Malaysian E-commerce Platform
 * Full-text search with intelligent suggestions and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z
    .string()
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .transform(Number)
    .default(() => 20),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(Boolean).optional(),
  rating: z.string().transform(Number).optional(),
  sortBy: z
    .enum(['relevance', 'price', 'rating', 'newest', 'popularity'])
    .default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const suggestionsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z
    .string()
    .transform(Number)
    .default(() => 5),
});

/**
 * GET /api/search - Advanced product search with full-text capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Check if this is a suggestions request
    if (searchParams.has('suggestions')) {
      return handleSuggestions(params);
    }

    const {
      q,
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sortBy,
      sortOrder,
    } = searchSchema.parse(params);

    const skip = (page - 1) * limit;

    // Build where conditions for full-text search
    const where: any = {
      status: 'ACTIVE',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        {
          categories: {
            some: {
              category: {
                name: { contains: q, mode: 'insensitive' },
              },
            },
          },
        },
      ],
    };

    // Apply additional filters
    if (category) {
      where.categories = {
        some: {
          categoryId: category,
        },
      };
    }

    if (minPrice || maxPrice) {
      where.regularPrice = {};
      if (minPrice) {
        where.regularPrice.gte = minPrice;
      }
      if (maxPrice) {
        where.regularPrice.lte = maxPrice;
      }
    }

    if (inStock) {
      where.stockQuantity = { gt: 0 };
    }

    // Build orderBy for different sort options
    const orderBy: any = [];
    switch (sortBy) {
      case 'price':
        orderBy.push({ regularPrice: sortOrder });
        break;
      case 'newest':
        orderBy.push({ createdAt: sortOrder });
        break;
      case 'popularity':
        // Sort by order count (approximate popularity)
        orderBy.push({ createdAt: 'desc' }); // Fallback for now
        break;
      case 'rating':
        // Will need to calculate average rating
        orderBy.push({ createdAt: 'desc' }); // Fallback for now
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a combination of factors
        orderBy.push({ featured: 'desc' });
        orderBy.push({ createdAt: 'desc' });
        break;
    }

    // Execute search query
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
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
            select: { rating: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings and format results
    const productsWithRatings = products.map(product => {
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

      const { ...productWithoutReviews } = product;

      return {
        ...productWithoutReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: product._count.reviews,
      };
    });

    // Filter by rating if specified
    const filteredProducts = rating
      ? productsWithRatings.filter(product => product.averageRating >= rating)
      : productsWithRatings;

    const totalPages = Math.ceil(totalCount / limit);

    // Track search analytics (simplified)
    try {
      await trackSearchAnalytics(q, totalCount);
    } catch (error) {
      console.error('Search analytics tracking failed:', error);
    }

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      searchQuery: q,
      filters: {
        category,
        minPrice,
        maxPrice,
        inStock,
        rating,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid search parameters', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Search failed' }, { status: 500 });
  }
}

/**
 * Handle search suggestions
 */
async function handleSuggestions(params: Record<string, string>) {
  try {
    const { q, limit } = suggestionsSchema.parse(params);

    // Get product name suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        slug: true,
      },
      take: limit,
      orderBy: {
        featured: 'desc',
      },
    });

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        slug: true,
      },
      take: Math.ceil(limit / 2),
    });

    // Get popular search terms (simplified - would come from analytics)
    const popularTerms = await getPopularSearchTerms(q, limit);

    return NextResponse.json({
      suggestions: {
        products: productSuggestions.map(p => ({
          type: 'product',
          text: p.name,
          url: `/products/${p.slug}`,
        })),
        categories: categorySuggestions.map(c => ({
          type: 'category',
          text: c.name,
          url: `/products?category=${c.slug}`,
        })),
        popular: popularTerms,
      },
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { message: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Track search analytics for insights
 */
async function trackSearchAnalytics(query: string, resultCount: number) {
  // Store search analytics in system config or create a simple tracking table
  const searchKey = `search_analytics_${new Date().toISOString().slice(0, 7)}`; // Monthly tracking

  try {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: searchKey },
    });

    const analytics = existing ? JSON.parse(existing.value) : {};

    if (!analytics.searches) {
      analytics.searches = {};
    }

    if (!analytics.searches[query]) {
      analytics.searches[query] = {
        count: 0,
        totalResults: 0,
        lastSearched: null,
      };
    }

    analytics.searches[query].count += 1;
    analytics.searches[query].totalResults = resultCount;
    analytics.searches[query].lastSearched = new Date().toISOString();

    await prisma.systemConfig.upsert({
      where: { key: searchKey },
      update: {
        value: JSON.stringify(analytics),
      },
      create: {
        key: searchKey,
        value: JSON.stringify(analytics),
        type: 'json',
      },
    });
  } catch (error) {
    console.error('Failed to track search analytics:', error);
  }
}

/**
 * Get popular search terms for suggestions
 */
async function getPopularSearchTerms(query: string, limit: number) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const searchKey = `search_analytics_${currentMonth}`;

    const analytics = await prisma.systemConfig.findUnique({
      where: { key: searchKey },
    });

    if (!analytics) {
      return [];
    }

    const data = JSON.parse(analytics.value);
    const searches = data.searches || {};

    // Filter and sort by popularity
    const matchingTerms = Object.entries(searches)
      .filter(
        ([term]) =>
          term.toLowerCase().includes(query.toLowerCase()) && term !== query
      )
      .sort(([, a]: any, [, b]: any) => b.count - a.count)
      .slice(0, limit)
      .map(([term]) => ({
        type: 'popular',
        text: term,
        url: `/search?q=${encodeURIComponent(term)}`,
      }));

    return matchingTerms;
  } catch (error) {
    console.error('Failed to get popular search terms:', error);
    return [];
  }
}
