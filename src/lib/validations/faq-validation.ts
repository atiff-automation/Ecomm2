/**
 * FAQ Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';

// Status enum
const faqStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

// Base FAQ schema
export const faqBaseSchema = z.object({
  question: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH,
      `Question must be at least ${FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH} characters`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH,
      `Question must not exceed ${FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH} characters`
    )
    .trim(),

  answer: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH,
      `Answer must be at least ${FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH} characters`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH,
      `Answer must not exceed ${FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH} characters`
    )
    .trim(),

  categoryId: z.string().min(1, 'Category is required'),

  sortOrder: z
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be 0 or greater')
    .default(0)
    .optional(),

  status: faqStatusEnum.default('ACTIVE'),
});

// Create FAQ schema (used in forms and API)
export const faqCreateSchema = faqBaseSchema;

// Update FAQ schema (all fields optional)
export const faqUpdateSchema = faqBaseSchema.partial();

// Reorder schema
export const faqReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid FAQ ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Filter schema
export const faqFilterSchema = z.object({
  categoryId: z.string().cuid().or(z.literal('ALL')).optional(),
  status: z.union([faqStatusEnum, z.literal('ALL')]).optional(),
  search: z.string().optional(),
});

// ID parameter schema
export const faqIdSchema = z.string().cuid('Invalid FAQ ID');

// Type exports
export type FAQCreateSchema = z.infer<typeof faqCreateSchema>;
export type FAQUpdateSchema = z.infer<typeof faqUpdateSchema>;
export type FAQReorderSchema = z.infer<typeof faqReorderSchema>;
export type FAQFilterSchema = z.infer<typeof faqFilterSchema>;
