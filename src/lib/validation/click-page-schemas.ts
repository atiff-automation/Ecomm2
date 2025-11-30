/**
 * Click Page Validation Schemas
 * Zod schemas for runtime validation of Click Page data
 */

import { z } from 'zod';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

// ============================================================================
// Style Settings Schemas
// ============================================================================

/**
 * Typography Settings Schema
 */
const typographySettingsSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(['100', '200', '300', '400', '500', '600', '700', '800', '900']).optional(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  color: z.string().optional(),
}).optional();

/**
 * Background Settings Schema
 */
const backgroundSettingsSchema = z.object({
  type: z.enum(['none', 'solid', 'gradient', 'image', 'video']).optional(),
  color: z.string().optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']).optional(),
    direction: z.enum([
      'to right', 'to left', 'to top', 'to bottom',
      'to top right', 'to bottom right', 'to top left', 'to bottom left'
    ]).optional(),
    colors: z.array(z.object({
      color: z.string(),
      position: z.number().min(0).max(100),
    })).optional(),
  }).optional(),
  image: z.object({
    url: z.string(),
    alt: z.string().optional(),
    position: z.string().optional(),
    size: z.enum(['cover', 'contain', 'auto']).optional(),
    repeat: z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y']).optional(),
    attachment: z.enum(['scroll', 'fixed']).optional(),
    overlay: z.object({
      color: z.string(),
      opacity: z.number().min(0).max(1),
    }).optional(),
  }).optional(),
  video: z.object({
    url: z.string(),
    posterImage: z.string().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    overlay: z.object({
      color: z.string(),
      opacity: z.number().min(0).max(1),
    }).optional(),
  }).optional(),
}).optional();

/**
 * Spacing Settings Schema
 */
const spacingSettingsSchema = z.object({
  padding: z.object({
    top: z.number().min(0).optional(),
    right: z.number().min(0).optional(),
    bottom: z.number().min(0).optional(),
    left: z.number().min(0).optional(),
    locked: z.boolean().optional(),
  }).optional(),
  margin: z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
    locked: z.boolean().optional(),
  }).optional(),
}).optional();

/**
 * Border Settings Schema
 */
const borderSettingsSchema = z.object({
  width: z.object({
    top: z.number().min(0).optional(),
    right: z.number().min(0).optional(),
    bottom: z.number().min(0).optional(),
    left: z.number().min(0).optional(),
    locked: z.boolean().optional(),
  }).optional(),
  style: z.enum(['none', 'solid', 'dashed', 'dotted', 'double']).optional(),
  color: z.string().optional(),
  radius: z.object({
    topLeft: z.number().min(0).optional(),
    topRight: z.number().min(0).optional(),
    bottomRight: z.number().min(0).optional(),
    bottomLeft: z.number().min(0).optional(),
    locked: z.boolean().optional(),
  }).optional(),
}).optional();

/**
 * Effect Settings Schema
 */
const effectSettingsSchema = z.object({
  boxShadow: z.object({
    enabled: z.boolean().optional(),
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    blur: z.number().min(0).optional(),
    spread: z.number().optional(),
    color: z.string().optional(),
    inset: z.boolean().optional(),
  }).optional(),
  textShadow: z.object({
    enabled: z.boolean().optional(),
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    blur: z.number().min(0).optional(),
    color: z.string().optional(),
  }).optional(),
  opacity: z.number().min(0).max(1).optional(),
  blur: z.number().min(0).optional(),
}).optional();

/**
 * Hover Effects Schema
 */
const hoverEffectsSchema = z.object({
  enabled: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
  scale: z.number().positive().optional(),
  translateY: z.number().optional(),
  boxShadow: z.object({
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    blur: z.number().min(0).optional(),
    spread: z.number().optional(),
    color: z.string().optional(),
  }).optional(),
  transition: z.object({
    duration: z.number().positive().optional(),
    easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
  }).optional(),
}).optional();

/**
 * Responsive Settings Schema
 */
const responsiveSettingsSchema = z.object({
  mobile: z.object({
    hidden: z.boolean().optional(),
    overrides: z.any().optional(),
  }).optional(),
  tablet: z.object({
    hidden: z.boolean().optional(),
    overrides: z.any().optional(),
  }).optional(),
  desktop: z.object({
    hidden: z.boolean().optional(),
    overrides: z.any().optional(),
  }).optional(),
}).optional();

/**
 * Animation Settings Schema
 */
const animationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  type: z.enum([
    'none', 'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight',
    'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight',
    'zoomIn', 'bounce', 'pulse'
  ]).optional(),
  trigger: z.enum(['onLoad', 'onScroll', 'onHover']).optional(),
  duration: z.number().positive().optional(),
  delay: z.number().min(0).optional(),
  easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
  repeat: z.boolean().optional(),
  repeatCount: z.number().min(0).optional(),
}).optional();

/**
 * Advanced Settings Schema
 */
const advancedSettingsSchema = z.object({
  customCSS: z.string().optional(),
  customClasses: z.array(z.string()).optional(),
  zIndex: z.number().optional(),
  display: z.enum(['block', 'flex', 'grid', 'inline', 'inline-block', 'none']).optional(),
  position: z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky']).optional(),
  overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
}).optional();

/**
 * Complete Style Settings Schema
 * Contains all styling capabilities for a block
 */
export const styleSettingsSchema = z.object({
  typography: typographySettingsSchema,
  background: backgroundSettingsSchema,
  spacing: spacingSettingsSchema,
  border: borderSettingsSchema,
  effects: effectSettingsSchema,
  hover: hoverEffectsSchema,
  responsive: responsiveSettingsSchema,
  animation: animationSettingsSchema,
  advanced: advancedSettingsSchema,
}).optional();

// ============================================================================
// Block-Specific Schemas
// ============================================================================

/**
 * Image URL Schema - accepts full URLs or relative paths
 * Used for all image URL fields that might receive uploads (relative paths like /uploads/...)
 */
const imageUrlSchema = z.preprocess(
  (val) => (val === '' || val === null) ? undefined : val,
  z.string().refine(
    (val) => val === undefined || val.startsWith('/') || /^https?:\/\//.test(val),
    { message: 'Must be a valid URL or relative path starting with /' }
  ).optional()
);

/**
 * Required Image URL Schema - for fields that require an image
 */
const requiredImageUrlSchema = z.preprocess(
  (val) => (val === '' || val === null) ? undefined : val,
  z.string().refine(
    (val) => val === undefined || val.startsWith('/') || /^https?:\/\//.test(val),
    { message: 'Must be a valid URL or relative path starting with /' }
  )
);

/**
 * Image URL with empty string support - accepts full URLs, relative paths, or empty string
 */
const imageUrlOrEmptySchema = z.string().refine(
  (val) => val === '' || val.startsWith('/') || /^https?:\/\//.test(val),
  { message: 'Must be a valid URL, relative path, or empty' }
);

/**
 * Hero Block Settings Schema
 */
export const heroBlockSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  backgroundImage: imageUrlOrEmptySchema.optional(),
  backgroundVideo: imageUrlOrEmptySchema.optional(),
  overlayOpacity: z.number().min(0).max(1),
  textAlignment: z.enum(['left', 'center', 'right']),
  ctaText: z.string().min(1, 'CTA text is required').max(100),
  ctaUrl: z.string().min(1, 'CTA URL is required'),
  showCountdown: z.boolean(),
  countdownEndDate: z.coerce.date().optional(),
  countdownLabel: z.string().max(100).optional(),
  styles: styleSettingsSchema,
});

/**
 * Text Block Settings Schema
 */
export const textBlockSettingsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  textAlign: z.enum(['left', 'center', 'right', 'justify']),
  maxWidth: z.number().positive().optional(),
  styles: styleSettingsSchema,
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
  styles: styleSettingsSchema,
});

/**
 * Image Block Settings Schema
 */
export const imageBlockSettingsSchema = z.object({
  url: imageUrlOrEmptySchema, // Allow empty - can be configured later
  altText: z.string().max(200).default(''), // Allow empty for initial creation
  caption: z.string().max(300).optional(),
  link: imageUrlOrEmptySchema.optional(),
  alignment: z.enum(['left', 'center', 'right']),
  width: z.enum(['full', 'large', 'medium', 'small']),
  rounded: z.boolean(),
  styles: styleSettingsSchema,
});

/**
 * Spacer Block Settings Schema
 */
export const spacerBlockSettingsSchema = z.object({
  height: z.number().min(10).max(500),
  styles: styleSettingsSchema,
});

/**
 * Divider Block Settings Schema
 */
export const dividerBlockSettingsSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  thickness: z.number().min(1).max(10),
  spacing: z.number().min(0).max(100),
  styles: styleSettingsSchema,
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
  imageUrl: imageUrlSchema,
});

/**
 * Pricing Table Block Settings Schema
 */
export const pricingTableBlockSettingsSchema = z.object({
  tiers: z.array(pricingTierSchema).max(5), // Allow empty - can be configured later
  layout: z.enum(['horizontal', 'vertical']),
  showComparison: z.boolean(),
  styles: styleSettingsSchema,
});

/**
 * Testimonial Item Schema
 */
export const testimonialItemSchema = z.object({
  id: z.string().min(1),
  quote: z.string().min(1, 'Quote is required').max(500),
  authorName: z.string().min(1, 'Author name is required').max(100),
  authorTitle: z.string().max(100).optional(),
  authorImage: imageUrlSchema,
  rating: z.number().min(1).max(5).optional(),
});

/**
 * Testimonial Block Settings Schema
 */
export const testimonialBlockSettingsSchema = z.object({
  testimonials: z.array(testimonialItemSchema).max(10), // Allow empty - can be configured later
  layout: z.enum(['single', 'carousel', 'grid']),
  showRatings: z.boolean(),
  showImages: z.boolean(),
  styles: styleSettingsSchema,
});

/**
 * Countdown Timer Block Settings Schema
 */
export const countdownTimerBlockSettingsSchema = z.object({
  endDate: z.coerce.date(), // Removed future date requirement - validation happens at publish time
  title: z.string().max(200).optional(),
  message: z.string().max(300).optional(),
  showDays: z.boolean(),
  showHours: z.boolean(),
  showMinutes: z.boolean(),
  showSeconds: z.boolean(),
  expiredMessage: z.string().max(200).optional(),
  styles: styleSettingsSchema,
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
    imageUrl: requiredImageUrlSchema,
    altText: z.string().min(1).max(200),
  })).optional(),
  reviews: z.object({
    totalReviews: z.number().min(0),
    averageRating: z.number().min(0).max(5),
    showStars: z.boolean(),
    images: z.array(z.string().refine(
      (val) => val.startsWith('/') || /^https?:\/\//.test(val),
      { message: 'Must be a valid URL or relative path' }
    )).max(10),
  }).optional(),
  layout: z.enum(['horizontal', 'vertical', 'grid']),
  styles: styleSettingsSchema,
});

/**
 * Video Block Settings Schema
 */
export const videoBlockSettingsSchema = z.object({
  videoType: z.enum(['youtube', 'vimeo', 'self-hosted']),
  youtubeId: z.string().max(100).optional(),
  vimeoId: z.string().max(100).optional(),
  selfHostedUrl: imageUrlOrEmptySchema.optional(),
  selfHostedFilename: z.string().optional(),
  thumbnailUrl: imageUrlOrEmptySchema.optional(),
  autoplay: z.boolean(),
  loop: z.boolean(),
  muted: z.boolean(),
  controls: z.boolean(),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '21:9', 'auto']),
  caption: z.string().max(300).optional(),
  rounded: z.boolean(),
  styles: styleSettingsSchema,
});

/**
 * Form Field Schema
 */
export const formFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string().min(1, 'Field label is required').max(100),
  placeholder: z.string().max(200).optional(),
  required: z.boolean(),
  options: z.array(z.string().max(200)).optional(),
  validation: z.object({
    pattern: z.string().optional(),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

/**
 * Form Block Settings Schema
 */
export const formBlockSettingsSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  fields: z.array(formFieldSchema).min(1, 'At least one field is required').max(20, 'Maximum 20 fields allowed'),
  submitButtonText: z.string().min(1, 'Submit button text is required').max(50),
  submitButtonVariant: z.enum(['default', 'outline', 'ghost']),
  successMessage: z.string().min(1, 'Success message is required').max(300),
  redirectUrl: z.string().url().optional().or(z.literal('')),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  emailNotification: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().email()).max(10, 'Maximum 10 recipients'),
    subject: z.string().min(1).max(200),
  }).optional(),
  styles: styleSettingsSchema,
});

/**
 * Gallery Image Schema
 */
export const galleryImageSchema = z.object({
  id: z.string().min(1),
  url: requiredImageUrlSchema,
  altText: z.string().min(1, 'Alt text is required').max(200),
  caption: z.string().max(300).optional(),
  link: z.string().url().optional().or(z.literal('')),
});

/**
 * Image Gallery Block Settings Schema
 */
export const imageGalleryBlockSettingsSchema = z.object({
  images: z.array(galleryImageSchema).max(50, 'Maximum 50 images allowed'),
  layout: z.enum(['carousel', 'grid', 'masonry']),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  showCaptions: z.boolean(),
  showNavigation: z.boolean(),
  autoplay: z.boolean(),
  autoplayInterval: z.number().min(1000).max(30000),
  lightbox: z.boolean(),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', 'original']).optional(),
  styles: styleSettingsSchema,
});

/**
 * Embed Block Settings Schema
 */
export const embedBlockSettingsSchema = z.object({
  embedType: z.enum(['iframe', 'custom']),
  iframeUrl: z.string().url().optional().or(z.literal('')),
  embedCode: z.string().max(5000).optional(),
  height: z.number().min(100).max(2000),
  width: z.union([
    z.enum(['full', 'large', 'medium', 'small']),
    z.number().min(100).max(2000)
  ]),
  allowFullscreen: z.boolean(),
  allowScripts: z.boolean(),
  title: z.string().max(200).optional(),
  caption: z.string().max(300).optional(),
  styles: styleSettingsSchema,
});

/**
 * Accordion Item Schema
 */
export const accordionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  isOpenByDefault: z.boolean(),
  icon: z.string().max(50).optional(),
});

/**
 * Accordion Block Settings Schema
 */
export const accordionBlockSettingsSchema = z.object({
  items: z.array(accordionItemSchema).min(1, 'At least one item is required').max(20, 'Maximum 20 items allowed'),
  allowMultipleOpen: z.boolean(),
  showIcons: z.boolean(),
  iconPosition: z.enum(['left', 'right']),
  animationDuration: z.number().min(0).max(1000),
  styles: styleSettingsSchema,
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
    'VIDEO',
    'FORM',
    'IMAGE_GALLERY',
    'EMBED',
    'ACCORDION',
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
  baseBlockSchema.extend({
    type: z.literal('VIDEO'),
    settings: videoBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('FORM'),
    settings: formBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('IMAGE_GALLERY'),
    settings: imageGalleryBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('EMBED'),
    settings: embedBlockSettingsSchema,
  }),
  baseBlockSchema.extend({
    type: z.literal('ACCORDION'),
    settings: accordionBlockSettingsSchema,
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
// Theme Settings Schema
// ============================================================================

/**
 * Brand Colors Schema
 */
export const brandColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  error: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

/**
 * Global Fonts Schema
 */
export const globalFontsSchema = z.object({
  heading: z.string().min(1, 'Heading font is required'),
  body: z.string().min(1, 'Body font is required'),
  monospace: z.string().optional(),
});

/**
 * Theme Settings Schema - Page-level styling configuration
 */
/**
 * Container Padding Schema
 * Validates per-side padding with link toggle
 */
export const containerPaddingSchema = z.object({
  linked: z.boolean(),
  top: z.number().min(0).max(200),
  right: z.number().min(0).max(200),
  bottom: z.number().min(0).max(200),
  left: z.number().min(0).max(200),
});

export const themeSettingsSchema = z.object({
  colors: brandColorsSchema,
  fonts: globalFontsSchema,
  defaultSpacing: z.object({
    blockGap: z.number().min(0).max(200),
    containerPadding: containerPaddingSchema,
  }).optional(),
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

  // Theme Settings
  themeSettings: themeSettingsSchema,
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

  // Theme Settings
  themeSettings: themeSettingsSchema,
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
// Form Submission Schema
// ============================================================================

export const formSubmissionSchema = z.object({
  blockId: z.string().min(1, 'Block ID is required'),
  data: z.record(z.string(), z.unknown()),
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
export type FormSubmissionInput = z.infer<typeof formSubmissionSchema>;
export type ClickPageFilter = z.infer<typeof clickPageFilterSchema>;
