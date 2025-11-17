import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * Get Landing Page Analytics
 * GET /api/admin/landing-pages/[id]/analytics
 *
 * Returns comprehensive analytics data for a landing page
 * Admin only endpoint
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      );
    }

    // Fetch landing page with analytics data
    const landingPage = await prisma.landingPage.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        clickCount: true,
        conversionCount: true,
        conversionValue: true,
        publishedAt: true,
        createdAt: true,
        clicks: {
          select: {
            id: true,
            clickType: true,
            targetUrl: true,
            targetId: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to recent 100 clicks
        },
        conversions: {
          select: {
            id: true,
            orderId: true,
            orderValue: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!landingPage) {
      return NextResponse.json(
        { error: 'Landing page not found' },
        { status: 404 }
      );
    }

    // Calculate metrics
    const conversionRate =
      landingPage.viewCount > 0
        ? (landingPage.conversionCount / landingPage.viewCount) * 100
        : 0;

    const clickThroughRate =
      landingPage.viewCount > 0
        ? (landingPage.clickCount / landingPage.viewCount) * 100
        : 0;

    const averageOrderValue =
      landingPage.conversionCount > 0
        ? Number(landingPage.conversionValue) / landingPage.conversionCount
        : 0;

    // Click breakdown by type
    const clicksByType = landingPage.clicks.reduce(
      (acc, click) => {
        acc[click.clickType] = (acc[click.clickType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // UTM performance analysis
    const utmPerformance = landingPage.conversions.reduce(
      (acc, conversion) => {
        const source = conversion.utmSource || 'direct';
        if (!acc[source]) {
          acc[source] = {
            conversions: 0,
            revenue: 0,
          };
        }
        acc[source].conversions += 1;
        acc[source].revenue += Number(conversion.orderValue);
        return acc;
      },
      {} as Record<string, { conversions: number; revenue: number }>
    );

    // Response structure
    return NextResponse.json({
      landingPage: {
        id: landingPage.id,
        title: landingPage.title,
        slug: landingPage.slug,
        status: landingPage.status,
        publishedAt: landingPage.publishedAt,
        createdAt: landingPage.createdAt,
      },
      summary: {
        views: landingPage.viewCount,
        clicks: landingPage.clickCount,
        conversions: landingPage.conversionCount,
        revenue: Number(landingPage.conversionValue),
        conversionRate: Number(conversionRate.toFixed(2)),
        clickThroughRate: Number(clickThroughRate.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
      clicksByType,
      utmPerformance,
      recentClicks: landingPage.clicks,
      recentConversions: landingPage.conversions.map((c) => ({
        ...c,
        orderValue: Number(c.orderValue),
      })),
    });
  } catch (error) {
    console.error('[analytics] Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
