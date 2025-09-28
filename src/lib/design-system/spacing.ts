/**
 * Spacing System - JRM E-commerce Platform
 * Centralized spacing utilities following 8px grid system
 * Based on design tokens and ECOMMERCE_UI_IMPROVEMENT_PLAN.md
 */

import { designTokens } from './tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spacing scale based on 8px grid system
export const spacingScale = {
  // Base spacing units (following 8px grid)
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem'       // 384px
} as const;

// Semantic spacing utilities
export const semanticSpacing = {
  // Component spacing
  component: {
    xs: 'space-y-2',    // 8px
    sm: 'space-y-3',    // 12px
    md: 'space-y-4',    // 16px
    lg: 'space-y-6',    // 24px
    xl: 'space-y-8'     // 32px
  },

  // Section spacing
  section: {
    xs: 'py-8',         // 32px
    sm: 'py-12',        // 48px
    md: 'py-16',        // 64px
    lg: 'py-20',        // 80px
    xl: 'py-24'         // 96px
  },

  // Container padding
  container: {
    xs: 'px-4',         // 16px
    sm: 'px-6',         // 24px
    md: 'px-8',         // 32px
    lg: 'px-12',        // 48px
    xl: 'px-16'         // 64px
  },

  // Grid gaps
  grid: {
    xs: 'gap-2',        // 8px
    sm: 'gap-3',        // 12px
    md: 'gap-4',        // 16px
    lg: 'gap-6',        // 24px
    xl: 'gap-8'         // 32px
  },

  // Form spacing
  form: {
    field: 'space-y-2',      // 8px between label and input
    group: 'space-y-4',      // 16px between form groups
    section: 'space-y-6'     // 24px between form sections
  },

  // Card spacing
  card: {
    padding: {
      xs: 'p-3',        // 12px
      sm: 'p-4',        // 16px
      md: 'p-6',        // 24px
      lg: 'p-8',        // 32px
      xl: 'p-10'        // 40px
    },
    content: 'space-y-3'     // 12px between card content
  },

  // Button spacing
  button: {
    padding: {
      xs: 'px-2 py-1',      // 8px x 4px
      sm: 'px-3 py-1.5',    // 12px x 6px
      md: 'px-4 py-2',      // 16px x 8px
      lg: 'px-6 py-2.5',    // 24px x 10px
      xl: 'px-8 py-3'       // 32px x 12px
    },
    gap: 'gap-2'             // 8px gap between button elements
  }
};

// Layout spacing patterns
export const layoutSpacing = {
  // Header spacing
  header: {
    height: 'h-16',          // 64px
    padding: 'px-4 lg:px-6', // Responsive padding
    gap: 'gap-4'             // 16px gap between header elements
  },

  // Navigation spacing
  nav: {
    gap: 'gap-6',            // 24px between nav items
    mobile: 'space-y-2',     // 8px in mobile menu
    dropdown: 'py-2'         // 8px padding in dropdowns
  },

  // Hero section spacing
  hero: {
    padding: 'py-20 lg:py-32', // Responsive hero padding
    content: 'space-y-6',      // 24px between hero content
    cta: 'gap-4'               // 16px between CTA buttons
  },

  // Product grid spacing
  productGrid: {
    gap: 'gap-4 lg:gap-6',     // Responsive grid gap
    card: 'space-y-3'          // 12px between card elements
  },

  // Footer spacing
  footer: {
    padding: 'py-16',          // 64px footer padding
    sections: 'space-y-8',     // 32px between footer sections
    links: 'space-y-2'         // 8px between footer links
  }
};

// Responsive spacing utilities
export const responsiveSpacing = {
  // Breakpoint-specific spacing
  mobile: {
    section: 'py-8',           // 32px on mobile
    container: 'px-4',         // 16px on mobile
    grid: 'gap-4'              // 16px grid gap on mobile
  },

  tablet: {
    section: 'md:py-12',       // 48px on tablet
    container: 'md:px-6',      // 24px on tablet
    grid: 'md:gap-5'           // 20px grid gap on tablet
  },

  desktop: {
    section: 'lg:py-16',       // 64px on desktop
    container: 'lg:px-8',      // 32px on desktop
    grid: 'lg:gap-6'           // 24px grid gap on desktop
  },

  // Combined responsive spacing
  combined: {
    section: 'py-8 md:py-12 lg:py-16',
    container: 'px-4 md:px-6 lg:px-8',
    grid: 'gap-4 md:gap-5 lg:gap-6'
  }
};

// Spacing utility functions
export const spacing = {
  // Get spacing value by key
  get: (key: keyof typeof spacingScale): string => {
    return spacingScale[key];
  },

  // Get semantic spacing
  getSemantic: (category: keyof typeof semanticSpacing, size: string): string => {
    const categorySpacing = semanticSpacing[category];
    if (typeof categorySpacing === 'object' && size in categorySpacing) {
      return categorySpacing[size as keyof typeof categorySpacing];
    }
    return '';
  },

  // Compose spacing classes
  compose: (...classes: string[]): string => {
    return cn(...classes);
  },

  // Generate margin classes
  margin: {
    all: (size: keyof typeof spacingScale) => `m-${size}`,
    x: (size: keyof typeof spacingScale) => `mx-${size}`,
    y: (size: keyof typeof spacingScale) => `my-${size}`,
    top: (size: keyof typeof spacingScale) => `mt-${size}`,
    right: (size: keyof typeof spacingScale) => `mr-${size}`,
    bottom: (size: keyof typeof spacingScale) => `mb-${size}`,
    left: (size: keyof typeof spacingScale) => `ml-${size}`
  },

  // Generate padding classes
  padding: {
    all: (size: keyof typeof spacingScale) => `p-${size}`,
    x: (size: keyof typeof spacingScale) => `px-${size}`,
    y: (size: keyof typeof spacingScale) => `py-${size}`,
    top: (size: keyof typeof spacingScale) => `pt-${size}`,
    right: (size: keyof typeof spacingScale) => `pr-${size}`,
    bottom: (size: keyof typeof spacingScale) => `pb-${size}`,
    left: (size: keyof typeof spacingScale) => `pl-${size}`
  },

  // Generate gap classes
  gap: (size: keyof typeof spacingScale) => `gap-${size}`,
  gapX: (size: keyof typeof spacingScale) => `gap-x-${size}`,
  gapY: (size: keyof typeof spacingScale) => `gap-y-${size}`,

  // Generate space classes
  spaceX: (size: keyof typeof spacingScale) => `space-x-${size}`,
  spaceY: (size: keyof typeof spacingScale) => `space-y-${size}`
};

// Component-specific spacing helpers
export const componentSpacing = {
  // Product card spacing
  productCard: () => cn(
    semanticSpacing.card.padding.md,
    semanticSpacing.card.content,
    'group'
  ),

  // Section header spacing
  sectionHeader: () => cn(
    'mb-8 lg:mb-12',
    semanticSpacing.component.md
  ),

  // Form field spacing
  formField: () => cn(
    semanticSpacing.form.field,
    'mb-4'
  ),

  // Button group spacing
  buttonGroup: () => cn(
    'flex',
    semanticSpacing.button.gap,
    'items-center'
  ),

  // Navigation spacing
  navItem: () => cn(
    semanticSpacing.button.padding.sm,
    'rounded-md'
  )
};

// Export types
export type SpacingKey = keyof typeof spacingScale;
export type SemanticSpacingCategory = keyof typeof semanticSpacing;
export type LayoutSpacingCategory = keyof typeof layoutSpacing;