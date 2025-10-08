/**
 * Shipping Calculation API
 *
 * POST /api/shipping/calculate - Calculate shipping rates for checkout
 *
 * This is the core API that powers the checkout shipping selector.
 * Called when customer enters shipping address.
 *
 * @module api/shipping/calculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { getShippingSettingsOrThrow } from '@/lib/shipping/shipping-settings';
import { createEasyParcelService, EasyParcelError } from '@/lib/shipping/easyparcel-service';
import { calculateTotalWeight } from '@/lib/shipping/utils/weight-utils';
import {
  COURIER_SELECTION_STRATEGIES,
  SHIPPING_ERROR_CODES,
  VALIDATION_PATTERNS,
} from '@/lib/shipping/constants';
import type {
  ShippingOption,
  ShippingCalculationResult,
  DeliveryAddress,
} from '@/lib/shipping/types';

const prisma = new PrismaClient();

/**
 * POST /api/shipping/calculate
 *
 * Calculate shipping rates for given address and cart items
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = ShippingCalculateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: SHIPPING_ERROR_CODES.INVALID_DESTINATION,
          message: 'Invalid request data',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { deliveryAddress, items, orderValue } = validation.data;

    // Check if shipping is configured
    const settings = await getShippingSettingsOrThrow();

    // Fetch product details to get weights
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true },
    });

    // Map products to cart items with weights
    const cartItemsWithWeight = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      return {
        product: { weight: product.weight },
        quantity: item.quantity,
      };
    });

    // Calculate total weight
    let totalWeight: number;
    try {
      totalWeight = calculateTotalWeight(cartItemsWithWeight);
    } catch (error) {
      console.error('[ShippingCalculate] Weight calculation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: SHIPPING_ERROR_CODES.WEIGHT_EXCEEDED,
          message: error instanceof Error ? error.message : 'Weight calculation failed',
        },
        { status: 400 }
      );
    }

    // Fetch shipping rates from EasyParcel
    const easyParcel = createEasyParcelService(settings);
    let rates;

    try {
      rates = await easyParcel.getRates(settings, deliveryAddress, totalWeight);
    } catch (error) {
      console.error('[ShippingCalculate] Rate fetch error:', error);

      if (error instanceof EasyParcelError) {
        return NextResponse.json(
          {
            success: false,
            error: error.code,
            message: error.message,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'Failed to fetch shipping rates',
        },
        { status: 500 }
      );
    }

    // Check for free shipping eligibility
    const freeShippingApplied =
      settings.freeShippingEnabled &&
      settings.freeShippingThreshold &&
      orderValue >= settings.freeShippingThreshold;

    // Convert EasyParcel rates to ShippingOptions
    let shippingOptions: ShippingOption[] = rates.map((rate) => ({
      serviceId: rate.service_id,
      courierName: rate.courier_name,
      serviceType: rate.service_type,
      serviceDetail: rate.service_detail, // 'pickup', 'dropoff', or 'dropoff or pickup'
      cost: freeShippingApplied ? 0 : rate.price,
      originalCost: rate.price,
      freeShipping: freeShippingApplied,
      estimatedDays: rate.estimated_delivery_days,
      savedAmount: freeShippingApplied ? rate.price : undefined,
      dropoffPoints: rate.dropoff_point, // Include dropoff locations if available
      pickupPoints: rate.pickup_point, // Include pickup locations if available
    }));

    // Apply courier selection strategy
    shippingOptions = applyCourierSelectionStrategy(
      shippingOptions,
      settings.courierSelectionMode,
      settings.selectedCouriers,
      settings.priorityCouriers
    );

    // Sort by price (cheapest first)
    shippingOptions.sort((a, b) => a.cost - b.cost);

    console.log('[ShippingCalculate] Rates calculated successfully:', {
      destination: `${deliveryAddress.state} ${deliveryAddress.postalCode}`,
      weight: totalWeight,
      optionsCount: shippingOptions.length,
      freeShippingApplied,
      strategy: settings.courierSelectionMode,
    });

    const result: ShippingCalculationResult = {
      success: true,
      shipping: {
        options: shippingOptions,
        strategy: settings.courierSelectionMode,
        freeShippingApplied,
        cartSubtotal: orderValue,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ShippingCalculate] Unexpected error:', error);

    // Handle "shipping not configured" error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: SHIPPING_ERROR_CODES.NOT_CONFIGURED,
          message: 'Shipping is not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Apply courier selection strategy to filter options
 *
 * @param options - All available shipping options (sorted by price)
 * @param strategy - Courier selection strategy
 * @param selectedCouriers - List of allowed courier IDs (for "selected" strategy)
 * @param priorityCouriers - Priority ranking (for "priority" strategy)
 * @returns Filtered shipping options
 */
function applyCourierSelectionStrategy(
  options: ShippingOption[],
  strategy: string,
  selectedCouriers?: string[],
  priorityCouriers?: {
    first: string;
    second?: string;
    third?: string;
  }
): ShippingOption[] {
  switch (strategy) {
    case COURIER_SELECTION_STRATEGIES.CHEAPEST:
      // Return only the cheapest option
      return options.length > 0 ? [options[0]] : [];

    case COURIER_SELECTION_STRATEGIES.SHOW_ALL:
      // Return all options
      return options;

    case COURIER_SELECTION_STRATEGIES.SELECTED:
      // Return all selected couriers (in priority order) that are available
      if (!selectedCouriers || selectedCouriers.length === 0) {
        console.warn('[ShippingCalculate] No couriers selected in "selected" mode, showing all');
        return options;
      }

      // Filter and maintain priority order (array order = priority)
      const filtered = selectedCouriers
        .map((courierServiceId) => options.find((option) => option.serviceId === courierServiceId))
        .filter((option): option is ShippingOption => option !== undefined);

      if (filtered.length === 0) {
        console.warn('[ShippingCalculate] No selected couriers available, showing all');
        return options;
      }

      console.log('[ShippingCalculate] Selected couriers found:', {
        total: filtered.length,
        couriers: filtered.map(c => ({ serviceId: c.serviceId, courierName: c.courierName })),
      });

      return filtered;

    case COURIER_SELECTION_STRATEGIES.PRIORITY:
      // Return highest priority courier that is available
      if (!priorityCouriers || !priorityCouriers.first) {
        console.warn('[ShippingCalculate] No priority couriers configured, using cheapest');
        return options.length > 0 ? [options[0]] : [];
      }

      // Check priority order: 1st → 2nd → 3rd
      const priorities = [
        priorityCouriers.first,
        priorityCouriers.second,
        priorityCouriers.third,
      ].filter(Boolean) as string[];

      for (const courierServiceId of priorities) {
        const match = options.find((option) => option.serviceId === courierServiceId);
        if (match) {
          console.log('[ShippingCalculate] Priority courier found:', {
            serviceId: match.serviceId,
            courierName: match.courierName,
            priority: priorities.indexOf(courierServiceId) + 1,
          });
          return [match]; // Return only highest priority available
        }
      }

      // None of the priority couriers are available - return empty array
      console.warn('[ShippingCalculate] None of the priority couriers are available for this destination');
      return [];

    default:
      console.warn(`[ShippingCalculate] Unknown strategy: ${strategy}, using cheapest`);
      return options.length > 0 ? [options[0]] : [];
  }
}

/**
 * Zod validation schema for shipping calculation request
 */
const ShippingCalculateSchema = z.object({
  deliveryAddress: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    phone: z
      .string()
      .regex(VALIDATION_PATTERNS.PHONE_MY, 'Phone must be in Malaysian format (+60XXXXXXXXX)'),
    addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.enum(
      ['jhr', 'kdh', 'ktn', 'mlk', 'nsn', 'phg', 'prk', 'pls', 'png', 'sgr', 'trg', 'kul', 'pjy', 'srw', 'sbh', 'lbn'],
      { errorMap: () => ({ message: 'Invalid state code' }) }
    ),
    postalCode: z
      .string()
      .regex(VALIDATION_PATTERNS.POSTAL_CODE_MY, 'Postal code must be a 5-digit number'),
    country: z.literal('MY', {
      errorMap: () => ({ message: 'Only Malaysia (MY) is supported' }),
    }),
  }),

  items: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive').max(999),
      })
    )
    .min(1, 'At least one item is required'),

  orderValue: z.number().positive('Order value must be positive'),
});
