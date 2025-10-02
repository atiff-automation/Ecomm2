/**

export const dynamic = 'force-dynamic';

 * Shipment Booking API
 * Creates EasyParcel shipments after successful payment
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import {
  easyParcelService,
  type ShipmentBookingRequest,
} from '@/lib/shipping/easyparcel-service';
import { z } from 'zod';

// Validation schema for shipment booking
const shipmentBookingSchema = z.object({
  orderId: z.string().cuid(),
  courierId: z.string().min(1),
  serviceType: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']),
  pickupDate: z.string().optional(), // YYYY-MM-DD
  pickupTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  specialInstructions: z.string().max(500).optional(),
  shippingPreferences: z
    .object({
      insurance: z.boolean().default(false),
      signatureRequired: z.boolean().default(false),
      cod: z
        .object({
          enabled: z.boolean().default(false),
          amount: z.number().optional(),
          paymentMethod: z.enum(['CASH', 'CHEQUE']).optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    console.log('📦 Shipment Booking Request:', {
      userId: session?.user?.id || 'guest',
      data: body,
    });

    // Validate request
    const validatedData = shipmentBookingSchema.parse(body);

    // Get order with all necessary information
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                weight: true,
                dimensions: true,
                shippingClass: true,
                customsDescription: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        shipment: true, // Check if shipment already exists
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Verify order ownership
    if (session?.user?.id && order.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // Check if order is paid
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Order must be paid before creating shipment' },
        { status: 400 }
      );
    }

    // Check if shipment already exists
    if (order.shipment) {
      return NextResponse.json(
        {
          message: 'Shipment already exists for this order',
          shipment: order.shipment,
        },
        { status: 409 }
      );
    }

    // Prepare addresses for EasyParcel
    const pickupAddress = {
      name: process.env.BUSINESS_NAME || 'JRM E-commerce',
      company: process.env.BUSINESS_NAME || 'JRM E-commerce',
      phone: process.env.BUSINESS_PHONE || '+60123456789',
      email: process.env.BUSINESS_EMAIL || 'noreply@jrmecommerce.com',
      address_line_1:
        process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Example',
      address_line_2: process.env.BUSINESS_ADDRESS_LINE2 || '',
      city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
      state: (process.env.BUSINESS_STATE || 'KUL') as any,
      postcode: process.env.BUSINESS_POSTAL_CODE || '50000',
      country: 'MY',
    };

    const deliveryAddress = {
      name: `${order.shippingAddress!.firstName} ${order.shippingAddress!.lastName}`,
      company: order.shippingAddress!.company || '',
      phone: order.shippingAddress!.phone || '+60123456789', // Default phone if not provided
      email: order.user?.email || order.guestEmail || '',
      address_line_1: order.shippingAddress!.addressLine1,
      address_line_2: order.shippingAddress!.addressLine2 || '',
      city: order.shippingAddress!.city,
      state: order.shippingAddress!.state as any,
      postcode: order.shippingAddress!.postalCode,
      country: order.shippingAddress!.country || 'MY',
    };

    // Calculate parcel details
    const totalWeight = order.orderItems.reduce((sum, item) => {
      const productWeight = item.product.weight
        ? Number(item.product.weight)
        : 0.5; // Default 0.5kg
      return sum + productWeight * item.quantity;
    }, 0);

    const totalValue = Number(order.total);

    // Prepare parcel content description
    const contentDescription = order.orderItems
      .map(item => `${item.productName} x${item.quantity}`)
      .join(', ')
      .substring(0, 100);

    // Get largest product dimensions if available
    let parcelDimensions: any = {};
    const itemWithDimensions = order.orderItems.find(
      item =>
        item.product.dimensions && typeof item.product.dimensions === 'object'
    );

    if (itemWithDimensions?.product.dimensions) {
      const dims = itemWithDimensions.product.dimensions as any;
      if (dims.length && dims.width && dims.height) {
        parcelDimensions = {
          length: dims.length,
          width: dims.width,
          height: dims.height,
        };
      }
    }

    // Prepare EasyParcel shipment booking request
    const shipmentRequest: ShipmentBookingRequest = {
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      parcel: {
        weight: Math.max(totalWeight, 0.1), // Minimum 0.1kg
        value: totalValue,
        content: contentDescription,
        quantity: order.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        ...parcelDimensions,
      },
      service_id: validatedData.courierId,
      reference: order.orderNumber,
      pickup_date: validatedData.pickupDate,
      pickup_time: validatedData.pickupTime,
      special_instruction: validatedData.specialInstructions,
      insurance: validatedData.shippingPreferences?.insurance || false,
      signature_required:
        validatedData.shippingPreferences?.signatureRequired || false,
      cod: validatedData.shippingPreferences?.cod?.enabled
        ? {
            amount: validatedData.shippingPreferences.cod.amount || totalValue,
            payment_method:
              validatedData.shippingPreferences.cod.paymentMethod || 'CASH',
          }
        : undefined,
    };

    console.log('🚚 Creating EasyParcel shipment:', {
      orderNumber: order.orderNumber,
      totalWeight,
      totalValue,
      courierId: validatedData.courierId,
    });

    // Book shipment with EasyParcel
    const easyParcelResponse =
      await easyParcelService.bookShipment(shipmentRequest);

    console.log('✅ EasyParcel shipment created:', {
      shipmentId: easyParcelResponse.shipment_id,
      trackingNumber: easyParcelResponse.tracking_number,
    });

    // Create shipment record in database
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        easyParcelShipmentId: easyParcelResponse.shipment_id,
        trackingNumber: easyParcelResponse.tracking_number,

        // Courier information
        courierId: easyParcelResponse.courier.id,
        courierName: easyParcelResponse.courier.name,
        serviceName: easyParcelResponse.courier.service_name,
        serviceType: validatedData.serviceType,

        // Addresses
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddress,
        parcelDetails: shipmentRequest.parcel,

        // Pricing
        originalPrice: easyParcelResponse.total_price,
        finalPrice: easyParcelResponse.total_price,
        insuranceAmount: validatedData.shippingPreferences?.insurance
          ? Math.min(totalValue * 0.02, 5000)
          : null,
        codAmount: validatedData.shippingPreferences?.cod?.enabled
          ? validatedData.shippingPreferences.cod.amount
          : null,

        // Status
        status: 'BOOKED',
        statusDescription: 'Shipment booked with EasyParcel',
        estimatedDelivery: easyParcelResponse.estimated_delivery
          ? new Date(easyParcelResponse.estimated_delivery)
          : null,

        // Label
        labelUrl: easyParcelResponse.label_url,
        labelGenerated: !!easyParcelResponse.label_url,

        // Pickup
        pickupDate: validatedData.pickupDate
          ? new Date(validatedData.pickupDate)
          : null,
        pickupTimeSlot: validatedData.pickupTime,

        // Special instructions
        specialInstructions: validatedData.specialInstructions,
        signatureRequired:
          validatedData.shippingPreferences?.signatureRequired || false,
        insuranceRequired:
          validatedData.shippingPreferences?.insurance || false,
      },
    });

    // Update order with tracking information
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: easyParcelResponse.tracking_number,
        selectedCourierId: easyParcelResponse.courier.id,
        estimatedDeliveryDate: easyParcelResponse.estimated_delivery
          ? new Date(easyParcelResponse.estimated_delivery)
          : null,
        status: 'PROCESSING', // Update order status
      },
    });

    // Create initial tracking event
    await prisma.shipmentTracking.create({
      data: {
        shipmentId: shipment.id,
        eventCode: 'BOOKED',
        eventName: 'Shipment Booked',
        description: 'Shipment successfully booked with EasyParcel',
        eventTime: new Date(),
        source: 'EASYPARCEL',
      },
    });

    console.log('📋 Shipment record created in database:', {
      shipmentId: shipment.id,
      orderNumber: order.orderNumber,
      trackingNumber: shipment.trackingNumber,
    });

    return NextResponse.json({
      success: true,
      message: 'Shipment booked successfully',
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        courierName: shipment.courierName,
        serviceName: shipment.serviceName,
        estimatedDelivery: shipment.estimatedDelivery,
        labelUrl: shipment.labelUrl,
        status: shipment.status,
      },
      easyParcelData: {
        shipmentId: easyParcelResponse.shipment_id,
        reference: easyParcelResponse.reference,
        totalPrice: easyParcelResponse.total_price,
      },
    });
  } catch (error) {
    console.error('❌ Shipment booking error:', error);

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
        { message: `Shipment booking failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error during shipment booking' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve shipment information for an order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Get shipment with tracking events
    const shipment = await prisma.shipment.findUnique({
      where: { orderId },
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
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Verify access rights
    if (session?.user?.id && shipment.order.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized access to shipment' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      shipment: {
        id: shipment.id,
        orderId: shipment.orderId,
        orderNumber: shipment.order.orderNumber,
        trackingNumber: shipment.trackingNumber,
        courierName: shipment.courierName,
        serviceName: shipment.serviceName,
        status: shipment.status,
        statusDescription: shipment.statusDescription,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        labelUrl: shipment.labelUrl,
        labelGenerated: shipment.labelGenerated,
        pickupScheduled: shipment.pickupScheduled,
        pickupDate: shipment.pickupDate,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      },
      trackingEvents: shipment.trackingEvents,
      easyParcelData: {
        shipmentId: shipment.easyParcelShipmentId,
      },
    });
  } catch (error) {
    console.error('❌ Get shipment error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve shipment information' },
      { status: 500 }
    );
  }
}
