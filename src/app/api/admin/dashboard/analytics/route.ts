/**
 * Admin Dashboard Analytics API - Malaysian E-commerce Platform
 * Enhanced analytics data for interactive charts and visualizations
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Revenue trend over last 30 days
    const revenueTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as orders,
        SUM("total") as revenue
      FROM "orders" 
      WHERE "createdAt" >= ${thirtyDaysAgo}
        AND "paymentStatus" = 'PAID'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
    ` as Array<{ date: Date; orders: bigint; revenue: number }>;

    // Order status distribution
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Top selling products (last 30 days)
    const topProducts = await prisma.$queryRaw`
      SELECT 
        p.name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi."totalPrice") as revenue
      FROM "order_items" oi
      JOIN "products" p ON oi."productId" = p.id
      JOIN "orders" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${thirtyDaysAgo}
        AND o."paymentStatus" = 'PAID'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 10
    ` as Array<{ name: string; sku: string; total_sold: bigint; revenue: number }>;

    // Member vs Non-member sales comparison
    const membershipComparison = await prisma.$queryRaw`
      SELECT 
        CASE WHEN u."isMember" = true THEN 'Member' ELSE 'Non-Member' END as customer_type,
        COUNT(*) as orders,
        SUM(o."total") as revenue,
        AVG(o."total") as avg_order_value
      FROM "orders" o
      LEFT JOIN "users" u ON o."userId" = u.id
      WHERE o."createdAt" >= ${thirtyDaysAgo}
        AND o."paymentStatus" = 'PAID'
      GROUP BY u."isMember"
    ` as Array<{ customer_type: string; orders: bigint; revenue: number; avg_order_value: number }>;

    // Category performance
    const categoryPerformance = await prisma.$queryRaw`
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
      WHERE o."createdAt" >= ${thirtyDaysAgo}
        AND o."paymentStatus" = 'PAID'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 8
    ` as Array<{ category: string; orders: bigint; units_sold: bigint; revenue: number }>;

    // Recent membership activations
    const membershipGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "memberSince") as date,
        COUNT(*) as new_members
      FROM "users" 
      WHERE "memberSince" >= ${thirtyDaysAgo}
        AND "isMember" = true
      GROUP BY DATE_TRUNC('day', "memberSince")
      ORDER BY date
    ` as Array<{ date: Date; new_members: bigint }>;

    // Format the data for frontend consumption
    const analytics = {
      revenueTrend: revenueTrend.map(item => ({
        date: item.date.toISOString().split('T')[0],
        orders: Number(item.orders),
        revenue: Number(item.revenue),
      })),
      orderStatusData: orderStatusData.map(item => ({
        status: item.status,
        count: item._count.id,
        percentage: Math.round((item._count.id / orderStatusData.reduce((sum, curr) => sum + curr._count.id, 0)) * 100),
      })),
      topProducts: topProducts.map(item => ({
        name: item.name,
        sku: item.sku,
        totalSold: Number(item.total_sold),
        revenue: Number(item.revenue),
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
      membershipGrowth: membershipGrowth.map(item => ({
        date: item.date.toISOString().split('T')[0],
        newMembers: Number(item.new_members),
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}