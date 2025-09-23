/**
 * EasyParcel CSV Export API
 * Export orders in EasyParcel bulk upload CSV format
 * Fallback solution when EasyParcel API is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { formatDateForFilename } from '@/lib/chat/data-management';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import {
  easyParcelCSVExporter,
  type OrderForExport,
} from '@/lib/shipping/easyparcel-csv-exporter';

const exportRequestSchema = z.object({
  action: z.enum(['preview', 'export']).default('export'),
  orderIds: z.array(z.string()).optional(),
  filters: z
    .object({
      status: z
        .array(
          z.enum([
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
          ])
        )
        .optional(),
      paymentStatus: z
        .array(z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']))
        .optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      courierFilter: z.array(z.string()).optional(),
    })
    .optional(),
  options: z
    .object({
      includeHeaders: z.boolean().default(true),
      validateRequired: z.boolean().default(true),
      previewLimit: z.number().min(1).max(20).default(5),
    })
    .optional(),
});

/**
 * POST - Export orders to EasyParcel CSV format
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, orderIds, filters, options } =
      exportRequestSchema.parse(body);

    console.log(
      `[EasyParcel CSV Export] ${action} requested by ${session.user.email}`,
      {
        orderIds: orderIds?.length || 0,
        filters,
        options,
      }
    );

    // Build query based on filters or specific order IDs
    const whereClause = buildWhereClause(orderIds, filters);

    // Fetch orders with all required data
    const orders = await fetchOrdersForExport(whereClause);

    if (orders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No orders found matching the criteria',
        data: {
          totalOrders: 0,
          exportedOrders: 0,
        },
      });
    }

    if (action === 'preview') {
      // Return preview data
      const previewData = await easyParcelCSVExporter.previewCSVData(
        orders,
        options?.previewLimit || 5
      );

      return NextResponse.json({
        success: true,
        action: 'preview',
        data: {
          ...previewData,
          orders: orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.user?.name || order.guestEmail || 'Guest',
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: parseFloat(order.total.toString()),
            createdAt: order.createdAt,
          })),
        },
      });
    }

    // Generate CSV export
    const csvContent = await easyParcelCSVExporter.exportOrdersToCSV(orders, {
      includeHeaders: options?.includeHeaders ?? true,
      validateRequired: options?.validateRequired ?? true,
    });

    const timestamp = formatDateForFilename(new Date());
    const filename = `EasyParcel_Export_${timestamp}_${orders.length}Orders.csv`;

    // Log export activity
    console.log(
      `[EasyParcel CSV Export] Generated CSV for ${orders.length} orders by ${session.user.email}`
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Count': orders.length.toString(),
        'X-Export-Date': new Date().toISOString(),
        'X-Export-User': session.user.email || 'unknown',
      },
    });
  } catch (error) {
    console.error('[EasyParcel CSV Export] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid export parameters',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: `Export failed: ${error.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during CSV export',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get export statistics and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const info = searchParams.get('info');

    if (info === 'headers') {
      // Return CSV headers for reference
      return NextResponse.json({
        success: true,
        headers: easyParcelCSVExporter.constructor.getCSVHeaders(),
        description: 'EasyParcel bulk upload CSV format headers',
      });
    }

    // Get export statistics
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalOrders, readyToShip, pendingPayment, processing, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        }),
        prisma.order.count({
          where: {
            status: 'PENDING',
            paymentStatus: 'PENDING',
          },
        }),
        prisma.order.count({
          where: {
            status: 'PROCESSING',
          },
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: startOfWeek,
            },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalOrders,
        readyToShip,
        pendingPayment,
        processing,
        recentOrders,
      },
      exportOptions: {
        supportedStatuses: [
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
        ],
        supportedPaymentStatuses: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        maxExportLimit: 1000,
        csvHeaders: easyParcelCSVExporter.constructor.getCSVHeaders().length,
      },
      recommendations: {
        idealStatuses: ['CONFIRMED', 'PROCESSING'],
        idealPaymentStatus: 'PAID',
        note: 'Export orders that are paid and ready for shipping',
      },
    });
  } catch (error) {
    console.error('[EasyParcel CSV Export] Error getting statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get export statistics' },
      { status: 500 }
    );
  }
}

/**
 * Build Prisma where clause from filters
 */
function buildWhereClause(orderIds?: string[], filters?: any) {
  const where: any = {};

  if (orderIds && orderIds.length > 0) {
    where.id = { in: orderIds };
    return where;
  }

  if (filters) {
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.paymentStatus && filters.paymentStatus.length > 0) {
      where.paymentStatus = { in: filters.paymentStatus };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.courierFilter && filters.courierFilter.length > 0) {
      where.selectedCourierId = { in: filters.courierFilter };
    }
  }

  // Default filter: only export orders that make sense for shipping
  if (Object.keys(where).length === 0) {
    where.OR = [
      {
        status: { in: ['CONFIRMED', 'PROCESSING'] },
        paymentStatus: 'PAID',
      },
      {
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    ];
  }

  return where;
}

/**
 * Fetch orders with all required data for export
 */
async function fetchOrdersForExport(
  whereClause: any
): Promise<OrderForExport[]> {
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      shippingAddress: true,
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              weight: true,
              dimensions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000, // Safety limit
  });

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    guestEmail: order.guestEmail || undefined,
    guestPhone: order.guestPhone || undefined,
    deliveryInstructions: order.deliveryInstructions || undefined,
    selectedCourierId: order.selectedCourierId || undefined,
    user: order.user
      ? {
          firstName: order.user.firstName || undefined,
          lastName: order.user.lastName || undefined,
          email: order.user.email,
          phone: order.user.phone || undefined,
        }
      : undefined,
    shippingAddress: order.shippingAddress
      ? {
          name: order.shippingAddress.name || undefined,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2 || undefined,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country || undefined,
        }
      : undefined,
    orderItems: order.orderItems.map(item => ({
      id: item.id,
      productName: item.productName,
      productSku: item.productSku || undefined,
      quantity: item.quantity,
      appliedPrice: item.appliedPrice,
      product: {
        name: item.product.name,
        weight: item.product.weight || undefined,
        dimensions: item.product.dimensions as any,
      },
    })),
  }));
}
