/**
 * Shipping Label Generation API
 * Downloads and serves shipping labels from EasyParcel
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import fs from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: {
    shipmentId: string;
  };
}

/**
 * GET - Generate and download shipping label
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shipmentId } = params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    const regenerate = searchParams.get('regenerate') === 'true';

    console.log('🏷️ Label request:', {
      shipmentId,
      download,
      regenerate,
    });

    const session = await getServerSession(authOptions);

    // Get shipment information
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Verify access rights (admin or order owner)
    const isAdmin =
      session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';
    const isOwner =
      session?.user?.id && shipment.order.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'Unauthorized access to shipping label' },
        { status: 403 }
      );
    }

    // Check if shipment is in valid status for label generation
    if (
      !['BOOKED', 'LABEL_GENERATED', 'PICKUP_SCHEDULED', 'PICKED_UP'].includes(
        shipment.status
      )
    ) {
      return NextResponse.json(
        { message: 'Shipment is not in valid status for label generation' },
        { status: 400 }
      );
    }

    // Define label storage path
    const labelsDir = path.join(process.cwd(), 'public', 'shipping-labels');
    const labelFileName = `${shipment.order.orderNumber}-${shipment.id}.pdf`;
    const labelPath = path.join(labelsDir, labelFileName);
    const labelUrl = `/shipping-labels/${labelFileName}`;

    // Check if label already exists and is valid
    let labelExists = false;
    try {
      await fs.access(labelPath);
      labelExists = true;
      console.log('📄 Existing label found:', labelPath);
    } catch (error) {
      console.log('📄 No existing label found, will generate new one');
    }

    // Generate or regenerate label if needed
    if (!labelExists || regenerate) {
      console.log('🔄 Generating new shipping label...');

      if (!shipment.easyParcelShipmentId) {
        return NextResponse.json(
          { message: 'EasyParcel shipment ID not found' },
          { status: 400 }
        );
      }

      try {
        // Ensure labels directory exists
        await fs.mkdir(labelsDir, { recursive: true });

        // Download label from EasyParcel
        const labelBuffer = await easyParcelService.generateLabel(
          shipment.easyParcelShipmentId
        );

        // Save label to file system
        await fs.writeFile(labelPath, labelBuffer);

        // Update shipment record
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            labelUrl: labelUrl,
            labelGenerated: true,
            status:
              shipment.status === 'BOOKED'
                ? 'LABEL_GENERATED'
                : shipment.status,
            statusDescription: 'Shipping label generated',
          },
        });

        // Create tracking event
        await prisma.shipmentTracking.create({
          data: {
            shipmentId: shipment.id,
            eventCode: 'LABEL_GENERATED',
            eventName: 'Label Generated',
            description: 'Shipping label successfully generated',
            eventTime: new Date(),
            source: 'EASYPARCEL',
          },
        });

        console.log('✅ Label generated and saved:', labelPath);
      } catch (error) {
        console.error('❌ Label generation failed:', error);
        return NextResponse.json(
          { message: `Label generation failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Return label data based on request type
    if (download) {
      try {
        // Read and serve the PDF file
        const labelBuffer = await fs.readFile(labelPath);

        return new NextResponse(labelBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${shipment.order.orderNumber}-label.pdf"`,
            'Content-Length': labelBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('❌ Label file read error:', error);
        return NextResponse.json(
          { message: 'Failed to read label file' },
          { status: 500 }
        );
      }
    } else {
      // Return label information
      return NextResponse.json({
        success: true,
        message: 'Label available',
        label: {
          shipmentId: shipment.id,
          orderNumber: shipment.order.orderNumber,
          trackingNumber: shipment.trackingNumber,
          labelUrl: labelUrl,
          fileName: labelFileName,
          downloadUrl: `/api/shipping/labels/${shipment.id}?download=true`,
          generatedAt: shipment.updatedAt,
        },
        shipment: {
          courierName: shipment.courierName,
          serviceName: shipment.serviceName,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery,
        },
      });
    }
  } catch (error) {
    console.error('❌ Label API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove label file (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { shipmentId } = params;
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Delete label file
    const labelsDir = path.join(process.cwd(), 'public', 'shipping-labels');
    const labelFileName = `${shipment.order.orderNumber}-${shipment.id}.pdf`;
    const labelPath = path.join(labelsDir, labelFileName);

    try {
      await fs.unlink(labelPath);
      console.log('🗑️ Label file deleted:', labelPath);
    } catch (error) {
      console.log('⚠️ Label file not found or already deleted');
    }

    // Update shipment record
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        labelUrl: null,
        labelGenerated: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    console.error('❌ Label deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete label' },
      { status: 500 }
    );
  }
}
