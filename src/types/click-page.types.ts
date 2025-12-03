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
  | 'SOCIAL_PROOF'
  | 'VIDEO'
  | 'FORM'
  | 'IMAGE_GALLERY'
  | 'EMBED'
  | 'ACCORDION'
  | 'PRODUCT_CARD';

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
  fullWidth?: boolean; // Override default width tier
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
  fullWidth?: boolean; // Override default width tier
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
  fullWidth?: boolean; // Override default width tier
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
  rounded?: boolean;
  fullWidth?: boolean; // Override default width tier (from Style tab)
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
  fullWidth?: boolean; // Override default width tier
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
  fullWidth?: boolean; // Override default width tier
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
  fullWidth?: boolean; // Override default width tier
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
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings;
}

export interface SocialProofBlock extends BaseBlock {
  type: 'SOCIAL_PROOF';
  settings: SocialProofBlockSettings;
}

/**
 * Video Block - Video/multimedia content
 */
export interface VideoBlockSettings {
  videoType: 'youtube' | 'vimeo' | 'self-hosted';
  youtubeId?: string;
  vimeoId?: string;
  selfHostedUrl?: string;
  selfHostedFilename?: string; // Track uploaded video filename for deletion
  thumbnailUrl?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  aspectRatio: '16:9' | '4:3' | '1:1' | '21:9' | 'auto';
  caption?: string;
  rounded?: boolean;
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings;
}

export interface VideoBlock extends BaseBlock {
  type: 'VIDEO';
  settings: VideoBlockSettings;
}

/**
 * Form Block - Lead capture and contact forms
 */
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface FormBlockSettings {
  title?: string;
  description?: string;
  fields: FormField[];
  submitButtonText: string;
  submitButtonVariant: 'default' | 'outline' | 'ghost';
  successMessage: string;
  redirectUrl?: string;
  webhookUrl?: string; // For form submissions
  emailNotification?: {
    enabled: boolean;
    recipients: string[];
    subject: string;
  };
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings;
}

export interface FormBlock extends BaseBlock {
  type: 'FORM';
  settings: FormBlockSettings;
}

/**
 * Image Gallery Block - Multiple images with carousel/grid layout
 */
export interface GalleryImage {
  id: string;
  url: string;
  altText: string;
  caption?: string;
  link?: string;
}

export interface ImageGalleryBlockSettings {
  images: GalleryImage[];
  layout: 'carousel' | 'grid' | 'masonry';
  columns: 2 | 3 | 4 | 5;
  showCaptions: boolean;
  showNavigation: boolean;
  autoplay: boolean;
  autoplayInterval: number; // in milliseconds
  lightbox: boolean; // Click to enlarge
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'original';
  rounded?: boolean;
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings;
}

export interface ImageGalleryBlock extends BaseBlock {
  type: 'IMAGE_GALLERY';
  settings: ImageGalleryBlockSettings;
}

/**
 * Embed Block - Generic iframe embed for external content
 */
export interface EmbedBlockSettings {
  embedType: 'iframe' | 'custom';
  iframeUrl?: string;
  embedCode?: string; // Custom HTML/script embed code
  height: number;
  width: 'full' | 'large' | 'medium' | 'small' | number;
  allowFullscreen: boolean;
  allowScripts: boolean;
  title?: string;
  caption?: string;
  styles?: StyleSettings;
}

export interface EmbedBlock extends BaseBlock {
  type: 'EMBED';
  settings: EmbedBlockSettings;
}

/**
 * Accordion Block - Collapsible FAQ/content sections
 */
export interface AccordionItem {
  id: string;
  title: string;
  content: string; // HTML content
  isOpenByDefault: boolean;
  icon?: string; // Lucide icon name
}

export interface AccordionBlockSettings {
  items: AccordionItem[];
  allowMultipleOpen: boolean;
  showIcons: boolean;
  iconPosition: 'left' | 'right';
  animationDuration: number; // in milliseconds
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings;
}

export interface AccordionBlock extends BaseBlock {
  type: 'ACCORDION';
  settings: AccordionBlockSettings;
}

/**
 * Product Card Block - Display product with pricing and CTA
 */
export interface ProductCardBlockSettings {
  // Product Selection
  productId: string; // Required - Product ID from database
  productSlug?: string; // Optional - For reference/debugging

  // Display Options
  layout: 'compact' | 'standard' | 'detailed';
  showMemberPrice: boolean;
  showStock: boolean;
  showDescription: boolean;
  showRating: boolean;

  // CTA Customization
  ctaText?: string; // Override default "Add to Cart"
  ctaAction: 'view' | 'cart'; // Navigate to product page or add to cart

  // Style & Layout
  fullWidth?: boolean; // Override default width tier
  styles?: StyleSettings; // Advanced styling from Style tab
}

export interface ProductCardBlock extends BaseBlock {
  type: 'PRODUCT_CARD';
  settings: ProductCardBlockSettings;
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
  | SocialProofBlock
  | VideoBlock
  | FormBlock
  | ImageGalleryBlock
  | EmbedBlock
  | AccordionBlock
  | ProductCardBlock;

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
