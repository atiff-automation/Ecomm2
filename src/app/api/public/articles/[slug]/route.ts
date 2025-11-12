/**
 * Public Article API - Get Single Published Article
 * GET /api/public/articles/[slug] - Get single article by slug
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';

/**
 * GET /api/public/articles/[slug]
 * Fetch single published article and increment view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 1. Fetch article by slug
    const article = await prisma.article.findUnique({
      where: {
        slug,
        status: 'PUBLISHED',
        category: {
          isActive: true,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        featuredImageAlt: true,
        publishedAt: true,
        readingTimeMin: true,
        viewCount: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
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
    });

    // 2. Return 404 if not found
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // 3. Increment view count (fire and forget)
    prisma.article
      .update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((error) => {
        console.error('Error incrementing view count:', error);
      });

    // 4. Fetch related articles (same category, exclude current)
    const relatedArticles = await prisma.article.findMany({
      where: {
        categoryId: article.category.id,
        status: 'PUBLISHED',
        id: { not: article.id },
        category: {
          isActive: true,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        featuredImageAlt: true,
        publishedAt: true,
        readingTimeMin: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: ARTICLE_CONSTANTS.UI.RELATED_ARTICLES_COUNT,
    });

    // 5. Return article with related articles
    return NextResponse.json({
      article,
      relatedArticles,
    });
  } catch (error) {
    console.error('Error fetching article:', error);

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
