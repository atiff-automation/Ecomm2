/**
 * Shipping Calculation API
 * Enhanced shipping rates calculation with real-time EasyParcel data
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 4.1
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
    'Johor': 'JOH',
    'Kedah': 'KDH', 
    'Kelantan': 'KTN',
    'Melaka': 'MLK',
    'Malacca': 'MLK',
    'Negeri Sembilan': 'NSN',
    'Pahang': 'PHG',
    'Perak': 'PRK',
    'Perlis': 'PLS',
    'Pulau Pinang': 'PNG',
    'Penang': 'PNG',
    'Kuala Lumpur': 'KUL',
    'Terengganu': 'TRG',
    'Selangor': 'SEL',
    'Sabah': 'SBH',
    'Sarawak': 'SWK',
    'Labuan': 'LBN',
    
    // Already correct codes
    'JOH': 'JOH',
    'KDH': 'KDH',
    'KTN': 'KTN', 
    'MLK': 'MLK',
    'NSN': 'NSN',
    'PHG': 'PHG',
    'PRK': 'PRK',
    'PLS': 'PLS',
    'PNG': 'PNG',
    'KUL': 'KUL',
    'TRG': 'TRG',
    'SEL': 'SEL',
    'SBH': 'SBH',
    'SWK': 'SWK',
    'LBN': 'LBN'
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
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  shippingClass: z.enum(['STANDARD', 'FRAGILE', 'HAZARDOUS']).optional(),
  customsDescription: z.string().optional(),
});

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^\+60[0-9]{8,10}$/, 'Valid Malaysian phone number required'),
  email: z.string().email().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/, 'Valid 5-digit postal code required'),
  country: z.string().default('MY'),
});

const calculationOptionsSchema = z.object({
  serviceTypes: z.array(z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT'])).optional(),
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
    });

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
    const isBusinessConfigured = await businessShippingConfig.isBusinessConfigured();

    // Use enhanced EasyParcel service with caching and monitoring
    const enhancedEasyParcel = new EnhancedEasyParcelService();
    const taxCalculator = new TaxInclusiveShippingCalculator();

    try {
      // Calculate total parcel weight and dimensions
      const totalWeight = calculationItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalValue = calculationItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);

      // Map delivery state to Malaysian state code
      const deliveryStateCode = mapToMalaysianStateCode(validatedData.deliveryAddress.state);

      // Calculate tax-inclusive shipping rates using business pickup address
      const taxInclusiveRates = await taxCalculator.calculateTaxInclusiveRates({
        pickupAddress: {
          postcode: pickupAddress.postcode,
          state: pickupAddress.state,
          city: pickupAddress.city
        },
        deliveryAddress: {
          postcode: validatedData.deliveryAddress.postalCode,
          state: deliveryStateCode,
          city: validatedData.deliveryAddress.city
        },
        parcel: {
          weight: totalWeight,
          length: calculationItems[0]?.dimensions?.length,
          width: calculationItems[0]?.dimensions?.width,
          height: calculationItems[0]?.dimensions?.height,
          value: totalValue
        },
        serviceTypes: validatedData.options?.serviceTypes,
        includeInsurance: validatedData.options?.includeInsurance,
        includeCOD: validatedData.options?.includeCOD,
        displayTaxInclusive: true,
        orderValue: validatedData.orderValue,
        freeShippingThreshold: businessProfile?.shippingPolicies.freeShippingThreshold || 150
      });

      // Filter rates based on business preferences
      let filteredRates = await businessShippingConfig.filterRatesForBusiness(taxInclusiveRates);

      // Transform to our expected format and add fallback using original calculator
      let rates = filteredRates.map(rate => ({
        courierId: rate.courierId,
        courierName: rate.courierName,
        serviceName: rate.serviceName,
        serviceType: rate.serviceType as 'STANDARD' | 'EXPRESS' | 'OVERNIGHT',
        price: rate.finalPrice,
        originalPrice: rate.basePrice,
        freeShippingApplied: rate.finalPrice === 0,
        estimatedDays: rate.estimatedDeliveryDays,
        description: `${rate.serviceName} delivery service`,
        features: {
          insuranceAvailable: rate.insuranceIncluded || validatedData.options?.includeInsurance || false,
          codAvailable: rate.codAvailable || validatedData.options?.includeCOD || false,
          signatureRequiredAvailable: true,
        },
        insurancePrice: rate.taxBreakdown ? 5.00 : 0,
        codPrice: rate.codAvailable ? 3.00 : 0,
        signaturePrice: 2.00,
      }));

      // If no rates from EasyParcel, fallback to original calculator
      if (rates.length === 0) {
        console.log('🔄 No EasyParcel rates available, falling back to original calculator');
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
          itemCount: calculationItems.reduce((sum, item) => sum + item.quantity, 0),
          freeShippingThreshold: businessProfile?.shippingPolicies.freeShippingThreshold || 150,
          freeShippingEligible: validatedData.orderValue >= (businessProfile?.shippingPolicies.freeShippingThreshold || 150),
          cheapestRate: rates.length > 0 ? Math.min(...rates.map(r => r.price)) : 0,
          fastestService: rates.find(r => r.serviceType === 'OVERNIGHT')?.serviceName || 
                         rates.find(r => r.serviceType === 'EXPRESS')?.serviceName || 
                         rates[0]?.serviceName,
          recommendedCourier: rates.length > 0 ? rates[0].courierName : undefined,
        },
        businessAddress: {
          name: pickupAddress.name,
          city: pickupAddress.city,
          state: pickupAddress.state,
          zone: ['Sabah', 'Sarawak', 'Labuan'].includes(pickupAddress.state) ? 'east' as const : 'west' as const,
          configured: isBusinessConfigured,
        },
        deliveryAddress: {
          city: validatedData.deliveryAddress.city,
          state: deliveryStateCode,
          zone: ['SBH', 'SWK', 'LBN'].includes(deliveryStateCode) ? 'east' as const : 'west' as const,
          serviceableByAllCouriers: true,
        },
        validationResults: {
          isValid: true,
          warnings: rates.length === 0 ? ['No EasyParcel rates available for this location'] : [],
          errors: [],
        },
        easyParcelIntegration: {
          active: true,
          version: '1.4.0',
          cached: false, // Will be set by caching layer
          taxInclusive: true,
          businessConfigured: isBusinessConfigured,
          courierFiltering: businessProfile?.courierPreferences.showCustomerChoice ? 'customer_choice' : 'business_filtered',
        }
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
      console.warn('⚠️ EasyParcel integration error, falling back to original calculator:', easyParcelError);
      
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
          error: easyParcelError instanceof Error ? easyParcelError.message : 'Unknown error',
          fallback: true,
        }
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
      const freeShippingThreshold = shippingCalculator.getFreeShippingThreshold();

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
            width: 200,  // cm
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
      { message: 'Invalid action. Use ?action=info, ?action=states, or ?action=test' },
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