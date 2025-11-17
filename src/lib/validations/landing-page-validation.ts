/**
 * Landing Page Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';

// Status enum
const landingPageStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

// Slug validation - URL-safe characters only
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(LANDING_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH, 'Slug is too long')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  });

// Base landing page schema
export const landingPageBaseSchema = z.object({
  title: z
    .string()
    .min(
      LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
      `Title must be at least ${LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH} characters`
    )
    .max(
      LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
      `Title must not exceed ${LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters`
    )
    .trim(),

  slug: slugSchema,

  excerpt: z
    .string()
    .min(
      LANDING_PAGE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH,
      `Excerpt must be at least ${LANDING_PAGE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH} characters`
    )
    .max(
      LANDING_PAGE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH,
      `Excerpt must not exceed ${LANDING_PAGE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH} characters`
    )
    .trim()
    .optional(),

  content: z
    .string()
    .min(
      LANDING_PAGE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH,
      `Content must be at least ${LANDING_PAGE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH} characters`
    )
    .trim(),

  featuredImage: z
    .string()
    .min(1, 'Featured image is required')
    .refine(
      (val) => {
        // Accept full URLs (http/https) or paths starting with /
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: 'Featured image must be a valid URL or path' }
    ),

  featuredImageAlt: z
    .string()
    .min(1, 'Image alt text is required for SEO')
    .max(
      LANDING_PAGE_CONSTANTS.VALIDATION.FEATURED_IMAGE_ALT_MAX_LENGTH,
      'Alt text is too long'
    )
    .trim(),

  tags: z
    .array(z.string().trim().min(1))
    .max(LANDING_PAGE_CONSTANTS.VALIDATION.MAX_TAGS, `Maximum ${LANDING_PAGE_CONSTANTS.VALIDATION.MAX_TAGS} tags allowed`)
    .default([]),

  status: landingPageStatusEnum.default('DRAFT'),

  publishedAt: z.coerce.date().optional(),

  // SEO fields
  metaTitle: z
    .string()
    .max(
      LANDING_PAGE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH,
      'Meta title is too long'
    )
    .trim()
    .optional(),

  metaDescription: z
    .string()
    .max(
      LANDING_PAGE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH,
      'Meta description is too long'
    )
    .trim()
    .optional(),

  metaKeywords: z
    .array(z.string().trim().min(1))
    .max(10, 'Maximum 10 keywords allowed')
    .default([]),
});

// Create landing page schema (used in forms and API)
export const landingPageCreateSchema = landingPageBaseSchema.refine(
  (data) => {
    // If status is PUBLISHED, publishedAt is required
    if (data.status === 'PUBLISHED' && !data.publishedAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Published date is required when status is Published',
    path: ['publishedAt'],
  }
);

// Update landing page schema (all fields optional)
export const landingPageUpdateSchema = landingPageBaseSchema.partial();

// Reorder schema
export const landingPageReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid landing page ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Filter schema
export const landingPageFilterSchema = z.object({
  tag: z.string().optional(),
  status: z.union([landingPageStatusEnum, z.literal('ALL')]).optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(LANDING_PAGE_CONSTANTS.UI.LANDING_PAGES_PER_PAGE),
});

// ID parameter schema
export const landingPageIdSchema = z.string().cuid('Invalid landing page ID');

// Slug parameter schema
export const landingPageSlugSchema = z.string().min(1, 'Slug is required');

// Type exports
export type LandingPageCreateSchema = z.infer<typeof landingPageCreateSchema>;
export type LandingPageUpdateSchema = z.infer<typeof landingPageUpdateSchema>;
export type LandingPageReorderSchema = z.infer<typeof landingPageReorderSchema>;
export type LandingPageFilterSchema = z.infer<typeof landingPageFilterSchema>;
