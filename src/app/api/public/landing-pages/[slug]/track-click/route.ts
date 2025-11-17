import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * Track Click Request Schema
 */
const trackClickSchema = z.object({
  clickType: z.enum(['PRODUCT', 'CTA', 'EXTERNAL_LINK']),
  targetUrl: z.string().url().optional(),
  targetId: z.string().optional(), // Product ID if applicable
  sessionId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

type TrackClickRequest = z.infer<typeof trackClickSchema>;

/**
 * Track Landing Page Click
 * POST /api/public/landing-pages/[slug]/track-click
 *
 * Records click events and increments click count
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = trackClickSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const clickData: TrackClickRequest = validationResult.data;

    // Get user session if available
    const session = await getServerSession(authOptions);

    // Find landing page
    const landingPage = await prisma.landingPage.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!landingPage) {
      return NextResponse.json(
        { error: 'Landing page not found' },
        { status: 404 }
      );
    }

    if (landingPage.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Landing page is not published' },
        { status: 403 }
      );
    }

    // Create click event and increment click count in transaction
    await prisma.$transaction([
      // Record click event
      prisma.landingPageClick.create({
        data: {
          landingPageId: landingPage.id,
          clickType: clickData.clickType,
          targetUrl: clickData.targetUrl,
          targetId: clickData.targetId,
          sessionId: clickData.sessionId,
          userId: session?.user?.id,
          utmSource: clickData.utmSource,
          utmMedium: clickData.utmMedium,
          utmCampaign: clickData.utmCampaign,
        },
      }),
      // Increment click count
      prisma.landingPage.update({
        where: { id: landingPage.id },
        data: { clickCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully',
    });
  } catch (error) {
    console.error('[track-click] Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
