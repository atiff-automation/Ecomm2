/**
 * Click Page Styling Type System
 * Comprehensive types for all styling capabilities across all 3 phases
 */

// ============================================================================
// Base Style Types
// ============================================================================

export type FontWeight =
  | '100' // Thin
  | '200' // Extra Light
  | '300' // Light
  | '400' // Normal
  | '500' // Medium
  | '600' // Semi Bold
  | '700' // Bold
  | '800' // Extra Bold
  | '900'; // Black

export type TextTransform =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize';

export type TextAlignment =
  | 'left'
  | 'center'
  | 'right'
  | 'justify';

export type BorderStyle =
  | 'none'
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double';

export type BackgroundType =
  | 'none'
  | 'solid'
  | 'gradient'
  | 'image'
  | 'video';

export type GradientDirection =
  | 'to right'
  | 'to left'
  | 'to top'
  | 'to bottom'
  | 'to top right'
  | 'to bottom right'
  | 'to top left'
  | 'to bottom left';

export type AnimationType =
  | 'none'
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn'
  | 'bounce'
  | 'pulse';

export type AnimationTrigger =
  | 'onLoad' // Trigger on page load
  | 'onScroll' // Trigger when scrolled into view
  | 'onHover'; // Trigger on hover

export type ResponsiveBreakpoint =
  | 'mobile' // < 768px
  | 'tablet' // 768px - 1024px
  | 'desktop'; // > 1024px

// ============================================================================
// Phase 1: Essential Styling
// ============================================================================

/**
 * Typography Settings
 * Font family, size, weight, spacing, and formatting
 */
export interface TypographySettings {
  fontFamily: string; // e.g., "Inter", "Roboto", "Playfair Display"
  fontSize: number; // In pixels
  fontWeight: FontWeight;
  lineHeight: number; // Multiplier (e.g., 1.5)
  letterSpacing: number; // In pixels
  textTransform: TextTransform;
  color: string; // Hex color with optional opacity
}

/**
 * Color with Opacity
 * Used throughout the system for colors
 */
export interface ColorValue {
  hex: string; // Hex color (e.g., "#3B82F6")
  opacity: number; // 0-1 (e.g., 0.8 for 80%)
}

/**
 * Background Settings
 * Supports solid colors, gradients, images, and videos
 */
export interface BackgroundSettings {
  type: BackgroundType;
  color?: string; // For solid background
  opacity?: number; // 0-1, applies to solid color backgrounds
  gradient?: {
    type: 'linear' | 'radial';
    direction: GradientDirection; // For linear
    colors: Array<{
      color: string;
      position: number; // 0-100 (percentage)
    }>;
  };
  image?: {
    url: string;
    alt?: string;
    position: string; // e.g., "center", "top", "bottom"
    size: 'cover' | 'contain' | 'auto';
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    attachment: 'scroll' | 'fixed';
    overlay?: {
      color: string;
      opacity: number; // 0-1
    };
  };
  video?: {
    url: string;
    posterImage?: string;
    loop: boolean;
    muted: boolean;
    overlay?: {
      color: string;
      opacity: number;
    };
  };
}

/**
 * Spacing Settings
 * Padding and margin with lock mechanism
 */
export interface SpacingSettings {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    locked: boolean; // If true, all values are the same
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    locked: boolean;
  };
}

/**
 * Border Settings
 * Width, style, color, and radius
 */
export interface BorderSettings {
  width: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    locked: boolean;
  };
  style: BorderStyle;
  color: string;
  radius: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
    locked: boolean;
  };
}

// ============================================================================
// Phase 2: Advanced Styling
// ============================================================================

/**
 * Shadow/Effects Settings
 * Box shadow and text shadow
 */
export interface EffectSettings {
  boxShadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    inset: boolean;
  };
  textShadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  opacity: number; // 0-1
  blur?: number; // Backdrop blur in pixels
}

/**
 * Hover Effects
 * State changes on hover (for buttons and images)
 */
export interface HoverEffects {
  enabled: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  scale?: number; // e.g., 1.05 for 5% scale up
  translateY?: number; // Vertical movement in pixels
  boxShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
  };
  transition: {
    duration: number; // In milliseconds
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}

/**
 * Responsive Settings
 * Visibility and overrides per breakpoint
 */
export interface ResponsiveSettings {
  mobile: {
    hidden: boolean; // Hide on mobile
    overrides?: Partial<StyleSettings>; // Override specific styles
  };
  tablet: {
    hidden: boolean;
    overrides?: Partial<StyleSettings>;
  };
  desktop: {
    hidden: boolean;
    overrides?: Partial<StyleSettings>;
  };
}

// ============================================================================
// Phase 3: Pro Features
// ============================================================================

/**
 * Animation Settings
 * Entrance animations with scroll triggers
 */
export interface AnimationSettings {
  enabled: boolean;
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number; // In milliseconds
  delay: number; // In milliseconds
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  repeat: boolean; // Repeat animation
  repeatCount?: number; // Number of times to repeat (0 = infinite)
}

/**
 * Advanced Settings
 * Custom CSS and classes
 */
export interface AdvancedSettings {
  customCSS?: string; // Raw CSS for the block
  customClasses?: string[]; // Additional CSS classes
  zIndex?: number; // Stack order
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'none';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

// ============================================================================
// Composite Style Settings
// ============================================================================

/**
 * Complete Style Settings for a Block
 * Contains all styling capabilities from all phases
 */
export interface StyleSettings {
  // Phase 1: Essential
  typography?: TypographySettings;
  background?: BackgroundSettings;
  spacing?: SpacingSettings;
  border?: BorderSettings;

  // Phase 2: Advanced
  effects?: EffectSettings;
  hover?: HoverEffects;
  responsive?: ResponsiveSettings;

  // Phase 3: Pro
  animation?: AnimationSettings;
  advanced?: AdvancedSettings;
}

// ============================================================================
// Global Theme Settings
// ============================================================================

/**
 * Brand Color Palette
 * Defined at page level, available in all color pickers
 */
export interface BrandColors {
  primary: string; // Main brand color
  secondary: string; // Secondary brand color
  accent: string; // Accent/highlight color
  background?: string; // Page background color
  text?: string; // Default text color
  success?: string;
  warning?: string;
  error?: string;
  neutral?: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

/**
 * Global Font Settings
 * Applied to all blocks as defaults
 */
export interface GlobalFonts {
  heading: string; // Font family for headings (e.g., "Playfair Display")
  body: string; // Font family for body text (e.g., "Inter")
  monospace?: string; // Font family for code/monospace
}

/**
 * Global Theme Settings
 * Stored at ClickPage level in themeSettings JSON field
 */
/**
 * Container Padding Configuration
 * Supports linked (uniform) or unlinked (per-side) padding
 */
export interface ContainerPadding {
  linked: boolean;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ThemeSettings {
  colors: BrandColors;
  fonts: GlobalFonts;
  defaultSpacing?: {
    blockGap: number; // Default gap between blocks
    containerPadding: ContainerPadding; // Per-side container padding with link toggle
  };
}

// ============================================================================
// Google Fonts Integration
// ============================================================================

/**
 * Google Font Configuration
 * For loading fonts dynamically
 */
export interface GoogleFont {
  family: string; // e.g., "Inter"
  variants: FontWeight[]; // e.g., ['400', '500', '700']
  subsets?: string[]; // e.g., ['latin', 'latin-ext']
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ColorValue
 */
export function isColorValue(value: unknown): value is ColorValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hex' in value &&
    'opacity' in value &&
    typeof (value as ColorValue).hex === 'string' &&
    typeof (value as ColorValue).opacity === 'number'
  );
}

/**
 * Type guard for StyleSettings
 */
export function isStyleSettings(value: unknown): value is StyleSettings {
  return typeof value === 'object' && value !== null;
}
