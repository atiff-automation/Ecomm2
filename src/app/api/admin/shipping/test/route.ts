/**
 * Admin Shipping Test API
 * Tests shipping configuration and courier selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { courierSelector } from '@/lib/shipping/courier-selector';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

/**
 * POST - Test shipping configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testDestination } = body;

    if (!testDestination) {
      return NextResponse.json(
        { error: 'Test destination is required' },
        { status: 400 }
      );
    }

    // Get business configuration
    const profile = await businessShippingConfig.getBusinessProfile();
    const pickupAddress = await businessShippingConfig.getPickupAddress();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Business profile not configured' },
        { status: 400 }
      );
    }

    // Use singleton EasyParcel service

    // Test request payload
    const testRequest = {
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
        name: 'Test Customer',
        phone: '+60123456789',
        address_line_1: 'Test Address',
        city: testDestination.city,
        state: testDestination.state,
        postcode: testDestination.postcode,
        country: 'MY'
      },
      parcel: {
        weight: 1.0,
        length: 20,
        width: 15,
        height: 10,
        content: 'Test package',
        value: 100
      },
      service_types: ['STANDARD'],
      insurance: false,
      cod: false
    };

    console.log('🧪 Testing shipping configuration with:', testRequest);

    // Get rates from EasyParcel
    const easyParcelResponse = await easyParcelService.calculateRates(testRequest);
    
    if (!easyParcelResponse.rates || easyParcelResponse.rates.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No shipping rates available for test destination',
          details: easyParcelResponse
        },
        { status: 400 }
      );
    }

    // Test courier selection algorithm
    const selectionCriteria = {
      destinationState: testDestination.state as any,
      destinationPostcode: testDestination.postcode,
      parcelWeight: 1.0,
      parcelValue: 100,
    };

    const selectedOption = await courierSelector.selectCourier(
      easyParcelResponse.rates,
      selectionCriteria
    );

    // Get analytics
    const analytics = await courierSelector.getShippingAnalytics(
      easyParcelResponse.rates,
      selectionCriteria
    );

    return NextResponse.json({
      success: true,
      message: 'Shipping configuration test completed successfully',
      results: {
        rateCount: easyParcelResponse.rates.length,
        recommendedCourier: selectedOption.selectedRate.courier_name,
        recommendedPrice: selectedOption.selectedRate.price,
        selectionReason: selectedOption.reason,
        potentialSavings: selectedOption.savings,
        analytics,
        businessConfiguration: {
          autoSelectEnabled: profile.courierPreferences.autoSelectCheapest,
          customerChoiceHidden: !profile.courierPreferences.showCustomerChoice,
          preferredCouriers: profile.courierPreferences.preferredCouriers,
          freeShippingThreshold: profile.shippingPolicies.freeShippingThreshold
        },
        testParameters: {
          pickup: {
            city: pickupAddress.city,
            state: pickupAddress.state,
            postcode: pickupAddress.postcode
          },
          destination: testDestination,
          parcel: testRequest.parcel
        }
      }
    });

  } catch (error) {
    console.error('❌ Shipping configuration test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Shipping test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}