/**
 * Admin Shipping - Statistics API
 * Returns shipping performance statistics for admin dashboard
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date ranges for calculations
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Parallel queries for performance
    const [
      totalShipments,
      pendingBookingCount,
      awaitingPickupCount,
      inTransitCount,
      deliveredCount,
      failedCount,
      totalRevenue,
      todayPickupsCount,
      pendingLabelsCount,
      deliveryTimes
    ] = await Promise.all([
      // Total shipments
      prisma.shipment.count(),

      // Pending booking (orders without shipments or draft shipments)
      prisma.order.count({
        where: {
          status: 'PAID',
          OR: [
            { shipment: null },
            { shipment: { status: 'DRAFT' } }
          ]
        }
      }),

      // Awaiting pickup
      prisma.shipment.count({
        where: {
          status: {
            in: ['BOOKED', 'LABEL_GENERATED', 'PICKUP_SCHEDULED']
          }
        }
      }),

      // In transit
      prisma.shipment.count({
        where: {
          status: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
          }
        }
      }),

      // Delivered
      prisma.shipment.count({
        where: {
          status: 'DELIVERED'
        }
      }),

      // Failed/Cancelled
      prisma.shipment.count({
        where: {
          status: {
            in: ['FAILED', 'CANCELLED']
          }
        }
      }),

      // Total revenue from shipped orders (last 30 days)
      prisma.order.aggregate({
        where: {
          status: 'SHIPPED',
          shippedAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          total: true
        }
      }),

      // Today's pickups
      prisma.shipment.count({
        where: {
          pickupDate: {
            gte: todayStart,
            lte: todayEnd
          },
          status: {
            in: ['PICKUP_SCHEDULED', 'PICKED_UP']
          }
        }
      }),

      // Pending labels (booked but no label generated)
      prisma.shipment.count({
        where: {
          status: 'BOOKED',
          labelGenerated: false
        }
      }),

      // Delivery times for average calculation
      prisma.shipment.findMany({
        where: {
          status: 'DELIVERED',
          actualDelivery: { not: null },
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true,
          actualDelivery: true
        },
        take: 100 // Limit for performance
      })
    ]);

    // Calculate average delivery time
    let averageDeliveryTime = 0;
    if (deliveryTimes.length > 0) {
      const totalDays = deliveryTimes.reduce((sum, shipment) => {
        if (shipment.actualDelivery) {
          const diffMs = shipment.actualDelivery.getTime() - shipment.createdAt.getTime();
          const days = diffMs / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      averageDeliveryTime = Math.round(totalDays / deliveryTimes.length * 10) / 10; // Round to 1 decimal
    }

    // Get status breakdown for additional insights
    const statusBreakdown = await prisma.shipment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const stats = {
      totalShipments,
      pendingBooking: pendingBookingCount,
      awaitingPickup: awaitingPickupCount,
      inTransit: inTransitCount,
      delivered: deliveredCount,
      failed: failedCount,
      totalRevenue: totalRevenue._sum.total || 0,
      averageDeliveryTime,
      todayPickups: todayPickupsCount,
      pendingLabels: pendingLabelsCount,
      statusBreakdown: statusBreakdown.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      // Additional metrics
      deliverySuccessRate: totalShipments > 0 ? 
        Math.round((deliveredCount / totalShipments) * 100 * 10) / 10 : 0,
      activeShipments: awaitingPickupCount + inTransitCount,
      completedShipments: deliveredCount + failedCount
    };

    return NextResponse.json({
      success: true,
      stats,
      calculatedAt: new Date().toISOString(),
      period: {
        from: thirtyDaysAgo.toISOString(),
        to: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching shipping statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping statistics' },
      { status: 500 }
    );
  }
}