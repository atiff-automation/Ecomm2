/**
 * Design System Tokens - Admin Interface
 * Centralized design tokens following ADMIN_LAYOUT_STANDARD.md specifications
 */

// Typography Scale
export const typography = {
  h1: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: '40px',
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: '32px',
  },
  h3: {
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: '28px',
  },
  h4: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
  },
} as const;

// Color Palette
export const colors = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#374151',
  },
} as const;

// Spacing System (Tailwind-based)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

// Component Dimensions
export const dimensions = {
  sidebar: {
    width: '240px',
    mobileWidth: '280px',
  },
  header: {
    height: '60px',
  },
  pageHeader: {
    height: '64px',
  },
  tabBar: {
    height: '48px',
  },
  filterBar: {
    height: '52px',
  },
  tableRow: {
    compact: '48px',
    comfortable: '56px',
  },
  button: {
    small: '36px',
    medium: '40px',
    large: '44px',
  },
} as const;

// Responsive Breakpoints
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px',
} as const;

// Animation/Transitions
export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Z-Index Scale
export const zIndex = {
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

// Button Variants
export const buttonVariants = {
  primary: {
    backgroundColor: colors.primary,
    color: 'white',
    border: `1px solid ${colors.primary}`,
  },
  secondary: {
    backgroundColor: 'transparent',
    color: colors.gray[600],
    border: `1px solid ${colors.gray[300]}`,
  },
  danger: {
    backgroundColor: colors.danger,
    color: 'white',
    border: `1px solid ${colors.danger}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: 'none',
  },
} as const;

// Status Badges
export const statusBadges = {
  success: {
    backgroundColor: colors.success,
    color: 'white',
  },
  warning: {
    backgroundColor: colors.warning,
    color: 'white',
  },
  danger: {
    backgroundColor: colors.danger,
    color: 'white',
  },
  info: {
    backgroundColor: colors.primary,
    color: 'white',
  },
} as const;

// CSS Custom Properties for Runtime Theming
export const cssVariables = {
  '--color-primary': colors.primary,
  '--color-success': colors.success,
  '--color-warning': colors.warning,
  '--color-danger': colors.danger,
  '--spacing-xs': spacing.xs,
  '--spacing-sm': spacing.sm,
  '--spacing-md': spacing.md,
  '--spacing-lg': spacing.lg,
  '--spacing-xl': spacing.xl,
  '--sidebar-width': dimensions.sidebar.width,
  '--header-height': dimensions.header.height,
  '--page-header-height': dimensions.pageHeader.height,
} as const;

// Utility Functions
export const utils = {
  // Convert spacing token to rem
  rem: (px: string): string => {
    const numValue = parseInt(px.replace('px', ''), 10);
    return `${numValue / 16}rem`;
  },

  // Generate responsive CSS media queries
  mediaQuery: {
    mobile: `@media (max-width: ${breakpoints.mobile})`,
    tablet: `@media (min-width: ${breakpoints.mobile}) and (max-width: ${breakpoints.desktop})`,
    desktop: `@media (min-width: ${breakpoints.desktop})`,
  },

  // Generate box shadow utilities
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
} as const;
