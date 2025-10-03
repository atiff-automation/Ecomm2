import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30', 10);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - period);

    // Sales Report
    const currentPeriodOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: 'PAID',
      },
      select: {
        total: true,
        createdAt: true,
        user: {
          select: {
            isMember: true,
          },
        },
      },
    });

    const previousPeriodOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
        paymentStatus: 'PAID',
      },
      select: {
        total: true,
      },
    });

    const currentRevenue = currentPeriodOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const previousRevenue = previousPeriodOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const ordersGrowth =
      previousPeriodOrders.length > 0
        ? ((currentPeriodOrders.length - previousPeriodOrders.length) /
            previousPeriodOrders.length) *
          100
        : 0;

    // Member Revenue Split
    const memberOrders = currentPeriodOrders.filter(
      order => order.user && order.user.isMember
    );
    const nonMemberOrders = currentPeriodOrders.filter(
      order => !order.user || !order.user.isMember
    );
    const memberRevenue = memberOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const nonMemberRevenue = nonMemberOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    // Membership Statistics
    const totalMembers = await prisma.user.count({
      where: {
        isMember: true,
        role: UserRole.CUSTOMER,
      },
    });

    const newMembersThisMonth = await prisma.user.count({
      where: {
        isMember: true,
        role: UserRole.CUSTOMER,
        memberSince: {
          gte: startDate,
        },
      },
    });

    const previousMembers = await prisma.user.count({
      where: {
        isMember: true,
        role: UserRole.CUSTOMER,
        memberSince: {
          lt: startDate,
        },
      },
    });

    const memberGrowth =
      previousMembers > 0
        ? ((totalMembers - previousMembers) / previousMembers) * 100
        : 0;

    const totalCustomers = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
      },
    });

    const memberConversionRate =
      totalCustomers > 0 ? (totalMembers / totalCustomers) * 100 : 0;

    // Product Statistics
    const totalProducts = await prisma.product.count();
    const lowStockProducts = await prisma.product.count({
      where: {
        stockQuantity: {
          lte: 10,
          gt: 0,
        },
      },
    });
    const outOfStockProducts = await prisma.product.count({
      where: {
        stockQuantity: 0,
      },
    });

    // Top Selling Products (mock data for now)
    const topSellingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topSellingProducts.map(async item => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, regularPrice: true },
        });
        return {
          id: item.productId,
          name: product?.name || 'Unknown Product',
          sold: item._sum.quantity || 0,
          revenue:
            (item._sum.quantity || 0) * Number(product?.regularPrice || 0),
        };
      })
    );

    // Customer Statistics
    const activeCustomers = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        orders: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    });

    // Simplified repeat customer calculation
    const repeatCustomers = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        orders: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    });

    const previousCustomers = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        createdAt: {
          lt: startDate,
        },
      },
    });

    const customerGrowth =
      previousCustomers > 0
        ? ((totalCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

    // Daily Sales for chart (simplified)
    const dailySales: Array<{ date: string; revenue: number; orders: number }> =
      [];
    for (let i = 0; i < Math.min(period, 30); i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = currentPeriodOrders.filter(
        order => order.createdAt.toISOString().split('T')[0] === dateStr
      );

      dailySales.unshift({
        date: dateStr,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: dayOrders.length,
      });
    }

    const reportData = {
      salesReport: {
        totalRevenue: currentRevenue,
        totalOrders: currentPeriodOrders.length,
        averageOrderValue:
          currentPeriodOrders.length > 0
            ? currentRevenue / currentPeriodOrders.length
            : 0,
        revenueGrowth,
        ordersGrowth,
        dailySales,
      },
      membershipReport: {
        totalMembers,
        newMembersThisMonth,
        memberConversionRate,
        memberRevenue,
        nonMemberRevenue,
        memberGrowth,
      },
      productReport: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        topSellingProducts: topProductsWithDetails,
      },
      customerReport: {
        totalCustomers,
        activeCustomers,
        repeatCustomers,
        customerGrowth,
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
