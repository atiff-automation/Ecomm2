/**
 * Click Page Block Width Constants
 * Single Source of Truth for block width standards
 *
 * Based on UX research and industry best practices:
 * - Narrow: Optimal for forms and focused interactions (50-60 chars/line)
 * - Standard: Default for most content blocks (65-75 chars/line)
 * - Wide: For comparison/grid layouts requiring horizontal space
 * - Full: Full-width for visual impact (media, dividers)
 */

/**
 * Block width tiers following Tailwind's max-width scale
 */
export const BLOCK_WIDTH_CLASSES = {
  /** 672px - Optimal for forms, timers, single testimonials */
  NARROW: 'max-w-2xl',

  /** 896px - Default for most content (text, accordions, heroes, social proof) */
  STANDARD: 'max-w-4xl',

  /** 1152px - Wide layouts for pricing tables, testimonial grids */
  WIDE: 'max-w-6xl',

  /** 100% - Full width for media, dividers, spacers */
  FULL: 'w-full',
} as const;

/**
 * Pixel values for blocks that use inline styles
 */
export const BLOCK_WIDTH_PX = {
  /** 672px in pixels */
  NARROW: 672,

  /** 896px in pixels */
  STANDARD: 896,

  /** 1152px in pixels */
  WIDE: 1152,
} as const;

/**
 * Block width assignment by block type
 * Defines which width tier each block type should use by default
 */
export const BLOCK_WIDTH_DEFAULTS = {
  // Narrow blocks (max-w-2xl / 672px)
  FORM: BLOCK_WIDTH_CLASSES.NARROW,
  COUNTDOWN_TIMER: BLOCK_WIDTH_CLASSES.NARROW,

  // Standard blocks (max-w-4xl / 896px)
  TEXT: BLOCK_WIDTH_CLASSES.STANDARD,
  HERO: BLOCK_WIDTH_CLASSES.STANDARD,
  ACCORDION: BLOCK_WIDTH_CLASSES.STANDARD,
  CTA_BUTTON: BLOCK_WIDTH_CLASSES.STANDARD,
  SOCIAL_PROOF: BLOCK_WIDTH_CLASSES.STANDARD,
  IMAGE_GALLERY_CAROUSEL: BLOCK_WIDTH_CLASSES.STANDARD,

  // Wide blocks (max-w-6xl / 1152px)
  PRICING_TABLE: BLOCK_WIDTH_CLASSES.WIDE,
  TESTIMONIAL_GRID: BLOCK_WIDTH_CLASSES.WIDE,

  // Full width blocks (100%)
  VIDEO: BLOCK_WIDTH_CLASSES.FULL,
  IMAGE_GALLERY_GRID: BLOCK_WIDTH_CLASSES.FULL,
  DIVIDER: BLOCK_WIDTH_CLASSES.FULL,
  SPACER: BLOCK_WIDTH_CLASSES.FULL,
} as const;

/**
 * Helper function to get width class with mx-auto centering
 * @param widthClass - The width class from BLOCK_WIDTH_CLASSES
 * @param fullWidth - Optional override to force full width
 * @returns Combined width and centering classes
 */
export function getBlockWidthClasses(widthClass: string, fullWidth?: boolean): string {
  // If fullWidth override is enabled, use full width
  if (fullWidth) {
    return BLOCK_WIDTH_CLASSES.FULL;
  }

  // Full width blocks don't need mx-auto
  if (widthClass === BLOCK_WIDTH_CLASSES.FULL) {
    return widthClass;
  }

  // All constrained widths should be centered
  return `${widthClass} mx-auto`;
}
