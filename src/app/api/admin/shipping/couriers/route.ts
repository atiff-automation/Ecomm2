/**
 * Admin Courier Preferences API
 * Manages courier preferences and fetches available couriers from EasyParcel API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const courierPreferenceSchema = z.object({
  courierId: z.string().min(1),
  courierName: z.string().min(1),
  priority: z.number().min(1),
  enabled: z.boolean(),
  serviceTypes: z.array(z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT'])),
  maxWeight: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const courierPreferencesSchema = z.object({
  preferences: z.array(courierPreferenceSchema),
});

/**
 * GET - Retrieve available couriers from EasyParcel API and current preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'preferences';

    if (action === 'available') {
      // Fetch available couriers from EasyParcel API
      return await getAvailableCouriers();
    }

    // Default: return current preferences
    const preferences = await businessShippingConfig.getCourierPreferences();

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error('Error retrieving courier data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve courier data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch available couriers from EasyParcel API for admin location
 */
async function getAvailableCouriers() {
  try {
    console.log('🚚 Fetching available couriers for admin configuration...');

    const { easyParcelService } = await import('@/lib/shipping/easyparcel-service');
    const pickupAddress = await businessShippingConfig.getPickupAddress();

    // Test API call to get available couriers for the admin's pickup location
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
        city: 'Kuala Lumpur',
        state: 'KUL',
        postcode: '50000',
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
      service_types: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
      insurance: false,
      cod: false
    };

    let availableCouriers: any[] = [];
    let apiConnected = false;

    try {
      console.log('📞 Testing EasyParcel API connectivity...');
      const easyParcelResponse = await easyParcelService.calculateRates(testRequest);
      
      if (easyParcelResponse.rates && easyParcelResponse.rates.length > 0) {
        apiConnected = true;
        
        // Extract unique couriers from the rates response
        const courierMap = new Map();
        
        easyParcelResponse.rates.forEach((rate: any) => {
          if (!courierMap.has(rate.courier_id)) {
            courierMap.set(rate.courier_id, {
              courierId: rate.courier_id,
              courierName: rate.courier_name,
              serviceTypes: [],
              coverage: {
                westMalaysia: true,
                eastMalaysia: rate.courier_name.toLowerCase().includes('pos') || 
                            rate.courier_name.toLowerCase().includes('gdex'),
              },
              features: {
                standardService: false,
                expressService: false,
                overnightService: false,
                insuranceAvailable: rate.features?.insurance_available || false,
                codAvailable: rate.features?.cod_available || false,
                signatureRequired: rate.features?.signature_required_available || false,
              },
              estimatedDeliveryDays: rate.estimated_delivery_days,
              notes: `Available from ${pickupAddress.city}, ${pickupAddress.state}`,
              priceRange: {
                min: parseFloat(rate.price_before_gst || rate.price || '0'),
                max: parseFloat(rate.price_before_gst || rate.price || '0'),
                currency: 'MYR'
              }
            });
          }
          
          const courier = courierMap.get(rate.courier_id);
          
          if (!courier.serviceTypes.includes(rate.service_type)) {
            courier.serviceTypes.push(rate.service_type);
          }
          
          // Update price range with this rate
          const ratePrice = parseFloat(rate.price_before_gst || rate.price || '0');
          if (ratePrice > 0) {
            courier.priceRange.min = Math.min(courier.priceRange.min, ratePrice);
            courier.priceRange.max = Math.max(courier.priceRange.max, ratePrice);
          }
          
          if (rate.service_type === 'STANDARD') courier.features.standardService = true;
          if (rate.service_type === 'EXPRESS') courier.features.expressService = true;
          if (rate.service_type === 'OVERNIGHT') courier.features.overnightService = true;
        });
        
        availableCouriers = Array.from(courierMap.values());
        console.log(`✅ Found ${availableCouriers.length} available couriers from EasyParcel API`);
      }
    } catch (apiError) {
      console.warn('⚠️ EasyParcel API not accessible, using fallback courier list:', apiError);
      apiConnected = false;
    }

    // Fallback courier list for common Malaysian couriers
    if (!apiConnected || availableCouriers.length === 0) {
      availableCouriers = [
        {
          courierId: 'citylink',
          courierName: 'City-Link Express (M) Sdn. Bhd.',
          serviceTypes: ['STANDARD', 'EXPRESS'],
          coverage: { westMalaysia: true, eastMalaysia: false },
          features: {
            standardService: true,
            expressService: true,
            overnightService: false,
            insuranceAvailable: true,
            codAvailable: true,
            signatureRequired: true,
          },
          estimatedDeliveryDays: 2,
          notes: 'Reliable for West Malaysia, limited East Malaysia coverage'
        },
        {
          courierId: 'poslaju',
          courierName: 'Pos Laju',
          serviceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
          coverage: { westMalaysia: true, eastMalaysia: true },
          features: {
            standardService: true,
            expressService: true,
            overnightService: true,
            insuranceAvailable: true,
            codAvailable: true,
            signatureRequired: true,
          },
          estimatedDeliveryDays: 1,
          notes: 'Nationwide coverage including Sabah & Sarawak'
        },
        {
          courierId: 'gdex',
          courierName: 'GDex',
          serviceTypes: ['STANDARD'],
          coverage: { westMalaysia: true, eastMalaysia: true },
          features: {
            standardService: true,
            expressService: false,
            overnightService: false,
            insuranceAvailable: true,
            codAvailable: true,
            signatureRequired: false,
          },
          estimatedDeliveryDays: 3,
          notes: 'Cost-effective nationwide delivery'
        },
        {
          courierId: 'jnt',
          courierName: 'J&T Express',
          serviceTypes: ['STANDARD', 'EXPRESS'],
          coverage: { westMalaysia: true, eastMalaysia: true },
          features: {
            standardService: true,
            expressService: true,
            overnightService: false,
            insuranceAvailable: true,
            codAvailable: true,
            signatureRequired: false,
          },
          estimatedDeliveryDays: 2,
          notes: 'Fast growing courier with competitive rates'
        }
      ];
      console.log('🔄 Using fallback courier list with common Malaysian couriers');
    }

    // Get current admin courier preferences
    const currentPreferences = await businessShippingConfig.getCourierPreferences();
    
    // Merge available couriers with current preferences
    const mergedCouriers = availableCouriers.map(courier => {
      const existingPref = currentPreferences.find(pref => pref.courierId === courier.courierId);
      
      return {
        ...courier,
        currentlySelected: !!existingPref,
        priority: existingPref?.priority || 999,
        enabled: existingPref?.enabled !== false,
        adminNotes: existingPref?.notes || courier.notes,
        maxWeight: existingPref?.maxWeight || 30,
      };
    });

    return NextResponse.json({
      success: true,
      availableCouriers: mergedCouriers,
      currentPreferences,
      apiConnected,
      businessLocation: {
        city: pickupAddress.city,
        state: pickupAddress.state,
        coverage: ['KUL', 'SEL', 'JOH', 'MLK', 'NSN'].includes(pickupAddress.state) ? 'central' : 
                 ['PNG', 'KDH', 'PRK', 'PLS'].includes(pickupAddress.state) ? 'north' :
                 ['PHG', 'TRG', 'KTN'].includes(pickupAddress.state) ? 'east_coast' :
                 ['SBH', 'SWK', 'LBN'].includes(pickupAddress.state) ? 'east_malaysia' : 'other'
      },
      metadata: {
        lastChecked: new Date().toISOString(),
        source: apiConnected ? 'easyparcel_api' : 'fallback_list',
        totalCouriers: mergedCouriers.length,
        enabledCouriers: mergedCouriers.filter(c => c.enabled).length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available couriers:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch available couriers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Update courier preferences
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate preferences data
    const validatedData = courierPreferencesSchema.parse(body);

    // Update courier preferences
    await businessShippingConfig.updateCourierPreferences(validatedData.preferences);

    return NextResponse.json({
      success: true,
      message: 'Courier preferences updated successfully',
    });

  } catch (error) {
    console.error('Error updating courier preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
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
      { error: 'Failed to update courier preferences' },
      { status: 500 }
    );
  }
}