/**
 * Layout Constants - Malaysian E-commerce Platform
 * Single source of truth for layout configurations
 * Following @CLAUDE.md principles - centralized constants, no hardcoding
 */

/**
 * Container configurations for consistent page layouts
 */
export const LAYOUT_CONSTANTS = {
  /** Member panel layouts */
  MEMBER: {
    /** Maximum width for focused content pages (profile, settings) */
    MAX_WIDTH: 'max-w-4xl',
    /** Outer padding for pages */
    PADDING: 'p-8',
    /** Vertical spacing between sections */
    SPACING: 'space-y-6',
    /** Grid gap for card layouts */
    GAP: 'gap-6',
  },

  /** Admin panel layouts */
  ADMIN: {
    /** Maximum width for admin pages */
    MAX_WIDTH: 'max-w-5xl',
    /** Outer padding for admin pages */
    PADDING: 'p-8',
    /** Vertical spacing between sections */
    SPACING: 'space-y-6',
    /** Grid gap for admin layouts */
    GAP: 'gap-6',
  },

  /** Card component configurations */
  CARD: {
    /** Standard card padding */
    PADDING: 'p-6',
    /** Card content spacing */
    SPACING: 'space-y-4',
    /** Card header padding */
    HEADER_PADDING: 'p-6',
  },

  /** Header configurations */
  HEADER: {
    /** Page header bottom margin */
    MARGIN_BOTTOM: 'mb-8',
    /** Header title spacing */
    TITLE_SPACING: 'gap-2',
    /** Description top margin */
    DESCRIPTION_MARGIN: 'mt-2',
  },
} as const;

/**
 * Grid configurations for responsive layouts
 */
export const GRID_CONFIGS = {
  /** Stats cards grid (4 columns on large screens) */
  STATS_GRID: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',

  /** Stats compact grid (2 columns on mobile, 4 on desktop) */
  STATS_COMPACT: 'grid grid-cols-2 md:grid-cols-4',

  /** Two column form layout */
  FORM_TWO_COLS: 'grid grid-cols-1 md:grid-cols-2',

  /** Benefits cards (2 columns on large screens) */
  BENEFITS_GRID: 'grid grid-cols-1 lg:grid-cols-2',
} as const;

/**
 * Icon sizes for consistent UI
 */
export const ICON_SIZES = {
  /** Small icon (e.g., in badges) */
  SMALL: 'w-3 h-3',
  /** Regular icon (e.g., in headers) */
  REGULAR: 'w-5 h-5',
  /** Large icon (e.g., page headers) */
  LARGE: 'w-8 h-8',
} as const;
