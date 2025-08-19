/**
 * Admin Shipment Booking API
 * Books shipments using admin-selected main and alternative couriers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smartBookingService } from '@/lib/shipping/smart-booking-service';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const bookingRequestSchema = z.object({
  orderId: z.string().min(1),
  options: z.object({
    insurance: z.boolean().optional(),
    insuranceAmount: z.number().min(0).optional(),
    cod: z.boolean().optional(),
    codAmount: z.number().min(0).optional(),
    signatureRequired: z.boolean().optional(),
    specialInstructions: z.string().max(200).optional(),
  }).optional(),
});

/**
 * POST - Book shipment with admin-selected couriers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 Booking request for order:', body.orderId);

    // Validate request
    const validatedData = bookingRequestSchema.parse(body);

    // Get order and shipment details
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        },
        shippingAddress: true,
        orderItems: {
          include: {
            product: {
              select: { name: true, weight: true }
            }
          }
        },
        shipments: {
          include: {
            order: {
              select: { orderNumber: true }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.shippingAddress) {
      return NextResponse.json(
        { error: 'Order has no shipping address' },
        { status: 400 }
      );
    }

    const shipment = order.shipments?.[0];
    if (!shipment) {
      return NextResponse.json(
        { error: 'No shipment found for order - please assign couriers first' },
        { status: 400 }
      );
    }

    if (shipment.status === 'BOOKED') {
      return NextResponse.json(
        { error: 'Shipment already booked' },
        { status: 400 }
      );
    }

    // Get courier selection from shipment metadata
    const metadata = shipment.metadata as any;
    if (!metadata?.adminSelection?.mainCourier) {
      return NextResponse.json(
        { error: 'No courier selection found - please assign couriers first' },
        { status: 400 }
      );
    }

    const mainCourier = metadata.adminSelection.mainCourier;
    const alternativeCourier = metadata.adminSelection.alternativeCourier;

    console.log('🎯 Using admin-selected couriers:', {
      main: mainCourier.courier_name,
      alternative: alternativeCourier?.courier_name,
    });

    // Get business pickup address
    const pickupAddress = await businessShippingConfig.getPickupAddress();

    // Calculate total weight
    const totalWeight = order.orderItems.reduce((sum, item) => {
      return sum + (item.product.weight || 0.5) * item.quantity;
    }, 0);

    // Build booking request
    const bookingData = {
      pickup_address: {
        name: pickupAddress.name,
        phone: pickupAddress.phone,
        address_line_1: pickupAddress.address_line_1,
        address_line_2: pickupAddress.address_line_2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        postcode: pickupAddress.postcode,
        country: 'MY'
      },
      delivery_address: {
        name: `${order.user?.firstName} ${order.user?.lastName}`,
        phone: order.user?.phone || order.shippingAddress.phone || '+60123456789',
        email: order.user?.email,
        address_line_1: order.shippingAddress.address,
        address_line_2: order.shippingAddress.address2 || '',
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postcode: order.shippingAddress.postcode,
        country: 'MY'
      },
      parcel: {
        weight: Math.max(0.1, totalWeight),
        length: 20, // Default dimensions
        width: 15,
        height: 10,
        content: order.orderItems.map(item => item.product.name).join(', '),
        value: order.total
      },
      reference_id: order.orderNumber,
      service_type: mainCourier.service_type,
    };

    // Book shipment with smart booking service
    const bookingResult = await smartBookingService.bookShipmentWithFallback({
      orderId: validatedData.orderId,
      mainCourier,
      alternativeCourier,
      bookingData,
      options: validatedData.options,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: bookingResult.success ? 'SHIPMENT_BOOKED' : 'SHIPMENT_BOOKING_FAILED',
        resource: 'Order',
        resourceId: validatedData.orderId,
        details: {
          orderNumber: order.orderNumber,
          bookingResult: {
            success: bookingResult.success,
            usedCourier: bookingResult.usedCourier.courier_name,
            fallbackUsed: bookingResult.fallbackUsed,
            attempts: bookingResult.attempts.length,
            shipmentId: bookingResult.shipmentId,
            trackingNumber: bookingResult.trackingNumber,
          },
          options: validatedData.options,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'admin',
        userAgent: request.headers.get('user-agent') || 'Admin Panel',
      }
    });

    if (bookingResult.success) {
      console.log('✅ Shipment booking successful:', {
        orderId: validatedData.orderId,
        orderNumber: order.orderNumber,
        shipmentId: bookingResult.shipmentId,
        trackingNumber: bookingResult.trackingNumber,
        courier: bookingResult.usedCourier.courier_name,
        fallbackUsed: bookingResult.fallbackUsed,
      });

      return NextResponse.json({
        success: true,
        message: bookingResult.fallbackUsed 
          ? `Shipment booked successfully with ${bookingResult.usedCourier.courier_name} (fallback used)`
          : `Shipment booked successfully with ${bookingResult.usedCourier.courier_name}`,
        data: {
          shipmentId: bookingResult.shipmentId,
          trackingNumber: bookingResult.trackingNumber,
          courier: bookingResult.usedCourier.courier_name,
          service: bookingResult.usedCourier.service_name,
          fallbackUsed: bookingResult.fallbackUsed,
          attempts: bookingResult.attempts.length,
          bookedAt: new Date().toISOString(),
        }
      });
    } else {
      console.error('❌ Shipment booking failed:', {
        orderId: validatedData.orderId,
        orderNumber: order.orderNumber,
        attempts: bookingResult.attempts,
      });

      return NextResponse.json({
        success: false,
        message: 'Failed to book shipment with all selected couriers',
        error: 'Booking failed',
        details: {
          attempts: bookingResult.attempts,
          mainCourier: mainCourier.courier_name,
          alternativeCourier: alternativeCourier?.courier_name,
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Booking API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to book shipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get booking status for an order
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const bookingStatus = await smartBookingService.getBookingStatus(orderId);

    return NextResponse.json({
      success: true,
      orderId,
      status: bookingStatus,
    });

  } catch (error) {
    console.error('❌ Get booking status error:', error);
    return NextResponse.json(
      { error: 'Failed to get booking status' },
      { status: 500 }
    );
  }
}