/**
 * Design Tokens - JRM E-commerce Platform
 * Central source of truth for design system values
 * Following the ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

export const designTokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006'
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#052e16'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03'
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a'
      },
      info: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49'
      }
    }
  },
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
    '3xl': '4rem',    // 64px
    '4xl': '5rem',    // 80px
    '5xl': '6rem',    // 96px
    '6xl': '8rem',    // 128px
  },
  // Component-specific spacing (separate for programmatic access)
  componentSpacing: {
    section: {
      xs: '2rem',     // 32px
      sm: '3rem',     // 48px
      md: '4rem',     // 64px
      lg: '6rem',     // 96px
      xl: '8rem'      // 128px
    },
    container: {
      xs: '1rem',     // 16px
      sm: '1.5rem',   // 24px
      md: '2rem',     // 32px
      lg: '3rem',     // 48px
      xl: '4rem'      // 64px
    }
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
      '9xl': '8rem'       // 128px
    },
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },
    fontWeights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    },
    // Semantic typography scales
    headings: {
      h1: {
        fontSize: '3rem',        // 48px
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.02em'
      },
      h2: {
        fontSize: '2.25rem',     // 36px
        lineHeight: '1.2',
        fontWeight: '600',
        letterSpacing: '-0.01em'
      },
      h3: {
        fontSize: '1.875rem',    // 30px
        lineHeight: '1.3',
        fontWeight: '600',
        letterSpacing: '0em'
      },
      h4: {
        fontSize: '1.5rem',      // 24px
        lineHeight: '1.4',
        fontWeight: '600',
        letterSpacing: '0em'
      },
      h5: {
        fontSize: '1.25rem',     // 20px
        lineHeight: '1.5',
        fontWeight: '500',
        letterSpacing: '0em'
      },
      h6: {
        fontSize: '1.125rem',    // 18px
        lineHeight: '1.5',
        fontWeight: '500',
        letterSpacing: '0em'
      }
    },
    body: {
      small: {
        fontSize: '0.875rem',    // 14px
        lineHeight: '1.5',
        fontWeight: '400'
      },
      base: {
        fontSize: '1rem',        // 16px
        lineHeight: '1.5',
        fontWeight: '400'
      },
      large: {
        fontSize: '1.125rem',    // 18px
        lineHeight: '1.5',
        fontWeight: '400'
      }
    },
    display: {
      small: {
        fontSize: '3.75rem',     // 60px
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.02em'
      },
      medium: {
        fontSize: '4.5rem',      // 72px
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.02em'
      },
      large: {
        fontSize: '6rem',        // 96px
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.02em'
      }
    }
  },
  borderRadius: {
    none: '0',
    xs: '0.125rem',    // 2px
    sm: '0.25rem',     // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px'
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  breakpoints: {
    xs: '0px',        // Mobile portrait
    sm: '640px',      // Mobile landscape
    md: '768px',      // Tablet
    lg: '1024px',     // Desktop
    xl: '1280px',     // Large desktop
    '2xl': '1536px'   // Extra large desktop
  },
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
} as const;

// Type exports for TypeScript support
export type DesignTokens = typeof designTokens;
export type ColorScale = typeof designTokens.colors.primary;
export type SpacingScale = typeof designTokens.spacing;
export type TypographyScale = typeof designTokens.typography;