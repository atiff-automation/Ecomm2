/**
 * Public Click Page API Route
 * GET /api/public/click-pages/[slug] - Get published click page by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { slug: string };
}

/**
 * GET /api/public/click-pages/[slug]
 * Get a published click page by slug
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    // Fetch click page (only published ones)
    const clickPage = await prisma.clickPage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        // Only show if not scheduled or if within scheduled dates
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: new Date() } },
        ],
      },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Check if campaign is active (if scheduled unpublish date exists)
    if (clickPage.scheduledUnpublishAt && new Date() > clickPage.scheduledUnpublishAt) {
      return NextResponse.json(
        { error: 'Click page is no longer available' },
        { status: 404 }
      );
    }

    // Increment view count asynchronously (don't wait for it)
    prisma.clickPage
      .update({
        where: { id: clickPage.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((error) => {
        console.error('Error incrementing view count:', error);
      });

    return NextResponse.json({ clickPage });
  } catch (error) {
    console.error('Error fetching click page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch click page' },
      { status: 500 }
    );
  }
}
