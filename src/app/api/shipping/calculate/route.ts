/**

export const dynamic = 'force-dynamic';

 * Shipping Calculation API
 * Enhanced shipping rates calculation with real-time EasyParcel Individual API v1.4.0
 * Reference: Official Malaysia_Individual_1.4.0.0.pdf documentation
 * Endpoint: EPRateCheckingBulk for real-time courier rate calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EnhancedEasyParcelService } from '@/lib/shipping/enhanced-easyparcel-service';
import { TaxInclusiveShippingCalculator } from '@/lib/shipping/tax-inclusive-shipping-calculator';
import { shippingCalculator } from '@/lib/shipping/shipping-calculator';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';

// State code mapping for Malaysian states
function mapToMalaysianStateCode(state: string): string {
  const stateMapping: Record<string, string> = {
    // Full names to codes
    Johor: 'JOH',
    Kedah: 'KDH',
    Kelantan: 'KTN',
    Melaka: 'MLK',
    Malacca: 'MLK',
    'Negeri Sembilan': 'NSN',
    Pahang: 'PHG',
    Perak: 'PRK',
    Perlis: 'PLS',
    'Pulau Pinang': 'PNG',
    Penang: 'PNG',
    'Kuala Lumpur': 'KUL',
    Terengganu: 'TRG',
    Selangor: 'SEL',
    Sabah: 'SBH',
    Sarawak: 'SWK',
    Labuan: 'LBN',

    // Already correct codes
    JOH: 'JOH',
    KDH: 'KDH',
    KTN: 'KTN',
    MLK: 'MLK',
    NSN: 'NSN',
    PHG: 'PHG',
    PRK: 'PRK',
    PLS: 'PLS',
    PNG: 'PNG',
    KUL: 'KUL',
    TRG: 'TRG',
    SEL: 'SEL',
    SBH: 'SBH',
    SWK: 'SWK',
    LBN: 'LBN',
  };

  return stateMapping[state] || state; // Return original if not found
}

// Validation schemas
const shippingCalculationItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  weight: z.number().positive(),
  quantity: z.number().int().positive(),
  value: z.number().positive(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  shippingClass: z.enum(['STANDARD', 'FRAGILE', 'HAZARDOUS']).optional(),
  customsDescription: z.string().optional(),
});

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z
    .string()
    .regex(/^\+60[0-9]{8,10}$/, 'Valid Malaysian phone number required'),
  email: z.string().email().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/, 'Valid 5-digit postal code required'),
  country: z.string().default('MY'),
});

const calculationOptionsSchema = z.object({
  serviceTypes: z
    .array(z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']))
    .optional(),
  includeInsurance: z.boolean().default(false),
  includeCOD: z.boolean().default(false),
  codAmount: z.number().optional(),
});

const shippingCalculationSchema = z.object({
  items: z.array(shippingCalculationItemSchema).min(1),
  deliveryAddress: shippingAddressSchema,
  orderValue: z.number().positive(),
  options: calculationOptionsSchema.optional(),
});

/**
 * POST - Calculate shipping rates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('🚚 Shipping calculation request:', {
      itemCount: body.items?.length || 0,
      orderValue: body.orderValue,
      city: body.deliveryAddress?.city,
      state: body.deliveryAddress?.state,
      adminControlled: body.adminControlled,
    });

    // Handle admin-controlled shipping request (simplified format)
    if (body.adminControlled && body.destination && body.parcel) {
      return handleAdminControlledShipping(body);
    }

    // Validate request
    const validatedData = shippingCalculationSchema.parse(body);

    // Convert to shipping calculator format
    const calculationItems = validatedData.items.map(item => ({
      productId: item.productId,
      name: item.name,
      weight: item.weight,
      quantity: item.quantity,
      value: item.value,
      dimensions: item.dimensions,
      shippingClass: item.shippingClass,
      customsDescription: item.customsDescription,
    }));

    const deliveryAddress = {
      firstName: validatedData.deliveryAddress.firstName,
      lastName: validatedData.deliveryAddress.lastName,
      phone: validatedData.deliveryAddress.phone,
      email: validatedData.deliveryAddress.email,
      addressLine1: validatedData.deliveryAddress.addressLine1,
      addressLine2: validatedData.deliveryAddress.addressLine2,
      city: validatedData.deliveryAddress.city,
      state: validatedData.deliveryAddress.state as any, // Type assertion for Malaysian state
      postalCode: validatedData.deliveryAddress.postalCode,
      country: validatedData.deliveryAddress.country,
    };

    // Get business configuration
    const businessProfile = await businessShippingConfig.getBusinessProfile();
    const pickupAddress = await businessShippingConfig.getPickupAddress();
    const isBusinessConfigured =
      await businessShippingConfig.isBusinessConfigured();

    try {
      // Calculate total parcel weight
      const totalWeight = calculationItems.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0
      );
      const totalValue = calculationItems.reduce(
        (sum, item) => sum + item.value * item.quantity,
        0
      );

      // Map delivery state to Malaysian state code
      const deliveryStateCode = mapToMalaysianStateCode(
        validatedData.deliveryAddress.state
      );

      // Use EasyParcel singleton service for real-time rates
      const { easyParcelService } = await import(
        '@/lib/shipping/easyparcel-service'
      );
      let rates;

      try {
        // Calculate tax-inclusive shipping rates using business pickup address
        const easyParcelRequest = {
          pickup_address: {
            name: pickupAddress.name,
            phone: pickupAddress.phone,
            address_line_1:
              pickupAddress.addressLine1 || 'No. 123, Jalan Technology',
            address_line_2: pickupAddress.addressLine2 || '',
            city: pickupAddress.city,
            state: pickupAddress.state as any,
            postcode: pickupAddress.postcode,
            country: 'MY',
          },
          delivery_address: {
            name: `${validatedData.deliveryAddress.firstName} ${validatedData.deliveryAddress.lastName}`,
            phone: validatedData.deliveryAddress.phone,
            address_line_1: validatedData.deliveryAddress.addressLine1,
            address_line_2: validatedData.deliveryAddress.addressLine2 || '',
            city: validatedData.deliveryAddress.city,
            state: deliveryStateCode as any,
            postcode: validatedData.deliveryAddress.postalCode,
            country: 'MY',
          },
          parcel: {
            weight: totalWeight,
            length: calculationItems[0]?.dimensions?.length || 10,
            width: calculationItems[0]?.dimensions?.width || 10,
            height: calculationItems[0]?.dimensions?.height || 5,
            content: calculationItems.map(item => item.name).join(', '),
            value: totalValue,
          },
          service_types: validatedData.options?.serviceTypes || ['STANDARD'],
          insurance: validatedData.options?.includeInsurance || false,
          cod: validatedData.options?.includeCOD || false,
        };

        console.log(
          '🚀 Calling EasyParcel API with request:',
          easyParcelRequest
        );
        const easyParcelResponse =
          await easyParcelService.calculateRates(easyParcelRequest);

        // Transform EasyParcel rates to our format
        const easyParcelRates = easyParcelResponse.rates.map(rate => ({
          courierId: rate.courier_id,
          courierName: rate.courier_name,
          serviceName: rate.service_name,
          serviceType: rate.service_type as
            | 'STANDARD'
            | 'EXPRESS'
            | 'OVERNIGHT',
          price: rate.price,
          originalPrice: rate.price,
          freeShippingApplied:
            validatedData.orderValue >=
            (businessProfile?.shippingPolicies.freeShippingThreshold || 150)
              ? true
              : false,
          estimatedDays: rate.estimated_delivery_days,
          description:
            rate.description || `${rate.service_name} delivery service`,
          features: {
            insuranceAvailable: rate.features.insurance_available,
            codAvailable: rate.features.cod_available,
            signatureRequiredAvailable:
              rate.features.signature_required_available,
          },
          insurancePrice: rate.features.insurance_available ? 5.0 : 0,
          codPrice: rate.features.cod_available ? 3.0 : 0,
          signaturePrice: 2.0,
        }));

        console.log(
          '✅ EasyParcel rates retrieved:',
          easyParcelRates.length,
          'options'
        );

        // Apply free shipping if applicable
        rates = easyParcelRates.map(rate => ({
          ...rate,
          price: rate.freeShippingApplied ? 0 : rate.price,
        }));
      } catch (easyParcelError) {
        console.warn(
          '⚠️ EasyParcel API error, falling back to original calculator:',
          easyParcelError
        );

        // Fallback to original shipping calculator
        const fallbackResult = await shippingCalculator.calculateShipping(
          calculationItems,
          deliveryAddress,
          validatedData.orderValue,
          validatedData.options
        );

        rates = fallbackResult.rates;
      }

      // Build result using EasyParcel data with enhanced information
      const result = {
        rates,
        summary: {
          totalWeight,
          totalValue: validatedData.orderValue,
          itemCount: calculationItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
          freeShippingThreshold:
            businessProfile?.shippingPolicies.freeShippingThreshold || 150,
          freeShippingEligible:
            validatedData.orderValue >=
            (businessProfile?.shippingPolicies.freeShippingThreshold || 150),
          cheapestRate:
            rates.length > 0 ? Math.min(...rates.map(r => r.price)) : 0,
          fastestService:
            rates.find(r => r.serviceType === 'OVERNIGHT')?.serviceName ||
            rates.find(r => r.serviceType === 'EXPRESS')?.serviceName ||
            rates[0]?.serviceName,
          recommendedCourier:
            rates.length > 0 ? rates[0].courierName : undefined,
        },
        businessAddress: {
          name: pickupAddress.name,
          city: pickupAddress.city,
          state: pickupAddress.state,
          zone: ['Sabah', 'Sarawak', 'Labuan'].includes(pickupAddress.state)
            ? ('east' as const)
            : ('west' as const),
          configured: isBusinessConfigured,
        },
        deliveryAddress: {
          city: validatedData.deliveryAddress.city,
          state: deliveryStateCode,
          zone: ['SBH', 'SWK', 'LBN'].includes(deliveryStateCode)
            ? ('east' as const)
            : ('west' as const),
          serviceableByAllCouriers: true,
        },
        validationResults: {
          isValid: true,
          warnings:
            rates.length === 0
              ? ['No EasyParcel rates available for this location']
              : [],
          errors: [],
        },
        easyParcelIntegration: {
          active: true,
          version: '1.4.0',
          cached: false, // Will be set by caching layer
          taxInclusive: true,
          businessConfigured: isBusinessConfigured,
          courierFiltering: businessProfile?.courierPreferences
            .showCustomerChoice
            ? 'customer_choice'
            : 'business_filtered',
        },
      };

      console.log('✅ Shipping calculation completed:', {
        rateCount: result.rates.length,
        cheapestRate: result.summary.cheapestRate,
        freeShipping: result.summary.freeShippingEligible,
        validationErrors: result.validationResults.errors.length,
        validationWarnings: result.validationResults.warnings.length,
      });

      return NextResponse.json(result);
    } catch (easyParcelError) {
      console.warn(
        '⚠️ EasyParcel integration error, falling back to original calculator:',
        easyParcelError
      );

      // Fallback to original shipping calculator
      const result = await shippingCalculator.calculateShipping(
        calculationItems,
        deliveryAddress,
        validatedData.orderValue,
        validatedData.options
      );

      const fallbackResult = {
        ...result,
        easyParcelIntegration: {
          active: false,
          error:
            easyParcelError instanceof Error
              ? easyParcelError.message
              : 'Unknown error',
          fallback: true,
        },
      };

      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error('❌ Shipping calculation error:', error);

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
        { message: `Shipping calculation failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error during shipping calculation' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get shipping service information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    if (action === 'info') {
      // Return general shipping information
      const serviceStatus = shippingCalculator.getServiceStatus();
      const malaysianStates = shippingCalculator.getMalaysianStates();
      const freeShippingThreshold =
        shippingCalculator.getFreeShippingThreshold();

      return NextResponse.json({
        service: {
          available: serviceStatus.configured,
          sandbox: serviceStatus.sandbox,
          version: '1.4.0',
        },
        settings: {
          freeShippingThreshold,
          supportedServiceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
          maxWeight: 70, // kg
          maxDimensions: {
            length: 200, // cm
            width: 200, // cm
            height: 200, // cm
          },
        },
        malaysianStates: malaysianStates.map(state => ({
          code: state.code,
          name: state.name,
          zone: state.zone,
        })),
        features: {
          realTimeRates: true,
          insurance: true,
          cod: true,
          signatureRequired: true,
          tracking: true,
          labelGeneration: true,
          pickupScheduling: true,
        },
      });
    }

    if (action === 'states') {
      // Return Malaysian states with postal code ranges
      const states = shippingCalculator.getMalaysianStates();
      return NextResponse.json({ states });
    }

    if (action === 'test') {
      // Test shipping service connectivity
      const serviceStatus = shippingCalculator.getServiceStatus();

      return NextResponse.json({
        status: serviceStatus.configured ? 'connected' : 'disconnected',
        details: serviceStatus,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message:
          'Invalid action. Use ?action=info, ?action=states, or ?action=test',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Shipping service info error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve shipping service information' },
      { status: 500 }
    );
  }
}

/**
 * Handle admin-controlled shipping calculation
 */
async function handleAdminControlledShipping(body: any) {
  try {
    console.log('🚚 Admin-controlled shipping request:', {
      destination: body.destination,
      parcelWeight: body.parcel?.weight,
      parcelValue: body.parcel?.declared_value,
    });

    const { EasyParcelService } = await import(
      '@/lib/shipping/easyparcel-service'
    );
    // Use singleton service instance
    const { easyParcelService } = await import(
      '@/lib/shipping/easyparcel-service'
    );
    const pickupAddress = await businessShippingConfig.getPickupAddress();

    // Map state to state code
    const stateCode = mapToMalaysianStateCode(body.destination.state);

    // Calculate rates using EasyParcel with proper error handling
    const easyParcelRequest = {
      pickup_address: {
        name: pickupAddress.name,
        phone: pickupAddress.phone,
        address_line_1: pickupAddress.address_line_1,
        address_line_2: pickupAddress.address_line_2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        postcode: pickupAddress.postcode,
        country: 'MY',
      },
      delivery_address: {
        name: 'Customer',
        phone: '+60123456789',
        address_line_1: 'Customer Address',
        city: body.destination.city,
        state: stateCode,
        postcode: body.destination.postcode,
        country: 'MY',
      },
      parcel: {
        weight: Math.max(0.1, body.parcel.weight || 0.5),
        length: body.parcel.length || 20,
        width: body.parcel.width || 15,
        height: body.parcel.height || 10,
        content: 'General merchandise',
        value: body.parcel.declared_value || 100,
      },
      service_types: ['STANDARD'],
      insurance: false,
      cod: false,
    };

    console.log('📦 EasyParcel Request for Admin-Controlled:', {
      pickup: `${pickupAddress.city}, ${pickupAddress.state}`,
      delivery: `${body.destination.city}, ${stateCode}`,
      weight: easyParcelRequest.parcel.weight,
      value: easyParcelRequest.parcel.value,
    });

    const easyParcelResponse =
      await easyParcelService.calculateRates(easyParcelRequest);

    // Apply business courier filtering based on admin preferences
    const filteredRates = await businessShippingConfig.filterRatesForBusiness(
      easyParcelResponse.rates
    );

    console.log('🎯 Courier Filtering Applied:', {
      originalRates: easyParcelResponse.rates.length,
      filteredRates: filteredRates.length,
      availableCouriers: filteredRates.map(r => r.courier_name).slice(0, 3),
    });

    // Get business profile to determine free shipping threshold
    const businessProfile = await businessShippingConfig.getBusinessProfile();
    const freeShippingThreshold =
      businessProfile?.shippingPolicies.freeShippingThreshold || 150;

    console.log('🏢 Business Profile Debug:', {
      profileExists: !!businessProfile,
      configuredThreshold:
        businessProfile?.shippingPolicies.freeShippingThreshold,
      effectiveThreshold: freeShippingThreshold,
      envThreshold: process.env.FREE_SHIPPING_THRESHOLD,
    });

    // Select the best rate from filtered rates (highest priority courier)
    const selectedRate = filteredRates[0];
    if (!selectedRate) {
      throw new Error('No shipping rates available from preferred couriers');
    }

    // Apply free shipping logic
    const orderValue = body.parcel.declared_value || 0;
    const finalPrice =
      orderValue >= freeShippingThreshold ? 0 : selectedRate.price;

    console.log('💰 Free Shipping Logic:', {
      orderValue,
      freeShippingThreshold,
      originalPrice: selectedRate.price,
      finalPrice,
      freeShippingApplied: finalPrice === 0,
    });

    const selectedOption = {
      courierName: selectedRate.courier_name,
      serviceName: selectedRate.service_name,
      price: finalPrice,
      estimatedDelivery: `${selectedRate.estimated_delivery_days} business day${selectedRate.estimated_delivery_days > 1 ? 's' : ''}`,
      deliveryNote:
        finalPrice === 0
          ? `Free shipping applied! Delivered via ${selectedRate.courier_name}`
          : `Automatically selected based on your location and our shipping policies`,
      insuranceAvailable: selectedRate.features?.insurance_available || true,
      codAvailable: selectedRate.features?.cod_available || true,
      apiSource: easyParcelResponse.rates.length > 0 ? 'easyparcel' : 'mock',
    };

    console.log('✅ Admin-controlled shipping selected:', selectedOption);

    return NextResponse.json({
      success: true,
      selectedOption,
      rateDetails: selectedRate,
      adminControlled: true,
      freeShippingApplied: finalPrice === 0,
      freeShippingThreshold,
      debug: {
        originalPrice: selectedRate.price,
        finalPrice,
        orderValue: body.parcel.declared_value,
      },
    });
  } catch (error) {
    console.error('❌ Admin-controlled shipping error:', error);

    // Provide intelligent fallback
    const businessProfile = await businessShippingConfig.getBusinessProfile();
    const freeShippingThreshold =
      businessProfile?.shippingPolicies.freeShippingThreshold || 150;
    const orderValue = body.parcel?.declared_value || 0;
    const finalPrice = orderValue >= freeShippingThreshold ? 0 : 10;

    console.log('🔄 Fallback Free Shipping Logic:', {
      orderValue,
      freeShippingThreshold,
      originalPrice: 10,
      finalPrice,
      freeShippingApplied: finalPrice === 0,
    });

    const fallbackOption = {
      courierName: 'Standard Courier',
      serviceName: 'Standard Delivery',
      price: finalPrice,
      estimatedDelivery: '2-3 business days',
      deliveryNote:
        finalPrice === 0
          ? 'Free shipping applied! Standard delivery'
          : 'Standard delivery rate (backup service)',
      insuranceAvailable: true,
      codAvailable: true,
      apiSource: 'fallback',
    };

    console.log('🔄 Using fallback shipping option:', fallbackOption);

    return NextResponse.json({
      success: true,
      selectedOption: fallbackOption,
      adminControlled: true,
      freeShippingApplied: finalPrice === 0,
      freeShippingThreshold,
      fallback: true,
      error:
        error instanceof Error ? error.message : 'API temporarily unavailable',
    });
  }
}
