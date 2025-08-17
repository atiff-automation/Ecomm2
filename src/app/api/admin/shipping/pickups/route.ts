/**
 * Admin Shipping - Pickup Schedules API
 * Returns scheduled pickups for admin dashboard
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upcoming pickup schedules (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // For now, we'll generate pickup schedules based on shipments that need pickup
    // In a full implementation, you might have a separate PickupSchedule model
    const shipmentsNeedingPickup = await prisma.shipment.findMany({
      where: {
        status: {
          in: ['PICKUP_SCHEDULED', 'LABEL_GENERATED']
        },
        pickupDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            },
            guestEmail: true,
            guestPhone: true
          }
        }
      },
      orderBy: {
        pickupDate: 'asc'
      }
    });

    // Group shipments by pickup date and time slot
    const pickupSchedulesMap = new Map<string, {
      date: string;
      timeSlot: string;
      shipments: any[];
      contactPerson: string;
      contactPhone: string;
      status: string;
    }>();

    shipmentsNeedingPickup.forEach(shipment => {
      if (!shipment.pickupDate) return;

      const dateStr = shipment.pickupDate.toISOString().split('T')[0];
      const timeSlot = shipment.pickupTimeSlot || 'morning';
      const key = `${dateStr}-${timeSlot}`;

      if (!pickupSchedulesMap.has(key)) {
        pickupSchedulesMap.set(key, {
          date: dateStr,
          timeSlot,
          shipments: [],
          contactPerson: 'Admin User', // Default contact
          contactPhone: '+60123456789', // Default phone
          status: 'PENDING'
        });
      }

      const schedule = pickupSchedulesMap.get(key)!;
      schedule.shipments.push({
        id: shipment.id,
        orderNumber: shipment.order.orderNumber,
        trackingNumber: shipment.trackingNumber,
        customerName: shipment.order.user?.name || shipment.order.guestEmail || 'Guest',
        status: shipment.status
      });

      // Update status based on shipment statuses
      if (schedule.shipments.some(s => s.status === 'PICKED_UP')) {
        schedule.status = 'COMPLETED';
      } else if (schedule.shipments.every(s => s.status === 'PICKUP_SCHEDULED')) {
        schedule.status = 'CONFIRMED';
      }
    });

    // Convert map to array and add IDs
    const pickupSchedules = Array.from(pickupSchedulesMap.entries()).map(([key, schedule], index) => ({
      id: key,
      date: schedule.date,
      timeSlot: schedule.timeSlot,
      shipmentCount: schedule.shipments.length,
      contactPerson: schedule.contactPerson,
      contactPhone: schedule.contactPhone,
      status: schedule.status,
      shipments: schedule.shipments.map(s => s.id),
      shipmentDetails: schedule.shipments
    }));

    // Also get some historical data for the last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentPickups = await prisma.shipment.findMany({
      where: {
        status: {
          in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
        },
        pickupDate: {
          gte: sevenDaysAgo,
          lt: now
        }
      },
      select: {
        id: true,
        pickupDate: true,
        pickupTimeSlot: true,
        status: true,
        order: {
          select: {
            orderNumber: true
          }
        }
      },
      orderBy: {
        pickupDate: 'desc'
      }
    });

    // Group recent pickups for historical view
    const recentPickupSchedules = new Map<string, any>();
    recentPickups.forEach(pickup => {
      if (!pickup.pickupDate) return;

      const dateStr = pickup.pickupDate.toISOString().split('T')[0];
      const timeSlot = pickup.pickupTimeSlot || 'morning';
      const key = `${dateStr}-${timeSlot}`;

      if (!recentPickupSchedules.has(key)) {
        recentPickupSchedules.set(key, {
          id: `completed-${key}`,
          date: dateStr,
          timeSlot,
          shipmentCount: 0,
          contactPerson: 'Admin User',
          contactPhone: '+60123456789',
          status: 'COMPLETED',
          shipments: []
        });
      }

      const schedule = recentPickupSchedules.get(key)!;
      schedule.shipmentCount++;
      schedule.shipments.push(pickup.id);
    });

    // Combine upcoming and recent schedules
    const allSchedules = [
      ...pickupSchedules,
      ...Array.from(recentPickupSchedules.values())
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      schedules: allSchedules,
      upcoming: pickupSchedules.length,
      completed: Array.from(recentPickupSchedules.values()).length,
      totalShipments: pickupSchedules.reduce((sum, schedule) => sum + schedule.shipmentCount, 0)
    });

  } catch (error) {
    console.error('Error fetching pickup schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup schedules' },
      { status: 500 }
    );
  }
}