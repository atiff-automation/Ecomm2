/**
 * Click Page Style Constants
 * Google Fonts, default theme colors, and styling presets
 */

import type {
  FontWeight,
  BrandColors,
  GlobalFonts,
  ThemeSettings,
  GoogleFont,
} from '@/types/click-page-styles.types';

// ============================================================================
// Google Fonts Library
// ============================================================================

/**
 * Curated list of Google Fonts for the page builder
 * Selected for readability, performance, and versatility
 */
export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans Serif - Modern & Clean
  {
    family: 'Inter',
    variants: ['300', '400', '500', '600', '700', '800'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Roboto',
    variants: ['300', '400', '500', '700', '900'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Open Sans',
    variants: ['300', '400', '600', '700', '800'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Poppins',
    variants: ['300', '400', '500', '600', '700', '800'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Montserrat',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Nunito',
    variants: ['300', '400', '600', '700', '800', '900'],
    subsets: ['latin', 'latin-ext'],
  },

  // Serif - Elegant & Traditional
  {
    family: 'Playfair Display',
    variants: ['400', '500', '600', '700', '800', '900'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Merriweather',
    variants: ['300', '400', '700', '900'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Lora',
    variants: ['400', '500', '600', '700'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Crimson Text',
    variants: ['400', '600', '700'],
    subsets: ['latin', 'latin-ext'],
  },

  // Display - Headlines & Impact
  {
    family: 'Oswald',
    variants: ['300', '400', '500', '600', '700'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Bebas Neue',
    variants: ['400'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Anton',
    variants: ['400'],
    subsets: ['latin', 'latin-ext'],
  },

  // Monospace - Technical & Modern
  {
    family: 'Fira Code',
    variants: ['300', '400', '500', '600', '700'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'JetBrains Mono',
    variants: ['300', '400', '500', '600', '700', '800'],
    subsets: ['latin', 'latin-ext'],
  },

  // Handwriting - Personal & Friendly
  {
    family: 'Pacifico',
    variants: ['400'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Dancing Script',
    variants: ['400', '500', '600', '700'],
    subsets: ['latin', 'latin-ext'],
  },

  // Special - Unique Styles
  {
    family: 'Raleway',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    subsets: ['latin', 'latin-ext'],
  },
  {
    family: 'Work Sans',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    subsets: ['latin', 'latin-ext'],
  },
];

/**
 * System fonts fallback
 * Used when no Google Font is selected
 */
export const SYSTEM_FONTS = [
  { label: 'System Sans Serif', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { label: 'System Serif', value: 'Georgia, "Times New Roman", Times, serif' },
  { label: 'System Monospace', value: '"Courier New", Courier, monospace' },
] as const;

// ============================================================================
// Default Theme Colors
// ============================================================================

/**
 * Default brand colors for new click pages
 * Based on JRM E-commerce branding
 */
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#3B82F6', // Blue
  secondary: '#8B5CF6', // Purple
  accent: '#FDE047', // Yellow
  success: '#10B981', // Green
  warning: '#F59E0B', // Orange
  error: '#EF4444', // Red
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

/**
 * Preset color palettes for inspiration
 * Users can select these as starting points
 */
export const COLOR_PALETTE_PRESETS = {
  DEFAULT: {
    name: 'JRM Default',
    colors: DEFAULT_BRAND_COLORS,
  },
  PROFESSIONAL: {
    name: 'Professional Blue',
    colors: {
      primary: '#2563EB',
      secondary: '#64748B',
      accent: '#0EA5E9',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
    } as BrandColors,
  },
  VIBRANT: {
    name: 'Vibrant & Bold',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#F97316',
      success: '#10B981',
      warning: '#FBBF24',
      error: '#EF4444',
    } as BrandColors,
  },
  ELEGANT: {
    name: 'Elegant Dark',
    colors: {
      primary: '#1F2937',
      secondary: '#6B7280',
      accent: '#FCD34D',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    } as BrandColors,
  },
  NATURE: {
    name: 'Natural Green',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#FBBF24',
      success: '#34D399',
      warning: '#F59E0B',
      error: '#EF4444',
    } as BrandColors,
  },
} as const;

/**
 * Alias for COLOR_PALETTE_PRESETS for compatibility
 */
export const COLOR_THEME_PRESETS = COLOR_PALETTE_PRESETS;

// ============================================================================
// Default Global Fonts
// ============================================================================

/**
 * Default global font settings
 */
export const DEFAULT_GLOBAL_FONTS: GlobalFonts = {
  heading: 'Poppins', // Bold, modern headings
  body: 'Inter', // Clean, readable body text
  monospace: 'Fira Code', // Technical/code blocks
};

// ============================================================================
// Default Theme Settings
// ============================================================================

/**
 * Complete default theme for new click pages
 */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  colors: DEFAULT_BRAND_COLORS,
  fonts: DEFAULT_GLOBAL_FONTS,
  defaultSpacing: {
    blockGap: 32, // 32px gap between blocks
    containerPadding: {
      linked: true,
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    },
  },
};

// ============================================================================
// Spacing Presets
// ============================================================================

/**
 * Common spacing values for quick selection
 */
export const SPACING_PRESETS = {
  NONE: { value: 0, label: 'None' },
  XS: { value: 4, label: 'Extra Small' },
  SM: { value: 8, label: 'Small' },
  MD: { value: 16, label: 'Medium' },
  LG: { value: 24, label: 'Large' },
  XL: { value: 32, label: 'Extra Large' },
  XXL: { value: 48, label: '2X Large' },
  XXXL: { value: 64, label: '3X Large' },
} as const;

// ============================================================================
// Border Radius Presets
// ============================================================================

/**
 * Common border radius values
 */
export const BORDER_RADIUS_PRESETS = {
  NONE: { value: 0, label: 'None' },
  SM: { value: 4, label: 'Small' },
  MD: { value: 8, label: 'Medium' },
  LG: { value: 12, label: 'Large' },
  XL: { value: 16, label: 'Extra Large' },
  FULL: { value: 9999, label: 'Full' },
} as const;

// ============================================================================
// Shadow Presets
// ============================================================================

/**
 * Common box shadow presets
 */
export const SHADOW_PRESETS = {
  NONE: {
    label: 'None',
    value: {
      offsetX: 0,
      offsetY: 0,
      blur: 0,
      spread: 0,
      color: '#00000000',
    },
  },
  SM: {
    label: 'Small',
    value: {
      offsetX: 0,
      offsetY: 1,
      blur: 2,
      spread: 0,
      color: '#0000000d', // rgba(0, 0, 0, 0.05)
    },
  },
  MD: {
    label: 'Medium',
    value: {
      offsetX: 0,
      offsetY: 4,
      blur: 6,
      spread: -1,
      color: '#0000001a', // rgba(0, 0, 0, 0.1)
    },
  },
  LG: {
    label: 'Large',
    value: {
      offsetX: 0,
      offsetY: 10,
      blur: 15,
      spread: -3,
      color: '#0000001a', // rgba(0, 0, 0, 0.1)
    },
  },
  XL: {
    label: 'Extra Large',
    value: {
      offsetX: 0,
      offsetY: 20,
      blur: 25,
      spread: -5,
      color: '#00000026', // rgba(0, 0, 0, 0.15)
    },
  },
  INNER: {
    label: 'Inner',
    value: {
      offsetX: 0,
      offsetY: 2,
      blur: 4,
      spread: 0,
      color: '#0000000d', // rgba(0, 0, 0, 0.05)
    },
  },
} as const;

// ============================================================================
// Font Weight Labels
// ============================================================================

/**
 * Human-readable font weight labels
 */
export const FONT_WEIGHT_LABELS: Record<FontWeight, string> = {
  '100': 'Thin',
  '200': 'Extra Light',
  '300': 'Light',
  '400': 'Normal',
  '500': 'Medium',
  '600': 'Semi Bold',
  '700': 'Bold',
  '800': 'Extra Bold',
  '900': 'Black',
};

// ============================================================================
// Animation Presets
// ============================================================================

/**
 * Animation easing functions
 */
export const ANIMATION_EASINGS = {
  LINEAR: { value: 'linear', label: 'Linear' },
  EASE: { value: 'ease', label: 'Ease' },
  EASE_IN: { value: 'ease-in', label: 'Ease In' },
  EASE_OUT: { value: 'ease-out', label: 'Ease Out' },
  EASE_IN_OUT: { value: 'ease-in-out', label: 'Ease In Out' },
} as const;

/**
 * Animation duration presets
 */
export const ANIMATION_DURATIONS = {
  FAST: { value: 200, label: 'Fast (200ms)' },
  NORMAL: { value: 300, label: 'Normal (300ms)' },
  SLOW: { value: 500, label: 'Slow (500ms)' },
  SLOWER: { value: 700, label: 'Slower (700ms)' },
} as const;

// ============================================================================
// Responsive Breakpoints
// ============================================================================

/**
 * Responsive breakpoint definitions
 * Used for media queries
 */
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: {
    label: 'Mobile',
    minWidth: 0,
    maxWidth: 767,
    mediaQuery: '@media (max-width: 767px)',
  },
  TABLET: {
    label: 'Tablet',
    minWidth: 768,
    maxWidth: 1023,
    mediaQuery: '@media (min-width: 768px) and (max-width: 1023px)',
  },
  DESKTOP: {
    label: 'Desktop',
    minWidth: 1024,
    maxWidth: Infinity,
    mediaQuery: '@media (min-width: 1024px)',
  },
} as const;

// ============================================================================
// Default Style Settings
// ============================================================================

/**
 * Default style settings for new blocks
 * Used when no custom styles are defined
 */
export const DEFAULT_STYLE_SETTINGS = {
  typography: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#1F2937',
  },
  spacing: {
    padding: {
      top: 16,
      right: 16,
      bottom: 16,
      left: 16,
      locked: true,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      locked: true,
    },
  },
  border: {
    width: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      locked: true,
    },
    style: 'none' as const,
    color: '#E5E7EB',
    radius: {
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
      locked: true,
    },
  },
  effects: {
    opacity: 1,
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get Google Font by family name
 */
export function getGoogleFont(family: string): GoogleFont | undefined {
  return GOOGLE_FONTS.find((font) => font.family === family);
}

/**
 * Generate Google Fonts URL for loading
 * @param fonts Array of font families to load
 * @returns Google Fonts API URL
 */
export function generateGoogleFontsURL(fonts: string[]): string {
  if (fonts.length === 0) return '';

  const fontParams = fonts
    .map((family) => {
      const font = getGoogleFont(family);
      if (!font) return null;

      const weights = font.variants.join(',');
      return `family=${encodeURIComponent(family)}:wght@${weights}`;
    })
    .filter(Boolean)
    .join('&');

  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}

/**
 * Get all unique fonts used in a page
 * @param themeSettings Theme settings with global fonts
 * @param blocks Array of blocks with potential custom fonts
 * @returns Array of unique font families
 */
export function extractUniqueFonts(
  themeSettings: ThemeSettings,
  blocks: Array<{ settings?: { styles?: { typography?: { fontFamily?: string } } } }>
): string[] {
  const fonts = new Set<string>();

  // Add global fonts
  if (themeSettings.fonts.heading) fonts.add(themeSettings.fonts.heading);
  if (themeSettings.fonts.body) fonts.add(themeSettings.fonts.body);
  if (themeSettings.fonts.monospace) fonts.add(themeSettings.fonts.monospace);

  // Add block-specific fonts
  blocks.forEach((block) => {
    const fontFamily = block.settings?.styles?.typography?.fontFamily;
    if (fontFamily && GOOGLE_FONTS.some((f) => f.family === fontFamily)) {
      fonts.add(fontFamily);
    }
  });

  return Array.from(fonts);
}
