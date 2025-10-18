/**
 * Weight Calculation Utilities
 *
 * Functions for calculating total order weight from cart items.
 * Used during checkout for shipping rate calculation.
 *
 * @module shipping/utils/weight-utils
 */

import { WEIGHT_LIMITS } from '../constants';
import type { CartItemWithWeight } from '../types';

/**
 * Calculate total order weight from cart items
 *
 * @param items - Array of cart items with product weight and quantity
 * @returns Total weight in kg
 * @throws Error if any item has invalid weight
 *
 * @example
 * const items = [
 *   { product: { weight: 1.5 }, quantity: 2 }, // 3.0 kg
 *   { product: { weight: 0.5 }, quantity: 1 }, // 0.5 kg
 * ];
 * const totalWeight = calculateTotalWeight(items); // 3.5 kg
 */
export function calculateTotalWeight(items: CartItemWithWeight[]): number {
  if (!items || items.length === 0) {
    throw new Error('Cannot calculate weight: No items provided');
  }

  let totalWeight = 0;

  for (const item of items) {
    const itemWeight = parseWeight(item.product.weight);

    // Validate weight
    if (itemWeight < WEIGHT_LIMITS.MIN) {
      throw new Error(
        `Invalid weight for product: ${itemWeight} kg is below minimum ${WEIGHT_LIMITS.MIN} kg`
      );
    }

    if (itemWeight > WEIGHT_LIMITS.MAX) {
      throw new Error(
        `Invalid weight for product: ${itemWeight} kg exceeds maximum ${WEIGHT_LIMITS.MAX} kg`
      );
    }

    // Validate quantity
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(
        `Invalid quantity: ${item.quantity} must be a positive integer`
      );
    }

    totalWeight += itemWeight * item.quantity;
  }

  // Round to 2 decimal places
  totalWeight = Math.round(totalWeight * 100) / 100;

  // Validate total weight
  if (totalWeight > WEIGHT_LIMITS.MAX) {
    throw new Error(
      `Total order weight ${totalWeight} kg exceeds maximum allowed ${WEIGHT_LIMITS.MAX} kg`
    );
  }

  return totalWeight;
}

/**
 * Parse weight value (handles both number and string from database)
 *
 * @param weight - Weight value (number or string)
 * @returns Parsed weight as number
 * @throws Error if weight cannot be parsed
 * @private
 */
function parseWeight(weight: number | string): number {
  const parsed = typeof weight === 'string' ? parseFloat(weight) : weight;

  if (isNaN(parsed) || !isFinite(parsed)) {
    throw new Error(`Invalid weight value: ${weight}`);
  }

  return parsed;
}

/**
 * Validate single product weight
 *
 * @param weight - Weight to validate
 * @returns True if valid
 * @throws Error if invalid
 */
export function validateProductWeight(weight: number): boolean {
  if (typeof weight !== 'number' || isNaN(weight) || !isFinite(weight)) {
    throw new Error('Weight must be a valid number');
  }

  if (weight < WEIGHT_LIMITS.MIN) {
    throw new Error(`Weight must be at least ${WEIGHT_LIMITS.MIN} kg`);
  }

  if (weight > WEIGHT_LIMITS.MAX) {
    throw new Error(`Weight cannot exceed ${WEIGHT_LIMITS.MAX} kg`);
  }

  return true;
}

/**
 * Format weight for display
 *
 * @param weight - Weight in kg
 * @returns Formatted weight string
 *
 * @example
 * formatWeight(1.5) // "1.50 kg"
 * formatWeight(0.05) // "0.05 kg"
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} kg`;
}

/**
 * Convert weight to grams
 *
 * @param kg - Weight in kilograms
 * @returns Weight in grams
 */
export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

/**
 * Convert weight to grams
 *
 * @param grams - Weight in grams
 * @returns Weight in kilograms
 */
export function gramsToKg(grams: number): number {
  return Math.round((grams / 1000) * 100) / 100;
}
