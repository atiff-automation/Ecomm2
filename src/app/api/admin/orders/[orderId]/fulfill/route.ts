/**
 * Fulfillment API Route
 *
 * POST /api/admin/orders/[orderId]/fulfill
 *
 * Books shipment with EasyParcel and updates order status to READY_TO_SHIP.
 * Handles courier override, pickup date scheduling, and error scenarios.
 *
 * @route POST /api/admin/orders/[orderId]/fulfill
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
import { emailService } from '@/lib/email/email-service';

/**
 * Zod schema for fulfillment request
 */
const fulfillmentSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  overriddenByAdmin: z.boolean().optional().default(false),
  adminOverrideReason: z.string().optional(),
});

/**
 * POST - Book shipment with EasyParcel
 *
 * Steps:
 * 1. Validate admin authentication
 * 2. Fetch order with all necessary data
 * 3. Validate order status (must be PAID)
 * 4. Get shipping settings
 * 5. Build EasyParcel shipment request
 * 6. Create shipment with EasyParcel API
 * 7. Update order status to READY_TO_SHIP
 * 8. Store tracking number and AWB
 * 9. Return success with tracking details
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
      `[Fulfillment] Admin ${session.user.email} initiating fulfillment for order ${params.orderId}`
    );

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validatedData = fulfillmentSchema.parse(body);

    // Step 3: Fetch order with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        orderItems: {
          include: {
            product: true,
          },
        },
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
    if (order.status !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be fulfilled. Current status: ${order.status}. Only PAID orders can be fulfilled.`,
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
          tracking: {
            trackingNumber: order.trackingNumber,
            awbNumber: order.airwayBillNumber,
            labelUrl: order.airwayBillUrl,
          },
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

    // Step 7: Validate shipping weight
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

    // Step 8: Build EasyParcel shipment request
    const shipmentRequest: EasyParcelShipmentRequest = {
      service_id: validatedData.serviceId,
      reference: order.orderNumber,
      pickup: {
        name: settings.businessName,
        phone: settings.phone,
        address: settings.addressLine1,
        address2: settings.addressLine2 || '',
        city: settings.city,
        state: settings.state,
        postcode: settings.postalCode,
        country: settings.country,
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
        // Optional: Add dimensions if available
        // length: 10,
        // width: 10,
        // height: 10,
      },
      // WhatsApp tracking notification (from global settings)
      addon_whatsapp_tracking_enabled: settings.whatsappNotificationsEnabled ? 1 : 0,
    };

    console.log('[Fulfillment] Shipment request:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceId: validatedData.serviceId,
      pickupDate: validatedData.pickupDate,
      weight: shippingWeight,
      overridden: validatedData.overriddenByAdmin,
      whatsappEnabled: settings.whatsappNotificationsEnabled,
      whatsappParam: shipmentRequest.addon_whatsapp_tracking_enabled,
    });

    // Step 9: Create shipment with EasyParcel API
    const easyParcelService = createEasyParcelService(settings);

    let shipmentResponse;
    try {
      shipmentResponse =
        await easyParcelService.createShipment(shipmentRequest);
    } catch (error) {
      console.error('[Fulfillment] EasyParcel API error:', error);

      // Track failed booking attempt
      const currentAttempts = order.failedBookingAttempts || 0;
      const newAttempts = currentAttempts + 1;
      const errorMessage =
        error instanceof EasyParcelError ? error.message : 'Unknown error';

      await prisma.order.update({
        where: { id: params.orderId },
        data: {
          failedBookingAttempts: newAttempts,
          lastBookingError: errorMessage,
        },
      });

      console.log(
        `[Fulfillment] Failed attempt ${newAttempts} recorded for order ${order.orderNumber}`
      );

      // Handle specific error codes
      if (error instanceof EasyParcelError) {
        // Check for insufficient balance
        if (error.code === SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE) {
          const balanceResponse = await easyParcelService
            .getBalance()
            .catch(() => null);

          return NextResponse.json(
            {
              success: false,
              message: error.message,
              code: error.code,
              balance: balanceResponse?.data.balance || null,
              failedAttempts: newAttempts,
            },
            { status: 402 }
          );
        }

        // Handle other known errors
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            code: error.code,
            details: error.details,
            failedAttempts: newAttempts,
          },
          { status: 400 }
        );
      }

      // Unknown error
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create shipment. Please try again.',
          code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
          failedAttempts: newAttempts,
        },
        { status: 500 }
      );
    }

    // Step 10: Update order with tracking information
    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: 'READY_TO_SHIP',
        trackingNumber: shipmentResponse.data.tracking_number,
        airwayBillNumber:
          shipmentResponse.data.awb_number ||
          shipmentResponse.data.tracking_number,
        airwayBillUrl: shipmentResponse.data.label_url || null,
        airwayBillGenerated: !!shipmentResponse.data.label_url,
        airwayBillGeneratedAt: shipmentResponse.data.label_url
          ? new Date()
          : null,
        trackingUrl: shipmentResponse.data.tracking_url || null,
        // Update courier name if admin overrode the selection
        courierName: validatedData.overriddenByAdmin
          ? shipmentResponse.data.courier_name || order.courierName
          : order.courierName,
        courierServiceType: validatedData.overriddenByAdmin
          ? shipmentResponse.data.service_name || order.courierServiceType
          : order.courierServiceType,
        selectedCourierServiceId: validatedData.serviceId,
        // NEW: Scheduled pickup date
        scheduledPickupDate: new Date(validatedData.pickupDate),
        // NEW: Admin override tracking
        overriddenByAdmin: validatedData.overriddenByAdmin,
        adminOverrideReason: validatedData.adminOverrideReason || null,
        // Clear any previous booking errors on successful fulfillment
        failedBookingAttempts: 0,
        lastBookingError: null,
        adminNotes: validatedData.overriddenByAdmin
          ? `Admin overrode courier selection. Original: ${order.courierName}. New: ${shipmentResponse.data.courier_name}${validatedData.adminOverrideReason ? `. Reason: ${validatedData.adminOverrideReason}` : ''}`
          : order.adminNotes,
      },
    });

    console.log('[Fulfillment] Order updated successfully:', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      trackingNumber: updatedOrder.trackingNumber,
      awbNumber: updatedOrder.airwayBillNumber,
    });

    // Step 11: Send email notification to customer
    try {
      const customerEmail = order.user?.email || order.guestEmail;

      if (customerEmail) {
        await emailService.sendOrderReadyToShipNotification({
          orderNumber: updatedOrder.orderNumber,
          customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          customerEmail: customerEmail,
          items: order.orderItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: parseFloat(item.finalPrice.toString()),
          })),
          subtotal: parseFloat(order.subtotal.toString()),
          taxAmount: parseFloat(order.taxAmount.toString()),
          shippingCost: parseFloat(order.shippingCost.toString()),
          total: parseFloat(order.total.toString()),
          paymentMethod: order.paymentMethod || 'Online Payment',
          trackingNumber: updatedOrder.trackingNumber || undefined,
          estimatedDelivery: updatedOrder.estimatedDelivery || undefined,
          shippingAddress: {
            firstName: order.shippingAddress.firstName,
            lastName: order.shippingAddress.lastName,
            addressLine1: order.shippingAddress.addressLine1,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
          },
        });

        console.log('[Fulfillment] Email notification sent to customer');
      }
    } catch (emailError) {
      // Log error but don't fail the fulfillment
      console.error(
        '[Fulfillment] Failed to send email notification:',
        emailError
      );
    }

    // Step 12: Return success response
    return NextResponse.json({
      success: true,
      message: 'Shipment booked successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
      },
      tracking: {
        trackingNumber: updatedOrder.trackingNumber,
        awbNumber: updatedOrder.airwayBillNumber,
        labelUrl: updatedOrder.airwayBillUrl,
        trackingUrl: updatedOrder.trackingUrl,
        courierName: updatedOrder.courierName,
        serviceType: updatedOrder.courierServiceType,
        overriddenByAdmin: validatedData.overriddenByAdmin,
      },
      pickup: {
        scheduledDate: updatedOrder.scheduledPickupDate
          ?.toISOString()
          .split('T')[0],
      },
      // Include EasyParcel shipment ID for debugging
      easyParcelShipmentId: shipmentResponse.data.shipment_id,
    });
  } catch (error) {
    console.error('[Fulfillment] Unexpected error:', error);

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
        message: 'An unexpected error occurred during fulfillment',
        code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
      },
      { status: 500 }
    );
  }
}
