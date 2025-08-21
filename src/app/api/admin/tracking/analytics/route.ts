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

    // Get shipment statistics
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        order: true,
        trackingEvents: true
      }
    });

    // Calculate metrics
    const totalShipments = shipments.length;
    const inTransit = shipments.filter(s => 
      ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status as string)
    ).length;
    const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
    const exceptions = shipments.filter(s => s.status === 'FAILED').length;

    // Calculate average delivery time for delivered shipments
    const deliveredShipments = shipments.filter(s => s.actualDelivery && s.createdAt);
    const totalDeliveryTime = deliveredShipments.reduce((sum, shipment) => {
      const deliveryTime = new Date(shipment.actualDelivery!).getTime() - new Date(shipment.createdAt).getTime();
      return sum + (deliveryTime / (1000 * 60 * 60 * 24)); // Convert to days
    }, 0);
    const averageDeliveryTime = deliveredShipments.length > 0 ? totalDeliveryTime / deliveredShipments.length : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = shipments.filter(s => {
      if (!s.actualDelivery || !s.estimatedDelivery) return false;
      return new Date(s.actualDelivery) <= new Date(s.estimatedDelivery);
    }).length;
    const onTimeDeliveryRate = deliveredShipments.length > 0 ? (onTimeDeliveries / deliveredShipments.length) * 100 : 0;

    // Calculate courier performance
    const courierStats = shipments.reduce((acc, shipment) => {
      const courierName = shipment.courierName;
      if (!acc[courierName]) {
        acc[courierName] = {
          shipmentCount: 0,
          delivered: 0,
          totalDeliveryTime: 0,
          deliveredWithTime: 0
        };
      }
      
      acc[courierName].shipmentCount++;
      
      if (shipment.status === 'DELIVERED') {
        acc[courierName].delivered++;
        
        if (shipment.actualDelivery && shipment.createdAt) {
          const deliveryTime = new Date(shipment.actualDelivery).getTime() - new Date(shipment.createdAt).getTime();
          acc[courierName].totalDeliveryTime += (deliveryTime / (1000 * 60 * 60 * 24));
          acc[courierName].deliveredWithTime++;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

    const courierPerformance = Object.entries(courierStats).map(([courierName, stats]) => ({
      courierName,
      shipmentCount: stats.shipmentCount,
      deliveryRate: stats.shipmentCount > 0 ? (stats.delivered / stats.shipmentCount) * 100 : 0,
      averageTime: stats.deliveredWithTime > 0 ? stats.totalDeliveryTime / stats.deliveredWithTime : 0
    })).sort((a, b) => b.shipmentCount - a.shipmentCount);

    return NextResponse.json({
      success: true,
      stats: {
        totalShipments,
        inTransit,
        delivered,
        exceptions,
        averageDeliveryTime,
        onTimeDeliveryRate,
        courierPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching tracking analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}