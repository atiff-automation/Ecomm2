/**
 * Shipping Options API Route
 *
 * GET /api/admin/orders/[orderId]/shipping-options
 *
 * Fetches available courier options for an order from EasyParcel API.
 * Used by ResponsiveFulfillmentDialog to populate courier override dropdown.
 *
 * @route GET /api/admin/orders/[orderId]/shipping-options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getShippingSettings } from '@/lib/shipping/shipping-settings';
import {
  createEasyParcelService,
  EasyParcelError,
} from '@/lib/shipping/easyparcel-service';
import { SHIPPING_ERROR_CODES } from '@/lib/shipping/constants';
import type { DeliveryAddress } from '@/lib/shipping/types';
import { getPickupAddressOrThrow } from '@/lib/shipping/business-profile-integration';

/**
 * GET - Fetch available shipping options for an order
 *
 * Steps:
 * 1. Validate admin authentication
 * 2. Fetch order with shipping address
 * 3. Get shipping settings
 * 4. Get pickup address from BusinessProfile
 * 5. Call EasyParcel getRates() API
 * 6. Return formatted courier options
 */
export async function GET(
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
      `[ShippingOptions] Fetching options for order ${params.orderId}`
    );

    // Step 2: Fetch order with shipping address
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

    // Step 3: Validate shipping address
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

    // Step 4: Validate shipping weight
    const shippingWeight = order.shippingWeight
      ? parseFloat(order.shippingWeight.toString())
      : null;

    if (!shippingWeight || shippingWeight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid shipping weight. Cannot fetch shipping options without weight.',
          code: SHIPPING_ERROR_CODES.INVALID_WEIGHT,
        },
        { status: 400 }
      );
    }

    // Step 5: Get shipping settings
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

    // Step 6: Get pickup address from BusinessProfile
    let pickupAddress;
    try {
      pickupAddress = await getPickupAddressOrThrow();
      console.log(
        '[ShippingOptions] Pickup address retrieved from BusinessProfile'
      );
    } catch (error) {
      console.error('[ShippingOptions] Failed to get pickup address:', error);
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve pickup address from Business Profile',
          code: SHIPPING_ERROR_CODES.INVALID_ADDRESS,
        },
        { status: 400 }
      );
    }

    // Step 7: Build delivery address object
    const deliveryAddress: DeliveryAddress = {
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      phone: order.shippingAddress.phone || '',
      addressLine1: order.shippingAddress.addressLine1,
      addressLine2: order.shippingAddress.addressLine2 || '',
      city: order.shippingAddress.city,
      state: order.shippingAddress.state as DeliveryAddress['state'],
      postalCode: order.shippingAddress.postalCode,
      country: 'MY',
    };

    console.log('[ShippingOptions] Fetching rates:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pickup: {
        city: pickupAddress.city,
        state: pickupAddress.state,
        postalCode: pickupAddress.postalCode,
      },
      destination: {
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        postalCode: deliveryAddress.postalCode,
      },
      weight: shippingWeight,
    });

    // Step 8: Fetch rates from EasyParcel API
    const easyParcelService = createEasyParcelService(settings);

    let rates;
    try {
      rates = await easyParcelService.getRates(
        pickupAddress,
        deliveryAddress,
        shippingWeight
      );
    } catch (error) {
      console.error('[ShippingOptions] EasyParcel API error:', error);

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
          message: 'Failed to fetch shipping options. Please try again.',
          code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        },
        { status: 500 }
      );
    }

    // Step 9: Format response for ResponsiveFulfillmentDialog
    const courierOptions = rates.map(rate => ({
      serviceId: rate.service_id,
      courierName: rate.courier_name,
      serviceType: rate.service_type,
      cost: rate.price,
      estimatedDays: rate.estimated_delivery_days
        ? `${rate.estimated_delivery_days} business days`
        : 'Not specified',
      isCustomerChoice: order.selectedCourierServiceId === rate.service_id,
    }));

    console.log('[ShippingOptions] Options fetched successfully:', {
      count: courierOptions.length,
      cheapest: courierOptions[0]?.cost,
      customerChoice:
        courierOptions.find(opt => opt.isCustomerChoice)?.courierName || 'None',
    });

    // Step 10: Return success response
    return NextResponse.json({
      success: true,
      options: courierOptions,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        selectedCourierServiceId: order.selectedCourierServiceId,
        courierName: order.courierName,
      },
    });
  } catch (error) {
    console.error('[ShippingOptions] Unexpected error:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while fetching shipping options',
        code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
      },
      { status: 500 }
    );
  }
}
