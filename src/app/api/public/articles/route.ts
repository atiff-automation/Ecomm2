/**
 * Public Articles API - List Published Articles
 * GET /api/public/articles - Get all published articles for public display
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');
    const tagSlug = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(
      searchParams.get('pageSize') || String(ARTICLE_CONSTANTS.UI.ARTICLES_PER_PAGE),
      10
    );

    // 2. Build where clause
    const where: Prisma.ArticleWhereInput = {
      status: 'PUBLISHED',
      category: {
        isActive: true, // Only show articles from active categories
      },
    };

    // Filter by category
    if (categorySlug) {
      where.category = {
        slug: categorySlug,
        isActive: true,
      };
    }

    // Filter by tag
    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 4. Fetch published articles (minimal data for public)
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          featuredImageAlt: true,
          publishedAt: true,
          readingTimeMin: true,
          viewCount: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take,
      }),
      prisma.article.count({ where }),
    ]);

    // 5. Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    // 6. Return articles with pagination metadata
    return NextResponse.json({
      articles,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching public articles:', error);

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
