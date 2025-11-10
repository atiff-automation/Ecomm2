/**
 * Product Export Validation - Malaysian E-commerce Platform
 * Zod schemas for validating product export parameters
 */

import { z } from 'zod';

/**
 * Validation schema for product export query parameters
 * Supports both specific product ID selection and filter-based export
 */
export const productExportParamsSchema = z.object({
  // Specific product IDs to export (comma-separated string from query params)
  productIds: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      // Split comma-separated string, trim each ID, and filter empty values
      const ids = val.split(',').map(id => id.trim()).filter(id => id.length > 0);
      return ids.length > 0 ? ids : undefined;
    }),

  // Filter-based export parameters (only used if productIds is not provided)
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
});

/**
 * Type inference from schema
 */
export type ProductExportParamsInput = z.input<typeof productExportParamsSchema>;
export type ProductExportParamsOutput = z.output<typeof productExportParamsSchema>;
