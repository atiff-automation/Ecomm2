/**
 * Fulfillment Quote API Route
 *
 * POST /api/admin/orders/[orderId]/fulfill/quote
 *
 * Gets shipping quote from EasyParcel without completing payment.
 * This is Step 1 of the two-step fulfillment process.
 *
 * @route POST /api/admin/orders/[orderId]/fulfill/quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getShippingSettings } from '@/lib/shipping/shipping-settings';
import {
  createEasyParcelService,
  EasyParcelError,
} from '@/lib/shipping/easyparcel-service';
import { SHIPPING_ERROR_CODES } from '@/lib/shipping/constants';
import type { EasyParcelShipmentRequest } from '@/lib/shipping/types';
import { getPickupAddressOrThrow } from '@/lib/shipping/business-profile-integration';

/**
 * Zod schema for quote request
 */
const quoteSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

/**
 * POST - Get shipping quote from EasyParcel (Step 1)
 *
 * Steps:
 * 1. Validate admin authentication
 * 2. Parse and validate request body
 * 3. Fetch order with necessary data
 * 4. Validate order status (must be PAID)
 * 5. Validate shipping address
 * 6. Get shipping settings
 * 7. Get pickup address from BusinessProfile
 * 8. Validate shipping weight
 * 9. Build EasyParcel shipment request
 * 10. Create shipment with EasyParcel API (EPSubmitOrderBulk)
 * 11. Return quote with shipmentId and price
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Step 1: Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Admin access required.',
        },
        { status: 401 }
      );
    }

    console.log(
      `[FulfillmentQuote] Admin ${session.user.email} requesting quote for order ${params.orderId}`
    );

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validatedData = quoteSchema.parse(body);

    // Step 3: Fetch order with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Step 4: Validate order status
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          message: `Order must be paid to get shipping quote. Current payment status: ${order.paymentStatus}`,
          code: SHIPPING_ERROR_CODES.INVALID_ORDER_STATUS,
        },
        { status: 400 }
      );
    }

    // Check if already fulfilled
    if (order.trackingNumber && order.airwayBillNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order already fulfilled',
          code: SHIPPING_ERROR_CODES.ALREADY_FULFILLED,
        },
        { status: 400 }
      );
    }

    // Step 5: Validate shipping address
    if (!order.shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shipping address not found for this order',
          code: SHIPPING_ERROR_CODES.INVALID_ADDRESS,
        },
        { status: 400 }
      );
    }

    // Step 6: Get shipping settings
    const settings = await getShippingSettings();

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Shipping settings not configured. Please configure in admin settings.',
          code: SHIPPING_ERROR_CODES.NOT_CONFIGURED,
        },
        { status: 400 }
      );
    }

    // Step 7: Get pickup address from BusinessProfile
    let pickupAddress;
    try {
      pickupAddress = await getPickupAddressOrThrow();
      console.log('[FulfillmentQuote] Pickup address retrieved from BusinessProfile');
    } catch (error) {
      console.error('[FulfillmentQuote] Failed to get pickup address:', error);
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to retrieve pickup address from Business Profile',
          code: SHIPPING_ERROR_CODES.INVALID_ADDRESS,
        },
        { status: 400 }
      );
    }

    // Step 8: Validate shipping weight
    const shippingWeight = order.shippingWeight
      ? parseFloat(order.shippingWeight.toString())
      : null;

    if (!shippingWeight || shippingWeight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid shipping weight. Cannot create shipment without weight.',
          code: SHIPPING_ERROR_CODES.INVALID_WEIGHT,
        },
        { status: 400 }
      );
    }

    // Step 9: Build EasyParcel shipment request
    const shipmentRequest: EasyParcelShipmentRequest = {
      service_id: validatedData.serviceId,
      reference: order.orderNumber,
      pickup: {
        name: pickupAddress.businessName,
        phone: pickupAddress.phone,
        address: pickupAddress.addressLine1,
        address2: pickupAddress.addressLine2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        postcode: pickupAddress.postalCode,
        country: pickupAddress.country,
        pickup_date: validatedData.pickupDate,
      },
      delivery: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        phone: order.shippingAddress.phone || '',
        address: order.shippingAddress.addressLine1,
        address2: order.shippingAddress.addressLine2 || '',
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postcode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      parcel: {
        weight: shippingWeight,
      },
      addon_whatsapp_tracking_enabled: settings.whatsappNotificationsEnabled ? 1 : 0,
    };

    console.log('[FulfillmentQuote] Shipment request:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceId: validatedData.serviceId,
      pickupDate: validatedData.pickupDate,
      weight: shippingWeight,
    });

    // Step 10: Create shipment with EasyParcel API
    const easyParcelService = createEasyParcelService(settings);

    let shipmentResponse;
    try {
      shipmentResponse =
        await easyParcelService.createShipment(shipmentRequest);
    } catch (error) {
      console.error('[FulfillmentQuote] EasyParcel API error:', error);

      // Handle specific error codes
      if (error instanceof EasyParcelError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }

      // Unknown error
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to get shipping quote. Please try again.',
          code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        },
        { status: 500 }
      );
    }

    // Step 11: Return quote with shipmentId and price
    const quotePrice = shipmentResponse.data.price || null;

    if (!quotePrice) {
      return NextResponse.json(
        {
          success: false,
          message: 'No price returned from EasyParcel',
          code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        },
        { status: 500 }
      );
    }

    console.log('[FulfillmentQuote] Quote successful:', {
      shipmentId: shipmentResponse.data.shipment_id,
      price: quotePrice,
      courierName: shipmentResponse.data.courier_name,
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping quote retrieved successfully',
      quote: {
        shipmentId: shipmentResponse.data.shipment_id,
        price: quotePrice,
        courierName: shipmentResponse.data.courier_name || order.courierName || 'Unknown',
        serviceType: shipmentResponse.data.service_name || order.courierServiceType || 'Unknown',
        estimatedDelivery: order.estimatedDelivery || null,
      },
    });
  } catch (error) {
    console.error('[FulfillmentQuote] Unexpected error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while getting shipping quote',
        code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
      },
      { status: 500 }
    );
  }
}
