/**
 * Typography System - JRM E-commerce Platform
 * Centralized typography utilities and components
 * Based on design tokens and ECOMMERCE_UI_IMPROVEMENT_PLAN.md
 */

import { designTokens } from './tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Typography variant definitions
export const typographyVariants = {
  // Display styles for hero sections
  display: {
    large:
      'text-6xl lg:text-7xl xl:text-8xl font-bold leading-none tracking-tighter',
    medium:
      'text-5xl lg:text-6xl xl:text-7xl font-bold leading-none tracking-tighter',
    small:
      'text-4xl lg:text-5xl xl:text-6xl font-bold leading-none tracking-tight',
  },

  // Heading hierarchy
  heading: {
    h1: 'text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-tight',
    h2: 'text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight tracking-tight',
    h3: 'text-xl lg:text-2xl xl:text-3xl font-semibold leading-snug',
    h4: 'text-lg lg:text-xl xl:text-2xl font-semibold leading-snug',
    h5: 'text-base lg:text-lg xl:text-xl font-medium leading-normal',
    h6: 'text-sm lg:text-base xl:text-lg font-medium leading-normal',
  },

  // Body text variations
  body: {
    large: 'text-lg leading-relaxed font-normal',
    base: 'text-base leading-normal font-normal',
    small: 'text-sm leading-normal font-normal',
  },

  // UI text elements
  ui: {
    button: 'text-sm font-medium leading-none tracking-wide',
    label: 'text-sm font-medium leading-none',
    caption: 'text-xs leading-tight font-medium tracking-wide uppercase',
    helper: 'text-xs leading-normal text-muted-foreground',
    code: 'text-sm font-mono leading-normal',
  },

  // Special text styles
  special: {
    quote: 'text-lg lg:text-xl italic leading-relaxed font-normal',
    highlight: 'text-base font-semibold',
    overline: 'text-xs font-semibold tracking-widest uppercase',
  },
} as const;

// Color variants for text
export const textColorVariants = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  white: 'text-white',
  black: 'text-black',
} as const;

// Text alignment utilities
export const textAlignVariants = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
} as const;

// Typography component props
export interface TypographyProps {
  variant?:
    | keyof typeof typographyVariants.heading
    | keyof typeof typographyVariants.body
    | keyof typeof typographyVariants.display
    | keyof typeof typographyVariants.ui
    | keyof typeof typographyVariants.special;
  color?: keyof typeof textColorVariants;
  align?: keyof typeof textAlignVariants;
  className?: string;
  children: React.ReactNode;
}

// Typography utility functions
export const typography = {
  // Get typography classes by variant
  getVariant: (variant: string): string => {
    // Check display variants
    if (variant in typographyVariants.display) {
      return typographyVariants.display[
        variant as keyof typeof typographyVariants.display
      ];
    }

    // Check heading variants
    if (variant in typographyVariants.heading) {
      return typographyVariants.heading[
        variant as keyof typeof typographyVariants.heading
      ];
    }

    // Check body variants
    if (variant in typographyVariants.body) {
      return typographyVariants.body[
        variant as keyof typeof typographyVariants.body
      ];
    }

    // Check UI variants
    if (variant in typographyVariants.ui) {
      return typographyVariants.ui[
        variant as keyof typeof typographyVariants.ui
      ];
    }

    // Check special variants
    if (variant in typographyVariants.special) {
      return typographyVariants.special[
        variant as keyof typeof typographyVariants.special
      ];
    }

    // Default to body base
    return typographyVariants.body.base;
  },

  // Get color classes
  getColor: (color: keyof typeof textColorVariants): string => {
    return textColorVariants[color];
  },

  // Get alignment classes
  getAlign: (align: keyof typeof textAlignVariants): string => {
    return textAlignVariants[align];
  },

  // Compose typography classes
  compose: (
    variant?: string,
    color?: keyof typeof textColorVariants,
    align?: keyof typeof textAlignVariants,
    className?: string
  ): string => {
    return cn(
      variant ? typography.getVariant(variant) : '',
      color ? typography.getColor(color) : '',
      align ? typography.getAlign(align) : '',
      className
    );
  },
};

// Hero section typography helpers
export const heroTypography = {
  title: (size: 'small' | 'medium' | 'large' = 'medium') =>
    cn(typographyVariants.display[size], 'text-balance'),
  subtitle: () =>
    cn(typographyVariants.body.large, 'text-muted-foreground text-balance'),
  cta: () => cn(typographyVariants.ui.button, 'font-semibold'),
};

// Product card typography helpers
export const productTypography = {
  title: () => cn(typographyVariants.heading.h6, 'line-clamp-2'),
  description: () =>
    cn(typographyVariants.body.small, 'text-muted-foreground line-clamp-2'),
  price: () => cn(typographyVariants.heading.h5, 'font-bold'),
  originalPrice: () =>
    cn(typographyVariants.body.small, 'text-muted-foreground line-through'),
  badge: () => cn(typographyVariants.ui.caption, 'font-semibold'),
};

// Section header typography helpers
export const sectionTypography = {
  title: () => cn(typographyVariants.heading.h2, 'text-balance'),
  subtitle: () =>
    cn(typographyVariants.body.large, 'text-muted-foreground text-balance'),
  overline: () => cn(typographyVariants.special.overline, 'text-primary'),
};

// Form typography helpers
export const formTypography = {
  label: () => cn(typographyVariants.ui.label),
  helper: () => cn(typographyVariants.ui.helper),
  error: () => cn(typographyVariants.ui.helper, 'text-destructive'),
  fieldset: () => cn(typographyVariants.heading.h6),
};

// CSS-in-JS styles for complex typography
export const typographyStyles = {
  heroHeadline: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  responsiveText: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    lineHeight: '1.5',
  },
};

// Export types
export type TypographyVariant =
  | keyof typeof typographyVariants.heading
  | keyof typeof typographyVariants.body
  | keyof typeof typographyVariants.display
  | keyof typeof typographyVariants.ui
  | keyof typeof typographyVariants.special;

export type TextColor = keyof typeof textColorVariants;
export type TextAlign = keyof typeof textAlignVariants;
