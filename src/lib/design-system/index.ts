/**
 * Design System - JRM E-commerce Platform
 * Central export for all design system utilities
 * Following ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

// Core design tokens
export { designTokens } from './tokens';
export type { DesignTokens, ColorScale, SpacingScale, TypographyScale } from './tokens';

// Typography system
export {
  typography,
  typographyVariants,
  textColorVariants,
  textAlignVariants,
  heroTypography,
  productTypography,
  sectionTypography,
  formTypography,
  typographyStyles,
  cn as typographyCn
} from './typography';
export type { TypographyProps, TypographyVariant, TextColor, TextAlign } from './typography';

// Spacing system
export {
  spacing,
  spacingScale,
  semanticSpacing,
  layoutSpacing,
  responsiveSpacing,
  componentSpacing,
  cn as spacingCn
} from './spacing';
export type { SpacingKey, SemanticSpacingCategory, LayoutSpacingCategory } from './spacing';

// Combined utilities
export { cn } from '../utils';

// Design system constants
export const DESIGN_SYSTEM_VERSION = '1.0.0';

// Breakpoints (same as design tokens but convenient access)
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Grid system configuration
export const gridSystem = {
  columns: 12,
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px'
  },
  padding: {
    xs: '1rem',    // 16px
    sm: '1.5rem',  // 24px
    md: '2rem',    // 32px
    lg: '3rem',    // 48px
    xl: '4rem'     // 64px
  }
} as const;

// Component size variants
export const sizeVariants = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
} as const;

// Animation presets
export const animations = {
  // Micro-interactions
  hover: 'transition-all duration-200 ease-out',
  focus: 'transition-all duration-150 ease-out',

  // Component animations
  slideIn: 'animate-in slide-in-from-left-1/2 duration-300',
  slideOut: 'animate-out slide-out-to-right-1/2 duration-300',
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',

  // Loading animations
  pulse: 'animate-pulse',
  spin: 'animate-spin',

  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200'
} as const;

// Shadow presets
export const shadows = {
  card: 'shadow-sm hover:shadow-md transition-shadow duration-200',
  cardHover: 'hover:shadow-lg transition-shadow duration-200',
  modal: 'shadow-xl',
  dropdown: 'shadow-lg border border-border/50',
  none: 'shadow-none'
} as const;

// Border radius presets
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
} as const;

// Component base classes
export const componentBase = {
  // Interactive elements
  interactive: 'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

  // Cards
  card: 'bg-card border border-border/50 rounded-lg shadow-sm',
  cardInteractive: 'bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',

  // Buttons
  button: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',

  // Form elements
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

  // Layout
  container: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
  section: 'py-16 lg:py-20'
} as const;

// Theme-aware color utilities
export const themeColors = {
  background: {
    primary: 'bg-background',
    secondary: 'bg-muted',
    accent: 'bg-accent',
    card: 'bg-card'
  },
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    inverse: 'text-background'
  },
  border: {
    default: 'border-border',
    muted: 'border-border/50',
    accent: 'border-accent'
  }
} as const;

// Accessibility helpers
export const a11y = {
  // Screen reader only
  srOnly: 'sr-only',

  // Focus management
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg',

  // Focus indicators
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  focusRingInset: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',

  // Touch targets (minimum 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]'
} as const;

// Export combined design system
export const designSystem = {
  tokens: designTokens,
  typography,
  spacing,
  breakpoints,
  gridSystem,
  sizeVariants,
  animations,
  shadows,
  borderRadius,
  componentBase,
  themeColors,
  a11y
} as const;

// Type exports
export type SizeVariant = keyof typeof sizeVariants;
export type ComponentBaseKey = keyof typeof componentBase;
export type ThemeColorCategory = keyof typeof themeColors;