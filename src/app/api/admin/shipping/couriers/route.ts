/**
 * Couriers List API Route
 *
 * GET /api/admin/shipping/couriers - Get list of available couriers for admin selection
 *
 * @module api/admin/shipping/couriers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getShippingSettingsOrThrow } from '@/lib/shipping/shipping-settings';
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';
import type { DeliveryAddress } from '@/lib/shipping/types';

/**
 * GET /api/admin/shipping/couriers
 *
 * Retrieve list of available couriers for "Selected Couriers" strategy
 *
 * This endpoint is called when:
 * - Admin first opens shipping settings page
 * - Admin clicks "Refresh Courier List" button
 * - Admin selects "Selected Couriers" strategy (conditional UI)
 *
 * Response includes courier ID, name, and logo for checkbox display
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 });
    }

    // Authorization check
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get shipping settings (need API key and pickup address for rate checking)
    const settings = await getShippingSettingsOrThrow();

    // Get pickup address from business profile
    const { getPickupAddressFromBusinessProfile } = await import('@/lib/shipping/business-profile-integration');
    const pickupAddress = await getPickupAddressFromBusinessProfile();

    if (!pickupAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'PICKUP_ADDRESS_NOT_CONFIGURED',
          message: 'Pickup address not configured in Business Profile',
        },
        { status: 400 }
      );
    }

    // Create EasyParcel service
    const service = createEasyParcelService(settings);

    // WooCommerce Plugin Approach: Fetch rates with sample package to get service_detail
    // Use KL as representative destination to get available courier services
    // Sample package: 1kg weight (dimensions optional for rate checking)
    const sampleDestination: DeliveryAddress = {
      name: 'Sample Customer',
      phone: '0123456789',
      addressLine1: 'Sample Address',
      city: 'Kuala Lumpur',
      state: 'kul',
      postalCode: '50000',
      country: 'MY',
    };

    console.log('[Courier API] Fetching rates with KL destination:', {
      pickup: { city: pickupAddress.city, state: pickupAddress.state, postalCode: pickupAddress.postalCode },
      destination: sampleDestination,
      weight: 1
    });

    const rates = await service.getRates(pickupAddress, sampleDestination, 1); // 1kg sample weight

    console.log('[Courier API] Received rates:', rates.length, 'services');

    // Extract unique couriers with their service details
    const courierMap = new Map<string, {
      courierName: string;
      serviceId: string;
      serviceName: string;
      serviceDetail: string;
      dropoffPoints?: any[];
    }>();

    rates.forEach((rate) => {
      // Create unique key combining courier name and service detail
      const key = `${rate.courier_name}-${rate.service_detail}`;

      if (!courierMap.has(key)) {
        courierMap.set(key, {
          courierName: rate.courier_name,
          serviceId: rate.service_id,
          serviceName: rate.service_name,
          serviceDetail: rate.service_detail,
          dropoffPoints: rate.dropoff_point,
        });
      }
    });

    // Convert map to array and format response
    const couriers = Array.from(courierMap.values()).map((courier) => ({
      courierId: courier.serviceId,
      name: `${courier.courierName} (${courier.serviceDetail === 'pickup' ? 'Pick-up' : courier.serviceDetail === 'dropoff' ? 'Drop-off' : 'Pick-up or Drop-off'})`,
      serviceDetail: courier.serviceDetail,
      hasDropoff: courier.serviceDetail === 'dropoff' || courier.serviceDetail === 'dropoff or pickup',
    }));

    return NextResponse.json({
      success: true,
      couriers,
    });
  } catch (error) {
    console.error('[API] Get couriers error:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[API] Error details:', {
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause
      });
    }

    // Handle configuration errors
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_CONFIGURED',
          message: 'Shipping is not configured. Please configure shipping settings first.',
        },
        { status: 400 }
      );
    }

    // Handle API errors
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: 'Failed to fetch couriers from EasyParcel API. Please check your API credentials.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve courier list',
      },
      { status: 500 }
    );
  }
}
