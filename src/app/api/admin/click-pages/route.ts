/**
 * Admin Click Pages API Routes
 * GET /api/admin/click-pages - List all click pages
 * POST /api/admin/click-pages - Create new click page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  clickPageCreateSchema,
  clickPageFilterSchema,
} from '@/lib/validation/click-page-schemas';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';
import type { ClickPageStatus } from '@prisma/client';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/click-pages
 * List all click pages with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filterInput = {
      status: searchParams.get('status') || 'ALL',
      search: searchParams.get('search') || undefined,
      campaignName: searchParams.get('campaignName') || undefined,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || CLICK_PAGE_CONSTANTS.UI.CLICK_PAGES_PER_PAGE,
    };

    // Validate filter input
    const validatedFilter = clickPageFilterSchema.parse(filterInput);

    // Build where clause
    const where: {
      status?: ClickPageStatus;
      campaignName?: { contains: string; mode: 'insensitive' };
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        slug?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    // Status filter
    if (validatedFilter.status && validatedFilter.status !== 'ALL') {
      where.status = validatedFilter.status as ClickPageStatus;
    }

    // Campaign name filter
    if (validatedFilter.campaignName) {
      where.campaignName = {
        contains: validatedFilter.campaignName,
        mode: 'insensitive',
      };
    }

    // Search filter (title or slug)
    if (validatedFilter.search) {
      where.OR = [
        { title: { contains: validatedFilter.search, mode: 'insensitive' } },
        { slug: { contains: validatedFilter.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.clickPage.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / validatedFilter.pageSize);
    const skip = (validatedFilter.page - 1) * validatedFilter.pageSize;

    // Fetch click pages
    const clickPages = await prisma.clickPage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: validatedFilter.pageSize,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      clickPages,
      total,
      page: validatedFilter.page,
      pageSize: validatedFilter.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching click pages:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch click pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/click-pages
 * Create a new click page
 */
export async function POST(req: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(req);
  if (csrfCheck) return csrfCheck;

  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validatedData = clickPageCreateSchema.parse(body);

    // Check if slug already exists
    const existingClickPage = await prisma.clickPage.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingClickPage) {
      return NextResponse.json(
        { error: 'Click page with this slug already exists' },
        { status: 409 }
      );
    }

    // Create click page
    const clickPage = await prisma.clickPage.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        blocks: validatedData.blocks as never, // JSON type
        status: validatedData.status,
        publishedAt: validatedData.publishedAt,

        // SEO
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        metaKeywords: validatedData.metaKeywords || [],
        ogImageUrl: validatedData.ogImageUrl,
        twitterImageUrl: validatedData.twitterImageUrl,
        canonicalUrl: validatedData.canonicalUrl,
        noIndex: validatedData.noIndex || false,

        // Analytics & Tracking
        fbPixelId: validatedData.fbPixelId,
        gaTrackingId: validatedData.gaTrackingId,
        gtmContainerId: validatedData.gtmContainerId,
        customScripts: validatedData.customScripts as never,

        // Campaign
        scheduledPublishAt: validatedData.scheduledPublishAt,
        scheduledUnpublishAt: validatedData.scheduledUnpublishAt,
        campaignName: validatedData.campaignName,
        campaignStartDate: validatedData.campaignStartDate,
        campaignEndDate: validatedData.campaignEndDate,

        // Theme Settings
        themeSettings: validatedData.themeSettings as never,

        // Creator
        createdBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ clickPage }, { status: 201 });
  } catch (error) {
    console.error('Error creating click page:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create click page' },
      { status: 500 }
    );
  }
}
