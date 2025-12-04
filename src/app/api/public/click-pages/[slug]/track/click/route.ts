/**
 * Public Click Page Click Tracking API Route
 * POST /api/public/click-pages/[slug]/track/click - Track a click event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clickEventSchema } from '@/lib/validation/click-page-schemas';

interface RouteParams {
  params: { slug: string };
}

/**
 * POST /api/public/click-pages/[slug]/track/click
 * Track a click event on a click page
 *
 * NOTE: CSRF protection is NOT required for this public analytics endpoint.
 * This endpoint:
 * - Accepts anonymous visitor tracking
 * - Does not modify user-sensitive data
 * - Only logs click analytics for measurement
 * - Must be accessible without authentication or CSRF tokens
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    // Find the click page
    const clickPage = await prisma.clickPage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
      },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validatedData = clickEventSchema.parse(body);

    // Create click event
    await prisma.clickPageClick.create({
      data: {
        clickPageId: clickPage.id,
        blockId: validatedData.blockId,
        blockType: validatedData.blockType,
        targetUrl: validatedData.targetUrl,
        targetId: validatedData.targetId,
        sessionId: validatedData.sessionId,
        utmSource: validatedData.utmSource,
        utmMedium: validatedData.utmMedium,
        utmCampaign: validatedData.utmCampaign,
      },
    });

    // Increment click count asynchronously
    prisma.clickPage
      .update({
        where: { id: clickPage.id },
        data: { clickCount: { increment: 1 } },
      })
      .catch(error => {
        console.error('Error incrementing click count:', error);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
