/**

export const dynamic = 'force-dynamic';

 * Member Orders Export API - Malaysian E-commerce Platform
 * Provides CSV export of member order history
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/member/orders/export - Export member order history as CSV
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

    // Allow all authenticated users to export their order history
    // All users should be able to export their purchase records

    // Get all member orders for export
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                categories: {
                  select: {
                    category: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create CSV content
    const csvHeaders = [
      'Order Number',
      'Date',
      'Status',
      'Product Name',
      'Category',
      'SKU',
      'Quantity',
      'Regular Price (MYR)',
      'Applied Price (MYR)',
      'Member Savings (MYR)',
      'Total (MYR)',
      'Order Total (MYR)',
    ];

    let csvContent = csvHeaders.join(',') + '\n';

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-MY');
      const orderTotal = Number(order.total);

      order.orderItems.forEach(item => {
        const regularPrice = Number(item.regularPrice);
        const appliedPrice = Number(item.appliedPrice);
        const itemTotal = appliedPrice * item.quantity;
        const itemSavings = (regularPrice - appliedPrice) * item.quantity;

        const row = [
          `"${order.orderNumber}"`,
          `"${orderDate}"`,
          `"${order.status}"`,
          `"${item.productName}"`,
          `"${item.product?.categories?.[0]?.category?.name || 'N/A'}"`,
          `"${item.productSku || 'N/A'}"`,
          item.quantity,
          regularPrice.toFixed(2),
          appliedPrice.toFixed(2),
          itemSavings.toFixed(2),
          itemTotal.toFixed(2),
          orderTotal.toFixed(2),
        ];

        csvContent += row.join(',') + '\n';
      });
    });

    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const totalSavings = orders.reduce(
      (sum, order) => sum + Number(order.memberDiscount || 0),
      0
    );

    // Add summary section
    csvContent += '\n';
    csvContent += 'MEMBER SUMMARY\n';
    csvContent += `Total Orders,${totalOrders}\n`;
    csvContent += `Total Spent (MYR),${totalSpent.toFixed(2)}\n`;
    csvContent += `Total Savings (MYR),${totalSavings.toFixed(2)}\n`;
    csvContent += `Export Date,"${new Date().toLocaleDateString('en-MY')}"\n`;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `member-orders-${session.user.id}-${timestamp}.csv`;

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
    console.error('Error exporting member orders:', error);
    return NextResponse.json(
      { message: 'Failed to export order history' },
      { status: 500 }
    );
  }
}
