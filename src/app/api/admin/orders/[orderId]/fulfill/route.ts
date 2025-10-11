/**
 * Fulfillment API Route
 *
 * POST /api/admin/orders/[orderId]/fulfill
 *
 * Books shipment with EasyParcel and updates order status to READY_TO_SHIP.
 * Handles courier override, pickup date scheduling, and error scenarios.
 * Pickup address is sourced from BusinessProfile (single source of truth).
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
import { getPickupAddressOrThrow } from '@/lib/shipping/business-profile-integration';

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
 * 2. Parse and validate request body
 * 3. Fetch order with all necessary data
 * 4. Validate order status (must be PAID)
 * 5. Validate shipping address
 * 6. Get shipping settings
 * 7. Get pickup address from BusinessProfile (with validation)
 * 8. Validate shipping weight
 * 9. Build EasyParcel shipment request
 * 10. Create shipment with EasyParcel API (EPSubmitOrderBulk)
 * 10.5. Pay for the order (EPPayOrderBulk) to get AWB and tracking details
 * 11. Update order status to READY_TO_SHIP with AWB details
 * 12. Send email notification to customer
 * 13. Return success with tracking details
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

    // Step 7: Get pickup address from BusinessProfile
    let pickupAddress;
    try {
      pickupAddress = await getPickupAddressOrThrow();
      console.log('[Fulfillment] Pickup address retrieved from BusinessProfile:', {
        businessName: pickupAddress.businessName,
        phone: pickupAddress.phone,
        city: pickupAddress.city,
        state: pickupAddress.state,
        postalCode: pickupAddress.postalCode,
      });
    } catch (error) {
      console.error('[Fulfillment] Failed to get pickup address:', error);
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

    // Step 9: Build EasyParcel shipment request with pickup address from BusinessProfile
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

    // Step 10: Create shipment with EasyParcel API
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

    // Step 10.5: Pay for the order to get AWB and tracking details
    let paymentResponse;
    try {
      console.log('[Fulfillment] Shipment created, now processing payment for order:', shipmentResponse.data.shipment_id);

      paymentResponse = await easyParcelService.payOrder(shipmentResponse.data.shipment_id);

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Payment response missing data',
          { paymentResponse }
        );
      }

      console.log('[Fulfillment] Payment successful, AWB details received');
    } catch (error) {
      console.error('[Fulfillment] Payment error:', error);

      // Track failed payment attempt
      const currentAttempts = order.failedBookingAttempts || 0;
      const newAttempts = currentAttempts + 1;
      const errorMessage =
        error instanceof EasyParcelError ? error.message : 'Payment failed';

      await prisma.order.update({
        where: { id: params.orderId },
        data: {
          failedBookingAttempts: newAttempts,
          lastBookingError: `Payment failed: ${errorMessage}`,
        },
      });

      // Handle specific payment error codes
      if (error instanceof EasyParcelError) {
        // Check for insufficient balance
        if (error.code === SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE) {
          const balanceResponse = await easyParcelService
            .getBalance()
            .catch(() => null);

          return NextResponse.json(
            {
              success: false,
              message: `${error.message}. Order created but not paid. Order ID: ${shipmentResponse.data.shipment_id}`,
              code: error.code,
              balance: balanceResponse?.data.balance || null,
              failedAttempts: newAttempts,
              easyParcelOrderId: shipmentResponse.data.shipment_id,
            },
            { status: 402 }
          );
        }

        // Handle other known errors
        return NextResponse.json(
          {
            success: false,
            message: `Payment failed: ${error.message}. Order ID: ${shipmentResponse.data.shipment_id}`,
            code: error.code,
            details: error.details,
            failedAttempts: newAttempts,
            easyParcelOrderId: shipmentResponse.data.shipment_id,
          },
          { status: 400 }
        );
      }

      // Unknown payment error
      return NextResponse.json(
        {
          success: false,
          message: `Payment failed. Order created but not paid. Order ID: ${shipmentResponse.data.shipment_id}`,
          code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
          failedAttempts: newAttempts,
          easyParcelOrderId: shipmentResponse.data.shipment_id,
        },
        { status: 500 }
      );
    }

    // Step 11: Update order with tracking information from payment response
    // Extract AWB details from the first parcel (most orders have 1 parcel)
    const parcelDetails = paymentResponse.data.parcels[0];

    // Extract actual shipping cost from shipment response (EPSubmitOrderBulk)
    const actualShippingCost = shipmentResponse.data.price || null;

    console.log('[Fulfillment] Parcel details from payment:', {
      parcelno: parcelDetails.parcelno,    // EasyParcel internal reference (EP-xxxxx)
      awb: parcelDetails.awb,              // Actual courier tracking number
      awbLink: parcelDetails.awb_id_link,  // AWB PDF link
      trackingUrl: parcelDetails.tracking_url, // Tracking page URL
    });

    console.log('[Fulfillment] EasyParcel order details:', {
      easyparcelOrderNumber: paymentResponse.data.order_number,
      easyparcelPaymentStatus: paymentResponse.data.payment_status,
      easyparcelParcelNumber: parcelDetails.parcelno,
      shippingCostCharged: actualShippingCost,
    });

    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: 'READY_TO_SHIP',
        trackingNumber: parcelDetails.awb, // ✅ FIXED: Use AWB as tracking number (the real courier tracking number)
        airwayBillNumber: parcelDetails.awb, // AWB from payment response (same as tracking number)
        airwayBillUrl: parcelDetails.awb_id_link, // AWB PDF link from payment response
        airwayBillGenerated: true, // Always true after successful payment
        airwayBillGeneratedAt: new Date(), // Set generation timestamp
        trackingUrl: parcelDetails.tracking_url, // Tracking URL from payment response
        // ✅ NEW EASYPARCEL FIELDS
        easyparcelOrderNumber: paymentResponse.data.order_number || null, // EasyParcel order number (FIXED: was easyparcel_order_id)
        easyparcelPaymentStatus: paymentResponse.data.payment_status || null, // Payment status (e.g., "Fully Paid")
        easyparcelParcelNumber: parcelDetails.parcelno || null, // Parcel number (EP-xxxxx)
        shippingCostCharged: actualShippingCost, // Actual cost charged (from EPSubmitOrderBulk)
        // Update courier name if admin overrode the selection
        courierName: validatedData.overriddenByAdmin
          ? shipmentResponse.data.courier_name || order.courierName
          : order.courierName,
        courierServiceType: validatedData.overriddenByAdmin
          ? shipmentResponse.data.service_name || order.courierServiceType
          : order.courierServiceType,
        selectedCourierServiceId: validatedData.serviceId,
        // Scheduled pickup date
        scheduledPickupDate: new Date(validatedData.pickupDate),
        // Admin override tracking
        overriddenByAdmin: validatedData.overriddenByAdmin,
        adminOverrideReason: validatedData.adminOverrideReason || null,
        // Clear any previous booking errors on successful fulfillment
        failedBookingAttempts: 0,
        lastBookingError: null,
        adminNotes: validatedData.overriddenByAdmin
          ? `Admin overrode courier selection. Original: ${order.courierName}. New: ${shipmentResponse.data.courier_name || 'N/A'}${validatedData.adminOverrideReason ? `. Reason: ${validatedData.adminOverrideReason}` : ''}`
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

    // Step 12: Send email notification to customer
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

    // Step 13: Return success response
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
