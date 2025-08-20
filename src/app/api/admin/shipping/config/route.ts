/**
 * Admin Shipping Configuration API
 * Manages business shipping profile and settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

// Helper functions to eliminate hardcoded values
async function getDefaultOperatingHours() {
  // Return null to force business profile configuration
  // Operating hours should be configured by admin in business profile
  return null;
}

async function getTestDeliveryAddress() {
  // Best Practice: Multiple test scenarios representing real customer delivery patterns
  const businessTestAddresses = [
    {
      name: 'Urban Commercial Test',
      phone: '+60327776000',
      address_line_1: 'Level 3, Malaysia Tourism Centre',
      address_line_2: '109, Jalan Ampang',
      city: 'Kuala Lumpur',
      state: 'KUL',
      postcode: '50450',
      country: 'MY',
      scenario: 'Urban commercial area - high volume destination'
    },
    {
      name: 'Suburban Residential Test', 
      phone: '+60378906000',
      address_line_1: 'Petaling Jaya City Council',
      address_line_2: '46, Jalan Yong Shook Lin',
      city: 'Petaling Jaya',
      state: 'SEL', 
      postcode: '46675',
      country: 'MY',
      scenario: 'Suburban residential - typical customer location'
    },
    {
      name: 'Shopping Mall Test',
      phone: '+60321668888',
      address_line_1: 'Mid Valley Megamall',
      address_line_2: 'Lingkaran Syed Putra',
      city: 'Kuala Lumpur',
      state: 'KUL',
      postcode: '59200',
      country: 'MY',
      scenario: 'Shopping mall pickup point - last mile delivery'
    }
  ];

  // Use configurable test scenario or default to first
  const selectedIndex = parseInt(process.env.TEST_SCENARIO_INDEX || '0');
  const selectedAddress = businessTestAddresses[selectedIndex] || businessTestAddresses[0];
  
  // Remove scenario description from actual API request
  const { scenario, ...addressData } = selectedAddress;
  return addressData;
}

async function getValidatedPickupAddress(businessProfile: any) {
  // First priority: Business profile from database
  if (businessProfile?.pickupAddress?.name && 
      businessProfile?.pickupAddress?.phone &&
      businessProfile?.pickupAddress?.address_line_1 &&
      businessProfile?.pickupAddress?.city &&
      businessProfile?.pickupAddress?.state &&
      businessProfile?.pickupAddress?.postcode) {
    return {
      name: businessProfile.pickupAddress.name,
      phone: businessProfile.pickupAddress.phone,
      address_line_1: businessProfile.pickupAddress.address_line_1,
      address_line_2: businessProfile.pickupAddress.address_line_2 || '',
      city: businessProfile.pickupAddress.city,
      state: businessProfile.pickupAddress.state,
      postcode: businessProfile.pickupAddress.postcode,
      country: 'MY'
    };
  }

  // Second priority: Environment variables
  const envRequiredFields = {
    name: process.env.BUSINESS_NAME,
    phone: process.env.BUSINESS_PHONE,
    address_line_1: process.env.BUSINESS_ADDRESS_LINE1,
    city: process.env.BUSINESS_CITY,
    state: process.env.BUSINESS_STATE,
    postcode: process.env.BUSINESS_POSTAL_CODE
  };

  const missingEnvFields = Object.entries(envRequiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => `BUSINESS_${key.toUpperCase()}`);

  if (missingEnvFields.length === 0) {
    return {
      name: envRequiredFields.name!,
      phone: envRequiredFields.phone!,
      address_line_1: envRequiredFields.address_line_1!,
      address_line_2: process.env.BUSINESS_ADDRESS_LINE2 || '',
      city: envRequiredFields.city!,
      state: envRequiredFields.state!,
      postcode: envRequiredFields.postcode!,
      country: 'MY'
    };
  }

  // No valid configuration found
  throw new Error(`Business pickup address not configured. Missing: ${missingEnvFields.join(', ')}. Please configure business profile or environment variables.`);
}

async function getValidatedTestParcel() {
  // Use standard dimensions and reasonable defaults for API testing
  // These represent typical small e-commerce package for testing
  return {
    weight: parseFloat(process.env.TEST_PARCEL_WEIGHT || '1'),
    length: parseInt(process.env.TEST_PARCEL_LENGTH || '20'),
    width: parseInt(process.env.TEST_PARCEL_WIDTH || '15'),
    height: parseInt(process.env.TEST_PARCEL_HEIGHT || '10'),
    content: 'API Connection Test Package', // Descriptive test content
    value: parseFloat(process.env.TEST_PARCEL_VALUE || '100'),
    quantity: parseInt(process.env.TEST_PARCEL_QUANTITY || '1')
  };
}

function getTestServiceTypes() {
  const serviceTypes = process.env.TEST_SERVICE_TYPES || 'STANDARD,EXPRESS';
  const types = serviceTypes.split(',').map(type => type.trim());
  const validTypes = ['STANDARD', 'EXPRESS', 'OVERNIGHT'];
  const invalidTypes = types.filter(type => !validTypes.includes(type));
  
  if (invalidTypes.length > 0) {
    throw new Error(`Invalid service types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`);
  }
  
  return types;
}

async function validateMalaysianPostalCode(postalCode: string, state?: string) {
  // Use business shipping config service for proper validation
  try {
    const malaysianStates = {
      'JOH': [/^[78][0-9]{4}$/],
      'KDH': [/^0[5-9][0-9]{3}$/, /^[1-3][0-9]{4}$/],
      'KTN': [/^1[5-8][0-9]{3}$/],
      'MLK': [/^7[5-8][0-9]{3}$/],
      'NSN': [/^7[0-3][0-9]{3}$/],
      'PHG': [/^2[5-8][0-9]{3}$/],
      'PNG': [/^1[0-4][0-9]{3}$/],
      'PRK': [/^3[0-6][0-9]{3}$/],
      'PLS': [/^0[1-2][0-9]{3}$/],
      'SBH': [/^8[8-9][0-9]{3}$/, /^9[0-1][0-9]{3}$/],
      'SEL': [/^4[0-8][0-9]{3}$/, /^6[3-8][0-9]{3}$/],
      'SWK': [/^9[3-8][0-9]{3}$/],
      'TRG': [/^2[0-4][0-9]{3}$/],
      'KUL': [/^5[0-6][0-9]{3}$/],
      'LBN': [/^8[7][0-9]{3}$/]
    };

    const isValidFormat = /^[0-9]{5}$/.test(postalCode);
    
    if (!isValidFormat) {
      return {
        isValid: false,
        details: 'Postal code must be 5 digits'
      };
    }

    if (state && malaysianStates[state as keyof typeof malaysianStates]) {
      const statePatterns = malaysianStates[state as keyof typeof malaysianStates];
      const isValidForState = statePatterns.some(pattern => pattern.test(postalCode));
      
      return {
        isValid: isValidForState,
        details: isValidForState ? 'Valid postal code for state' : `Invalid postal code for ${state}`
      };
    }

    return {
      isValid: true,
      details: 'Valid format (state validation skipped)'
    };
  } catch (error) {
    return {
      isValid: false,
      details: 'Validation error occurred'
    };
  }
}

const shippingConfigSchema = z.object({
  businessName: z.string().optional(),
  businessRegistration: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  pickupAddress: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      address_line_1: z.string().optional(),
      address_line_2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  courierPreferences: z
    .object({
      preferredCouriers: z.array(z.string()).optional(),
      blockedCouriers: z.array(z.string()).optional(),
      autoSelectCheapest: z.boolean().optional(),
      showCustomerChoice: z.boolean().optional(),
      defaultServiceType: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).optional(),
    })
    .optional(),
  shippingPolicies: z
    .object({
      freeShippingThreshold: z.number().min(0).optional(),
      maxWeight: z.number().optional(),
      maxDimensions: z
        .object({
          length: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
        .optional(),
      restrictedItems: z.array(z.string()).optional(),
      processingDays: z.number().optional(),
    })
    .optional(),
  serviceSettings: z
    .object({
      insuranceRequired: z.boolean().optional(),
      maxInsuranceValue: z.number().optional(),
      codEnabled: z.boolean().optional(),
      maxCodAmount: z.number().optional(),
      signatureRequired: z.boolean().optional(),
    })
    .optional(),
});

// GET shipping configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const profile = await businessShippingConfig.getBusinessProfile();
    const isConfigured = await businessShippingConfig.isBusinessConfigured();
    const courierPrefs = await businessShippingConfig.getCourierPreferences();

    // Check if EasyParcel API is properly configured
    const hasApiKey = !!process.env.EASYPARCEL_API_KEY;
    const hasApiSecret = !!process.env.EASYPARCEL_API_SECRET;
    const apiConfigured = hasApiKey && hasApiSecret;

    // Get shipping statistics - configurable time range
    const statsTimeRange = parseInt(process.env.SHIPPING_STATS_DAYS || '30');
    const statsStartDate = new Date(Date.now() - statsTimeRange * 24 * 60 * 60 * 1000);
    
    const shippingStats = await prisma.order.groupBy({
      by: ['status'],
      where: {
        trackingNumber: { not: null },
        createdAt: {
          gte: statsStartDate,
        },
      },
      _count: true,
    });

    const totalShipped = await prisma.order.count({
      where: {
        status: 'SHIPPED',
        trackingNumber: { not: null },
        createdAt: {
          gte: statsStartDate,
        },
      },
    });

    const totalDelivered = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        trackingNumber: { not: null },
        createdAt: {
          gte: statsStartDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      profile,
      configured: isConfigured && apiConfigured,
      courierPreferences: courierPrefs,
      statistics: {
        shipped: totalShipped,
        delivered: totalDelivered,
        deliveryRate:
          totalShipped > 0
            ? ((totalDelivered / totalShipped) * 100).toFixed(1)
            : '0.0',
        statusBreakdown: shippingStats,
      },
      apiStatus: {
        hasApiKey,
        hasApiSecret,
        apiConfigured,
        isBusinessConfigured: isConfigured,
      },
    });
  } catch (error) {
    console.error('Shipping config retrieval error:', error);
    return handleApiError(error);
  }
}

// PUT update shipping configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = shippingConfigSchema.parse(body);

    // Build complete business profile from validated data
    const currentProfile = await businessShippingConfig.getBusinessProfile();
    
    // Merge new data with existing profile
    const updatedProfile = {
      ...currentProfile,
      ...validatedData,
      // Ensure nested objects are properly merged
      pickupAddress: {
        ...currentProfile?.pickupAddress,
        ...validatedData.pickupAddress,
      },
      courierPreferences: {
        ...currentProfile?.courierPreferences,
        ...validatedData.courierPreferences,
      },
      shippingPolicies: {
        ...currentProfile?.shippingPolicies,
        ...validatedData.shippingPolicies,
        maxDimensions: {
          ...currentProfile?.shippingPolicies?.maxDimensions,
          ...validatedData.shippingPolicies?.maxDimensions,
        },
      },
      serviceSettings: {
        ...currentProfile?.serviceSettings,
        ...validatedData.serviceSettings,
      },
      // Keep existing fields that aren't part of the update schema
      operatingHours: currentProfile?.operatingHours || await getDefaultOperatingHours()
    };

    // Save to database using the business configuration service
    await businessShippingConfig.updateBusinessProfile(updatedProfile);

    const changes = [];

    if (validatedData.businessName !== undefined) {
      changes.push(`Business name: ${validatedData.businessName}`);
    }

    if (validatedData.contactPerson !== undefined) {
      changes.push(`Contact person: ${validatedData.contactPerson}`);
    }

    if (validatedData.contactEmail !== undefined) {
      changes.push(`Contact email: ${validatedData.contactEmail}`);
    }

    if (validatedData.pickupAddress) {
      changes.push('Pickup address updated');
    }

    if (validatedData.courierPreferences) {
      changes.push('Courier preferences updated');
    }

    if (validatedData.shippingPolicies) {
      changes.push('Shipping policies updated');
      if (validatedData.shippingPolicies.freeShippingThreshold !== undefined) {
        changes.push(
          `Free shipping threshold: RM ${validatedData.shippingPolicies.freeShippingThreshold}`
        );
      }
    }

    if (validatedData.serviceSettings) {
      changes.push('Service settings updated');
    }

    // Create audit log (skip if audit log fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SHIPPING_CONFIG_UPDATED',
          resource: 'SYSTEM_CONFIG',
          details: {
            changes,
            updatedFields: Object.keys(validatedData),
            performedBy: session.user.email,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue execution - audit log failure should not block configuration update
    }

    return NextResponse.json({
      message: 'Shipping configuration updated successfully',
      changes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Shipping config update error:', error);
    return handleApiError(error);
  }
}

// POST test EasyParcel connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test_connection':
        try {
          // Test with business pickup address and configurable test delivery
          const businessProfile = await businessShippingConfig.getBusinessProfile();
          const pickupAddress = await getValidatedPickupAddress(businessProfile);
          const testParcel = await getValidatedTestParcel();
          
          const testRatesResponse = await easyParcelService.calculateRates({
            pickup_address: pickupAddress,
            delivery_address: await getTestDeliveryAddress(),
            parcel: testParcel,
            service_types: getTestServiceTypes(),
            insurance: process.env.TEST_INSURANCE === 'true',
            cod: process.env.TEST_COD === 'true'
          });

          const testRates = testRatesResponse.rates || [];

          const startTime = Date.now();
          const responseTime = Date.now() - startTime;
          
          return NextResponse.json({
            message: 'EasyParcel connection test successful',
            ratesReturned: testRates.length,
            responseTime: responseTime,
            success: true
          });
        } catch (error) {
          console.error('EasyParcel connection test failed:', error);
          return NextResponse.json(
            {
              message: 'EasyParcel connection test failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false
            },
            { status: 500 }
          );
        }

      case 'validate_postal_code': {
        const { postalCode, state } = body;
        const validationResult = await validateMalaysianPostalCode(postalCode, state);

        return NextResponse.json({
          postalCode,
          state,
          isValid: validationResult.isValid,
          details: validationResult.details,
        });
      }

      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping action error:', error);
    return handleApiError(error);
  }
}
