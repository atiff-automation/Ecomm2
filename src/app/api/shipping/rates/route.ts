/**
 * Shipping Rates API
 * Calculate shipping rates for orders using EasyParcel
 */

import { NextRequest, NextResponse } from 'next/server';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const shippingRateRequestSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      weight: z.number().min(0.1),
      quantity: z.number().int().min(1),
      value: z.number().min(0),
    })
  ),
  deliveryAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().regex(/^\d{5}$/, 'Invalid Malaysian postal code'),
    country: z.string().default('MY'),
  }),
  courier: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = shippingRateRequestSchema.parse(body);

    // Calculate total weight and value
    const totalWeight = validatedData.items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    );
    const totalValue = validatedData.items.reduce(
      (sum, item) => sum + item.value * item.quantity,
      0
    );

    // Default pickup address (business address)
    const pickupAddress = {
      name: process.env.BUSINESS_NAME || 'JRM E-commerce',
      phone: process.env.BUSINESS_PHONE || '+60123456789',
      email: process.env.BUSINESS_EMAIL || 'noreply@jrmecommerce.com',
      addressLine1:
        process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Example',
      addressLine2: process.env.BUSINESS_ADDRESS_LINE2 || '',
      city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
      state: process.env.BUSINESS_STATE || 'KUL',
      postalCode: process.env.BUSINESS_POSTAL_CODE || '50000',
      country: 'MY',
    };

    // Get shipping rates from EasyParcel
    const shippingRates = await easyParcelService.getShippingRates({
      pickupAddress,
      deliveryAddress: validatedData.deliveryAddress,
      items: validatedData.items,
      totalWeight,
      totalValue,
      courier: validatedData.courier,
    });

    // Apply free shipping threshold if configured
    const freeShippingThreshold = parseFloat(
      process.env.FREE_SHIPPING_THRESHOLD || '150'
    );
    const hasEligibleFreeShipping = totalValue >= freeShippingThreshold;

    const processedRates = shippingRates.map(rate => ({
      ...rate,
      originalPrice: rate.price,
      price: hasEligibleFreeShipping ? 0 : rate.price,
      freeShippingApplied: hasEligibleFreeShipping,
    }));

    return NextResponse.json({
      rates: processedRates,
      summary: {
        totalWeight: totalWeight.toFixed(2),
        totalValue: totalValue.toFixed(2),
        itemCount: validatedData.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        freeShippingThreshold,
        freeShippingEligible: hasEligibleFreeShipping,
      },
      pickupLocation: {
        city: pickupAddress.city,
        state: pickupAddress.state,
      },
      deliveryLocation: {
        city: validatedData.deliveryAddress.city,
        state: validatedData.deliveryAddress.state,
        zone:
          easyParcelService
            .getMalaysianStates()
            .find(s => s.code === validatedData.deliveryAddress.state)?.zone ||
          'unknown',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Shipping rates calculation error:', error);
    return handleApiError(error);
  }
}

// GET method to retrieve available states and configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'states':
        return NextResponse.json({
          states: easyParcelService.getMalaysianStates(),
        });

      case 'config':
        return NextResponse.json({
          serviceStatus: easyParcelService.getServiceStatus(),
          freeShippingThreshold: parseFloat(
            process.env.FREE_SHIPPING_THRESHOLD || '150'
          ),
          businessLocation: {
            city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
            state: process.env.BUSINESS_STATE || 'KUL',
          },
        });

      default:
        return NextResponse.json(
          { message: 'Invalid action. Use ?action=states or ?action=config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping config retrieval error:', error);
    return handleApiError(error);
  }
}
