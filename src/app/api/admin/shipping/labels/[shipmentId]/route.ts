import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the shipment
    const shipment = await prisma.shipment.findUnique({
      where: { easyParcelShipmentId: params.shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    try {
      // Get label from EasyParcel
      const labelData = await easyParcelService.downloadLabel(
        params.shipmentId
      );

      if (!labelData) {
        return NextResponse.json(
          { error: 'Label not available' },
          { status: 404 }
        );
      }

      // Log label download
      await prisma.auditLog.create({
        data: {
          action: 'LABEL_DOWNLOADED',
          resource: 'SHIPMENT',
          resourceId: shipment.id,
          userId: session.user.id,
          details: {
            shipmentId: params.shipmentId,
            trackingNumber: shipment.trackingNumber,
            orderNumber: shipment.order.orderNumber,
          },
        },
      });

      // Return PDF label
      return new NextResponse(labelData, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="label-${shipment.order.orderNumber}-${shipment.trackingNumber}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error downloading label:', error);
      return NextResponse.json(
        { error: 'Failed to download label from courier' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in label download:', error);
    return NextResponse.json(
      { error: 'Failed to process label request' },
      { status: 500 }
    );
  }
}
