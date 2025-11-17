/**
 * Public Landing Page API - Get Single Published Landing Page
 * GET /api/public/landing-pages/[slug] - Get single landing page by slug
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';
import { ContentTransformerService } from '@/lib/services/content-transformer';
import { ProductEmbedService } from '@/lib/services/product-embed-service';

/**
 * GET /api/public/landing-pages/[slug]
 * Fetch single published landing page and increment view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 1. Fetch landing page by slug
    const landingPage = await prisma.landingPage.findUnique({
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
    if (!landingPage) {
      return NextResponse.json(
        { error: 'Landing page not found' },
        { status: 404 }
      );
    }

    // 3. Increment view count (fire and forget)
    prisma.landingPage
      .update({
        where: { id: landingPage.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((error) => {
        console.error('Error incrementing view count:', error);
      });

    // 4. Transform landing page content (YouTube embeds + Product cards)
    try {
      // Extract current host from request (e.g., "localhost:3000" or "jrmholistikajah.com")
      const host = request.headers.get('host') || 'localhost:3000';

      // Extract product slugs from content (filtered by current host)
      const productSlugs = ProductEmbedService.extractProductSlugs(
        landingPage.content,
        host
      );

      // Fetch product data with caching
      const productsData = await ProductEmbedService.fetchProductsBySlug(productSlugs);

      // Transform content with all embeds
      landingPage.content = await ContentTransformerService.transformContent(
        landingPage.content,
        productsData
      );
    } catch (transformError) {
      console.error('Content transformation error:', transformError);
      // Continue with original content (graceful degradation)
    }

    // 5. Fetch related landing pages (same category, exclude current)
    const relatedLandingPages = await prisma.landingPage.findMany({
      where: {
        categoryId: landingPage.category.id,
        status: 'PUBLISHED',
        id: { not: landingPage.id },
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
      take: LANDING_PAGE_CONSTANTS.UI.RELATED_LANDING_PAGES_COUNT,
    });

    // 6. Return landing page with related landing pages (content already transformed)
    return NextResponse.json({
      landingPage,
      relatedLandingPages,
    });
  } catch (error) {
    console.error('Error fetching landing page:', error);

    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    );
  }
}
