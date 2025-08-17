/**
 * Admin Business Shipping Configuration API
 * Manages business profile and courier preferences
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 2 - Account Setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { z } from 'zod';

// Validation schemas
const malaysianStateSchema = z.enum([
  "JOH", "KDH", "KTN", "MLK", "NSN", "PHG", "PRK", "PLS", 
  "PNG", "KUL", "TRG", "SEL", "SBH", "SWK", "LBN"
]);

const addressSchema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().optional(),
  phone: z.string().regex(/^\+60[0-9]{8,10}$/, 'Valid Malaysian phone number required'),
  email: z.string().email().optional(),
  address_line_1: z.string().min(1).max(100),
  address_line_2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: malaysianStateSchema,
  postcode: z.string().regex(/^\d{5}$/, 'Valid 5-digit postal code required'),
  country: z.string().default('MY')
});

const operatingHourSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Time format HH:MM required'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Time format HH:MM required'),
  available: z.boolean()
});

const businessProfileSchema = z.object({
  businessName: z.string().min(1).max(100),
  businessRegistration: z.string().optional(),
  contactPerson: z.string().min(1).max(100),
  contactPhone: z.string().regex(/^\+60[0-9]{8,10}$/, 'Valid Malaysian phone number required'),
  contactEmail: z.string().email(),
  
  pickupAddress: addressSchema,
  
  operatingHours: z.object({
    monday: operatingHourSchema,
    tuesday: operatingHourSchema,
    wednesday: operatingHourSchema,
    thursday: operatingHourSchema,
    friday: operatingHourSchema,
    saturday: operatingHourSchema,
    sunday: operatingHourSchema
  }),
  
  courierPreferences: z.object({
    preferredCouriers: z.array(z.string()),
    blockedCouriers: z.array(z.string()),
    autoSelectCheapest: z.boolean(),
    showCustomerChoice: z.boolean(),
    defaultServiceType: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT'])
  }),
  
  shippingPolicies: z.object({
    freeShippingThreshold: z.number().min(0),
    maxWeight: z.number().min(0.1).max(70),
    maxDimensions: z.object({
      length: z.number().min(1).max(200),
      width: z.number().min(1).max(200),
      height: z.number().min(1).max(200)
    }),
    restrictedItems: z.array(z.string()),
    processingDays: z.number().min(0).max(14)
  }),
  
  serviceSettings: z.object({
    insuranceRequired: z.boolean(),
    maxInsuranceValue: z.number().min(0),
    codEnabled: z.boolean(),
    maxCodAmount: z.number().min(0),
    signatureRequired: z.boolean()
  })
});

const courierPreferenceSchema = z.object({
  courierId: z.string(),
  courierName: z.string(),
  priority: z.number().min(1).max(100),
  enabled: z.boolean(),
  serviceTypes: z.array(z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT'])),
  maxWeight: z.number().optional(),
  coverageAreas: z.array(malaysianStateSchema).optional(),
  notes: z.string().optional()
});

/**
 * GET - Get business configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component');

    if (component === 'profile') {
      const profile = await businessShippingConfig.getBusinessProfile();
      const isConfigured = await businessShippingConfig.isBusinessConfigured();
      
      return NextResponse.json({
        success: true,
        profile,
        isConfigured,
        timestamp: new Date().toISOString()
      });
    }

    if (component === 'couriers') {
      const preferences = await businessShippingConfig.getCourierPreferences();
      
      return NextResponse.json({
        success: true,
        preferences,
        timestamp: new Date().toISOString()
      });
    }

    if (component === 'status') {
      const profile = await businessShippingConfig.getBusinessProfile();
      const isConfigured = await businessShippingConfig.isBusinessConfigured();
      const pickupAddress = await businessShippingConfig.getPickupAddress();
      
      return NextResponse.json({
        success: true,
        status: {
          configured: isConfigured,
          businessName: profile?.businessName || 'Not configured',
          pickupCity: pickupAddress.city,
          pickupState: pickupAddress.state,
          courierPreferences: profile?.courierPreferences || null,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Default: return complete configuration
    const profile = await businessShippingConfig.getBusinessProfile();
    const preferences = await businessShippingConfig.getCourierPreferences();
    const isConfigured = await businessShippingConfig.isBusinessConfigured();

    return NextResponse.json({
      success: true,
      data: {
        profile,
        preferences,
        isConfigured
      },
      availableComponents: ['profile', 'couriers', 'status'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting business configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get business configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Update business configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, component } = body;

    console.log(`[Business Config] ${action} requested by ${session.user.email}`, {
      component,
      hasData: !!body.data
    });

    if (action === 'update_profile') {
      const validatedProfile = businessProfileSchema.parse(body.data);
      
      await businessShippingConfig.updateBusinessProfile(validatedProfile);
      
      return NextResponse.json({
        success: true,
        message: 'Business profile updated successfully',
        updatedBy: session.user.email,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'update_couriers') {
      const validatedPreferences = z.array(courierPreferenceSchema).parse(body.data);
      
      await businessShippingConfig.updateCourierPreferences(validatedPreferences);
      
      return NextResponse.json({
        success: true,
        message: 'Courier preferences updated successfully',
        updatedBy: session.user.email,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'test_configuration') {
      const isConfigured = await businessShippingConfig.isBusinessConfigured();
      const profile = await businessShippingConfig.getBusinessProfile();
      
      const testResults = {
        configured: isConfigured,
        validations: {
          businessName: !!profile?.businessName,
          contactInfo: !!(profile?.contactPerson && profile?.contactPhone && profile?.contactEmail),
          pickupAddress: !!(
            profile?.pickupAddress.name &&
            profile?.pickupAddress.address_line_1 &&
            profile?.pickupAddress.city &&
            profile?.pickupAddress.state &&
            profile?.pickupAddress.postcode
          ),
          courierPreferences: !!(profile?.courierPreferences),
          shippingPolicies: !!(profile?.shippingPolicies)
        }
      };
      
      return NextResponse.json({
        success: true,
        testResults,
        message: isConfigured ? 'Configuration is complete' : 'Configuration incomplete',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating business configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid configuration data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update business configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Reset configuration to defaults
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SuperAdmin required' }, { status: 401 });
    }

    // Reset to default configuration
    const defaultProfile = await businessShippingConfig.getBusinessProfile();
    const defaultPreferences = await businessShippingConfig.getCourierPreferences();
    
    if (defaultProfile) {
      await businessShippingConfig.updateBusinessProfile(defaultProfile);
    }
    
    await businessShippingConfig.updateCourierPreferences(defaultPreferences);

    return NextResponse.json({
      success: true,
      message: 'Configuration reset to defaults',
      resetBy: session.user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting business configuration:', error);
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    );
  }
}