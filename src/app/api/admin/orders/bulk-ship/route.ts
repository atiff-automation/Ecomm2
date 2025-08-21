import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { smartBookingService } from '@/lib/shipping/smart-booking-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

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

    // Fetch orders ready for shipping
    const orders = await prisma.order.findMany({
      where: { 
        id: { in: orderIds },
        status: 'PROCESSING',
        shipment: null // No existing shipment
      },
      include: { 
        orderItems: { 
          include: { 
            product: true 
          } 
        },
        shippingAddress: true,
        billingAddress: true
      }
    });

    const results = {
      total: orders.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each order for shipping
    for (const order of orders) {
      try {
        // Create basic shipment record first
        const shipment = await prisma.shipment.create({
          data: {
            orderId: order.id,
            courierId: 'DEFAULT', // Will be updated by smart booking
            courierName: 'Processing',
            serviceName: 'Standard',
            serviceType: 'STANDARD',
            pickupAddress: {
              // Use business address from environment
              name: process.env.BUSINESS_NAME || 'EcomJRM Store',
              phone: process.env.BUSINESS_PHONE || '+60123456789',
              address: process.env.BUSINESS_ADDRESS_LINE1 || 'Business Address',
              city: process.env.BUSINESS_CITY || 'Kuala Terengganu',
              state: process.env.BUSINESS_STATE || 'TRG',
              postcode: process.env.BUSINESS_POSTAL_CODE || '20000'
            },
            deliveryAddress: {
              name: `${order.shippingAddress!.firstName} ${order.shippingAddress!.lastName}`,
              phone: order.shippingAddress!.phone || '',
              address: order.shippingAddress!.addressLine1,
              address2: order.shippingAddress!.addressLine2,
              city: order.shippingAddress!.city,
              state: order.shippingAddress!.state,
              postcode: order.shippingAddress!.postalCode
            },
            parcelDetails: {
              weight: 1.0, // Default weight, should be calculated from products
              length: 20,
              width: 15, 
              height: 10,
              value: Number(order.total)
            },
            originalPrice: Number(order.shippingCost),
            finalPrice: Number(order.shippingCost),
            status: 'DRAFT'
          }
        });

        // Note: In a real implementation, you would use the smart booking service
        // to get actual shipping rates and book with EasyParcel
        // For now, we'll create a basic shipment record
        
        // Update order status to SHIPPED
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: 'SHIPPED'
          }
        });

        results.successful++;
        
        // Rate limiting between shipments
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log bulk operation
    await prisma.auditLog.create({
      data: {
        action: 'BULK_SHIP_ORDERS',
        resource: 'ORDER',
        resourceId: null,
        userId: session.user.id,
        details: {
          orderCount: orders.length,
          successful: results.successful,
          failed: results.failed,
          orderIds: orderIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk shipping completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error in bulk shipping:', error);
    return NextResponse.json({ error: 'Failed to process bulk shipping' }, { status: 500 });
  }
}