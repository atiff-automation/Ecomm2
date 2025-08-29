import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get detailed shipment data for export
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV content
    const csvHeaders = [
      'Order Number',
      'Tracking Number',
      'Courier Name',
      'Service Name',
      'Status',
      'Status Description',
      'Created Date',
      'Estimated Delivery',
      'Actual Delivery',
      'Delivery Days',
      'Customer Name',
      'Destination City',
      'Destination State',
      'Items Count',
      'Order Value',
      'Latest Event',
      'Latest Event Date',
      'Latest Event Location',
    ];

    const csvRows = shipments.map(shipment => {
      const order = shipment.order;
      const latestEvent = shipment.trackingEvents[0];

      // Calculate delivery days
      let deliveryDays = '';
      if (shipment.actualDelivery && shipment.createdAt) {
        const deliveryTime =
          new Date(shipment.actualDelivery).getTime() -
          new Date(shipment.createdAt).getTime();
        deliveryDays = (deliveryTime / (1000 * 60 * 60 * 24)).toFixed(1);
      }

      return [
        order.orderNumber,
        shipment.trackingNumber || '',
        shipment.courierName,
        shipment.serviceName,
        shipment.status,
        shipment.statusDescription || '',
        shipment.createdAt.toISOString().split('T')[0],
        shipment.estimatedDelivery
          ? shipment.estimatedDelivery.toISOString().split('T')[0]
          : '',
        shipment.actualDelivery
          ? shipment.actualDelivery.toISOString().split('T')[0]
          : '',
        deliveryDays,
        // Customer name from delivery address
        (shipment.deliveryAddress as any)?.name || 'N/A',
        (shipment.deliveryAddress as any)?.city || 'N/A',
        (shipment.deliveryAddress as any)?.state || 'N/A',
        order.orderItems?.length || 0,
        shipment.finalPrice,
        latestEvent?.eventName || '',
        latestEvent ? latestEvent.eventTime.toISOString().split('T')[0] : '',
        latestEvent?.location || '',
      ];
    });

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row =>
        row
          .map(field => {
            // Escape commas and quotes in CSV fields
            const stringField = String(field);
            if (
              stringField.includes(',') ||
              stringField.includes('"') ||
              stringField.includes('\n')
            ) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          })
          .join(',')
      ),
    ].join('\n');

    // Log export activity
    await prisma.auditLog.create({
      data: {
        action: 'TRACKING_EXPORT',
        resource: 'SHIPMENT',
        resourceId: null,
        userId: session.user.id,
        details: {
          exportType: 'CSV',
          dayRange: days,
          recordCount: shipments.length,
          startDate: startDate.toISOString(),
        },
      },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tracking-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to export tracking data' },
      { status: 500 }
    );
  }
}
