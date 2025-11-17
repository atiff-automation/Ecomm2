import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Track Landing Page View
 * POST /api/public/landing-pages/[slug]/track-view
 *
 * Increments view count for published landing pages
 * No authentication required - public endpoint
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Validate slug exists
    if (!slug) {
      return NextResponse.json(
        { error: 'Landing page slug is required' },
        { status: 400 }
      );
    }

    // Increment view count (only for PUBLISHED pages)
    const updatedLandingPage = await prisma.landingPage.update({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      data: {
        viewCount: { increment: 1 },
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: updatedLandingPage.viewCount,
    });
  } catch (error) {
    // Landing page not found or not published
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Landing page not found or not published' },
        { status: 404 }
      );
    }

    console.error('[track-view] Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
