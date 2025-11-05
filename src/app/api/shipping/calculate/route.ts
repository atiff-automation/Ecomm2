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
import { getPickupAddressOrThrow } from '@/lib/shipping/business-profile-integration';
import {
  createEasyParcelService,
  EasyParcelError,
} from '@/lib/shipping/easyparcel-service';
import { calculateTotalWeight } from '@/lib/shipping/utils/weight-utils';
import { normalizePhoneNumber } from '@/lib/shipping/utils/phoneNumber-utils';
import {
  COURIER_SELECTION_STRATEGIES,
  SHIPPING_ERROR_CODES,
  VALIDATION_PATTERNS,
} from '@/lib/shipping/constants';
import type {
  ShippingOption,
  ShippingCalculationResult,
  DeliveryAddress,
  MalaysianStateCode,
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

    let { deliveryAddress, items, orderValue } = validation.data;

    // Normalize phone number to +60 format (defense-in-depth)
    // Even though frontend normalizes, we normalize again on server for consistency
    try {
      deliveryAddress = {
        ...deliveryAddress,
        phone: normalizePhoneNumber(deliveryAddress.phone),
      };
    } catch (phoneError) {
      console.error('[ShippingCalculate] Server-side phone normalization failed:', phoneError);
      // Continue anyway - Zod validation already checked the format
    }

    // Check if shipping is configured
    const settings = await getShippingSettingsOrThrow();

    // Get pickup address from business profile
    const pickupAddress = await getPickupAddressOrThrow();

    // Fetch product details to get weights
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true },
    });

    // Map products to cart items with weights
    const cartItemsWithWeight = items.map(item => {
      const product = products.find(p => p.id === item.productId);
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
          message:
            error instanceof Error
              ? error.message
              : 'Weight calculation failed',
        },
        { status: 400 }
      );
    }

    // Fetch shipping rates from EasyParcel
    const easyParcel = createEasyParcelService(settings);
    let rates;

    try {
      rates = await easyParcel.getRates(
        pickupAddress,
        deliveryAddress,
        totalWeight
      );
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

    // Check if free shipping eligibility (with state-based restrictions)
    // orderValue should be cart total (after discounts, before tax/shipping)
    const freeShippingApplied = checkFreeShippingEligibility(
      settings,
      deliveryAddress.state,
      orderValue
    );

    // Convert EasyParcel rates to ShippingOptions
    // ✅ FIX: Use service_name (brand) instead of courier_name (legal entity)
    // This ensures consistency with EasyParcel's shipment creation response
    let shippingOptions: ShippingOption[] = rates.map(rate => ({
      serviceId: rate.service_id,
      courierName: rate.service_name, // ← Changed from courier_name to service_name
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
        totalWeight, // Include calculated weight for checkout
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
        console.warn(
          '[ShippingCalculate] No couriers selected in "selected" mode, showing all'
        );
        return options;
      }

      // Filter and maintain priority order (array order = priority)
      const filtered = selectedCouriers
        .map(courierServiceId =>
          options.find(option => option.serviceId === courierServiceId)
        )
        .filter((option): option is ShippingOption => option !== undefined);

      if (filtered.length === 0) {
        console.warn(
          '[ShippingCalculate] No selected couriers available, showing all'
        );
        return options;
      }

      console.log('[ShippingCalculate] Selected couriers found:', {
        total: filtered.length,
        couriers: filtered.map(c => ({
          serviceId: c.serviceId,
          courierName: c.courierName,
        })),
      });

      return filtered;

    case COURIER_SELECTION_STRATEGIES.PRIORITY:
      // Return highest priority courier that is available
      if (!priorityCouriers || !priorityCouriers.first) {
        console.warn(
          '[ShippingCalculate] No priority couriers configured, using cheapest'
        );
        return options.length > 0 ? [options[0]] : [];
      }

      // Check priority order: 1st → 2nd → 3rd
      const priorities = [
        priorityCouriers.first,
        priorityCouriers.second,
        priorityCouriers.third,
      ].filter(Boolean) as string[];

      for (const courierServiceId of priorities) {
        const match = options.find(
          option => option.serviceId === courierServiceId
        );
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
      console.warn(
        '[ShippingCalculate] None of the priority couriers are available for this destination'
      );
      return [];

    default:
      console.warn(
        `[ShippingCalculate] Unknown strategy: ${strategy}, using cheapest`
      );
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
      .regex(
        VALIDATION_PATTERNS.PHONE_MY,
        'Phone must be a valid Malaysian number (0123456789, 60123456789, or +60123456789)'
      ),
    addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.enum(
      [
        'jhr',
        'kdh',
        'ktn',
        'mlk',
        'nsn',
        'phg',
        'prk',
        'pls',
        'png',
        'sgr',
        'trg',
        'kul',
        'pjy',
        'srw',
        'sbh',
        'lbn',
      ],
      { errorMap: () => ({ message: 'Invalid state code' }) }
    ),
    postalCode: z
      .string()
      .regex(
        VALIDATION_PATTERNS.POSTAL_CODE_MY,
        'Postal code must be a 5-digit number'
      ),
    country: z.literal('MY', {
      errorMap: () => ({ message: 'Only Malaysia (MY) is supported' }),
    }),
  }),

  items: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z
          .number()
          .int()
          .positive('Quantity must be positive')
          .max(999),
      })
    )
    .min(1, 'At least one item is required'),

  orderValue: z.number().positive('Order value must be positive'),
});

/**
 * Check if order qualifies for free shipping
 *
 * Implements multi-tier eligibility check:
 * 1. Feature must be enabled globally (toggle overrides all)
 * 2. Threshold must be configured
 * 3. Delivery state must be eligible (if state restrictions configured)
 * 4. Order value must meet threshold
 *
 * @param settings - Shipping settings from database (SystemConfig)
 * @param deliveryState - Customer's delivery state code (e.g., 'kul', 'srw')
 * @param orderValue - Cart total after discounts, before tax/shipping
 * @returns true if free shipping should be applied, false otherwise
 *
 * @example
 * // State restrictions enabled - KUL eligible, SRW not
 * checkFreeShippingEligibility(
 *   { freeShippingEnabled: true, freeShippingThreshold: 150, freeShippingEligibleStates: ['kul'] },
 *   'kul',
 *   200
 * ); // true
 *
 * checkFreeShippingEligibility(
 *   { freeShippingEnabled: true, freeShippingThreshold: 150, freeShippingEligibleStates: ['kul'] },
 *   'srw',
 *   200
 * ); // false (state not eligible)
 */
function checkFreeShippingEligibility(
  settings: {
    freeShippingEnabled: boolean;
    freeShippingThreshold?: number;
    freeShippingEligibleStates?: string[];
  },
  deliveryState: string,
  orderValue: number
): boolean {
  // TIER 1: Feature toggle check (overrides everything)
  if (!settings.freeShippingEnabled) {
    console.log('[FreeShipping] Feature disabled globally');
    return false;
  }

  // TIER 2: Threshold configuration check
  if (!settings.freeShippingThreshold) {
    console.log('[FreeShipping] No threshold configured');
    return false;
  }

  // TIER 3: State-based eligibility check (NEW LOGIC)
  if (settings.freeShippingEligibleStates !== undefined) {
    // State restrictions are configured
    if (settings.freeShippingEligibleStates.length === 0) {
      // Empty array = free shipping disabled (safety check)
      console.log('[FreeShipping] Empty state list - feature effectively disabled');
      return false;
    }

    // Check if delivery state is in eligible list
    const isStateEligible = settings.freeShippingEligibleStates.includes(
      deliveryState
    );

    if (!isStateEligible) {
      // SILENT FAILURE: State not eligible, no error message to customer
      console.log('[FreeShipping] State not eligible for free shipping:', {
        deliveryState,
        eligibleStates: settings.freeShippingEligibleStates,
        stateCount: settings.freeShippingEligibleStates.length,
      });
      return false;
    }

    console.log('[FreeShipping] State eligibility verified:', {
      deliveryState,
      eligibleStates: settings.freeShippingEligibleStates,
    });
  } else {
    // No state restrictions configured = all states eligible (backwards compatible)
    console.log(
      '[FreeShipping] No state restrictions configured - all states eligible'
    );
  }

  // TIER 4: Order value threshold check
  if (orderValue < settings.freeShippingThreshold) {
    console.log('[FreeShipping] Order value below threshold:', {
      orderValue: `RM ${orderValue.toFixed(2)}`,
      threshold: `RM ${settings.freeShippingThreshold.toFixed(2)}`,
      shortfall: `RM ${(settings.freeShippingThreshold - orderValue).toFixed(2)}`,
    });
    return false;
  }

  // ALL CHECKS PASSED
  console.log('[FreeShipping] ✅ ELIGIBLE - All conditions met:', {
    orderValue: `RM ${orderValue.toFixed(2)}`,
    threshold: `RM ${settings.freeShippingThreshold.toFixed(2)}`,
    deliveryState,
    hasStateRestrictions: settings.freeShippingEligibleStates !== undefined,
  });

  return true;
}
