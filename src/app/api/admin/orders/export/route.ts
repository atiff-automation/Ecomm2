/**
 * Order Export API - Malaysian E-commerce Platform
 * Export orders for fulfillment and accounting purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ])
    .optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  includeItems: z.boolean().default(true),
  includeCustomer: z.boolean().default(true),
});

/**
 * POST /api/admin/orders/export - Export orders with filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      format,
      dateFrom,
      dateTo,
      status,
      paymentStatus,
      includeItems,
      includeCustomer,
    } = exportSchema.parse(body);

    // Build where clause for filtering
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Fetch orders with related data
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: includeCustomer
          ? {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                isMember: true,
              },
            }
          : false,
        shippingAddress: includeCustomer,
        orderItems: includeItems
          ? {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    weight: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const csvData = generateCSV(orders, includeItems, includeCustomer);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // JSON format
      const jsonData = {
        exportedAt: new Date().toISOString(),
        totalOrders: orders.length,
        filters: {
          dateFrom,
          dateTo,
          status,
          paymentStatus,
        },
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: parseFloat(order.total.toString()),
          subtotal: parseFloat(order.subtotal.toString()),
          taxAmount: parseFloat(order.taxAmount.toString()),
          shippingCost: parseFloat(order.shippingCost.toString()),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          ...(includeCustomer && {
            customer: order.user
              ? {
                  id: order.user.id,
                  email: order.user.email,
                  name: `${order.user.firstName} ${order.user.lastName}`,
                  phone: order.user.phone,
                  isMember: order.user.isMember,
                }
              : null,
            shippingAddress: order.shippingAddress,
          }),
          ...(includeItems && {
            items: order.orderItems?.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              sku: item.productSku,
              quantity: item.quantity,
              unitPrice: parseFloat(item.appliedPrice.toString()),
              totalPrice: parseFloat(item.totalPrice.toString()),
            })),
          }),
        })),
      };

      return NextResponse.json(jsonData, {
        headers: {
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid export parameters', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to export orders' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV format for order export
 */
function generateCSV(
  orders: any[],
  includeItems: boolean,
  includeCustomer: boolean
): string {
  const headers = [
    'Order ID',
    'Order Number',
    'Status',
    'Payment Status',
    'Total Amount (RM)',
    'Subtotal (RM)',
    'Tax Amount (RM)',
    'Shipping Cost (RM)',
    'Created Date',
    'Updated Date',
  ];

  if (includeCustomer) {
    headers.push(
      'Customer Email',
      'Customer Name',
      'Customer Phone',
      'Is Member',
      'Shipping Address Line 1',
      'Shipping Address Line 2',
      'Shipping City',
      'Shipping State',
      'Shipping Postal Code',
      'Shipping Country'
    );
  }

  if (includeItems) {
    headers.push('Product Count', 'Product Details');
  }

  const csvRows = [headers.join(',')];

  orders.forEach(order => {
    const row = [
      order.id,
      order.orderNumber,
      order.status,
      order.paymentStatus,
      parseFloat(order.totalAmount.toString()).toFixed(2),
      parseFloat(order.subtotal.toString()).toFixed(2),
      parseFloat(order.taxAmount.toString()).toFixed(2),
      parseFloat(order.shippingCost.toString()).toFixed(2),
      order.createdAt.toISOString(),
      order.updatedAt.toISOString(),
    ];

    if (includeCustomer) {
      row.push(
        order.user?.email || '',
        order.user ? `${order.user.firstName} ${order.user.lastName}` : '',
        order.user?.phone || '',
        order.user?.isMember ? 'Yes' : 'No',
        order.shippingAddress?.addressLine1 || '',
        order.shippingAddress?.addressLine2 || '',
        order.shippingAddress?.city || '',
        order.shippingAddress?.state || '',
        order.shippingAddress?.postalCode || '',
        order.shippingAddress?.country || ''
      );
    }

    if (includeItems && order.orderItems) {
      const productCount = order.orderItems.length;
      const productDetails = order.orderItems
        .map(
          (item: any) =>
            `${item.product.name} (${item.product.sku}) x${item.quantity} @ RM${parseFloat(item.unitPrice.toString()).toFixed(2)}`
        )
        .join(' | ');

      row.push(productCount.toString(), `"${productDetails}"`);
    } else if (includeItems) {
      row.push('0', '');
    }

    // Escape commas and quotes in data
    const escapedRow = row.map(field => {
      const stringField = String(field);
      if (
        stringField.includes(',') ||
        stringField.includes('"') ||
        stringField.includes('\n')
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    });

    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
}

/**
 * GET /api/admin/orders/export - Get export statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get export statistics
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      processingOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
      prisma.order.count({
        where: {
          status: 'PROCESSING',
        },
      }),
    ]);

    return NextResponse.json({
      statistics: {
        totalOrders,
        todayOrders,
        monthOrders,
        pendingOrders,
        processingOrders,
      },
      availableStatuses: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
      ],
      availablePaymentStatuses: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    });
  } catch (error) {
    console.error('Error getting export statistics:', error);
    return NextResponse.json(
      { message: 'Failed to get export statistics' },
      { status: 500 }
    );
  }
}
