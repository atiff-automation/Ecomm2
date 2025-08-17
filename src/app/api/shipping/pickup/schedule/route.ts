/**
 * Pickup Scheduling API
 * Schedules package pickup with EasyParcel
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService, type PickupRequest } from '@/lib/shipping/easyparcel-service';
import { z } from 'zod';

// Validation schema for pickup scheduling
const pickupScheduleSchema = z.object({
  shipmentIds: z.array(z.string().cuid()).min(1, 'At least one shipment is required'),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  pickupTime: z.enum(['morning', 'afternoon', 'evening']),
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactPhone: z.string().regex(/^\+60[0-9]{8,10}$/, 'Valid Malaysian phone number required'),
  specialInstructions: z.string().max(500).optional(),
});

/**
 * POST - Schedule pickup for shipments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin permissions (only admins can schedule pickups)
    if (!session?.user || !['ADMIN', 'SUPERADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required for pickup scheduling' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📋 Pickup schedule request:', {
      userId: session.user.id,
      shipmentCount: body.shipmentIds?.length || 0,
      pickupDate: body.pickupDate,
    });

    // Validate request
    const validatedData = pickupScheduleSchema.parse(body);

    // Validate pickup date (must be future date)
    const pickupDate = new Date(validatedData.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
      return NextResponse.json(
        { message: 'Pickup date must be in the future' },
        { status: 400 }
      );
    }

    // Get shipments that need pickup scheduling
    const shipments = await prisma.shipment.findMany({
      where: {
        id: { in: validatedData.shipmentIds },
        status: { in: ['LABEL_GENERATED', 'BOOKED'] }, // Only allow scheduling for these statuses
        pickupScheduled: false,
      },
      include: {
        order: {
          select: { 
            orderNumber: true,
            paymentStatus: true,
          }
        },
      },
    });

    if (shipments.length === 0) {
      return NextResponse.json(
        { message: 'No eligible shipments found for pickup scheduling' },
        { status: 400 }
      );
    }

    // Verify all shipments have EasyParcel IDs
    const invalidShipments = shipments.filter(s => !s.easyParcelShipmentId);
    if (invalidShipments.length > 0) {
      return NextResponse.json(
        { 
          message: 'Some shipments are missing EasyParcel shipment IDs',
          invalidShipments: invalidShipments.map(s => s.order.orderNumber),
        },
        { status: 400 }
      );
    }

    // Prepare EasyParcel pickup request
    const pickupRequest: PickupRequest = {
      shipment_ids: shipments.map(s => s.easyParcelShipmentId!),
      pickup_date: validatedData.pickupDate,
      pickup_time: validatedData.pickupTime,
      contact_person: validatedData.contactPerson,
      contact_phone: validatedData.contactPhone,
      special_instruction: validatedData.specialInstructions,
    };

    console.log('🚚 Scheduling EasyParcel pickup:', {
      shipmentCount: pickupRequest.shipment_ids.length,
      pickupDate: pickupRequest.pickup_date,
      pickupTime: pickupRequest.pickup_time,
    });

    // Schedule pickup with EasyParcel
    const pickupResponse = await easyParcelService.schedulePickup(pickupRequest);

    console.log('✅ Pickup scheduled with EasyParcel:', {
      pickupId: pickupResponse.pickup_id,
      status: pickupResponse.status,
    });

    // Update shipments in database transaction
    const updatedShipments = await prisma.$transaction(async (tx) => {
      const updates = [];

      for (const shipment of shipments) {
        // Update shipment
        const updated = await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            pickupScheduled: true,
            pickupDate: pickupDate,
            pickupTimeSlot: validatedData.pickupTime,
            status: 'PICKUP_SCHEDULED',
            statusDescription: `Pickup scheduled for ${validatedData.pickupDate} ${validatedData.pickupTime}`,
          },
        });

        // Create tracking event
        await tx.shipmentTracking.create({
          data: {
            shipmentId: shipment.id,
            eventCode: 'PICKUP_SCHEDULED',
            eventName: 'Pickup Scheduled',
            description: `Pickup scheduled for ${validatedData.pickupDate} during ${validatedData.pickupTime}`,
            location: 'Origin Hub',
            eventTime: new Date(),
            source: 'EASYPARCEL',
          },
        });

        updates.push(updated);
      }

      return updates;
    });

    // Create pickup log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'Pickup',
        resourceId: pickupResponse.pickup_id,
        details: {
          pickupId: pickupResponse.pickup_id,
          shipmentIds: validatedData.shipmentIds,
          pickupDate: validatedData.pickupDate,
          pickupTime: validatedData.pickupTime,
          contactPerson: validatedData.contactPerson,
          shipmentCount: shipments.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    console.log('📋 Pickup scheduled for shipments:', {
      shipmentCount: updatedShipments.length,
      pickupId: pickupResponse.pickup_id,
      orderNumbers: shipments.map(s => s.order.orderNumber),
    });

    return NextResponse.json({
      success: true,
      message: `Pickup scheduled successfully for ${updatedShipments.length} shipment(s)`,
      pickup: {
        pickupId: pickupResponse.pickup_id,
        status: pickupResponse.status,
        pickupDate: validatedData.pickupDate,
        pickupTime: validatedData.pickupTime,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone,
        shipmentCount: updatedShipments.length,
      },
      shipments: updatedShipments.map(shipment => ({
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        courierName: shipment.courierName,
        status: shipment.status,
      })),
    });

  } catch (error) {
    console.error('❌ Pickup scheduling error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
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
        { message: `Pickup scheduling failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error during pickup scheduling' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get pickup schedules and eligible shipments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin permissions
    if (!session?.user || !['ADMIN', 'SUPERADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'eligible';

    if (action === 'eligible') {
      // Get shipments eligible for pickup scheduling
      const eligibleShipments = await prisma.shipment.findMany({
        where: {
          status: { in: ['LABEL_GENERATED', 'BOOKED'] },
          pickupScheduled: false,
          easyParcelShipmentId: { not: null },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              total: true,
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to recent shipments
      });

      const summary = {
        totalEligible: eligibleShipments.length,
        totalValue: eligibleShipments.reduce((sum, s) => sum + Number(s.originalPrice), 0),
        courierBreakdown: eligibleShipments.reduce((acc, s) => {
          acc[s.courierName] = (acc[s.courierName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return NextResponse.json({
        eligibleShipments: eligibleShipments.map(shipment => ({
          id: shipment.id,
          trackingNumber: shipment.trackingNumber,
          orderNumber: shipment.order.orderNumber,
          courierName: shipment.courierName,
          serviceName: shipment.serviceName,
          status: shipment.status,
          createdAt: shipment.createdAt,
          customerName: shipment.order.user ? 
            `${shipment.order.user.firstName} ${shipment.order.user.lastName}` : 
            'Guest Customer',
          orderTotal: shipment.order.total,
        })),
        summary,
      });
    }

    if (action === 'scheduled') {
      // Get upcoming scheduled pickups
      const scheduledPickups = await prisma.shipment.findMany({
        where: {
          pickupScheduled: true,
          status: { in: ['PICKUP_SCHEDULED', 'PICKED_UP'] },
          pickupDate: {
            gte: new Date(),
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
        },
        orderBy: { pickupDate: 'asc' },
      });

      // Group by pickup date
      const groupedPickups = scheduledPickups.reduce((acc, shipment) => {
        const dateKey = shipment.pickupDate?.toISOString().split('T')[0] || 'unknown';
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({
          id: shipment.id,
          trackingNumber: shipment.trackingNumber,
          orderNumber: shipment.order.orderNumber,
          courierName: shipment.courierName,
          pickupTimeSlot: shipment.pickupTimeSlot,
          status: shipment.status,
          customerName: shipment.order.user ? 
            `${shipment.order.user.firstName} ${shipment.order.user.lastName}` : 
            'Guest Customer',
        });
        return acc;
      }, {} as Record<string, any[]>);

      return NextResponse.json({
        scheduledPickups: groupedPickups,
        summary: {
          totalScheduled: scheduledPickups.length,
          upcomingDates: Object.keys(groupedPickups).sort(),
        },
      });
    }

    return NextResponse.json(
      { message: 'Invalid action. Use ?action=eligible or ?action=scheduled' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Get pickup schedules error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve pickup information' },
      { status: 500 }
    );
  }
}