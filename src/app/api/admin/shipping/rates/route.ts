/**
 * Admin Shipping Rates API
 * Get courier rates for admin selection interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { courierSelector } from '@/lib/shipping/courier-selector';
import { z } from 'zod';

const ratesRequestSchema = z.object({
  orderId: z.string().min(1),
  destination: z.object({
    postcode: z.string().regex(/^\d{5}$/),
    city: z.string().min(1),
    state: z.string().min(2),
  }),
  parcel: z.object({
    weight: z.number().min(0.1),
    declared_value: z.number().min(1),
    length: z.number().min(1).optional(),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
  }),
});

// State code mapping
function mapToMalaysianStateCode(state: string): string {
  const stateMapping: Record<string, string> = {
    'Johor': 'JOH', 'Kedah': 'KDH', 'Kelantan': 'KTN', 'Melaka': 'MLK', 
    'Malacca': 'MLK', 'Negeri Sembilan': 'NSN', 'Pahang': 'PHG', 'Perak': 'PRK',
    'Perlis': 'PLS', 'Pulau Pinang': 'PNG', 'Penang': 'PNG', 'Kuala Lumpur': 'KUL',
    'Terengganu': 'TRG', 'Selangor': 'SEL', 'Sabah': 'SBH', 'Sarawak': 'SWK', 
    'Labuan': 'LBN',
    'JOH': 'JOH', 'KDH': 'KDH', 'KTN': 'KTN', 'MLK': 'MLK', 'NSN': 'NSN',
    'PHG': 'PHG', 'PRK': 'PRK', 'PLS': 'PLS', 'PNG': 'PNG', 'KUL': 'KUL',
    'TRG': 'TRG', 'SEL': 'SEL', 'SBH': 'SBH', 'SWK': 'SWK', 'LBN': 'LBN'
  };
  return stateMapping[state] || state;
}

/**
 * POST - Get courier rates for admin selection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🚚 Admin rates request:', body);

    // Validate request
    const validatedData = ratesRequestSchema.parse(body);
    
    // Get business configuration
    const pickupAddress = await businessShippingConfig.getPickupAddress();
    const stateCode = mapToMalaysianStateCode(validatedData.destination.state);

    // Use singleton EasyParcel service

    // Prepare EasyParcel request
    const easyParcelRequest = {
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
        name: 'Customer',
        phone: '+60123456789',
        address_line_1: 'Customer Address',
        city: validatedData.destination.city,
        state: stateCode,
        postcode: validatedData.destination.postcode,
        country: 'MY'
      },
      parcel: {
        weight: validatedData.parcel.weight,
        length: validatedData.parcel.length || 20,
        width: validatedData.parcel.width || 15,
        height: validatedData.parcel.height || 10,
        content: 'Order items',
        value: validatedData.parcel.declared_value
      },
      service_types: ['STANDARD', 'EXPRESS'],
      insurance: false,
      cod: false
    };

    console.log('📦 Calling EasyParcel API with:', easyParcelRequest);

    // Get rates from EasyParcel
    const easyParcelResponse = await easyParcelService.calculateRates(easyParcelRequest);
    
    if (!easyParcelResponse.rates || easyParcelResponse.rates.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No courier rates available for this destination',
        rates: [],
      });
    }

    // Apply business filtering
    const filteredRates = await businessShippingConfig.filterRatesForBusiness(easyParcelResponse.rates);
    
    // Use courier selector to get recommendations
    const selectionCriteria = {
      destinationState: stateCode as any,
      destinationPostcode: validatedData.destination.postcode,
      parcelWeight: validatedData.parcel.weight,
      parcelValue: validatedData.parcel.declared_value,
    };

    let recommendedMain = null;
    let recommendedAlternative = null;
    let selectionReason = 'Manual selection required';

    if (filteredRates.length > 0) {
      try {
        const selection = await courierSelector.selectCourier(filteredRates, selectionCriteria);
        recommendedMain = selection.selectedRate;
        
        // Find best alternative (different courier, next best option)
        const alternatives = selection.alternatives.filter(alt => 
          alt.courier_name !== recommendedMain.courier_name
        );
        
        if (alternatives.length > 0) {
          recommendedAlternative = alternatives[0];
        }

        selectionReason = `Auto-recommended: ${selection.reason}`;
      } catch (error) {
        console.warn('Courier selector failed, will show all options:', error);
      }
    }

    // Sort rates by price for display
    const sortedRates = filteredRates.sort((a, b) => (a.price || 0) - (b.price || 0));

    // Calculate price statistics
    const prices = sortedRates.map(rate => rate.price || 0);
    const cheapestPrice = Math.min(...prices);
    const mostExpensivePrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    console.log('✅ Retrieved rates:', {
      total: sortedRates.length,
      cheapest: cheapestPrice,
      mostExpensive: mostExpensivePrice,
      recommendedMain: recommendedMain?.courier_name,
      recommendedAlternative: recommendedAlternative?.courier_name,
    });

    return NextResponse.json({
      success: true,
      orderId: validatedData.orderId,
      rates: sortedRates,
      recommendedMain,
      recommendedAlternative,
      reason: selectionReason,
      analytics: {
        totalOptions: sortedRates.length,
        priceRange: {
          min: cheapestPrice,
          max: mostExpensivePrice,
          average: Number(averagePrice.toFixed(2)),
        },
        courierBreakdown: sortedRates.reduce((acc, rate) => {
          acc[rate.courier_name] = (acc[rate.courier_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      requestDetails: {
        destination: validatedData.destination,
        parcelWeight: validatedData.parcel.weight,
        parcelValue: validatedData.parcel.declared_value,
      },
    });

  } catch (error) {
    console.error('❌ Admin rates fetch error:', error);

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
        error: 'Failed to fetch courier rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}