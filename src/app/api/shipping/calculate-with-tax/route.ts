/**

export const dynamic = 'force-dynamic';

 * Tax-Inclusive Shipping Calculation API
 * Returns shipping rates with Malaysian tax calculations
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TaxInclusiveShippingCalculator } from '@/lib/shipping/tax-inclusive-shipping-calculator';

const taxInclusiveRateSchema = z.object({
  pickupAddress: z.object({
    postcode: z.string().min(5).max(5),
    state: z.string().min(2).max(3),
    city: z.string().min(1).max(50),
  }),
  deliveryAddress: z.object({
    postcode: z.string().min(5).max(5),
    state: z.string().min(2).max(3),
    city: z.string().min(1).max(50),
  }),
  parcel: z.object({
    weight: z.number().min(0.1).max(70),
    length: z.number().min(1).optional(),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
    value: z.number().min(0),
  }),
  serviceTypes: z.array(z.string()).optional(),
  includeInsurance: z.boolean().optional(),
  includeCOD: z.boolean().optional(),
  displayTaxInclusive: z.boolean().optional().default(true),
  orderValue: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = taxInclusiveRateSchema.parse(body);

    const calculator = new TaxInclusiveShippingCalculator();

    // Calculate tax-inclusive rates
    const rates = await calculator.calculateTaxInclusiveRates(validatedData);

    // Get recommended options
    const recommendations =
      await calculator.getRecommendedOptionWithTax(validatedData);

    // Calculate free shipping if order value is provided
    let freeShippingAnalysis = null;
    if (
      validatedData.orderValue !== undefined &&
      validatedData.freeShippingThreshold
    ) {
      const qualifiesForFreeShipping =
        validatedData.orderValue >= validatedData.freeShippingThreshold;
      const amountNeededForFreeShipping = qualifiesForFreeShipping
        ? 0
        : validatedData.freeShippingThreshold - validatedData.orderValue;

      freeShippingAnalysis = {
        qualifies: qualifiesForFreeShipping,
        threshold: validatedData.freeShippingThreshold,
        currentOrderValue: validatedData.orderValue,
        amountNeeded: amountNeededForFreeShipping,
        message: qualifiesForFreeShipping
          ? 'Congratulations! You qualify for free shipping.'
          : `Add RM ${amountNeededForFreeShipping.toFixed(2)} more to qualify for free shipping.`,
      };
    }

    // Format rates for display
    const formattedRates = rates.map(rate => {
      const display = calculator.formatRateDisplay(rate, true);
      return {
        ...rate,
        display,
      };
    });

    return NextResponse.json({
      success: true,
      rates: formattedRates,
      recommendations,
      freeShippingAnalysis,
      taxInformation: {
        description:
          'All prices include Malaysian Service Tax (SST) where applicable',
        authority: 'Royal Malaysian Customs Department',
        taxInclusivePricing: validatedData.displayTaxInclusive,
        averageTaxRate: recommendations.taxSummary.averageTaxRate,
        totalAvailableRates: rates.length,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        currency: 'MYR',
        country: 'Malaysia',
      },
    });
  } catch (error) {
    console.error('Error calculating tax-inclusive shipping rates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate shipping rates with tax',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Simple rate calculation for GET requests
  const pickupPostcode = searchParams.get('pickupPostcode');
  const deliveryPostcode = searchParams.get('deliveryPostcode');
  const weight = searchParams.get('weight');
  const value = searchParams.get('value');

  if (!pickupPostcode || !deliveryPostcode || !weight || !value) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing required parameters: pickupPostcode, deliveryPostcode, weight, value',
      },
      { status: 400 }
    );
  }

  try {
    const calculator = new TaxInclusiveShippingCalculator();

    // Simple calculation with minimal data
    const rates = await calculator.calculateTaxInclusiveRates({
      pickupAddress: {
        postcode: pickupPostcode,
        state: 'KUL', // Default to KL for GET requests
        city: 'Kuala Lumpur',
      },
      deliveryAddress: {
        postcode: deliveryPostcode,
        state: 'SEL', // Default to Selangor for GET requests
        city: 'Shah Alam',
      },
      parcel: {
        weight: parseFloat(weight),
        value: parseFloat(value),
      },
      displayTaxInclusive: searchParams.get('includeTax') !== 'false',
    });

    const cheapestRate = rates.length > 0 ? rates[0] : null;

    return NextResponse.json({
      success: true,
      cheapestRate,
      totalRatesAvailable: rates.length,
      taxInformation: {
        description: 'Prices include Malaysian Service Tax (SST)',
        includedInPrice: searchParams.get('includeTax') !== 'false',
      },
    });
  } catch (error) {
    console.error('Error in GET shipping calculation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate shipping rates',
      },
      { status: 500 }
    );
  }
}
