/**
 * Article Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';

// Status enum
const articleStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

// Slug validation - URL-safe characters only
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(ARTICLE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH, 'Slug is too long')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  });

// Base article schema
export const articleBaseSchema = z.object({
  title: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
      `Title must be at least ${ARTICLE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH} characters`
    )
    .max(
      ARTICLE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
      `Title must not exceed ${ARTICLE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters`
    )
    .trim(),

  slug: slugSchema,

  excerpt: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH,
      `Excerpt must be at least ${ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH} characters`
    )
    .max(
      ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH,
      `Excerpt must not exceed ${ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH} characters`
    )
    .trim()
    .optional(),

  content: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH,
      `Content must be at least ${ARTICLE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH} characters`
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
      ARTICLE_CONSTANTS.VALIDATION.FEATURED_IMAGE_ALT_MAX_LENGTH,
      'Alt text is too long'
    )
    .trim(),

  categoryId: z.string().cuid('Invalid category ID'),

  tags: z
    .array(z.string().trim().min(1))
    .max(ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS, `Maximum ${ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS} tags allowed`)
    .default([]),

  status: articleStatusEnum.default('DRAFT'),

  publishedAt: z.coerce.date().optional(),

  // SEO fields
  metaTitle: z
    .string()
    .max(
      ARTICLE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH,
      'Meta title is too long'
    )
    .trim()
    .optional(),

  metaDescription: z
    .string()
    .max(
      ARTICLE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH,
      'Meta description is too long'
    )
    .trim()
    .optional(),

  metaKeywords: z
    .array(z.string().trim().min(1))
    .max(10, 'Maximum 10 keywords allowed')
    .default([]),
});

// Create article schema (used in forms and API)
export const articleCreateSchema = articleBaseSchema.refine(
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

// Update article schema (all fields optional)
export const articleUpdateSchema = articleBaseSchema.partial();

// Reorder schema
export const articleReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid article ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Filter schema
export const articleFilterSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  status: z.union([articleStatusEnum, z.literal('ALL')]).optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(ARTICLE_CONSTANTS.UI.ARTICLES_PER_PAGE),
});

// ID parameter schema
export const articleIdSchema = z.string().cuid('Invalid article ID');

// Slug parameter schema
export const articleSlugSchema = z.string().min(1, 'Slug is required');

// Category validation schemas
export const articleCategoryBaseSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100).trim(),
  slug: slugSchema,
  description: z.string().max(500).trim().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code').optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const articleCategoryCreateSchema = articleCategoryBaseSchema;
export const articleCategoryUpdateSchema = articleCategoryBaseSchema.partial();

// Category reorder schema
export const articleCategoryReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid category ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Type exports
export type ArticleCreateSchema = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateSchema = z.infer<typeof articleUpdateSchema>;
export type ArticleReorderSchema = z.infer<typeof articleReorderSchema>;
export type ArticleFilterSchema = z.infer<typeof articleFilterSchema>;
export type ArticleCategoryCreateSchema = z.infer<typeof articleCategoryCreateSchema>;
export type ArticleCategoryUpdateSchema = z.infer<typeof articleCategoryUpdateSchema>;
export type ArticleCategoryReorderSchema = z.infer<typeof articleCategoryReorderSchema>;
