/**
 * Public Landing Pages API - List Published Landing Pages
 * GET /api/public/landing-pages - Get all published landing pages for public display
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const tagSlug = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(
      searchParams.get('pageSize') || String(LANDING_PAGE_CONSTANTS.UI.LANDING_PAGES_PER_PAGE),
      10
    );

    // 2. Build where clause
    const where: Prisma.LandingPageWhereInput = {
      status: 'PUBLISHED',
    };

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

    // 4. Fetch published landing pages (minimal data for public)
    const [landingPages, total] = await Promise.all([
      prisma.landingPage.findMany({
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
          createdAt: true,
          updatedAt: true,
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
      prisma.landingPage.count({ where }),
    ]);

    // 5. Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    // 6. Return landing pages with pagination metadata
    return NextResponse.json({
      landingPages,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching public landing pages:', error);

    return NextResponse.json(
      { error: 'Failed to fetch landing pages' },
      { status: 500 }
    );
  }
}
