/**
 * Click Page Constants - Single Source of Truth
 * All click page-related constants and configurations
 */

import type { BlockType } from '@/types/click-page.types';

export const CLICK_PAGE_CONSTANTS = {
  // ============================================================================
  // Status Configuration
  // ============================================================================
  STATUS: {
    DRAFT: {
      value: 'DRAFT',
      label: 'Draft',
      color: 'gray',
      icon: 'FileEdit',
      description: 'Not visible to public',
    },
    PUBLISHED: {
      value: 'PUBLISHED',
      label: 'Published',
      color: 'green',
      icon: 'Globe',
      description: 'Live and visible to public',
    },
    SCHEDULED: {
      value: 'SCHEDULED',
      label: 'Scheduled',
      color: 'blue',
      icon: 'Clock',
      description: 'Scheduled for future publication',
    },
  },

  // ============================================================================
  // Validation Rules
  // ============================================================================
  VALIDATION: {
    TITLE_MIN_LENGTH: 3, // Reduced for draft flexibility
    TITLE_MAX_LENGTH: 200,
    SLUG_MAX_LENGTH: 200,
    META_TITLE_MAX_LENGTH: 200,
    META_DESCRIPTION_MAX_LENGTH: 300,
    CAMPAIGN_NAME_MAX_LENGTH: 100,
    MAX_BLOCKS: 50, // Maximum blocks per page
    MIN_BLOCKS: 0, // Allow empty drafts - blocks required only at publish time
  },

  // ============================================================================
  // Routes
  // ============================================================================
  ROUTES: {
    // Admin Routes
    ADMIN_LIST: '/admin/click-pages',
    ADMIN_CREATE: '/admin/click-pages/create',
    ADMIN_EDIT: '/admin/click-pages/[id]/edit',
    ADMIN_ANALYTICS: '/admin/click-pages/[id]/analytics',

    // API Routes
    API_ADMIN: '/api/admin/click-pages',
    API_PUBLIC: '/api/public/click-pages',
    API_ANALYTICS: '/api/admin/click-pages/[id]/analytics',
    API_TRACK_VIEW: '/api/public/click-pages/[slug]/track/view',
    API_TRACK_CLICK: '/api/public/click-pages/[slug]/track/click',
    API_TRACK_CONVERSION: '/api/public/click-pages/[slug]/track/conversion',

    // Public Routes
    PUBLIC_VIEW: '/click',
    PUBLIC_VIEW_SINGLE: '/click/[slug]',
  },

  // ============================================================================
  // Block System
  // ============================================================================
  BLOCKS: {
    // Block Categories
    CATEGORIES: {
      CONTENT: {
        value: 'content',
        label: 'Content',
        description: 'Text and rich content blocks',
      },
      MEDIA: {
        value: 'media',
        label: 'Media',
        description: 'Images and visual elements',
      },
      CTA: {
        value: 'cta',
        label: 'Call to Action',
        description: 'Buttons and conversion elements',
      },
      SOCIAL: {
        value: 'social',
        label: 'Social Proof',
        description: 'Testimonials, reviews, and trust signals',
      },
      LAYOUT: {
        value: 'layout',
        label: 'Layout',
        description: 'Spacing and structural elements',
      },
    },

    // Block Types
    TYPES: {
      HERO: {
        type: 'HERO' as BlockType,
        label: 'Hero Section',
        description: 'Large banner with title, CTA, and optional countdown',
        icon: 'Sparkles',
        category: 'cta',
      },
      TEXT: {
        type: 'TEXT' as BlockType,
        label: 'Text Block',
        description: 'Rich text content with formatting',
        icon: 'Type',
        category: 'content',
      },
      CTA_BUTTON: {
        type: 'CTA_BUTTON' as BlockType,
        label: 'CTA Button',
        description: 'Call-to-action button',
        icon: 'MousePointer2',
        category: 'cta',
      },
      IMAGE: {
        type: 'IMAGE' as BlockType,
        label: 'Image',
        description: 'Image with optional caption and link',
        icon: 'Image',
        category: 'media',
      },
      SPACER: {
        type: 'SPACER' as BlockType,
        label: 'Spacer',
        description: 'Vertical spacing',
        icon: 'SeparatorVertical',
        category: 'layout',
      },
      DIVIDER: {
        type: 'DIVIDER' as BlockType,
        label: 'Divider',
        description: 'Visual separator line',
        icon: 'Minus',
        category: 'layout',
      },
      PRICING_TABLE: {
        type: 'PRICING_TABLE' as BlockType,
        label: 'Pricing Table',
        description: 'Product pricing with tiers',
        icon: 'DollarSign',
        category: 'cta',
      },
      TESTIMONIAL: {
        type: 'TESTIMONIAL' as BlockType,
        label: 'Testimonial',
        description: 'Customer reviews and testimonials',
        icon: 'MessageSquareQuote',
        category: 'social',
      },
      COUNTDOWN_TIMER: {
        type: 'COUNTDOWN_TIMER' as BlockType,
        label: 'Countdown Timer',
        description: 'Urgency timer for promotions',
        icon: 'Timer',
        category: 'cta',
      },
      SOCIAL_PROOF: {
        type: 'SOCIAL_PROOF' as BlockType,
        label: 'Social Proof',
        description: 'Stats, badges, and trust signals',
        icon: 'Award',
        category: 'social',
      },
      VIDEO: {
        type: 'VIDEO' as BlockType,
        label: 'Video',
        description: 'Embed YouTube, Vimeo, or self-hosted video',
        icon: 'Video',
        category: 'media',
      },
      FORM: {
        type: 'FORM' as BlockType,
        label: 'Form',
        description: 'Lead capture and contact forms',
        icon: 'FormInput',
        category: 'cta',
      },
      IMAGE_GALLERY: {
        type: 'IMAGE_GALLERY' as BlockType,
        label: 'Image Gallery',
        description: 'Carousel or grid of multiple images',
        icon: 'Images',
        category: 'media',
      },
      EMBED: {
        type: 'EMBED' as BlockType,
        label: 'Embed',
        description: 'External content via iframe or custom code',
        icon: 'Code2',
        category: 'media',
      },
      ACCORDION: {
        type: 'ACCORDION' as BlockType,
        label: 'Accordion',
        description: 'Collapsible FAQ or content sections',
        icon: 'ChevronDown',
        category: 'content',
      },
    },

    // Default Settings for Each Block Type
    DEFAULT_SETTINGS: {
      HERO: {
        title: 'Welcome to Our Store',
        subtitle: 'Limited Time Offer',
        description: 'Get amazing deals on our products',
        backgroundImage: '',
        overlayOpacity: 0.3,
        textAlignment: 'center' as const,
        ctaText: 'Shop Now',
        ctaUrl: '/products',
        showCountdown: false,
      },
      TEXT: {
        content: '<p>Enter your text here...</p>',
        textAlign: 'left' as const,
      },
      CTA_BUTTON: {
        text: 'Click Here',
        url: '/products',
        variant: 'default' as const,
        size: 'default' as const,
        alignment: 'center' as const,
        openInNewTab: false,
      },
      IMAGE: {
        url: '',
        altText: 'Image',
        alignment: 'center' as const,
        width: 'full' as const,
        rounded: false,
      },
      SPACER: {
        height: 40,
      },
      DIVIDER: {
        style: 'solid' as const,
        color: '#e5e7eb',
        thickness: 1,
        spacing: 20,
      },
      PRICING_TABLE: {
        tiers: [],
        layout: 'horizontal' as const,
        showComparison: true,
      },
      TESTIMONIAL: {
        testimonials: [],
        layout: 'single' as const,
        showRatings: true,
        showImages: true,
      },
      COUNTDOWN_TIMER: {
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
      SOCIAL_PROOF: {
        type: 'stats' as const,
        layout: 'horizontal' as const,
      },
      VIDEO: {
        videoType: 'youtube' as const,
        autoplay: false,
        loop: false,
        muted: false,
        controls: true,
        aspectRatio: '16:9' as const,
        rounded: true,
      },
      FORM: {
        fields: [],
        submitButtonText: 'Submit',
        submitButtonVariant: 'default' as const,
        successMessage: 'Thank you! Your submission has been received.',
      },
      IMAGE_GALLERY: {
        images: [],
        layout: 'carousel' as const,
        columns: 3 as const,
        showCaptions: true,
        showNavigation: true,
        autoplay: false,
        autoplayInterval: 5000,
        lightbox: true,
        rounded: true,
      },
      EMBED: {
        embedType: 'iframe' as const,
        height: 500,
        width: 'full' as const,
        allowFullscreen: true,
        allowScripts: false,
      },
      ACCORDION: {
        items: [],
        allowMultipleOpen: false,
        showIcons: true,
        iconPosition: 'right' as const,
        animationDuration: 300,
      },
    },
  },

  // ============================================================================
  // Analytics Configuration
  // ============================================================================
  ANALYTICS: {
    // Session duration for tracking (30 minutes)
    SESSION_DURATION_MS: 30 * 60 * 1000,

    // Click tracking batch size
    CLICK_BATCH_SIZE: 10,

    // Analytics refresh interval (5 minutes)
    REFRESH_INTERVAL_MS: 5 * 60 * 1000,

    // Conversion window (30 days)
    CONVERSION_WINDOW_DAYS: 30,
  },

  // ============================================================================
  // UI Configuration
  // ============================================================================
  UI: {
    // Pagination
    CLICK_PAGES_PER_PAGE: 12,

    // Search debounce
    SEARCH_DEBOUNCE_MS: 300,

    // Block editor
    BLOCK_DRAG_HANDLE_SIZE: 24,
    BLOCK_MIN_HEIGHT: 50,

    // Image upload
    MAX_IMAGE_SIZE_MB: 10,
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ACCEPTED_MIME_TYPES: 'image/jpeg,image/png,image/webp',

    // Auto-save interval
    AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds
  },

  // ============================================================================
  // Campaign Configuration
  // ============================================================================
  CAMPAIGN: {
    // Default campaign duration (7 days)
    DEFAULT_DURATION_DAYS: 7,

    // Maximum campaign duration (90 days)
    MAX_DURATION_DAYS: 90,

    // Countdown timer warning threshold (24 hours)
    COUNTDOWN_WARNING_HOURS: 24,
  },

  // ============================================================================
  // SEO Configuration
  // ============================================================================
  SEO: {
    // Default meta values
    DEFAULT_META_TITLE_SUFFIX: ' | JRM E-commerce',
    DEFAULT_OG_IMAGE_WIDTH: 1200,
    DEFAULT_OG_IMAGE_HEIGHT: 630,

    // Structured data types
    STRUCTURED_DATA_TYPE: 'WebPage',
  },
} as const;

// ============================================================================
// Type Helpers
// ============================================================================

export type ClickPageStatusValue = keyof typeof CLICK_PAGE_CONSTANTS.STATUS;
export type BlockCategory = keyof typeof CLICK_PAGE_CONSTANTS.BLOCKS.CATEGORIES;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate URL-friendly slug from title
 * @param title Click page title
 * @returns URL-safe slug
 */
export function generateClickPageSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, CLICK_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Generate unique block ID
 * @returns Unique block ID
 */
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate conversion rate
 * @param conversions Number of conversions
 * @param views Number of views
 * @returns Conversion rate percentage
 */
export function calculateConversionRate(conversions: number, views: number): number {
  if (views === 0) return 0;
  return Number(((conversions / views) * 100).toFixed(2));
}

/**
 * Check if a campaign is active
 * @param startDate Campaign start date
 * @param endDate Campaign end date
 * @returns Whether campaign is currently active
 */
export function isCampaignActive(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
): boolean {
  const now = new Date();

  // If no dates, campaign is not scheduled
  if (!startDate && !endDate) return true;

  // Check if within date range
  const isAfterStart = !startDate || now >= startDate;
  const isBeforeEnd = !endDate || now <= endDate;

  return isAfterStart && isBeforeEnd;
}

/**
 * Get block definition by type
 * @param type Block type
 * @returns Block definition
 */
export function getBlockDefinition(type: BlockType) {
  return CLICK_PAGE_CONSTANTS.BLOCKS.TYPES[type];
}

/**
 * Get default settings for a block type
 * @param type Block type
 * @returns Default settings object
 */
export function getDefaultBlockSettings(type: BlockType) {
  return CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS[type];
}

/**
 * Get blocks by category
 * @param category Block category
 * @returns Array of block types in the category
 */
export function getBlocksByCategory(category: BlockCategory): BlockType[] {
  const categoryValue = CLICK_PAGE_CONSTANTS.BLOCKS.CATEGORIES[category].value;

  return Object.values(CLICK_PAGE_CONSTANTS.BLOCKS.TYPES)
    .filter((block) => block.category === categoryValue)
    .map((block) => block.type);
}
