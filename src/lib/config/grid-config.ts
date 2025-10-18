/**
 * Grid Configuration - JRM E-commerce Platform
 * Centralized responsive grid patterns
 * Following CLAUDE.md Single Source of Truth principle
 */

/**
 * Standard responsive breakpoints
 * @see https://tailwindcss.com/docs/responsive-design
 */
export const GRID_BREAKPOINTS = {
  mobile: 0,      // 0px+
  sm: 640,        // 640px+
  md: 768,        // 768px+
  lg: 1024,       // 1024px+
  xl: 1280,       // 1280px+
  '2xl': 1536     // 1536px+
} as const;

/**
 * Grid column configurations for different use cases
 * Each configuration defines columns per breakpoint
 */
export const GRID_COLUMNS = {
  // Product grids - Standard e-commerce product display
  product: {
    mobile: 2,     // 2 columns on mobile
    sm: 2,         // 2 columns on small screens
    md: 3,         // 3 columns on tablet
    lg: 4,         // 4 columns on desktop
    xl: 5          // 5 columns on large desktop
  },

  // Compact product grid - Sidebars, recommendations
  productCompact: {
    mobile: 2,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4
  },

  // Search results - Optimized for search pages
  searchResults: {
    mobile: 2,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4
  },

  // Wishlist - Consistent with product display
  wishlist: {
    mobile: 2,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4
  },

  // Category grid - Category cards/tiles
  category: {
    mobile: 2,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6
  },

  // Feature grid - Feature highlights, benefits
  feature: {
    mobile: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3
  },

  // Blog/Article grid
  blog: {
    mobile: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3
  },

  // Testimonial grid
  testimonial: {
    mobile: 1,
    sm: 1,
    md: 1,
    lg: 2,
    xl: 2
  },

  // Form fields - Two column forms
  formTwoColumn: {
    mobile: 1,
    sm: 1,
    md: 2,
    lg: 2,
    xl: 2
  },

  // Admin dashboard cards
  adminDashboard: {
    mobile: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4
  }
} as const;

/**
 * Grid gap configurations
 * Responsive spacing between grid items
 */
export const GRID_GAPS = {
  xs: 'gap-2',              // 8px
  sm: 'gap-3',              // 12px
  md: 'gap-4',              // 16px
  lg: 'gap-6',              // 24px
  xl: 'gap-8',              // 32px
  responsive: 'gap-4 lg:gap-6'  // Responsive gap
} as const;

/**
 * Helper function to get grid configuration
 * @param gridType - Type of grid (product, category, etc.)
 * @returns Grid column configuration
 */
export function getGridConfig(gridType: keyof typeof GRID_COLUMNS) {
  return GRID_COLUMNS[gridType];
}

/**
 * Helper function to generate grid class string
 * @param gridType - Type of grid
 * @param gap - Gap size
 * @returns Tailwind class string
 */
export function getGridClasses(
  gridType: keyof typeof GRID_COLUMNS,
  gap: keyof typeof GRID_GAPS = 'md'
): string {
  const config = GRID_COLUMNS[gridType];
  const gapClass = GRID_GAPS[gap];

  const classes = [
    'grid',
    `grid-cols-${config.mobile}`,
    `sm:grid-cols-${config.sm}`,
    `md:grid-cols-${config.md}`,
    `lg:grid-cols-${config.lg}`,
    `xl:grid-cols-${config.xl}`,
    gapClass
  ];

  return classes.join(' ');
}

/**
 * Type exports for TypeScript safety
 */
export type GridType = keyof typeof GRID_COLUMNS;
export type GridGapSize = keyof typeof GRID_GAPS;
export type GridConfig = typeof GRID_COLUMNS[GridType];
