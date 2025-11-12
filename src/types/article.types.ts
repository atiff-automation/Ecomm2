/**
 * Article Type Definitions
 * Centralized TypeScript types for Article feature
 */

import {
  Article as PrismaArticle,
  ArticleCategory as PrismaArticleCategory,
  ArticleTag as PrismaArticleTag,
  ArticleStatus,
} from '@prisma/client';

// Base types from Prisma
export type Article = PrismaArticle;
export type ArticleCategory = PrismaArticleCategory;
export type ArticleTag = PrismaArticleTag;

// Article with full relations
export interface ArticleWithRelations extends Article {
  category: ArticleCategory;
  tags: Array<{
    tag: ArticleTag;
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

// Article for public display
export interface ArticlePublic {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  category: {
    name: string;
    slug: string;
    color: string | null;
  };
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

// Article list item (for listing pages)
export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string;
  featuredImageAlt: string;
  category: {
    name: string;
    slug: string;
    color: string | null;
  };
  author: {
    firstName: string;
    lastName: string;
  };
  publishedAt: Date;
  readingTimeMin: number;
  viewCount: number;
}

// Article create input
export interface ArticleCreateInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  categoryId: string;
  tags: string[]; // Array of tag names
  status: ArticleStatus;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

// Article update input
export interface ArticleUpdateInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

// Article filter options
export interface ArticleFilter {
  category?: string;
  tag?: string;
  status?: ArticleStatus | 'ALL';
  author?: string;
  search?: string;
}

// Article reorder input
export interface ArticleReorderInput {
  id: string;
  sortOrder: number;
}

// API Response types
export interface ArticleListResponse {
  articles: ArticleWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ArticleResponse {
  article: ArticleWithRelations;
}

export interface ArticlePublicResponse {
  article: ArticlePublic;
}

export interface ArticlePublicListResponse {
  articles: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
  tags: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
}

// Form types for admin
export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  categoryId: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: Date;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

// Category types
export interface ArticleCategoryWithCount extends ArticleCategory {
  _count: {
    articles: number;
  };
}

export interface ArticleCategoryCreateInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ArticleCategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}
