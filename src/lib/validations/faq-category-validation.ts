/**
 * FAQ Category Validation Schemas
 * Zod schemas for validating FAQ category operations
 */

import { z } from 'zod';

// Create FAQ Category Schema
export const faqCategoryCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must be at most 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional(),

  icon: z
    .string()
    .max(50, 'Icon name must be at most 50 characters')
    .trim()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be a positive integer')
    .default(0)
    .optional(),

  isActive: z.boolean().default(true),
});

// Update FAQ Category Schema (all fields optional)
export const faqCategoryUpdateSchema = faqCategoryCreateSchema.partial();

// Query Parameters Schema
export const faqCategoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  sortBy: z.enum(['name', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type FAQCategoryCreateInput = z.infer<typeof faqCategoryCreateSchema>;
export type FAQCategoryUpdateInput = z.infer<typeof faqCategoryUpdateSchema>;
export type FAQCategoryQueryInput = z.infer<typeof faqCategoryQuerySchema>;
