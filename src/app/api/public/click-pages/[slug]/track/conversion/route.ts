/**
 * Public Click Page Conversion Tracking API Route
 * POST /api/public/click-pages/[slug]/track/conversion - Track a conversion event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { conversionEventSchema } from '@/lib/validation/click-page-schemas';
import { calculateConversionRate } from '@/lib/constants/click-page-constants';
import { checkCSRF } from '@/lib/middleware/with-csrf';

interface RouteParams {
  params: { slug: string };
}

/**
 * POST /api/public/click-pages/[slug]/track/conversion
 * Track a conversion event (purchase) for a click page
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(req);
  if (csrfCheck) return csrfCheck;

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
        viewCount: true,
        conversionCount: true,
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
    const validatedData = conversionEventSchema.parse(body);

    // Check if this order has already been tracked for this click page
    const existingConversion = await prisma.clickPageConversion.findFirst({
      where: {
        clickPageId: clickPage.id,
        orderId: validatedData.orderId,
      },
    });

    if (existingConversion) {
      return NextResponse.json(
        { error: 'Conversion already tracked for this order' },
        { status: 409 }
      );
    }

    // Create conversion event
    await prisma.clickPageConversion.create({
      data: {
        clickPageId: clickPage.id,
        orderId: validatedData.orderId,
        orderValue: validatedData.orderValue,
        sessionId: validatedData.sessionId,
        utmSource: validatedData.utmSource,
        utmMedium: validatedData.utmMedium,
        utmCampaign: validatedData.utmCampaign,
      },
    });

    // Update click page stats
    const newConversionCount = clickPage.conversionCount + 1;
    const newConversionRate = calculateConversionRate(
      newConversionCount,
      clickPage.viewCount
    );

    await prisma.clickPage.update({
      where: { id: clickPage.id },
      data: {
        conversionCount: { increment: 1 },
        conversionRate: newConversionRate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}
