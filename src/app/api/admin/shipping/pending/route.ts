/**
 * Admin Shipping - Pending Shipments API
 * Returns pending shipments for fulfillment dashboard
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

    // Get shipments that need processing
    const shipments = await prisma.order.findMany({
      where: {
        status: {
          in: ['PAID', 'PROCESSING', 'SHIPPED']
        },
        // Include orders that might not have shipments yet or have shipments in early stages
        OR: [
          { shipment: null },
          {
            shipment: {
              status: {
                in: ['DRAFT', 'RATE_CALCULATED', 'BOOKED', 'LABEL_GENERATED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT']
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        shippingAddress: true,
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                weight: true,
                dimensions: true,
                shippingClass: true,
              }
            }
          }
        },
        shipment: {
          include: {
            trackingEvents: {
              orderBy: { eventTime: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for performance
    });

    // Transform the data for the frontend
    const pendingShipments = shipments.map(order => {
      // Calculate total weight from order items
      const totalWeight = order.orderItems.reduce((sum, item) => {
        const productWeight = item.product.weight || 0;
        return sum + (productWeight * item.quantity);
      }, 0);

      // Determine dimensions (simplified - take largest dimensions)
      const dimensions = order.orderItems.reduce((max, item) => {
        const productDimensions = item.product.dimensions as any;
        if (productDimensions && typeof productDimensions === 'object') {
          const volume = (productDimensions.length || 0) * (productDimensions.width || 0) * (productDimensions.height || 0);
          const maxVolume = (max.length || 0) * (max.width || 0) * (max.height || 0);
          return volume > maxVolume ? productDimensions : max;
        }
        return max;
      }, { length: 0, width: 0, height: 0 });

      const dimensionsString = dimensions.length > 0 
        ? `${dimensions.length}×${dimensions.width}×${dimensions.height}cm`
        : undefined;

      return {
        id: order.shipment?.id || `pending-${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || order.guestEmail || 'Guest Customer',
        customerEmail: order.user?.email || order.guestEmail,
        customerPhone: order.user?.phone || order.guestPhone,
        deliveryAddress: {
          name: order.shippingAddress?.name || order.user?.name || 'Customer',
          addressLine1: order.shippingAddress?.addressLine1 || '',
          addressLine2: order.shippingAddress?.addressLine2,
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          postalCode: order.shippingAddress?.postalCode || '',
        },
        status: order.shipment?.status || 'DRAFT',
        createdAt: order.createdAt.toISOString(),
        estimatedDelivery: order.shipment?.estimatedDelivery?.toISOString(),
        totalValue: order.total,
        weight: totalWeight > 0 ? totalWeight : undefined,
        dimensions: dimensionsString,
        specialInstructions: order.deliveryInstructions || order.shipment?.specialInstructions,
        courierSelected: !!order.selectedCourierId,
        labelGenerated: order.shipment?.labelGenerated || false,
        pickupScheduled: order.shipment?.pickupScheduled || false,
        trackingNumber: order.shipment?.trackingNumber,
        courierName: order.shipment?.courierName,
        serviceName: order.shipment?.serviceName,
      };
    });

    return NextResponse.json({
      success: true,
      shipments: pendingShipments,
      total: pendingShipments.length,
    });

  } catch (error) {
    console.error('Error fetching pending shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending shipments' },
      { status: 500 }
    );
  }
}