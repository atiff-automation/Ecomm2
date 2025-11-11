/**
 * FAQ Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';

// Category enum
const faqCategoryEnum = z.enum([
  'ABOUT_US',
  'PRODUCTS',
  'SHIPPING',
  'PAYMENT',
  'MEMBERSHIP',
  'SAFETY',
]);

// Status enum
const faqStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

// Base FAQ schema
export const faqBaseSchema = z.object({
  question: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH,
      `Soalan mesti sekurang-kurangnya ${FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH} aksara`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH,
      `Soalan tidak boleh melebihi ${FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH} aksara`
    )
    .trim(),

  answer: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH,
      `Jawapan mesti sekurang-kurangnya ${FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH} aksara`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH,
      `Jawapan tidak boleh melebihi ${FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH} aksara`
    )
    .trim(),

  category: faqCategoryEnum,

  sortOrder: z
    .number()
    .int('Sort order mesti nombor bulat')
    .min(0, 'Sort order mesti 0 atau lebih')
    .default(0),

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
  category: z.union([faqCategoryEnum, z.literal('ALL')]).optional(),
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
