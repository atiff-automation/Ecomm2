# Click Pages Feature - Complete Implementation Plan

**Feature Name**: Click Pages (High-Converting Sales Page Builder)
**Version**: 1.0.0 MVP
**Status**: Planning Phase
**Target Completion**: 4 weeks
**Last Updated**: 2025-01-24

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Database Schema](#database-schema)
4. [Type System](#type-system)
5. [Constants & Configuration](#constants--configuration)
6. [Block System Architecture](#block-system-architecture)
7. [Component Structure](#component-structure)
8. [API Routes](#api-routes)
9. [Validation Schemas](#validation-schemas)
10. [File Structure](#file-structure)
11. [Implementation Phases](#implementation-phases)
12. [Testing Requirements](#testing-requirements)
13. [Dependencies](#dependencies)
14. [Migration Scripts](#migration-scripts)
15. [Code Examples](#code-examples)

---

## Overview

### Purpose
Click Pages is a **block-based page builder** designed specifically for creating high-converting sales and promotional pages. Unlike traditional Landing Pages (content-focused), Click Pages are optimized for conversions with purpose-built blocks like pricing tables, testimonials, countdown timers, and CTA buttons.

### Key Differences: Click Pages vs Landing Pages

| Aspect | Landing Pages | Click Pages |
|--------|---------------|-------------|
| **Purpose** | Informational content | Sales & conversions |
| **Editor** | WYSIWYG/Rich Text | Block-based builder |
| **URL** | `/landing/*` | `/click/*` |
| **Flexibility** | Fixed template | Fully customizable |
| **Use Cases** | Blogs, announcements | Product launches, promos |
| **Database** | `LandingPage` table | `ClickPage` table (separate) |
| **Constants** | `landing-page-constants.ts` | `click-page-constants.ts` (separate) |

### MVP Scope

**Included in MVP:**
- ✅ Block-based page builder (9 block types)
- ✅ Drag & drop block reordering
- ✅ Full SEO support
- ✅ Analytics & conversion tracking
- ✅ Admin CRUD interface
- ✅ Public page rendering
- ✅ Auto-responsive design

**Excluded from MVP (Phase 2):**
- ❌ Save as template feature
- ❌ Mobile-specific settings
- ❌ E2E tests
- ❌ Advanced lazy loading
- ❌ A/B testing
- ❌ Block restrictions/rules

---

## Architecture & Design Principles

### Core Principles (MANDATORY)

Following `claudedocs/CODING_STANDARDS.md`:

#### 1. **Single Source of Truth**
```typescript
// ✅ GOOD: One constant definition
// src/lib/constants/click-page-constants.ts
export const CLICK_PAGE_CONSTANTS = {
  STATUS: {
    DRAFT: { value: 'DRAFT', label: 'Draft' },
    // ...
  }
} as const;

// Used everywhere:
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

// ❌ BAD: Hardcoded strings
if (status === 'DRAFT') { } // FORBIDDEN
```

#### 2. **No Hardcoding**
```typescript
// ✅ GOOD: Configuration-driven
const maxBlocks = CLICK_PAGE_CONSTANTS.VALIDATION.MAX_BLOCKS_PER_PAGE;

// ❌ BAD: Magic numbers
if (blocks.length > 50) { } // FORBIDDEN
```

#### 3. **Type Safety (No `any`)**
```typescript
// ✅ GOOD: Explicit types
interface BlockSettings {
  title: string;
  backgroundColor: string;
}

// ❌ BAD: any type
const settings: any = {}; // WILL BE REJECTED
```

#### 4. **Three-Layer Validation**
```
Frontend → API (Zod) → Database (Prisma constraints)
```

#### 5. **Separation of Concerns**
- Click Pages are **completely independent** from Landing Pages
- No shared constants (except design system)
- No shared types
- No shared components (except UI primitives)
- Separate database tables, routes, validations

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | 14.x |
| **Language** | TypeScript (strict mode) | 5.x |
| **Database** | PostgreSQL via Prisma | Latest |
| **Validation** | Zod | 3.x |
| **Drag & Drop** | @dnd-kit/core | 6.x |
| **UI Components** | Existing shadcn/ui | - |
| **Image Management** | Existing MediaUpload | - |
| **Testing** | Jest + React Testing Library | Latest |

---

## Database Schema

### New Table: `ClickPage`

```prisma
// prisma/schema.prisma

model ClickPage {
  id                String          @id @default(cuid())

  // Core Fields
  title             String          @db.VarChar(200)
  slug              String          @unique @db.VarChar(200)

  // Page Builder Content (JSON structure)
  blocks            Json            @default("[]")
  // Structure: Array<{ id: string, type: string, order: number, settings: object }>

  // Status & Publishing
  status            ClickPageStatus @default(DRAFT)
  publishedAt       DateTime?

  // SEO Fields (reuse Landing Page pattern)
  metaTitle         String?         @db.VarChar(200)
  metaDescription   String?         @db.VarChar(300)
  metaKeywords      String[]        @default([])
  ogImageUrl        String?
  twitterImageUrl   String?
  canonicalUrl      String?
  noIndex           Boolean         @default(false)

  // Analytics & Tracking
  fbPixelId         String?
  gaTrackingId      String?
  gtmContainerId    String?
  customScripts     String?         @db.Text // JSON string of head/body scripts

  // Metrics
  viewCount         Int             @default(0)
  clickCount        Int             @default(0)
  conversionCount   Int             @default(0)
  conversionRate    Decimal         @default(0) @db.Decimal(5, 2) // Percentage (0-100)

  // Campaign Information
  campaignName      String?         @db.VarChar(100)
  campaignStartDate DateTime?
  campaignEndDate   DateTime?

  // Relations
  createdById       String
  createdBy         User            @relation("ClickPageCreatedBy", fields: [createdById], references: [id])
  updatedById       String?
  updatedBy         User?           @relation("ClickPageUpdatedBy", fields: [updatedById], references: [id])

  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Indexes for performance
  @@index([slug])
  @@index([status])
  @@index([createdById])
  @@index([publishedAt])
  @@index([campaignStartDate, campaignEndDate])

  @@map("click_pages")
}

enum ClickPageStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  ARCHIVED

  @@map("click_page_status")
}

// Update User model
model User {
  // ... existing fields

  // Add Click Page relations
  clickPagesCreated  ClickPage[] @relation("ClickPageCreatedBy")
  clickPagesUpdated  ClickPage[] @relation("ClickPageUpdatedBy")
}
```

### Block Data Structure (JSON)

```typescript
// Stored in ClickPage.blocks as JSON
type BlockData = Array<{
  id: string;              // Unique block ID (cuid)
  type: BlockType;         // HERO, TEXT, CTA_BUTTON, etc.
  order: number;           // 0-based ordering
  settings: BlockSettings; // Block-specific settings (varies by type)
}>;

// Example:
[
  {
    "id": "clx123abc",
    "type": "HERO",
    "order": 0,
    "settings": {
      "title": "Summer Sale - 50% OFF!",
      "subtitle": "Limited time offer",
      "backgroundImage": "https://...",
      "backgroundColor": "#FF6B6B",
      "showCTA": true,
      "ctaText": "Shop Now",
      "ctaLink": "product-123",
      "showCountdown": true,
      "countdownEndDate": "2025-08-31T23:59:59Z"
    }
  },
  {
    "id": "clx456def",
    "type": "TEXT",
    "order": 1,
    "settings": {
      "content": "<p>Amazing product description...</p>",
      "alignment": "center",
      "maxWidth": "narrow"
    }
  }
]
```

### Database Constraints

```sql
-- Title must not be empty
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_title_check"
  CHECK (length(title) >= 1 AND length(title) <= 200);

-- Slug must be lowercase with hyphens only
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_slug_check"
  CHECK (slug ~ '^[a-z0-9-]+$');

-- Conversion rate must be between 0 and 100
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_conversion_rate_check"
  CHECK (conversion_rate >= 0 AND conversion_rate <= 100);

-- View/click/conversion counts must be non-negative
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_metrics_check"
  CHECK (view_count >= 0 AND click_count >= 0 AND conversion_count >= 0);
```

---

## Type System

### File: `src/types/click-page.types.ts`

```typescript
/**
 * Click Page Type Definitions
 * SINGLE SOURCE OF TRUTH for all Click Page types
 */

import { ClickPage as PrismaClickPage, ClickPageStatus } from '@prisma/client';

// ============================================================================
// Base Types
// ============================================================================

export type ClickPage = PrismaClickPage;
export { ClickPageStatus };

// ============================================================================
// Block Types
// ============================================================================

/**
 * All available block types
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
 * Base block structure (all blocks extend this)
 */
export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  settings: Record<string, unknown>;
}

// ============================================================================
// Block Settings Types
// ============================================================================

export interface HeroBlockSettings {
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor: string;
  textColor: string;
  height: 'small' | 'medium' | 'large' | 'full';
  alignment: 'left' | 'center' | 'right';
  showCTA: boolean;
  ctaText: string;
  ctaLink: string; // Product ID or URL
  ctaStyle: 'primary' | 'secondary' | 'outline';
  showCountdown: boolean;
  countdownEndDate: string | null;
  badges: Array<{
    text: string;
    color: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>;
}

export interface TextBlockSettings {
  content: string; // HTML from rich text editor
  alignment: 'left' | 'center' | 'right';
  maxWidth: 'narrow' | 'medium' | 'wide' | 'full';
  backgroundColor: string | null;
  padding: 'none' | 'small' | 'medium' | 'large';
}

export interface CTAButtonBlockSettings {
  text: string;
  link: string; // Product ID or URL
  linkType: 'product' | 'url' | 'email' | 'phone';
  style: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  icon: string | null; // Emoji or icon name
  alignment: 'left' | 'center' | 'right';
}

export interface ImageBlockSettings {
  imageUrl: string;
  altText: string;
  caption: string | null;
  size: 'small' | 'medium' | 'large' | 'full';
  alignment: 'left' | 'center' | 'right';
  clickAction: 'none' | 'lightbox' | 'product' | 'url';
  clickTarget: string | null; // Product ID or URL
}

export interface SpacerBlockSettings {
  height: number; // Pixels (10-200)
  backgroundColor: string | null;
}

export interface DividerBlockSettings {
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  thickness: number; // 1-5 pixels
  width: 25 | 50 | 75 | 100; // Percentage
  alignment: 'left' | 'center' | 'right';
}

export interface PricingTier {
  title: string;
  price: string;
  originalPrice: string | null;
  features: string[];
  productId: string;
  isPopular: boolean;
  ctaText: string;
}

export interface PricingTableBlockSettings {
  tiers: PricingTier[]; // 1-4 tiers
  columns: 1 | 2 | 3 | 4;
}

export interface Testimonial {
  customerName: string;
  location: string | null;
  customerPhoto: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
  beforeImage: string | null;
  afterImage: string | null;
}

export interface TestimonialBlockSettings {
  testimonials: Testimonial[]; // 1-6 testimonials
  layout: 'single' | 'grid' | 'carousel';
  columns: 1 | 2 | 3;
  showPhotos: boolean;
  showRatings: boolean;
  showBeforeAfter: boolean;
}

export interface CountdownTimerBlockSettings {
  endDate: string; // ISO 8601 format
  title: string;
  style: 'minimal' | 'boxed' | 'large';
  colorScheme: 'default' | 'danger' | 'success' | 'custom';
  customColors: {
    background: string;
    text: string;
  } | null;
  onExpire: 'hide' | 'showMessage' | 'redirect';
  expireMessage: string | null;
  expireRedirectUrl: string | null;
}

export interface SocialProofBlockSettings {
  type: 'reviews' | 'orders' | 'customers' | 'trust-badges';
  reviewImage: string | null; // Screenshot of reviews
  orderCount: string | null; // e.g., "17,295+"
  customerCount: string | null; // e.g., "1,326"
  starRating: 1 | 2 | 3 | 4 | 5 | null;
  trustBadgeImages: string[]; // Array of badge image URLs
  layout: 'horizontal' | 'vertical' | 'grid';
}

// ============================================================================
// Typed Block Interfaces
// ============================================================================

export interface HeroBlock extends BaseBlock {
  type: 'HERO';
  settings: HeroBlockSettings;
}

export interface TextBlock extends BaseBlock {
  type: 'TEXT';
  settings: TextBlockSettings;
}

export interface CTAButtonBlock extends BaseBlock {
  type: 'CTA_BUTTON';
  settings: CTAButtonBlockSettings;
}

export interface ImageBlock extends BaseBlock {
  type: 'IMAGE';
  settings: ImageBlockSettings;
}

export interface SpacerBlock extends BaseBlock {
  type: 'SPACER';
  settings: SpacerBlockSettings;
}

export interface DividerBlock extends BaseBlock {
  type: 'DIVIDER';
  settings: DividerBlockSettings;
}

export interface PricingTableBlock extends BaseBlock {
  type: 'PRICING_TABLE';
  settings: PricingTableBlockSettings;
}

export interface TestimonialBlock extends BaseBlock {
  type: 'TESTIMONIAL';
  settings: TestimonialBlockSettings;
}

export interface CountdownTimerBlock extends BaseBlock {
  type: 'COUNTDOWN_TIMER';
  settings: CountdownTimerBlockSettings;
}

export interface SocialProofBlock extends BaseBlock {
  type: 'SOCIAL_PROOF';
  settings: SocialProofBlockSettings;
}

// Union type of all blocks
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
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// ============================================================================
// Form Input Types
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

  // Tracking
  fbPixelId?: string;
  gaTrackingId?: string;
  gtmContainerId?: string;
  customScripts?: {
    head: string[];
    body: string[];
  };

  // Campaign
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

  // Tracking
  fbPixelId?: string;
  gaTrackingId?: string;
  gtmContainerId?: string;
  customScripts?: {
    head: string[];
    body: string[];
  };

  // Campaign
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

export interface ClickPagePublicResponse {
  clickPage: ClickPage;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ClickPageAnalytics {
  pageId: string;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  avgTimeOnPage: number; // Seconds
  topCTAs: Array<{
    blockId: string;
    blockType: string;
    clicks: number;
  }>;
}

export interface ConversionEvent {
  clickPageId: string;
  sessionId: string;
  clickedBlockId: string;
  productId: string | null;
  timestamp: Date;
  converted: boolean;
  orderId: string | null;
}
```

---

## Constants & Configuration

### File: `src/lib/constants/click-page-constants.ts`

```typescript
/**
 * Click Page Constants - Single Source of Truth
 * All click page-related constants and configurations
 *
 * IMPORTANT: This is SEPARATE from landing-page-constants.ts
 * Click Pages and Landing Pages are independent features
 */

export const CLICK_PAGE_CONSTANTS = {
  // ============================================================================
  // Status Configuration
  // ============================================================================
  STATUS: {
    DRAFT: {
      value: 'DRAFT' as const,
      label: 'Draft',
      color: 'gray',
      icon: 'FileEdit',
      description: 'Page is being edited and not visible to public',
    },
    PUBLISHED: {
      value: 'PUBLISHED' as const,
      label: 'Published',
      color: 'green',
      icon: 'Globe',
      description: 'Page is live and visible to public',
    },
    SCHEDULED: {
      value: 'SCHEDULED' as const,
      label: 'Scheduled',
      color: 'blue',
      icon: 'Clock',
      description: 'Page will be published at scheduled time',
    },
    ARCHIVED: {
      value: 'ARCHIVED' as const,
      label: 'Archived',
      color: 'red',
      icon: 'Archive',
      description: 'Page is archived and not visible',
    },
  },

  // ============================================================================
  // Validation Limits
  // ============================================================================
  VALIDATION: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 200,
    SLUG_MAX_LENGTH: 200,
    META_TITLE_MAX_LENGTH: 200,
    META_DESCRIPTION_MAX_LENGTH: 300,
    MAX_BLOCKS_PER_PAGE: 50,
    MAX_KEYWORDS: 10,

    // Block-specific limits
    HERO_TITLE_MAX_LENGTH: 100,
    HERO_SUBTITLE_MAX_LENGTH: 200,
    TEXT_CONTENT_MAX_LENGTH: 10000,
    CTA_TEXT_MAX_LENGTH: 50,
    TESTIMONIAL_QUOTE_MAX_LENGTH: 500,
    PRICING_TIER_TITLE_MAX_LENGTH: 50,
    PRICING_TIER_MAX_FEATURES: 10,
    MAX_PRICING_TIERS: 4,
    MAX_TESTIMONIALS: 6,
    SPACER_MIN_HEIGHT: 10,
    SPACER_MAX_HEIGHT: 200,
    DIVIDER_MIN_THICKNESS: 1,
    DIVIDER_MAX_THICKNESS: 5,
  },

  // ============================================================================
  // URL Routes
  // ============================================================================
  ROUTES: {
    // Admin routes
    ADMIN_LIST: '/admin/click-pages',
    ADMIN_CREATE: '/admin/click-pages/create',
    ADMIN_EDIT: (id: string) => `/admin/click-pages/${id}/edit`,
    ADMIN_ANALYTICS: (id: string) => `/admin/click-pages/${id}/analytics`,

    // API routes
    API_ADMIN_BASE: '/api/admin/click-pages',
    API_ADMIN_DETAIL: (id: string) => `/api/admin/click-pages/${id}`,
    API_ADMIN_ANALYTICS: (id: string) => `/api/admin/click-pages/${id}/analytics`,
    API_PUBLIC_BASE: '/api/public/click-pages',
    API_PUBLIC_DETAIL: (slug: string) => `/api/public/click-pages/${slug}`,
    API_TRACK_VIEW: (slug: string) => `/api/public/click-pages/${slug}/track-view`,
    API_TRACK_CLICK: (slug: string) => `/api/public/click-pages/${slug}/track-click`,

    // Public routes
    PUBLIC_LIST: '/click',
    PUBLIC_PAGE: (slug: string) => `/click/${slug}`,
  },

  // ============================================================================
  // UI Configuration
  // ============================================================================
  UI: {
    PAGES_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
    AUTOSAVE_INTERVAL_MS: 30000, // 30 seconds
    BLOCK_ANIMATION_DURATION_MS: 200,
  },

  // ============================================================================
  // Block Definitions
  // ============================================================================
  BLOCKS: {
    HERO: {
      type: 'HERO' as const,
      label: 'Hero Section',
      icon: '🎯',
      category: 'Layout',
      description: 'Eye-catching hero section with title, CTA, and optional countdown',
      defaultSettings: {
        title: 'Your Headline Here',
        subtitle: 'Compelling subtitle that drives action',
        backgroundImage: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        height: 'large' as const,
        alignment: 'center' as const,
        showCTA: true,
        ctaText: 'Get Started',
        ctaLink: '',
        ctaStyle: 'primary' as const,
        showCountdown: false,
        countdownEndDate: null,
        badges: [],
      },
    },
    TEXT: {
      type: 'TEXT' as const,
      label: 'Text Content',
      icon: '📝',
      category: 'Content',
      description: 'Rich text content with formatting options',
      defaultSettings: {
        content: '<p>Your content here...</p>',
        alignment: 'left' as const,
        maxWidth: 'medium' as const,
        backgroundColor: null,
        padding: 'medium' as const,
      },
    },
    CTA_BUTTON: {
      type: 'CTA_BUTTON' as const,
      label: 'CTA Button',
      icon: '🔘',
      category: 'Actions',
      description: 'Call-to-action button that drives conversions',
      defaultSettings: {
        text: 'Buy Now',
        link: '',
        linkType: 'product' as const,
        style: 'primary' as const,
        size: 'medium' as const,
        fullWidth: false,
        icon: null,
        alignment: 'center' as const,
      },
    },
    IMAGE: {
      type: 'IMAGE' as const,
      label: 'Image',
      icon: '🖼️',
      category: 'Media',
      description: 'Single image with optional caption and click action',
      defaultSettings: {
        imageUrl: '',
        altText: '',
        caption: null,
        size: 'medium' as const,
        alignment: 'center' as const,
        clickAction: 'none' as const,
        clickTarget: null,
      },
    },
    SPACER: {
      type: 'SPACER' as const,
      label: 'Spacer',
      icon: '↕️',
      category: 'Layout',
      description: 'Add vertical spacing between blocks',
      defaultSettings: {
        height: 40,
        backgroundColor: null,
      },
    },
    DIVIDER: {
      type: 'DIVIDER' as const,
      label: 'Divider',
      icon: '—',
      category: 'Layout',
      description: 'Visual separator between sections',
      defaultSettings: {
        style: 'solid' as const,
        color: '#e5e7eb',
        thickness: 1,
        width: 100 as const,
        alignment: 'center' as const,
      },
    },
    PRICING_TABLE: {
      type: 'PRICING_TABLE' as const,
      label: 'Pricing Table',
      icon: '💰',
      category: 'Marketing',
      description: 'Showcase pricing tiers and packages',
      defaultSettings: {
        tiers: [],
        columns: 3 as const,
      },
    },
    TESTIMONIAL: {
      type: 'TESTIMONIAL' as const,
      label: 'Testimonials',
      icon: '⭐',
      category: 'Marketing',
      description: 'Display customer reviews and testimonials',
      defaultSettings: {
        testimonials: [],
        layout: 'grid' as const,
        columns: 3 as const,
        showPhotos: true,
        showRatings: true,
        showBeforeAfter: false,
      },
    },
    COUNTDOWN_TIMER: {
      type: 'COUNTDOWN_TIMER' as const,
      label: 'Countdown Timer',
      icon: '⏰',
      category: 'Marketing',
      description: 'Create urgency with countdown timer',
      defaultSettings: {
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Offer Ends In:',
        style: 'boxed' as const,
        colorScheme: 'default' as const,
        customColors: null,
        onExpire: 'hide' as const,
        expireMessage: null,
        expireRedirectUrl: null,
      },
    },
    SOCIAL_PROOF: {
      type: 'SOCIAL_PROOF' as const,
      label: 'Social Proof',
      icon: '👥',
      category: 'Marketing',
      description: 'Show reviews, order counts, and trust badges',
      defaultSettings: {
        type: 'reviews' as const,
        reviewImage: null,
        orderCount: null,
        customerCount: null,
        starRating: null,
        trustBadgeImages: [],
        layout: 'horizontal' as const,
      },
    },
  },

  // ============================================================================
  // Analytics Configuration
  // ============================================================================
  ANALYTICS: {
    SESSION_COOKIE_NAME: 'click_page_session',
    SESSION_DURATION_DAYS: 30,
    CONVERSION_WINDOW_DAYS: 7, // Track conversions up to 7 days after visit
    MIN_TIME_ON_PAGE_MS: 1000, // Minimum time to count as valid view
  },

  // ============================================================================
  // Image Upload Configuration
  // ============================================================================
  IMAGE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
    ACCEPTED_MIME_TYPES: 'image/jpeg,image/png,image/webp',
    OPTIMAL_WIDTH: 1200,
    OPTIMAL_HEIGHT: 630,
  },
} as const;

// ============================================================================
// Type Helpers
// ============================================================================

export type ClickPageStatusValue = keyof typeof CLICK_PAGE_CONSTANTS.STATUS;
export type BlockCategory = 'Layout' | 'Content' | 'Actions' | 'Media' | 'Marketing';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate URL-friendly slug from title
 * @param title Click page title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, CLICK_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Validate slug format
 * @param slug Slug to validate
 * @returns true if valid
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Calculate conversion rate
 * @param conversions Number of conversions
 * @param views Number of views
 * @returns Conversion rate as percentage (0-100)
 */
export function calculateConversionRate(conversions: number, views: number): number {
  if (views === 0) return 0;
  return Math.round((conversions / views) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Get block definition by type
 * @param type Block type
 * @returns Block definition or undefined
 */
export function getBlockDefinition(type: keyof typeof CLICK_PAGE_CONSTANTS.BLOCKS) {
  return CLICK_PAGE_CONSTANTS.BLOCKS[type];
}

/**
 * Get all block types for a category
 * @param category Block category
 * @returns Array of block types in that category
 */
export function getBlocksByCategory(category: BlockCategory): string[] {
  return Object.values(CLICK_PAGE_CONSTANTS.BLOCKS)
    .filter(block => block.category === category)
    .map(block => block.type);
}
```

---

## Block System Architecture

### Block Registry

**File**: `src/lib/click-page/block-registry.ts`

```typescript
/**
 * Block Registry - Central block type management
 * Maps block types to their components and schemas
 */

import { BlockType } from '@/types/click-page.types';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

// Frontend block components (lazy-loaded)
export const FRONTEND_BLOCK_COMPONENTS = {
  HERO: () => import('@/components/click-pages/frontend/blocks/HeroBlock'),
  TEXT: () => import('@/components/click-pages/frontend/blocks/TextBlock'),
  CTA_BUTTON: () => import('@/components/click-pages/frontend/blocks/CTAButtonBlock'),
  IMAGE: () => import('@/components/click-pages/frontend/blocks/ImageBlock'),
  SPACER: () => import('@/components/click-pages/frontend/blocks/SpacerBlock'),
  DIVIDER: () => import('@/components/click-pages/frontend/blocks/DividerBlock'),
  PRICING_TABLE: () => import('@/components/click-pages/frontend/blocks/PricingTableBlock'),
  TESTIMONIAL: () => import('@/components/click-pages/frontend/blocks/TestimonialBlock'),
  COUNTDOWN_TIMER: () => import('@/components/click-pages/frontend/blocks/CountdownTimerBlock'),
  SOCIAL_PROOF: () => import('@/components/click-pages/frontend/blocks/SocialProofBlock'),
} as const;

// Admin block editor components
export const ADMIN_BLOCK_EDITORS = {
  HERO: () => import('@/components/click-pages/admin/blocks/HeroBlockEditor'),
  TEXT: () => import('@/components/click-pages/admin/blocks/TextBlockEditor'),
  CTA_BUTTON: () => import('@/components/click-pages/admin/blocks/CTAButtonBlockEditor'),
  IMAGE: () => import('@/components/click-pages/admin/blocks/ImageBlockEditor'),
  SPACER: () => import('@/components/click-pages/admin/blocks/SpacerBlockEditor'),
  DIVIDER: () => import('@/components/click-pages/admin/blocks/DividerBlockEditor'),
  PRICING_TABLE: () => import('@/components/click-pages/admin/blocks/PricingTableBlockEditor'),
  TESTIMONIAL: () => import('@/components/click-pages/admin/blocks/TestimonialBlockEditor'),
  COUNTDOWN_TIMER: () => import('@/components/click-pages/admin/blocks/CountdownTimerBlockEditor'),
  SOCIAL_PROOF: () => import('@/components/click-pages/admin/blocks/SocialProofBlockEditor'),
} as const;

/**
 * Get all block definitions
 */
export function getAllBlockDefinitions() {
  return Object.values(CLICK_PAGE_CONSTANTS.BLOCKS);
}

/**
 * Get block definition by type
 */
export function getBlockDefinition(type: BlockType) {
  return CLICK_PAGE_CONSTANTS.BLOCKS[type];
}

/**
 * Create new block with default settings
 */
export function createBlock(type: BlockType, order: number): any {
  const definition = getBlockDefinition(type);

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
    settings: { ...definition.defaultSettings },
  };
}

/**
 * Validate block structure
 */
export function isValidBlock(block: any): boolean {
  if (!block || typeof block !== 'object') return false;
  if (typeof block.id !== 'string') return false;
  if (typeof block.type !== 'string') return false;
  if (typeof block.order !== 'number') return false;
  if (!block.settings || typeof block.settings !== 'object') return false;

  return true;
}

/**
 * Reorder blocks
 */
export function reorderBlocks(blocks: any[], startIndex: number, endIndex: number): any[] {
  const result = Array.from(blocks);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  // Update order property
  return result.map((block, index) => ({
    ...block,
    order: index,
  }));
}
```

### Block Validation Schemas

**File**: `src/lib/click-page/block-schemas.ts`

```typescript
/**
 * Block Validation Schemas
 * Zod schemas for validating block settings
 */

import { z } from 'zod';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

const { VALIDATION } = CLICK_PAGE_CONSTANTS;

// ============================================================================
// Base Block Schema
// ============================================================================

export const baseBlockSchema = z.object({
  id: z.string().min(1, 'Block ID required'),
  type: z.enum([
    'HERO',
    'TEXT',
    'CTA_BUTTON',
    'IMAGE',
    'SPACER',
    'DIVIDER',
    'PRICING_TABLE',
    'TESTIMONIAL',
    'COUNTDOWN_TIMER',
    'SOCIAL_PROOF',
  ]),
  order: z.number().int().min(0),
  settings: z.record(z.unknown()),
});

// ============================================================================
// Block Settings Schemas
// ============================================================================

export const heroBlockSettingsSchema = z.object({
  title: z.string()
    .min(1, 'Title required')
    .max(VALIDATION.HERO_TITLE_MAX_LENGTH, `Title max ${VALIDATION.HERO_TITLE_MAX_LENGTH} characters`),
  subtitle: z.string()
    .max(VALIDATION.HERO_SUBTITLE_MAX_LENGTH, `Subtitle max ${VALIDATION.HERO_SUBTITLE_MAX_LENGTH} characters`),
  backgroundImage: z.string().url().optional().or(z.literal('')),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  height: z.enum(['small', 'medium', 'large', 'full']),
  alignment: z.enum(['left', 'center', 'right']),
  showCTA: z.boolean(),
  ctaText: z.string().max(VALIDATION.CTA_TEXT_MAX_LENGTH),
  ctaLink: z.string(),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']),
  showCountdown: z.boolean(),
  countdownEndDate: z.string().datetime().nullable(),
  badges: z.array(z.object({
    text: z.string().max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  })),
});

export const textBlockSettingsSchema = z.object({
  content: z.string()
    .min(1, 'Content required')
    .max(VALIDATION.TEXT_CONTENT_MAX_LENGTH),
  alignment: z.enum(['left', 'center', 'right']),
  maxWidth: z.enum(['narrow', 'medium', 'wide', 'full']),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  padding: z.enum(['none', 'small', 'medium', 'large']),
});

export const ctaButtonBlockSettingsSchema = z.object({
  text: z.string()
    .min(1, 'Button text required')
    .max(VALIDATION.CTA_TEXT_MAX_LENGTH),
  link: z.string().min(1, 'Link required'),
  linkType: z.enum(['product', 'url', 'email', 'phone']),
  style: z.enum(['primary', 'secondary', 'outline', 'ghost']),
  size: z.enum(['small', 'medium', 'large']),
  fullWidth: z.boolean(),
  icon: z.string().nullable(),
  alignment: z.enum(['left', 'center', 'right']),
});

export const imageBlockSettingsSchema = z.object({
  imageUrl: z.string().url('Must be valid URL'),
  altText: z.string().min(1, 'Alt text required for accessibility'),
  caption: z.string().nullable(),
  size: z.enum(['small', 'medium', 'large', 'full']),
  alignment: z.enum(['left', 'center', 'right']),
  clickAction: z.enum(['none', 'lightbox', 'product', 'url']),
  clickTarget: z.string().nullable(),
});

export const spacerBlockSettingsSchema = z.object({
  height: z.number()
    .int()
    .min(VALIDATION.SPACER_MIN_HEIGHT, `Minimum ${VALIDATION.SPACER_MIN_HEIGHT}px`)
    .max(VALIDATION.SPACER_MAX_HEIGHT, `Maximum ${VALIDATION.SPACER_MAX_HEIGHT}px`),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
});

export const dividerBlockSettingsSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  thickness: z.number()
    .int()
    .min(VALIDATION.DIVIDER_MIN_THICKNESS)
    .max(VALIDATION.DIVIDER_MAX_THICKNESS),
  width: z.enum([25, 50, 75, 100]),
  alignment: z.enum(['left', 'center', 'right']),
});

export const pricingTierSchema = z.object({
  title: z.string()
    .min(1, 'Title required')
    .max(VALIDATION.PRICING_TIER_TITLE_MAX_LENGTH),
  price: z.string().min(1, 'Price required'),
  originalPrice: z.string().nullable(),
  features: z.array(z.string())
    .max(VALIDATION.PRICING_TIER_MAX_FEATURES, `Max ${VALIDATION.PRICING_TIER_MAX_FEATURES} features`),
  productId: z.string().min(1, 'Product ID required'),
  isPopular: z.boolean(),
  ctaText: z.string().max(VALIDATION.CTA_TEXT_MAX_LENGTH),
});

export const pricingTableBlockSettingsSchema = z.object({
  tiers: z.array(pricingTierSchema)
    .min(1, 'At least 1 tier required')
    .max(VALIDATION.MAX_PRICING_TIERS, `Max ${VALIDATION.MAX_PRICING_TIERS} tiers`),
  columns: z.enum([1, 2, 3, 4]),
});

export const testimonialSchema = z.object({
  customerName: z.string().min(1, 'Name required').max(100),
  location: z.string().max(100).nullable(),
  customerPhoto: z.string().url().nullable(),
  rating: z.enum([1, 2, 3, 4, 5]),
  quote: z.string()
    .min(1, 'Quote required')
    .max(VALIDATION.TESTIMONIAL_QUOTE_MAX_LENGTH),
  beforeImage: z.string().url().nullable(),
  afterImage: z.string().url().nullable(),
});

export const testimonialBlockSettingsSchema = z.object({
  testimonials: z.array(testimonialSchema)
    .min(1, 'At least 1 testimonial required')
    .max(VALIDATION.MAX_TESTIMONIALS),
  layout: z.enum(['single', 'grid', 'carousel']),
  columns: z.enum([1, 2, 3]),
  showPhotos: z.boolean(),
  showRatings: z.boolean(),
  showBeforeAfter: z.boolean(),
});

export const countdownTimerBlockSettingsSchema = z.object({
  endDate: z.string().datetime('Must be valid ISO 8601 date'),
  title: z.string().max(100),
  style: z.enum(['minimal', 'boxed', 'large']),
  colorScheme: z.enum(['default', 'danger', 'success', 'custom']),
  customColors: z.object({
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).nullable(),
  onExpire: z.enum(['hide', 'showMessage', 'redirect']),
  expireMessage: z.string().nullable(),
  expireRedirectUrl: z.string().url().nullable(),
});

export const socialProofBlockSettingsSchema = z.object({
  type: z.enum(['reviews', 'orders', 'customers', 'trust-badges']),
  reviewImage: z.string().url().nullable(),
  orderCount: z.string().nullable(),
  customerCount: z.string().nullable(),
  starRating: z.enum([1, 2, 3, 4, 5]).nullable(),
  trustBadgeImages: z.array(z.string().url()),
  layout: z.enum(['horizontal', 'vertical', 'grid']),
});

// ============================================================================
// Typed Block Schemas
// ============================================================================

export const heroBlockSchema = baseBlockSchema.extend({
  type: z.literal('HERO'),
  settings: heroBlockSettingsSchema,
});

export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal('TEXT'),
  settings: textBlockSettingsSchema,
});

export const ctaButtonBlockSchema = baseBlockSchema.extend({
  type: z.literal('CTA_BUTTON'),
  settings: ctaButtonBlockSettingsSchema,
});

export const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal('IMAGE'),
  settings: imageBlockSettingsSchema,
});

export const spacerBlockSchema = baseBlockSchema.extend({
  type: z.literal('SPACER'),
  settings: spacerBlockSettingsSchema,
});

export const dividerBlockSchema = baseBlockSchema.extend({
  type: z.literal('DIVIDER'),
  settings: dividerBlockSettingsSchema,
});

export const pricingTableBlockSchema = baseBlockSchema.extend({
  type: z.literal('PRICING_TABLE'),
  settings: pricingTableBlockSettingsSchema,
});

export const testimonialBlockSchema = baseBlockSchema.extend({
  type: z.literal('TESTIMONIAL'),
  settings: testimonialBlockSettingsSchema,
});

export const countdownTimerBlockSchema = baseBlockSchema.extend({
  type: z.literal('COUNTDOWN_TIMER'),
  settings: countdownTimerBlockSettingsSchema,
});

export const socialProofBlockSchema = baseBlockSchema.extend({
  type: z.literal('SOCIAL_PROOF'),
  settings: socialProofBlockSettingsSchema,
});

// ============================================================================
// Union Schema
// ============================================================================

export const blockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  textBlockSchema,
  ctaButtonBlockSchema,
  imageBlockSchema,
  spacerBlockSchema,
  dividerBlockSchema,
  pricingTableBlockSchema,
  testimonialBlockSchema,
  countdownTimerBlockSchema,
  socialProofBlockSchema,
]);

export const blocksArraySchema = z.array(blockSchema)
  .max(VALIDATION.MAX_BLOCKS_PER_PAGE, `Maximum ${VALIDATION.MAX_BLOCKS_PER_PAGE} blocks per page`);
```

---

## Component Structure

### Frontend Components

```
src/components/click-pages/frontend/
├── BlockRenderer.tsx              # Main block renderer
├── ClickPageHead.tsx              # SEO & tracking scripts
├── ClickPageLayout.tsx            # Wrapper layout
└── blocks/
    ├── HeroBlock.tsx
    ├── TextBlock.tsx
    ├── CTAButtonBlock.tsx
    ├── ImageBlock.tsx
    ├── SpacerBlock.tsx
    ├── DividerBlock.tsx
    ├── PricingTableBlock.tsx
    ├── TestimonialBlock.tsx
    ├── CountdownTimerBlock.tsx
    └── SocialProofBlock.tsx
```

### Admin Components

```
src/components/click-pages/admin/
├── PageBuilder.tsx                # Main page builder interface
├── BlockLibrary.tsx               # Block type selector
├── BlockSettings.tsx              # Settings sidebar
├── LivePreview.tsx                # Real-time preview panel
├── BlockDragHandle.tsx            # Drag handle component
└── blocks/
    ├── HeroBlockEditor.tsx
    ├── TextBlockEditor.tsx
    ├── CTAButtonBlockEditor.tsx
    ├── ImageBlockEditor.tsx
    ├── SpacerBlockEditor.tsx
    ├── DividerBlockEditor.tsx
    ├── PricingTableBlockEditor.tsx
    ├── TestimonialBlockEditor.tsx
    ├── CountdownTimerBlockEditor.tsx
    └── SocialProofBlockEditor.tsx
```

### Key Component: BlockRenderer

**File**: `src/components/click-pages/frontend/BlockRenderer.tsx`

```typescript
'use client';

import { Block } from '@/types/click-page.types';
import { lazy, Suspense } from 'react';

// Lazy-load block components
const HeroBlock = lazy(() => import('./blocks/HeroBlock'));
const TextBlock = lazy(() => import('./blocks/TextBlock'));
const CTAButtonBlock = lazy(() => import('./blocks/CTAButtonBlock'));
const ImageBlock = lazy(() => import('./blocks/ImageBlock'));
const SpacerBlock = lazy(() => import('./blocks/SpacerBlock'));
const DividerBlock = lazy(() => import('./blocks/DividerBlock'));
const PricingTableBlock = lazy(() => import('./blocks/PricingTableBlock'));
const TestimonialBlock = lazy(() => import('./blocks/TestimonialBlock'));
const CountdownTimerBlock = lazy(() => import('./blocks/CountdownTimerBlock'));
const SocialProofBlock = lazy(() => import('./blocks/SocialProofBlock'));

const BLOCK_COMPONENTS = {
  HERO: HeroBlock,
  TEXT: TextBlock,
  CTA_BUTTON: CTAButtonBlock,
  IMAGE: ImageBlock,
  SPACER: SpacerBlock,
  DIVIDER: DividerBlock,
  PRICING_TABLE: PricingTableBlock,
  TESTIMONIAL: TestimonialBlock,
  COUNTDOWN_TIMER: CountdownTimerBlock,
  SOCIAL_PROOF: SocialProofBlock,
} as const;

interface BlockRendererProps {
  blocks: Block[];
  onBlockClick?: (blockId: string) => void;
}

export function BlockRenderer({ blocks, onBlockClick }: BlockRendererProps) {
  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="block-renderer">
      {sortedBlocks.map((block) => {
        const BlockComponent = BLOCK_COMPONENTS[block.type];

        if (!BlockComponent) {
          console.error(`Unknown block type: ${block.type}`);
          return null;
        }

        return (
          <Suspense key={block.id} fallback={<div className="block-loading">Loading...</div>}>
            <div
              className="block-wrapper"
              onClick={() => onBlockClick?.(block.id)}
              data-block-id={block.id}
              data-block-type={block.type}
            >
              <BlockComponent settings={block.settings} blockId={block.id} />
            </div>
          </Suspense>
        );
      })}
    </div>
  );
}
```

---

## API Routes

### Admin API Routes

```
src/app/api/admin/click-pages/
├── route.ts                       # GET (list), POST (create)
├── [id]/
│   ├── route.ts                   # GET (detail), PUT (update), DELETE
│   └── analytics/
│       └── route.ts               # GET (analytics data)
└── reorder/
    └── route.ts                   # POST (bulk reorder)
```

### Public API Routes

```
src/app/api/public/click-pages/
├── route.ts                       # GET (list published pages)
└── [slug]/
    ├── route.ts                   # GET (single page)
    ├── track-view/
    │   └── route.ts               # POST (track page view)
    └── track-click/
        └── route.ts               # POST (track CTA click)
```

### Example: Create Click Page API

**File**: `src/app/api/admin/click-pages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { blocksArraySchema } from '@/lib/click-page/block-schemas';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';

// ============================================================================
// Validation Schema
// ============================================================================

const createClickPageSchema = z.object({
  title: z.string()
    .min(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH),
  slug: z.string()
    .min(1)
    .max(CLICK_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  blocks: blocksArraySchema,
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  publishedAt: z.string().datetime().optional(),

  // SEO
  metaTitle: z.string().max(CLICK_PAGE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH).optional(),
  metaDescription: z.string().max(CLICK_PAGE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH).optional(),
  metaKeywords: z.array(z.string()).max(CLICK_PAGE_CONSTANTS.VALIDATION.MAX_KEYWORDS).optional(),
  ogImageUrl: z.string().url().optional(),
  twitterImageUrl: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().optional(),

  // Tracking
  fbPixelId: z.string().optional(),
  gaTrackingId: z.string().optional(),
  gtmContainerId: z.string().optional(),
  customScripts: z.object({
    head: z.array(z.string()),
    body: z.array(z.string()),
  }).optional(),

  // Campaign
  campaignName: z.string().max(100).optional(),
  campaignStartDate: z.string().datetime().optional(),
  campaignEndDate: z.string().datetime().optional(),
});

// ============================================================================
// POST - Create Click Page
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Login required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = createClickPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 3. Check slug uniqueness
    const existingPage = await prisma.clickPage.findUnique({
      where: { slug: data.slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 409 }
      );
    }

    // 4. Create click page
    const clickPage = await prisma.clickPage.create({
      data: {
        title: data.title,
        slug: data.slug,
        blocks: data.blocks,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,

        // SEO
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords || [],
        ogImageUrl: data.ogImageUrl,
        twitterImageUrl: data.twitterImageUrl,
        canonicalUrl: data.canonicalUrl,
        noIndex: data.noIndex || false,

        // Tracking
        fbPixelId: data.fbPixelId,
        gaTrackingId: data.gaTrackingId,
        gtmContainerId: data.gtmContainerId,
        customScripts: data.customScripts ? JSON.stringify(data.customScripts) : null,

        // Campaign
        campaignName: data.campaignName,
        campaignStartDate: data.campaignStartDate ? new Date(data.campaignStartDate) : null,
        campaignEndDate: data.campaignEndDate ? new Date(data.campaignEndDate) : null,

        // Relations
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      clickPage,
    });

  } catch (error) {
    console.error('[API] Create click page error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create click page',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List Click Pages
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // 3. Build where clause
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 4. Fetch click pages with pagination
    const [clickPages, total] = await Promise.all([
      prisma.clickPage.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clickPage.count({ where }),
    ]);

    // 5. Return response
    return NextResponse.json({
      success: true,
      clickPages,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (error) {
    console.error('[API] List click pages error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

---

## Validation Schemas

### Click Page Validation

**File**: `src/lib/validations/click-page-validation.ts`

```typescript
/**
 * Click Page Validation Schemas
 * Centralized validation using Zod
 */

import { z } from 'zod';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';
import { blocksArraySchema } from '@/lib/click-page/block-schemas';

const { VALIDATION } = CLICK_PAGE_CONSTANTS;

// ============================================================================
// Create Click Page Schema
// ============================================================================

export const createClickPageSchema = z.object({
  title: z.string()
    .min(VALIDATION.TITLE_MIN_LENGTH, `Title must be at least ${VALIDATION.TITLE_MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE_MAX_LENGTH, `Title max ${VALIDATION.TITLE_MAX_LENGTH} characters`),

  slug: z.string()
    .min(1, 'Slug required')
    .max(VALIDATION.SLUG_MAX_LENGTH, `Slug max ${VALIDATION.SLUG_MAX_LENGTH} characters`)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),

  blocks: blocksArraySchema,

  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),

  publishedAt: z.string().datetime().optional(),

  // SEO
  metaTitle: z.string()
    .max(VALIDATION.META_TITLE_MAX_LENGTH)
    .optional(),
  metaDescription: z.string()
    .max(VALIDATION.META_DESCRIPTION_MAX_LENGTH)
    .optional(),
  metaKeywords: z.array(z.string())
    .max(VALIDATION.MAX_KEYWORDS, `Max ${VALIDATION.MAX_KEYWORDS} keywords`)
    .optional(),
  ogImageUrl: z.string().url().optional(),
  twitterImageUrl: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().optional(),

  // Tracking
  fbPixelId: z.string().optional(),
  gaTrackingId: z.string().optional(),
  gtmContainerId: z.string().optional(),
  customScripts: z.object({
    head: z.array(z.string()),
    body: z.array(z.string()),
  }).optional(),

  // Campaign
  campaignName: z.string().max(100).optional(),
  campaignStartDate: z.string().datetime().optional(),
  campaignEndDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    // If status is PUBLISHED, publishedAt must be set
    if (data.status === 'PUBLISHED' && !data.publishedAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Published date required when status is PUBLISHED',
    path: ['publishedAt'],
  }
).refine(
  (data) => {
    // Campaign end date must be after start date
    if (data.campaignStartDate && data.campaignEndDate) {
      return new Date(data.campaignEndDate) > new Date(data.campaignStartDate);
    }
    return true;
  },
  {
    message: 'Campaign end date must be after start date',
    path: ['campaignEndDate'],
  }
);

// ============================================================================
// Update Click Page Schema (all fields optional except what's required)
// ============================================================================

export const updateClickPageSchema = createClickPageSchema.partial();

// ============================================================================
// Track Click Schema
// ============================================================================

export const trackClickSchema = z.object({
  sessionId: z.string().min(1),
  blockId: z.string().min(1),
  blockType: z.string().min(1),
  productId: z.string().optional(),
  targetUrl: z.string().optional(),
});

// ============================================================================
// Track View Schema
// ============================================================================

export const trackViewSchema = z.object({
  sessionId: z.string().min(1),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});
```

---

## File Structure

### Complete Directory Tree

```
src/
├── app/
│   ├── click/                                  # Public pages
│   │   ├── page.tsx                            # List all click pages
│   │   └── [slug]/
│   │       └── page.tsx                        # Single click page
│   │
│   ├── admin/
│   │   └── click-pages/                        # Admin interface
│   │       ├── page.tsx                        # List/manage pages
│   │       ├── create/
│   │       │   └── page.tsx                    # Create new page
│   │       └── [id]/
│   │           ├── edit/
│   │           │   └── page.tsx                # Edit page
│   │           └── analytics/
│   │               └── page.tsx                # Analytics dashboard
│   │
│   └── api/
│       ├── admin/
│       │   └── click-pages/
│       │       ├── route.ts                    # List, Create
│       │       ├── [id]/
│       │       │   ├── route.ts                # Get, Update, Delete
│       │       │   └── analytics/
│       │       │       └── route.ts            # Analytics data
│       │       └── reorder/
│       │           └── route.ts                # Bulk reorder
│       │
│       └── public/
│           └── click-pages/
│               ├── route.ts                    # List published
│               └── [slug]/
│                   ├── route.ts                # Get single
│                   ├── track-view/
│                   │   └── route.ts            # Track view
│                   └── track-click/
│                       └── route.ts            # Track click
│
├── components/
│   └── click-pages/
│       ├── admin/
│       │   ├── PageBuilder.tsx                 # Main builder UI
│       │   ├── BlockLibrary.tsx                # Block selector
│       │   ├── BlockSettings.tsx               # Settings panel
│       │   ├── LivePreview.tsx                 # Preview panel
│       │   ├── BlockDragHandle.tsx             # Drag handle
│       │   └── blocks/
│       │       ├── HeroBlockEditor.tsx
│       │       ├── TextBlockEditor.tsx
│       │       ├── CTAButtonBlockEditor.tsx
│       │       ├── ImageBlockEditor.tsx
│       │       ├── SpacerBlockEditor.tsx
│       │       ├── DividerBlockEditor.tsx
│       │       ├── PricingTableBlockEditor.tsx
│       │       ├── TestimonialBlockEditor.tsx
│       │       ├── CountdownTimerBlockEditor.tsx
│       │       └── SocialProofBlockEditor.tsx
│       │
│       └── frontend/
│           ├── BlockRenderer.tsx               # Main renderer
│           ├── ClickPageHead.tsx               # SEO/tracking
│           ├── ClickPageLayout.tsx             # Wrapper
│           └── blocks/
│               ├── HeroBlock.tsx
│               ├── TextBlock.tsx
│               ├── CTAButtonBlock.tsx
│               ├── ImageBlock.tsx
│               ├── SpacerBlock.tsx
│               ├── DividerBlock.tsx
│               ├── PricingTableBlock.tsx
│               ├── TestimonialBlock.tsx
│               ├── CountdownTimerBlock.tsx
│               └── SocialProofBlock.tsx
│
├── lib/
│   ├── constants/
│   │   └── click-page-constants.ts            # All constants
│   │
│   ├── click-page/
│   │   ├── block-registry.ts                  # Block management
│   │   ├── block-schemas.ts                   # Zod schemas
│   │   └── block-utils.ts                     # Utility functions
│   │
│   ├── validations/
│   │   └── click-page-validation.ts           # API validation
│   │
│   └── services/
│       └── click-page-analytics.service.ts    # Analytics logic
│
├── types/
│   └── click-page.types.ts                    # TypeScript types
│
└── __tests__/
    └── click-pages/
        ├── block-registry.test.ts             # Unit tests
        ├── block-schemas.test.ts
        ├── click-page-validation.test.ts
        └── api/
            ├── create-click-page.test.ts      # Integration tests
            ├── update-click-page.test.ts
            └── analytics.test.ts
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Days 1-2: Database & Types**
- [ ] Create Prisma schema for `ClickPage` model
- [ ] Run migration: `npx prisma migrate dev --name add_click_pages`
- [ ] Create `click-page.types.ts` with all TypeScript types
- [ ] Create `click-page-constants.ts` with all constants
- [ ] Create block validation schemas

**Days 3-4: Block Registry & Utils**
- [ ] Create `block-registry.ts`
- [ ] Create `block-schemas.ts` (Zod validation for all 9 blocks)
- [ ] Create `block-utils.ts` (helper functions)
- [ ] Write unit tests for registry and schemas

**Days 5-7: Core Components (3 blocks)**
- [ ] Create `BlockRenderer.tsx`
- [ ] Implement Hero Block (frontend + admin editor)
- [ ] Implement Text Block (frontend + admin editor)
- [ ] Implement CTA Button Block (frontend + admin editor)
- [ ] Write component tests

### Phase 2: Page Builder Admin (Week 2)

**Days 8-10: Admin Infrastructure**
- [ ] Install `@dnd-kit/core` dependency
- [ ] Create `PageBuilder.tsx` main component
- [ ] Create `BlockLibrary.tsx` (block selector)
- [ ] Create `BlockSettings.tsx` (settings panel)
- [ ] Create `LivePreview.tsx` (preview panel)
- [ ] Implement drag & drop with @dnd-kit

**Days 11-12: Remaining Basic Blocks**
- [ ] Implement Image Block (frontend + admin)
- [ ] Implement Spacer Block (frontend + admin)
- [ ] Implement Divider Block (frontend + admin)

**Days 13-14: Admin Pages**
- [ ] Create `/admin/click-pages` (list page)
- [ ] Create `/admin/click-pages/create` (create page)
- [ ] Create `/admin/click-pages/[id]/edit` (edit page)

### Phase 3: Marketing Blocks (Week 3)

**Days 15-16: Pricing & Testimonials**
- [ ] Implement Pricing Table Block (frontend + admin)
- [ ] Implement Testimonial Block (frontend + admin)
- [ ] Write block tests

**Days 17-18: Timer & Social Proof**
- [ ] Implement Countdown Timer Block (frontend + admin)
- [ ] Implement Social Proof Block (frontend + admin)
- [ ] Write block tests

**Days 19-20: Admin API Routes**
- [ ] Create `/api/admin/click-pages` (list, create)
- [ ] Create `/api/admin/click-pages/[id]` (get, update, delete)
- [ ] Write API integration tests

**Day 21: Public Routes**
- [ ] Create `/api/public/click-pages` (list published)
- [ ] Create `/api/public/click-pages/[slug]` (get single)
- [ ] Create `/click/[slug]/page.tsx` (frontend page)

### Phase 4: Analytics & Polish (Week 4)

**Days 22-23: Analytics**
- [ ] Create tracking API routes (track-view, track-click)
- [ ] Implement `click-page-analytics.service.ts`
- [ ] Create `/admin/click-pages/[id]/analytics` page
- [ ] Implement conversion tracking

**Days 24-25: SEO & Tracking**
- [ ] Implement `ClickPageHead.tsx` (meta tags, FB Pixel, GA)
- [ ] Add custom scripts injection
- [ ] Test all tracking pixels

**Days 26-27: Testing**
- [ ] Write unit tests (target: 80%+ coverage)
- [ ] Write integration tests for all API routes
- [ ] Manual QA testing

**Day 28: Deployment**
- [ ] Code review
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Monitor errors

---

## Testing Requirements

### Unit Tests

**Block Registry Tests** (`block-registry.test.ts`)
```typescript
describe('Block Registry', () => {
  it('should return all block definitions', () => {
    const blocks = getAllBlockDefinitions();
    expect(blocks).toHaveLength(10);
  });

  it('should create block with default settings', () => {
    const block = createBlock('HERO', 0);
    expect(block).toHaveProperty('id');
    expect(block.type).toBe('HERO');
    expect(block.order).toBe(0);
    expect(block.settings).toBeDefined();
  });

  it('should reorder blocks correctly', () => {
    const blocks = [
      { id: '1', type: 'HERO', order: 0, settings: {} },
      { id: '2', type: 'TEXT', order: 1, settings: {} },
      { id: '3', type: 'CTA_BUTTON', order: 2, settings: {} },
    ];

    const reordered = reorderBlocks(blocks, 0, 2);
    expect(reordered[0].id).toBe('2');
    expect(reordered[1].id).toBe('3');
    expect(reordered[2].id).toBe('1');
  });
});
```

**Block Schema Tests** (`block-schemas.test.ts`)
```typescript
describe('Block Schemas', () => {
  describe('Hero Block Schema', () => {
    it('should validate correct hero block', () => {
      const validBlock = {
        id: 'block_123',
        type: 'HERO',
        order: 0,
        settings: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          backgroundImage: '',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          height: 'large',
          alignment: 'center',
          showCTA: true,
          ctaText: 'Click Me',
          ctaLink: 'product-123',
          ctaStyle: 'primary',
          showCountdown: false,
          countdownEndDate: null,
          badges: [],
        },
      };

      const result = heroBlockSchema.safeParse(validBlock);
      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const invalidBlock = {
        id: 'block_123',
        type: 'HERO',
        order: 0,
        settings: {
          backgroundColor: 'not-a-color', // Invalid
          // ... other fields
        },
      };

      const result = heroBlockSchema.safeParse(invalidBlock);
      expect(result.success).toBe(false);
    });
  });
});
```

### Integration Tests

**API Route Tests** (`create-click-page.test.ts`)
```typescript
describe('POST /api/admin/click-pages', () => {
  it('should create click page with valid data', async () => {
    const response = await fetch('/api/admin/click-pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie, // Auth session
      },
      body: JSON.stringify({
        title: 'Summer Sale 2025',
        slug: 'summer-sale-2025',
        blocks: [
          {
            id: 'block_123',
            type: 'HERO',
            order: 0,
            settings: { /* ... */ },
          },
        ],
        status: 'DRAFT',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.clickPage).toBeDefined();
    expect(data.clickPage.slug).toBe('summer-sale-2025');
  });

  it('should reject duplicate slug', async () => {
    // Create first page
    await createClickPage({ slug: 'test-page' });

    // Try to create with same slug
    const response = await fetch('/api/admin/click-pages', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Another Page',
        slug: 'test-page', // Duplicate!
        blocks: [],
        status: 'DRAFT',
      }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  it('should require authentication', async () => {
    const response = await fetch('/api/admin/click-pages', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });
});
```

### Test Coverage Goals
- Unit tests: **≥80%** coverage
- Integration tests: All API routes
- Critical paths: Create, Update, Publish, Analytics

---

## Dependencies

### New Dependencies to Install

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "jest": "^29.7.0"
  }
}
```

### Installation Command
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D @testing-library/react @testing-library/jest-dom jest
```

### Existing Dependencies (Reused)
- ✅ Next.js 14
- ✅ TypeScript 5
- ✅ Prisma (existing)
- ✅ Zod (existing)
- ✅ shadcn/ui (existing)
- ✅ TailwindCSS (existing)

---

## Migration Scripts

### Database Migration

**File**: `prisma/migrations/YYYYMMDD_add_click_pages/migration.sql`

```sql
-- CreateEnum for ClickPageStatus
CREATE TYPE "click_page_status" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "click_pages" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "click_page_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(300),
    "meta_keywords" TEXT[],
    "og_image_url" TEXT,
    "twitter_image_url" TEXT,
    "canonical_url" TEXT,
    "no_index" BOOLEAN NOT NULL DEFAULT false,
    "fb_pixel_id" TEXT,
    "ga_tracking_id" TEXT,
    "gtm_container_id" TEXT,
    "custom_scripts" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "campaign_name" VARCHAR(100),
    "campaign_start_date" TIMESTAMP(3),
    "campaign_end_date" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "click_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "click_pages_slug_key" ON "click_pages"("slug");
CREATE INDEX "click_pages_slug_idx" ON "click_pages"("slug");
CREATE INDEX "click_pages_status_idx" ON "click_pages"("status");
CREATE INDEX "click_pages_created_by_id_idx" ON "click_pages"("created_by_id");
CREATE INDEX "click_pages_published_at_idx" ON "click_pages"("published_at");
CREATE INDEX "click_pages_campaign_start_date_campaign_end_date_idx" ON "click_pages"("campaign_start_date", "campaign_end_date");

-- AddForeignKey
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add constraints
ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_title_check"
  CHECK (length(title) >= 1 AND length(title) <= 200);

ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_slug_check"
  CHECK (slug ~ '^[a-z0-9-]+$');

ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_conversion_rate_check"
  CHECK (conversion_rate >= 0 AND conversion_rate <= 100);

ALTER TABLE "click_pages" ADD CONSTRAINT "click_pages_metrics_check"
  CHECK (view_count >= 0 AND click_count >= 0 AND conversion_count >= 0);
```

### Run Migration
```bash
# Generate migration
npx prisma migrate dev --name add_click_pages

# Generate Prisma Client
npx prisma generate

# Verify migration
npx prisma migrate status
```

---

## Code Examples

### Example: Hero Block Component

**Frontend** (`HeroBlock.tsx`)
```typescript
'use client';

import { HeroBlockSettings } from '@/types/click-page.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface HeroBlockProps {
  settings: HeroBlockSettings;
  blockId: string;
}

export default function HeroBlock({ settings, blockId }: HeroBlockProps) {
  const {
    title,
    subtitle,
    backgroundImage,
    backgroundColor,
    textColor,
    height,
    alignment,
    showCTA,
    ctaText,
    ctaLink,
    ctaStyle,
    badges,
  } = settings;

  const heightClasses = {
    small: 'min-h-[300px]',
    medium: 'min-h-[500px]',
    large: 'min-h-[700px]',
    full: 'min-h-screen',
  };

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <section
      className={`hero-block relative ${heightClasses[height]} flex flex-col justify-center`}
      style={{ backgroundColor }}
      data-block-id={blockId}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" /> {/* Overlay */}
        </div>
      )}

      {/* Content */}
      <div className={`container mx-auto px-4 md:px-6 lg:px-16 relative z-10 flex flex-col ${alignmentClasses[alignment]} gap-6`}>
        {/* Badges */}
        {badges.map((badge, index) => (
          <Badge
            key={index}
            className="absolute"
            style={{
              backgroundColor: badge.color,
              [badge.position.includes('top') ? 'top' : 'bottom']: '1rem',
              [badge.position.includes('left') ? 'left' : 'right']: '1rem',
            }}
          >
            {badge.text}
          </Badge>
        ))}

        {/* Title */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold"
          style={{ color: textColor }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-xl md:text-2xl lg:text-3xl"
            style={{ color: textColor, opacity: 0.9 }}
          >
            {subtitle}
          </p>
        )}

        {/* CTA Button */}
        {showCTA && (
          <Button
            size="lg"
            variant={ctaStyle}
            asChild
            className="mt-4"
          >
            <a href={`/products/${ctaLink}`}>{ctaText}</a>
          </Button>
        )}
      </div>
    </section>
  );
}
```

**Admin Editor** (`HeroBlockEditor.tsx`)
```typescript
'use client';

import { HeroBlockSettings } from '@/types/click-page.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeroBlockEditorProps {
  settings: HeroBlockSettings;
  onChange: (settings: HeroBlockSettings) => void;
}

export default function HeroBlockEditor({ settings, onChange }: HeroBlockEditorProps) {
  const updateSetting = <K extends keyof HeroBlockSettings>(
    key: K,
    value: HeroBlockSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Hero Block Settings</h3>

      {/* Title */}
      <div>
        <Label htmlFor="hero-title">Title *</Label>
        <Input
          id="hero-title"
          value={settings.title}
          onChange={(e) => updateSetting('title', e.target.value)}
          placeholder="Your Headline Here"
          maxLength={100}
        />
      </div>

      {/* Subtitle */}
      <div>
        <Label htmlFor="hero-subtitle">Subtitle</Label>
        <Textarea
          id="hero-subtitle"
          value={settings.subtitle}
          onChange={(e) => updateSetting('subtitle', e.target.value)}
          placeholder="Compelling subtitle..."
          maxLength={200}
        />
      </div>

      {/* Background Image */}
      <div>
        <Label htmlFor="hero-bg">Background Image URL</Label>
        <Input
          id="hero-bg"
          type="url"
          value={settings.backgroundImage}
          onChange={(e) => updateSetting('backgroundImage', e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Background Color */}
      <div>
        <Label htmlFor="hero-bg-color">Background Color</Label>
        <Input
          id="hero-bg-color"
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => updateSetting('backgroundColor', e.target.value)}
        />
      </div>

      {/* Height */}
      <div>
        <Label htmlFor="hero-height">Height</Label>
        <Select
          value={settings.height}
          onValueChange={(value) => updateSetting('height', value as any)}
        >
          <SelectTrigger id="hero-height">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (300px)</SelectItem>
            <SelectItem value="medium">Medium (500px)</SelectItem>
            <SelectItem value="large">Large (700px)</SelectItem>
            <SelectItem value="full">Full Screen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show CTA */}
      <div className="flex items-center gap-3">
        <Switch
          id="hero-show-cta"
          checked={settings.showCTA}
          onCheckedChange={(checked) => updateSetting('showCTA', checked)}
        />
        <Label htmlFor="hero-show-cta">Show CTA Button</Label>
      </div>

      {/* CTA Settings (conditional) */}
      {settings.showCTA && (
        <>
          <div>
            <Label htmlFor="hero-cta-text">CTA Button Text</Label>
            <Input
              id="hero-cta-text"
              value={settings.ctaText}
              onChange={(e) => updateSetting('ctaText', e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="hero-cta-link">CTA Link (Product ID or URL)</Label>
            <Input
              id="hero-cta-link"
              value={settings.ctaLink}
              onChange={(e) => updateSetting('ctaLink', e.target.value)}
              placeholder="product-123"
            />
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Success Criteria

### MVP is complete when:

✅ **Core Features**
- [ ] All 9 block types implemented (frontend + admin)
- [ ] Drag & drop block reordering works
- [ ] Page builder saves and loads correctly
- [ ] Public pages render all blocks correctly
- [ ] Analytics tracking (views, clicks, conversions)

✅ **Quality Standards**
- [ ] All code follows `CODING_STANDARDS.md`
- [ ] No `any` types used
- [ ] All user inputs validated (3-layer validation)
- [ ] All async operations have try-catch blocks
- [ ] Unit test coverage ≥80%
- [ ] All integration tests pass

✅ **Functionality**
- [ ] Admin can create/edit/delete click pages
- [ ] Admin can publish/unpublish pages
- [ ] Public can view published pages
- [ ] SEO meta tags work correctly
- [ ] FB Pixel, GA, GTM tracking works
- [ ] Mobile responsive on all blocks

✅ **Documentation**
- [ ] Code has clear comments
- [ ] Types are well-documented
- [ ] README updated with click pages info

---

## Notes for Developer

### Important Reminders

1. **Separate from Landing Pages**
   - Click Pages are NOT Landing Pages
   - Separate constants, types, components, routes
   - Only share design system primitives (Button, Input, etc.)

2. **Single Source of Truth**
   - All constants in `click-page-constants.ts`
   - All types in `click-page.types.ts`
   - No hardcoded values

3. **Type Safety**
   - NEVER use `any` type
   - All function params and returns must be typed
   - Use Zod for runtime validation

4. **Three-Layer Validation**
   - Frontend: HTML5 validation
   - API: Zod schema validation
   - Database: Prisma constraints

5. **Error Handling**
   - All `await` in try-catch
   - Log errors with context
   - User-friendly error messages

6. **Testing**
   - Write tests DURING development, not after
   - Test edge cases and error conditions
   - Mock external services (MediaUpload, etc.)

### Questions? Issues?

If you encounter any ambiguity:
1. Check this document first
2. Check `CODING_STANDARDS.md`
3. Check existing Landing Pages implementation for patterns
4. Ask for clarification rather than guessing

---

**END OF DOCUMENT**

*This document is the SINGLE SOURCE OF TRUTH for Click Pages implementation.*
*Last Updated: 2025-01-24*
*Version: 1.0.0*
