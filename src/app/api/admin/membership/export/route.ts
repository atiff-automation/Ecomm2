/**
 * Admin Membership Export API - Malaysian E-commerce Platform
 * Exports comprehensive membership analytics data as CSV
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/admin/membership/export - Export membership analytics as CSV
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all members with detailed order information
    const members = await prisma.user.findMany({
      where: { isMember: true },
      include: {
        orders: {
          where: { status: 'DELIVERED' },
          include: {
            orderItems: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { memberSince: 'desc' },
    });

    // Create CSV content with comprehensive member data
    const csvHeaders = [
      'Member ID',
      'First Name',
      'Last Name',
      'Email',
      'Member Since',
      'Days as Member',
      'Total Orders',
      'Total Spent (MYR)',
      'Total Savings (MYR)',
      'Average Order Value (MYR)',
      'Favorite Category',
      'Last Order Date',
      'Membership Total (MYR)',
      'Savings Rate (%)',
    ];

    let csvContent = csvHeaders.join(',') + '\n';

    const now = new Date();

    members.forEach(member => {
      const memberSince = member.memberSince
        ? new Date(member.memberSince)
        : null;
      const daysSinceMember = memberSince
        ? Math.floor(
            (now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      const totalOrders = member.orders.length;
      const totalSpent = member.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const totalSavings = member.orders.reduce(
        (sum, order) => sum + Number(order.memberDiscount || 0),
        0
      );
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const savingsRate =
        totalSpent > 0 ? (totalSavings / (totalSpent + totalSavings)) * 100 : 0;

      // Calculate favorite category
      const categoryCount = new Map<string, number>();
      member.orders.forEach(order => {
        order.orderItems.forEach(item => {
          const categoryName = item.product.category.name;
          categoryCount.set(
            categoryName,
            (categoryCount.get(categoryName) || 0) + 1
          );
        });
      });

      let favoriteCategory = 'N/A';
      let maxCount = 0;
      categoryCount.forEach((count, category) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });

      // Get last order date
      const lastOrderDate =
        member.orders.length > 0
          ? new Date(
              Math.max(
                ...member.orders.map(order =>
                  new Date(order.createdAt).getTime()
                )
              )
            ).toLocaleDateString('en-MY')
          : 'N/A';

      const row = [
        `"${member.id}"`,
        `"${member.firstName || ''}"`,
        `"${member.lastName || ''}"`,
        `"${member.email}"`,
        `"${memberSince?.toLocaleDateString('en-MY') || 'N/A'}"`,
        daysSinceMember,
        totalOrders,
        totalSpent.toFixed(2),
        totalSavings.toFixed(2),
        averageOrderValue.toFixed(2),
        `"${favoriteCategory}"`,
        `"${lastOrderDate}"`,
        Number(member.membershipTotal || 0).toFixed(2),
        savingsRate.toFixed(2),
      ];

      csvContent += row.join(',') + '\n';
    });

    // Add summary statistics
    const totalMembers = members.length;
    const totalOrdersAll = members.reduce(
      (sum, member) => sum + member.orders.length,
      0
    );
    const totalSpentAll = members.reduce(
      (sum, member) =>
        sum +
        member.orders.reduce(
          (orderSum, order) => orderSum + Number(order.total),
          0
        ),
      0
    );
    const totalSavingsAll = members.reduce(
      (sum, member) =>
        sum +
        member.orders.reduce(
          (orderSum, order) => orderSum + Number(order.memberDiscount || 0),
          0
        ),
      0
    );

    // Add summary section
    csvContent += '\n';
    csvContent += 'MEMBERSHIP PROGRAM SUMMARY\n';
    csvContent += `Total Members,${totalMembers}\n`;
    csvContent += `Total Orders by Members,${totalOrdersAll}\n`;
    csvContent += `Total Revenue from Members (MYR),${totalSpentAll.toFixed(2)}\n`;
    csvContent += `Total Savings Given (MYR),${totalSavingsAll.toFixed(2)}\n`;
    csvContent += `Average Orders per Member,${totalMembers > 0 ? (totalOrdersAll / totalMembers).toFixed(1) : '0'}\n`;
    csvContent += `Average Spending per Member (MYR),${totalMembers > 0 ? (totalSpentAll / totalMembers).toFixed(2) : '0'}\n`;
    csvContent += `Average Savings per Member (MYR),${totalMembers > 0 ? (totalSavingsAll / totalMembers).toFixed(2) : '0'}\n`;
    csvContent += `Export Date,"${new Date().toLocaleDateString('en-MY')}"\n`;
    csvContent += `Export Time,"${new Date().toLocaleTimeString('en-MY')}"\n`;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `membership-analytics-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error exporting membership analytics:', error);
    return NextResponse.json(
      { message: 'Failed to export membership analytics' },
      { status: 500 }
    );
  }
}
