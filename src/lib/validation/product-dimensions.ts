/**
 * Centralized Product Dimensions Validation Schema
 *
 * Single source of truth for dimension validation across:
 * - Product Create/Edit Forms
 * - Product Import API
 * - Data Migration Scripts
 *
 * Following @CLAUDE.md principles:
 * - Single Responsibility: One schema for all dimension validation
 * - DRY: No duplication across different entry points
 * - Type Safety: Explicit TypeScript types
 */

import { z } from 'zod';

/**
 * Dimension data structure stored in database (Json field)
 */
export interface ProductDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

/**
 * Centralized dimension validation schema
 * Used by all APIs and forms that handle product dimensions
 */
export const dimensionsSchema = z
  .object({
    length: z.number().positive('Length must be positive').nullable().optional(),
    width: z.number().positive('Width must be positive').nullable().optional(),
    height: z.number().positive('Height must be positive').nullable().optional(),
  })
  .nullable()
  .optional();

/**
 * Type-safe dimension data from validated schema
 */
export type ValidatedDimensions = z.infer<typeof dimensionsSchema>;

/**
 * Helper: Parse dimension string format (legacy: "10x15x8") to object
 * Used during migration and backward compatibility
 */
export function parseLegacyDimensionString(dimensionString: string): ProductDimensions | null {
  if (!dimensionString || dimensionString.trim() === '') {
    return null;
  }

  // Format: "lengthxwidthxheight" (e.g., "10x15x8")
  const match = dimensionString.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);

  if (match) {
    return {
      length: parseFloat(match[1]),
      width: parseFloat(match[2]),
      height: parseFloat(match[3]),
    };
  }

  return null;
}

/**
 * Helper: Parse corrupted JSON string to object
 * Used during migration to fix incorrectly stored data
 */
export function parseCorruptedDimensionJSON(jsonString: string): ProductDimensions | null {
  if (!jsonString || jsonString.trim() === '') {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Validate parsed data has expected structure
    if (parsed && typeof parsed === 'object') {
      return {
        length: parsed.length ?? null,
        width: parsed.width ?? null,
        height: parsed.height ?? null,
      };
    }
  } catch {
    // Not valid JSON, return null
  }

  return null;
}

/**
 * Helper: Validate and normalize dimension data from any source
 * Ensures consistent format regardless of input
 */
export function normalizeDimensions(input: any): ProductDimensions | null {
  if (!input) {
    return null;
  }

  // Already an object with correct structure
  if (typeof input === 'object' && !Array.isArray(input)) {
    return {
      length: input.length ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
    };
  }

  // Legacy string format "10x15x8"
  if (typeof input === 'string') {
    const fromLegacy = parseLegacyDimensionString(input);
    if (fromLegacy) {
      return fromLegacy;
    }

    // Corrupted JSON string
    const fromJSON = parseCorruptedDimensionJSON(input);
    if (fromJSON) {
      return fromJSON;
    }
  }

  return null;
}

/**
 * Helper: Convert separate dimension columns (from CSV import) to object
 */
export function createDimensionsFromColumns(
  length: number | string | null | undefined,
  width: number | string | null | undefined,
  height: number | string | null | undefined
): ProductDimensions | null {
  const parsedLength = length ? parseFloat(String(length)) : null;
  const parsedWidth = width ? parseFloat(String(width)) : null;
  const parsedHeight = height ? parseFloat(String(height)) : null;

  // Return null if all dimensions are null/empty
  if (!parsedLength && !parsedWidth && !parsedHeight) {
    return null;
  }

  return {
    length: parsedLength && !isNaN(parsedLength) ? parsedLength : null,
    width: parsedWidth && !isNaN(parsedWidth) ? parsedWidth : null,
    height: parsedHeight && !isNaN(parsedHeight) ? parsedHeight : null,
  };
}

/**
 * Constants for dimension validation
 */
export const DIMENSION_CONSTANTS = {
  MIN_VALUE: 0.01, // Minimum dimension in cm
  MAX_VALUE: 999999, // Maximum dimension in cm
  UNIT: 'cm',
} as const;
