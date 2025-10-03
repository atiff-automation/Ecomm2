import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { logAudit } from '@/lib/audit/logger';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    // Fetch orders with shipment data
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        shipment: {
          easyParcelShipmentId: { not: null },
          trackingNumber: { not: null },
        },
      },
      include: {
        shipment: true,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders with shipping labels found' },
        { status: 404 }
      );
    }

    const zip = new JSZip();
    const results = {
      total: orders.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Download labels and add to ZIP
    for (const order of orders) {
      if (!order.shipment?.easyParcelShipmentId) {
        continue;
      }

      try {
        // Get label from EasyParcel
        const labelData = await easyParcelService.downloadLabel(
          order.shipment.easyParcelShipmentId
        );

        if (labelData) {
          const filename = `${order.orderNumber}_${order.shipment.trackingNumber}.pdf`;
          zip.file(filename, labelData);
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(
            `Order ${order.orderNumber}: Label not available`
          );
        }

        // Rate limiting between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (results.successful === 0) {
      return NextResponse.json(
        {
          error: 'No labels could be downloaded',
          results,
        },
        { status: 404 }
      );
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Log bulk operation
    await prisma.auditLog.create({
      data: {
        action: 'BULK_LABEL_DOWNLOAD',
        resource: 'ORDER',
        resourceId: null,
        userId: session.user.id,
        details: {
          orderCount: orders.length,
          successful: results.successful,
          failed: results.failed,
          orderIds: orderIds,
        },
      },
    });

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="shipping-labels-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in bulk label download:', error);
    return NextResponse.json(
      { error: 'Failed to download labels' },
      { status: 500 }
    );
  }
}
