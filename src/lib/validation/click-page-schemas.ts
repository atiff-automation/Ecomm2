/**
 * Click Page Validation Schemas
 * Zod schemas for runtime validation of Click Page data
 */

import { z } from 'zod';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

// ============================================================================
// Block-Specific Schemas
// ============================================================================

/**
 * Hero Block Settings Schema
 */
export const heroBlockSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  backgroundImage: z.string().url().optional().or(z.literal('')),
  backgroundVideo: z.string().url().optional().or(z.literal('')),
  overlayOpacity: z.number().min(0).max(1),
  textAlignment: z.enum(['left', 'center', 'right']),
  ctaText: z.string().min(1, 'CTA text is required').max(100),
  ctaUrl: z.string().min(1, 'CTA URL is required'),
  showCountdown: z.boolean(),
  countdownEndDate: z.coerce.date().optional(),
  countdownLabel: z.string().max(100).optional(),
});

/**
 * Text Block Settings Schema
 */
export const textBlockSettingsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  textAlign: z.enum(['left', 'center', 'right', 'justify']),
  maxWidth: z.number().positive().optional(),
});

/**
 * CTA Button Block Settings Schema
 */
export const ctaButtonBlockSettingsSchema = z.object({
  text: z.string().min(1, 'Button text is required').max(100),
  url: z.string().min(1, 'URL is required'),
  variant: z.enum(['default', 'outline', 'ghost', 'destructive']),
  size: z.enum(['sm', 'default', 'lg']),
  alignment: z.enum(['left', 'center', 'right']),
  openInNewTab: z.boolean(),
});

/**
 * Image Block Settings Schema
 */
export const imageBlockSettingsSchema = z.object({
  url: z.string().url('Must be a valid URL').min(1, 'Image URL is required'),
  altText: z.string().min(1, 'Alt text is required').max(200),
  caption: z.string().max(300).optional(),
  link: z.string().url().optional().or(z.literal('')),
  alignment: z.enum(['left', 'center', 'right']),
  width: z.enum(['full', 'large', 'medium', 'small']),
  rounded: z.boolean(),
});

/**
 * Spacer Block Settings Schema
 */
export const spacerBlockSettingsSchema = z.object({
  height: z.number().min(10).max(500),
});

/**
 * Divider Block Settings Schema
 */
export const dividerBlockSettingsSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  thickness: z.number().min(1).max(10),
  spacing: z.number().min(0).max(100),
});

/**
 * Pricing Tier Schema
 */
export const pricingTierSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(100),
  subtitle: z.string().max(200).optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  features: z.array(z.string().max(200)).min(1, 'At least one feature is required'),
  ctaText: z.string().min(1, 'CTA text is required').max(50),
  ctaUrl: z.string().min(1, 'CTA URL is required'),
  highlighted: z.boolean(),
  badge: z.string().max(50).optional(),
});

/**
 * Pricing Table Block Settings Schema
 */
export const pricingTableBlockSettingsSchema = z.object({
  tiers: z.array(pricingTierSchema).min(1, 'At least one pricing tier is required').max(5),
  layout: z.enum(['horizontal', 'vertical']),
  showComparison: z.boolean(),
});

/**
 * Testimonial Item Schema
 */
export const testimonialItemSchema = z.object({
  id: z.string().min(1),
  quote: z.string().min(1, 'Quote is required').max(500),
  authorName: z.string().min(1, 'Author name is required').max(100),
  authorTitle: z.string().max(100).optional(),
  authorImage: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
});

/**
 * Testimonial Block Settings Schema
 */
export const testimonialBlockSettingsSchema = z.object({
  testimonials: z.array(testimonialItemSchema).min(1, 'At least one testimonial is required').max(10),
  layout: z.enum(['single', 'carousel', 'grid']),
  showRatings: z.boolean(),
  showImages: z.boolean(),
});

/**
 * Countdown Timer Block Settings Schema
 */
export const countdownTimerBlockSettingsSchema = z.object({
  endDate: z.coerce.date().min(new Date(), 'End date must be in the future'),
  title: z.string().max(200).optional(),
  message: z.string().max(300).optional(),
  showDays: z.boolean(),
  showHours: z.boolean(),
  showMinutes: z.boolean(),
  showSeconds: z.boolean(),
  expiredMessage: z.string().max(200).optional(),
});

/**
 * Social Proof Block Settings Schema
 */
export const socialProofBlockSettingsSchema = z.object({
  type: z.enum(['stats', 'badges', 'reviews']),
  stats: z.array(z.object({
    label: z.string().min(1).max(100),
    value: z.string().min(1).max(100),
    icon: z.string().max(50).optional(),
  })).optional(),
  badges: z.array(z.object({
    imageUrl: z.string().url(),
    altText: z.string().min(1).max(200),
  })).optional(),
  reviews: z.object({
    totalReviews: z.number().min(0),
    averageRating: z.number().min(0).max(5),
    showStars: z.boolean(),
    images: z.array(z.string().url()).max(10),
  }).optional(),
  layout: z.enum(['horizontal', 'vertical', 'grid']),
});

// ============================================================================
// Base Block Schema
// ============================================================================

export const baseBlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  type: z.enum([
    'HERO',
    'TEXT',
    'CTA_BUTTON',
    'IMAGE',
    'SPACER',
    'DIVIDER',
    'PRICING_TABLE',
    'TESTIMONIAL',
    'COUNTDOWN_TIMER',
    'SOCIAL_PROOF',
  ]),
  sortOrder: z.number().min(0),
});

// ============================================================================
// Block Union Schema (Discriminated)
// ============================================================================

export const blockSchema = z.discriminatedUnion('type', [
  baseBlockSchema.extend({
    type: z.literal('HERO'),
    settings: heroBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('TEXT'),
    settings: textBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('CTA_BUTTON'),
    settings: ctaButtonBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('IMAGE'),
    settings: imageBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('SPACER'),
    settings: spacerBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('DIVIDER'),
    settings: dividerBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('PRICING_TABLE'),
    settings: pricingTableBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('TESTIMONIAL'),
    settings: testimonialBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('COUNTDOWN_TIMER'),
    settings: countdownTimerBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('SOCIAL_PROOF'),
    settings: socialProofBlockSettingsSchema,
  }),
]);

// ============================================================================
// Custom Scripts Schema
// ============================================================================

export const customScriptsSchema = z.object({
  head: z.array(z.string()).max(10, 'Maximum 10 head scripts allowed'),
  body: z.array(z.string()).max(10, 'Maximum 10 body scripts allowed'),
}).optional();

// ============================================================================
// Click Page Create Schema
// ============================================================================

export const clickPageCreateSchema = z.object({
  // Basic Content
  title: z.string()
    .min(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
      `Title must be at least ${CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH} characters`)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
      `Title must not exceed ${CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters`),

  slug: z.string()
    .min(1, 'Slug is required')
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),

  blocks: z.array(blockSchema)
    .min(CLICK_PAGE_CONSTANTS.VALIDATION.MIN_BLOCKS,
      `At least ${CLICK_PAGE_CONSTANTS.VALIDATION.MIN_BLOCKS} block is required`)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.MAX_BLOCKS,
      `Maximum ${CLICK_PAGE_CONSTANTS.VALIDATION.MAX_BLOCKS} blocks allowed`),

  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']),

  publishedAt: z.coerce.date().optional(),

  // SEO
  metaTitle: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH)
    .optional(),

  metaDescription: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH)
    .optional(),

  metaKeywords: z.array(z.string().max(50)).max(10, 'Maximum 10 keywords allowed').optional(),

  ogImageUrl: z.string().url().optional().or(z.literal('')),
  twitterImageUrl: z.string().url().optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  noIndex: z.boolean().optional(),

  // Analytics & Tracking
  fbPixelId: z.string().max(50).optional(),
  gaTrackingId: z.string().max(50).optional(),
  gtmContainerId: z.string().max(50).optional(),
  customScripts: customScriptsSchema,

  // Campaign
  scheduledPublishAt: z.coerce.date().optional(),
  scheduledUnpublishAt: z.coerce.date().optional(),
  campaignName: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.CAMPAIGN_NAME_MAX_LENGTH)
    .optional(),
  campaignStartDate: z.coerce.date().optional(),
  campaignEndDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If status is SCHEDULED, scheduledPublishAt must be provided
    if (data.status === 'SCHEDULED' && !data.scheduledPublishAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Scheduled publish date is required for SCHEDULED status',
    path: ['scheduledPublishAt'],
  }
).refine(
  (data) => {
    // If both campaign dates are provided, start must be before end
    if (data.campaignStartDate && data.campaignEndDate) {
      return data.campaignStartDate < data.campaignEndDate;
    }
    return true;
  },
  {
    message: 'Campaign start date must be before end date',
    path: ['campaignEndDate'],
  }
);

// ============================================================================
// Click Page Update Schema
// ============================================================================

export const clickPageUpdateSchema = z.object({
  title: z.string()
    .min(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH)
    .optional(),

  slug: z.string()
    .min(1)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH)
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  blocks: z.array(blockSchema)
    .min(CLICK_PAGE_CONSTANTS.VALIDATION.MIN_BLOCKS)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.MAX_BLOCKS)
    .optional(),

  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  publishedAt: z.coerce.date().optional(),

  // SEO
  metaTitle: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH)
    .optional(),
  metaDescription: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH)
    .optional(),
  metaKeywords: z.array(z.string().max(50)).max(10).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal('')),
  twitterImageUrl: z.string().url().optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  noIndex: z.boolean().optional(),

  // Analytics & Tracking
  fbPixelId: z.string().max(50).optional(),
  gaTrackingId: z.string().max(50).optional(),
  gtmContainerId: z.string().max(50).optional(),
  customScripts: customScriptsSchema,

  // Campaign
  scheduledPublishAt: z.coerce.date().optional(),
  scheduledUnpublishAt: z.coerce.date().optional(),
  campaignName: z.string()
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.CAMPAIGN_NAME_MAX_LENGTH)
    .optional(),
  campaignStartDate: z.coerce.date().optional(),
  campaignEndDate: z.coerce.date().optional(),
});

// ============================================================================
// Click Event Schema
// ============================================================================

export const clickEventSchema = z.object({
  blockId: z.string().optional(),
  blockType: z.string().optional(),
  targetUrl: z.string().optional(),
  targetId: z.string().optional(),
  sessionId: z.string().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

// ============================================================================
// Conversion Event Schema
// ============================================================================

export const conversionEventSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  orderValue: z.number().min(0, 'Order value must be positive'),
  sessionId: z.string().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

// ============================================================================
// Filter Schema
// ============================================================================

export const clickPageFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ALL']).optional(),
  search: z.string().max(200).optional(),
  campaignName: z.string().max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(12),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type ClickPageCreateInput = z.infer<typeof clickPageCreateSchema>;
export type ClickPageUpdateInput = z.infer<typeof clickPageUpdateSchema>;
export type ClickEventInput = z.infer<typeof clickEventSchema>;
export type ConversionEventInput = z.infer<typeof conversionEventSchema>;
export type ClickPageFilter = z.infer<typeof clickPageFilterSchema>;
