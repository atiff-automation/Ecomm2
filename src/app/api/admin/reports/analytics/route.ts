/**

export const dynamic = 'force-dynamic';

 * Admin Reports Analytics API - Malaysian E-commerce Platform
 * Enhanced analytics data for interactive charts and visualizations in reports page
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30';

    const now = new Date();
    const daysAgo = parseInt(period, 10);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Revenue trend over the specified period
    const revenueTrend = (await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as orders,
        SUM("total") as revenue
      FROM "orders" 
      WHERE "createdAt" >= ${startDate}
        AND "paymentStatus" = 'PAID'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
    `) as Array<{ date: Date; orders: bigint; revenue: number }>;

    // Order status distribution
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Member vs Non-member sales comparison
    const membershipComparison = (await prisma.$queryRaw`
      SELECT 
        CASE WHEN u."isMember" = true THEN 'Member' ELSE 'Non-Member' END as customer_type,
        COUNT(*) as orders,
        SUM(o."total") as revenue,
        AVG(o."total") as avg_order_value
      FROM "orders" o
      LEFT JOIN "users" u ON o."userId" = u.id
      WHERE o."createdAt" >= ${startDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY u."isMember"
    `) as Array<{
      customer_type: string;
      orders: bigint;
      revenue: number;
      avg_order_value: number;
    }>;

    // Category performance
    const categoryPerformance = (await prisma.$queryRaw`
      SELECT 
        c.name as category,
        COUNT(DISTINCT oi."orderId") as orders,
        SUM(oi.quantity) as units_sold,
        SUM(oi."totalPrice") as revenue
      FROM "order_items" oi
      JOIN "products" p ON oi."productId" = p.id
      JOIN "product_categories" pc ON p.id = pc."productId"
      JOIN "categories" c ON pc."categoryId" = c.id
      JOIN "orders" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 10
    `) as Array<{
      category: string;
      orders: bigint;
      units_sold: bigint;
      revenue: number;
    }>;

    // Hourly order distribution (for operational insights)
    const hourlyOrderData = (await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as orders,
        SUM("total") as revenue
      FROM "orders"
      WHERE "createdAt" >= ${startDate}
        AND "paymentStatus" = 'PAID'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `) as Array<{ hour: number; orders: bigint; revenue: number }>;

    // Payment method distribution
    const paymentMethodDistribution = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
        paymentStatus: 'PAID',
      },
    });

    // Format the data for frontend consumption
    const totalOrderStatus = orderStatusData.reduce(
      (sum, curr) => sum + curr._count.id,
      0
    );
    const totalPaymentMethods = paymentMethodDistribution.reduce(
      (sum, curr) => sum + curr._count.id,
      0
    );

    const analytics = {
      revenueTrend: revenueTrend.map(item => ({
        date: item.date.toISOString().split('T')[0],
        orders: Number(item.orders),
        revenue: Number(item.revenue),
      })),
      orderStatusData: orderStatusData.map(item => ({
        status: item.status,
        count: item._count.id,
        percentage: Math.round((item._count.id / totalOrderStatus) * 100),
      })),
      membershipComparison: membershipComparison.map(item => ({
        customerType: item.customer_type,
        orders: Number(item.orders),
        revenue: Number(item.revenue),
        avgOrderValue: Number(item.avg_order_value),
      })),
      categoryPerformance: categoryPerformance.map(item => ({
        category: item.category,
        orders: Number(item.orders),
        unitsSold: Number(item.units_sold),
        revenue: Number(item.revenue),
      })),
      hourlyOrderData: Array.from({ length: 24 }, (_, hour) => {
        const data = hourlyOrderData.find(item => Number(item.hour) === hour);
        return {
          hour,
          orders: data ? Number(data.orders) : 0,
          revenue: data ? Number(data.revenue) : 0,
        };
      }),
      paymentMethodDistribution: paymentMethodDistribution.map(item => ({
        method: item.paymentMethod || 'Unknown',
        count: item._count.id,
        percentage: Math.round((item._count.id / totalPaymentMethods) * 100),
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Reports analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports analytics' },
      { status: 500 }
    );
  }
}
