/**
 * Landing Page Type Definitions
 * Centralized TypeScript types for Landing Page feature
 */

import {
  LandingPage as PrismaLandingPage,
  LandingPageTag as PrismaLandingPageTag,
  LandingPageStatus,
} from '@prisma/client';

// Base types from Prisma
export type LandingPage = PrismaLandingPage;
export type LandingPageTag = PrismaLandingPageTag;
export { LandingPageStatus };

// Landing Page with full relations
export interface LandingPageWithRelations extends LandingPage {
  tags: Array<{
    tag: LandingPageTag;
  }>;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
}

// Landing Page for public display
export interface LandingPagePublic {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  tags: Array<{
    name: string;
    slug: string;
  }>;
  author: {
    firstName: string;
    lastName: string;
  };
  publishedAt: Date;
  readingTimeMin: number;
  viewCount: number;
}

// Landing Page list item (for listing pages)
export interface LandingPageListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string;
  featuredImageAlt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  publishedAt: Date;
  readingTimeMin: number;
  viewCount: number;
}

// Landing Page create input
export interface LandingPageCreateInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  tags: string[]; // Array of tag names
  status: LandingPageStatus;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

// Landing Page update input
export interface LandingPageUpdateInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  tags?: string[];
  status?: LandingPageStatus;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

// Landing Page filter options
export interface LandingPageFilter {
  tag?: string;
  status?: LandingPageStatus | 'ALL';
  author?: string;
  search?: string;
}

// Landing Page reorder input
export interface LandingPageReorderInput {
  id: string;
  sortOrder: number;
}

// API Response types
export interface LandingPageListResponse {
  landingPages: LandingPageWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LandingPageResponse {
  landingPage: LandingPageWithRelations;
}

export interface LandingPagePublicResponse {
  landingPage: LandingPagePublic;
}

export interface LandingPagePublicListResponse {
  landingPages: LandingPageListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tags: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

// Form types for admin
export interface LandingPageFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  tags: string[];
  status: LandingPageStatus;
  publishedAt?: Date;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

// ============================================================================
// Embed Types - Product Cards in Landing Pages
// ============================================================================

/**
 * Product Embed Data
 * Minimal product information for embedding in landing pages
 * Optimized for performance with only essential fields
 */
export interface ProductEmbedData {
  id: string;
  slug: string;
  name: string;
  regularPrice: number;
  memberPrice: number;
  featuredImage: string;
  stockQuantity: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

/**
 * Cached Product
 * Product data with cache metadata
 */
export interface CachedProduct extends ProductEmbedData {
  cachedAt: number; // Unix timestamp
  ttl: number; // Time to live in milliseconds
}

/**
 * Product Embed Cache Entry
 * Internal cache structure for ProductEmbedService
 */
export interface ProductEmbedCacheEntry {
  data: ProductEmbedData;
  expiresAt: number; // Unix timestamp
}
