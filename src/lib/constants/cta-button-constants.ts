/**
 * CTA Button Constants - Single Source of Truth
 * Color presets and configuration for article CTA buttons
 */

export interface CTAColorPreset {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  category: 'primary' | 'seasonal' | 'product' | 'neutral';
}

/**
 * Brand Color Presets
 * Professional e-commerce colors suitable for herbal/wellness products
 * Can be customized as brand evolves
 */
export const CTA_COLOR_PRESETS: CTAColorPreset[] = [
  // Primary Action Colors
  {
    id: 'black',
    name: 'Classic Black',
    description: 'Strong, professional call-to-action',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    category: 'primary',
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural, wellness-focused',
    backgroundColor: '#16A34A',
    textColor: '#FFFFFF',
    category: 'primary',
  },
  {
    id: 'warm-red',
    name: 'Warm Red',
    description: 'Urgent, sale-oriented',
    backgroundColor: '#DC2626',
    textColor: '#FFFFFF',
    category: 'primary',
  },

  // Seasonal & Campaign Colors
  {
    id: 'gold',
    name: 'Luxury Gold',
    description: 'Premium, special occasions',
    backgroundColor: '#D97706',
    textColor: '#FFFFFF',
    category: 'seasonal',
  },
  {
    id: 'teal',
    name: 'Trust Teal',
    description: 'Calm, trustworthy',
    backgroundColor: '#0D9488',
    textColor: '#FFFFFF',
    category: 'seasonal',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Premium, exclusive',
    backgroundColor: '#9333EA',
    textColor: '#FFFFFF',
    category: 'seasonal',
  },

  // Product Category Colors
  {
    id: 'earthy-brown',
    name: 'Earthy Brown',
    description: 'Traditional, herbal',
    backgroundColor: '#92400E',
    textColor: '#FFFFFF',
    category: 'product',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Fresh, clean',
    backgroundColor: '#2563EB',
    textColor: '#FFFFFF',
    category: 'product',
  },

  // Neutral/Outline Options
  {
    id: 'white-outline',
    name: 'White Outline',
    description: 'Subtle, secondary action',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    borderColor: '#000000',
    category: 'neutral',
  },
  {
    id: 'gray',
    name: 'Soft Gray',
    description: 'Neutral, informational',
    backgroundColor: '#6B7280',
    textColor: '#FFFFFF',
    category: 'neutral',
  },
];

/**
 * CTA Button Styles
 * CSS class mappings for button variations
 */
export const CTA_BUTTON_STYLES = {
  BASE_CLASS: 'article-cta-button',
  MIN_WIDTH: '140px',
  PADDING: '12px 24px',
  BORDER_RADIUS: '6px',
  FONT_WEIGHT: '600',
  TRANSITION: 'all 0.2s ease',
} as const;

/**
 * Default CTA Colors
 * Fallback when no color is specified
 */
export const DEFAULT_CTA_COLOR: CTAColorPreset = CTA_COLOR_PRESETS[0]; // Classic Black

/**
 * Color Categories for UI Organization
 */
export const COLOR_CATEGORIES = {
  primary: 'Main Actions',
  seasonal: 'Seasonal & Campaigns',
  product: 'Product Categories',
  neutral: 'Neutral & Subtle',
} as const;
