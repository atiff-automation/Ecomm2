/**
 * Click Page Type Definitions
 * Centralized TypeScript types for Click Page feature
 */

import {
  ClickPage as PrismaClickPage,
  ClickPageStatus,
  ClickPageClick,
  ClickPageConversion,
} from '@prisma/client';
import type { StyleSettings } from './click-page-styles.types';

// ============================================================================
// Base Types from Prisma
// ============================================================================

export type ClickPage = PrismaClickPage;
export { ClickPageStatus };
export type ClickPageClickEvent = ClickPageClick;
export type ClickPageConversionEvent = ClickPageConversion;

// ============================================================================
// Block Type System
// ============================================================================

/**
 * All available block types for Click Pages
 */
export type BlockType =
  | 'HERO'
  | 'TEXT'
  | 'CTA_BUTTON'
  | 'IMAGE'
  | 'SPACER'
  | 'DIVIDER'
  | 'PRICING_TABLE'
  | 'TESTIMONIAL'
  | 'COUNTDOWN_TIMER'
  | 'SOCIAL_PROOF';

/**
 * Base block interface - all blocks extend this
 */
export interface BaseBlock {
  id: string; // Unique block ID
  type: BlockType;
  sortOrder: number; // Display order
}

// ============================================================================
// Block-Specific Settings
// ============================================================================

/**
 * Hero Block - Main banner with CTA and countdown
 */
export interface HeroBlockSettings {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlayOpacity: number; // 0-1
  textAlignment: 'left' | 'center' | 'right';
  ctaText: string;
  ctaUrl: string;
  showCountdown: boolean;
  countdownEndDate?: Date;
  countdownLabel?: string;
  styles?: StyleSettings;
}

export interface HeroBlock extends BaseBlock {
  type: 'HERO';
  settings: HeroBlockSettings;
}

/**
 * Text Block - Rich text content
 */
export interface TextBlockSettings {
  content: string; // HTML from TipTap
  textAlign: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: number; // Max width in pixels
  styles?: StyleSettings;
}

export interface TextBlock extends BaseBlock {
  type: 'TEXT';
  settings: TextBlockSettings;
}

/**
 * CTA Button Block - Call-to-action button
 */
export interface CTAButtonBlockSettings {
  text: string;
  url: string;
  variant: 'default' | 'outline' | 'ghost' | 'destructive';
  size: 'sm' | 'default' | 'lg';
  alignment: 'left' | 'center' | 'right';
  openInNewTab: boolean;
  styles?: StyleSettings;
}

export interface CTAButtonBlock extends BaseBlock {
  type: 'CTA_BUTTON';
  settings: CTAButtonBlockSettings;
}

/**
 * Image Block - Image with optional caption
 */
export interface ImageBlockSettings {
  url: string;
  altText: string;
  caption?: string;
  link?: string;
  alignment: 'left' | 'center' | 'right';
  width: 'full' | 'large' | 'medium' | 'small';
  rounded: boolean;
  styles?: StyleSettings;
}

export interface ImageBlock extends BaseBlock {
  type: 'IMAGE';
  settings: ImageBlockSettings;
}

/**
 * Spacer Block - Vertical spacing
 */
export interface SpacerBlockSettings {
  height: number; // Height in pixels
  styles?: StyleSettings;
}

export interface SpacerBlock extends BaseBlock {
  type: 'SPACER';
  settings: SpacerBlockSettings;
}

/**
 * Divider Block - Visual separator
 */
export interface DividerBlockSettings {
  style: 'solid' | 'dashed' | 'dotted';
  color: string; // Hex color
  thickness: number; // Thickness in pixels
  spacing: number; // Vertical spacing around divider
  styles?: StyleSettings;
}

export interface DividerBlock extends BaseBlock {
  type: 'DIVIDER';
  settings: DividerBlockSettings;
}

/**
 * Pricing Table Block - Product pricing tiers
 */
export interface PricingTier {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  features: string[];
  ctaText: string;
  ctaUrl: string;
  highlighted: boolean;
  badge?: string; // e.g., "BEST VALUE"
  imageUrl?: string; // Optional icon/image for the tier
}

export interface PricingTableBlockSettings {
  tiers: PricingTier[];
  layout: 'horizontal' | 'vertical';
  showComparison: boolean;
  styles?: StyleSettings;
}

export interface PricingTableBlock extends BaseBlock {
  type: 'PRICING_TABLE';
  settings: PricingTableBlockSettings;
}

/**
 * Testimonial Block - Customer review/testimonial
 */
export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  rating?: number; // 1-5 stars
}

export interface TestimonialBlockSettings {
  testimonials: TestimonialItem[];
  layout: 'single' | 'carousel' | 'grid';
  showRatings: boolean;
  showImages: boolean;
  styles?: StyleSettings;
}

export interface TestimonialBlock extends BaseBlock {
  type: 'TESTIMONIAL';
  settings: TestimonialBlockSettings;
}

/**
 * Countdown Timer Block - Urgency timer
 */
export interface CountdownTimerBlockSettings {
  endDate: Date;
  title?: string;
  message?: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  expiredMessage?: string;
  styles?: StyleSettings;
}

export interface CountdownTimerBlock extends BaseBlock {
  type: 'COUNTDOWN_TIMER';
  settings: CountdownTimerBlockSettings;
}

/**
 * Social Proof Block - Reviews, badges, trust signals
 */
export interface SocialProofBlockSettings {
  type: 'stats' | 'badges' | 'reviews';
  stats?: {
    label: string;
    value: string;
    icon?: string;
  }[];
  badges?: {
    imageUrl: string;
    altText: string;
  }[];
  reviews?: {
    totalReviews: number;
    averageRating: number;
    showStars: boolean;
    images: string[]; // Review screenshots
  };
  layout: 'horizontal' | 'vertical' | 'grid';
  styles?: StyleSettings;
}

export interface SocialProofBlock extends BaseBlock {
  type: 'SOCIAL_PROOF';
  settings: SocialProofBlockSettings;
}

// ============================================================================
// Union Type - All Blocks
// ============================================================================

/**
 * Discriminated union of all block types
 */
export type Block =
  | HeroBlock
  | TextBlock
  | CTAButtonBlock
  | ImageBlock
  | SpacerBlock
  | DividerBlock
  | PricingTableBlock
  | TestimonialBlock
  | CountdownTimerBlock
  | SocialProofBlock;

// ============================================================================
// Click Page with Relations
// ============================================================================

export interface ClickPageWithRelations extends ClickPage {
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  clicks?: ClickPageClickEvent[];
  conversions?: ClickPageConversionEvent[];
}

// ============================================================================
// API Input Types
// ============================================================================

export interface ClickPageCreateInput {
  title: string;
  slug: string;
  blocks: Block[];
  status: ClickPageStatus;
  publishedAt?: Date;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  twitterImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;

  // Analytics & Tracking
  fbPixelId?: string;
  gaTrackingId?: string;
  gtmContainerId?: string;
  customScripts?: {
    head: string[];
    body: string[];
  };

  // Campaign
  scheduledPublishAt?: Date;
  scheduledUnpublishAt?: Date;
  campaignName?: string;
  campaignStartDate?: Date;
  campaignEndDate?: Date;
}

export interface ClickPageUpdateInput {
  title?: string;
  slug?: string;
  blocks?: Block[];
  status?: ClickPageStatus;
  publishedAt?: Date;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  twitterImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;

  // Analytics & Tracking
  fbPixelId?: string;
  gaTrackingId?: string;
  gtmContainerId?: string;
  customScripts?: {
    head: string[];
    body: string[];
  };

  // Campaign
  scheduledPublishAt?: Date;
  scheduledUnpublishAt?: Date;
  campaignName?: string;
  campaignStartDate?: Date;
  campaignEndDate?: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ClickPageListResponse {
  clickPages: ClickPageWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClickPageResponse {
  clickPage: ClickPageWithRelations;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface ClickPageFilter {
  status?: ClickPageStatus | 'ALL';
  search?: string;
  campaignName?: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ClickPageAnalytics {
  clickPageId: string;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  clicksByBlock: {
    blockId: string;
    blockType: BlockType;
    clicks: number;
  }[];
  clicksOverTime: {
    date: string;
    clicks: number;
    conversions: number;
  }[];
}

export interface ClickEventInput {
  blockId?: string;
  blockType?: string;
  targetUrl?: string;
  targetId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ConversionEventInput {
  orderId: string;
  orderValue: number;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ============================================================================
// Form Data Types (for Admin)
// ============================================================================

export interface ClickPageFormData {
  title: string;
  slug: string;
  blocks: Block[];
  status: ClickPageStatus;
  publishedAt?: Date;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImageUrl?: string;
  twitterImageUrl?: string;
  canonicalUrl?: string;
  noIndex: boolean;

  // Analytics & Tracking
  fbPixelId?: string;
  gaTrackingId?: string;
  gtmContainerId?: string;
  customScripts?: {
    head: string[];
    body: string[];
  };

  // Campaign
  scheduledPublishAt?: Date;
  scheduledUnpublishAt?: Date;
  campaignName?: string;
  campaignStartDate?: Date;
  campaignEndDate?: Date;
}

// ============================================================================
// Block Registry Types
// ============================================================================

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'content' | 'media' | 'cta' | 'social';
  defaultSettings: Block['settings'];
}

export type BlockRegistry = Record<BlockType, BlockDefinition>;
