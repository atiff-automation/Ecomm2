/**
 * Admin Click Page Analytics API Route
 * GET /api/admin/click-pages/[id]/analytics - Get analytics data for a click page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateConversionRate } from '@/lib/constants/click-page-constants';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/click-pages/[id]/analytics
 * Get comprehensive analytics for a click page
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if click page exists
    const clickPage = await prisma.clickPage.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        viewCount: true,
        clickCount: true,
        conversionCount: true,
        conversionRate: true,
      },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Get clicks grouped by block
    const clicksByBlock = await prisma.clickPageClick.groupBy({
      by: ['blockId', 'blockType'],
      where: {
        clickPageId: id,
        blockId: { not: null },
        blockType: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Format clicks by block
    const formattedClicksByBlock = clicksByBlock.map((block) => ({
      blockId: block.blockId || '',
      blockType: block.blockType || '',
      clicks: block._count.id,
    }));

    // Get clicks over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [clicksOverTime, conversionsOverTime] = await Promise.all([
      // Clicks over time
      prisma.$queryRaw<Array<{ date: Date; clicks: number }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*)::int as clicks
        FROM click_page_clicks
        WHERE click_page_id = ${id}
          AND created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      // Conversions over time
      prisma.$queryRaw<Array<{ date: Date; conversions: number }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*)::int as conversions
        FROM click_page_conversions
        WHERE click_page_id = ${id}
          AND created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    // Merge clicks and conversions by date
    const dateMap = new Map<string, { clicks: number; conversions: number }>();

    // Initialize all 30 days with zeros
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { clicks: 0, conversions: 0 });
    }

    // Add click data
    clicksOverTime.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr)!.clicks = item.clicks;
      }
    });

    // Add conversion data
    conversionsOverTime.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr)!.conversions = item.conversions;
      }
    });

    // Convert map to array
    const timeSeriesData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        clicks: data.clicks,
        conversions: data.conversions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate total revenue from conversions
    const revenueResult = await prisma.clickPageConversion.aggregate({
      where: { clickPageId: id },
      _sum: { orderValue: true },
    });

    const totalRevenue = Number(revenueResult._sum.orderValue || 0);

    // Build analytics response
    const analytics = {
      clickPageId: clickPage.id,
      views: clickPage.viewCount,
      clicks: clickPage.clickCount,
      conversions: clickPage.conversionCount,
      conversionRate: calculateConversionRate(
        clickPage.conversionCount,
        clickPage.viewCount
      ),
      totalRevenue,
      clicksByBlock: formattedClicksByBlock,
      clicksOverTime: timeSeriesData,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching click page analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
