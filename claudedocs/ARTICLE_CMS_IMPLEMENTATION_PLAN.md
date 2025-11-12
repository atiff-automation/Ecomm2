# ARTICLE CMS - COMPREHENSIVE IMPLEMENTATION PLAN

**Project:** JRM HOLISTIK E-commerce Platform
**Feature:** Article CMS with SEO Optimization
**Timeline:** 12-15 hours (1.5-2 weeks part-time)
**Developer Guide:** Step-by-step systematic implementation
**Date Created:** November 12, 2025

---

## 📋 TABLE OF CONTENTS

1. [Overview & Architecture](#overview--architecture)
2. [Readiness Assessment](#readiness-assessment)
3. [Coding Standards Compliance](#coding-standards-compliance)
4. [Dependencies Setup](#dependencies-setup)
5. [Database Design](#database-design)
6. [Type Definitions & Constants](#type-definitions--constants)
7. [Validation Schemas](#validation-schemas)
8. [API Design](#api-design)
9. [Rich Text Editor Integration](#rich-text-editor-integration)
10. [Admin Interface](#admin-interface)
11. [Public Interface](#public-interface)
12. [SEO Implementation](#seo-implementation)
13. [Implementation Steps](#implementation-steps)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Checklist](#deployment-checklist)

---

## 🎯 OVERVIEW & ARCHITECTURE

### Purpose
Build a full-featured Article CMS optimized for SEO that allows admins to create, edit, organize, and publish blog articles to improve organic search traffic and provide valuable content to customers.

### Key Features
- ✅ Create, Read, Update, Delete Articles
- ✅ Rich text editor (TipTap) with formatting, emojis, bold/headings
- ✅ Featured image upload (required, SEO-optimized)
- ✅ Dynamic categories (admin-managed, like FAQ system)
- ✅ Free-form tags for taxonomy
- ✅ Simple Draft → Published workflow
- ✅ SEO fields: slug, meta title/description, keywords
- ✅ Author attribution (admin users)
- ✅ Reading time calculation
- ✅ Related articles suggestion
- ✅ Search and filter in admin
- ✅ Public listing page (`/article`) with pagination (13 per page)
- ✅ Single article page (`/article/[slug]`)
- ✅ Social sharing Open Graph tags
- ✅ Structured data (Article schema, breadcrumbs)
- ✅ Auto-generated sitemap integration

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Rich Text Editor:** TipTap (new dependency)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Image Processing:** Sharp (already available)
- **Validation:** Zod
- **UI Components:** Existing component library + Radix UI

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT SIDE                            │
├─────────────────────────────────────────────────────────────┤
│  Public Pages                 Admin Interface                │
│  /article                    /admin/content/articles         │
│  ├─ Listing (13/page)        ├─ List Articles                │
│  ├─ Search & Filter          ├─ Create Article               │
│  ├─ Category Filter          ├─ Edit Article                 │
│  ├─ Tag Filter               ├─ Delete Article               │
│  └─ Pagination               ├─ Manage Categories            │
│                              └─ Drag-drop Reorder            │
│  /article/[slug]                                             │
│  ├─ Hero Image                                               │
│  ├─ Article Content                                          │
│  ├─ Author Info                                              │
│  ├─ Reading Time                                             │
│  ├─ Social Share                                             │
│  ├─ Related Articles                                         │
│  └─ Breadcrumbs                                              │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  /api/admin/articles                                         │
│  ├─ GET    /api/admin/articles          (List all)          │
│  ├─ POST   /api/admin/articles          (Create)            │
│  ├─ GET    /api/admin/articles/[id]     (Get one)           │
│  ├─ PUT    /api/admin/articles/[id]     (Update)            │
│  ├─ DELETE /api/admin/articles/[id]     (Delete)            │
│  └─ PATCH  /api/admin/articles/reorder  (Reorder)           │
│                                                               │
│  /api/admin/article-categories                               │
│  ├─ GET    /api/admin/article-categories         (List)     │
│  ├─ POST   /api/admin/article-categories         (Create)   │
│  ├─ PUT    /api/admin/article-categories/[id]    (Update)   │
│  ├─ DELETE /api/admin/article-categories/[id]    (Delete)   │
│  └─ PATCH  /api/admin/article-categories/reorder (Reorder)  │
│                                                               │
│  /api/public/articles                                        │
│  ├─ GET    /api/public/articles         (Published only)    │
│  └─ GET    /api/public/articles/[slug]  (Single article)    │
│                                                               │
│  /api/upload/image                                           │
│  └─ POST   /api/upload/image            (Featured image)    │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM → PostgreSQL                                    │
│  ├─ Article Model                                           │
│  ├─ ArticleCategory Model                                   │
│  ├─ ArticleTag Model (many-to-many)                         │
│  └─ Relationships & Indexes                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 READINESS ASSESSMENT

### ✅ Existing Infrastructure (Ready to Use)

**1. Database & ORM**
- ✅ PostgreSQL configured and running
- ✅ Prisma ORM fully set up
- ✅ Migration system working (tested with FAQ)
- ✅ User model with audit relations ready

**2. Image Upload System**
- ✅ `/src/components/ui/image-upload.tsx` component available
- ✅ `/src/lib/upload/image-upload.ts` utility functions
- ✅ `/api/upload/image` endpoint functional
- ✅ Sharp for image optimization installed
- ✅ Railway Volume configured for production uploads

**3. SEO Infrastructure**
- ✅ `/src/lib/seo/seo-service.ts` comprehensive SEO service
- ✅ Structured data support (Schema.org)
- ✅ Open Graph and Twitter Card support
- ✅ Meta tag generation utilities
- ✅ FAQ schema example available

**4. Admin Panel Structure**
- ✅ Admin layout (`/src/app/admin/layout.tsx`)
- ✅ Admin sidebar navigation
- ✅ Content section exists (`/admin/content/`)
- ✅ Drag-drop reorder component (`DragDropTable`)
- ✅ Admin authentication middleware

**5. UI Component Library**
- ✅ Form components (Input, Textarea, Select, Button)
- ✅ Card, Badge, Dialog components
- ✅ Toast notifications (Sonner)
- ✅ Loading states (Spinner, Skeleton)
- ✅ Pagination component
- ✅ Search and filter components

**6. Patterns & Examples**
- ✅ FAQ CMS as reference implementation
- ✅ Dynamic category system (FAQCategory model)
- ✅ API route patterns established
- ✅ Zod validation patterns
- ✅ TypeScript type patterns
- ✅ Constants management pattern

### ❌ Missing Dependencies

**1. TipTap Rich Text Editor** ⚠️ CRITICAL
- Need to install: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`
- Required for rich content editing

### 📊 Readiness Score: 95%

**Summary:** Codebase is highly ready. Only missing TipTap dependency. All other infrastructure, patterns, and utilities are in place. Implementation can proceed systematically following FAQ CMS patterns.

---

## 🔐 CODING STANDARDS COMPLIANCE

All code MUST follow `claudedocs/CODING_STANDARDS.md` and project `CLAUDE.md`. Key requirements:

### 1. Single Source of Truth
```typescript
// ✅ CORRECT: Constants in one place
// src/lib/constants/article-constants.ts
export const ARTICLE_CONSTANTS = {
  STATUS: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
  },
  VALIDATION: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 200,
    CONTENT_MIN_LENGTH: 100,
    SLUG_MAX_LENGTH: 200,
  },
} as const;

// ❌ WRONG: Hardcoding values everywhere
if (article.status === 'DRAFT') { ... }
```

### 2. No Hardcoding
```typescript
// ✅ CORRECT: Use constants and environment variables
const API_BASE = '/api/admin/articles';
const MAX_EXCERPT_LENGTH = ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH;

// ❌ WRONG: Hardcoded values
const endpoint = '/api/admin/articles';
if (excerpt.length > 300) { ... }
```

### 3. Type Safety
```typescript
// ✅ CORRECT: Explicit types
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: ArticleStatus;
  publishedAt: Date | null;
}

// ❌ WRONG: Using 'any'
function updateArticle(data: any) { ... }
```

### 4. Three-Layer Validation
```typescript
// Layer 1: Frontend validation (React Hook Form + Zod)
const formSchema = z.object({ ... });

// Layer 2: API validation (Zod in API route)
const body = articleCreateSchema.parse(await request.json());

// Layer 3: Database constraints (Prisma schema)
model Article {
  title String @db.VarChar(200)
  slug  String @unique
}
```

### 5. Error Handling
```typescript
// ✅ CORRECT: Try-catch with proper error types
try {
  const article = await prisma.article.create({ data });
  return NextResponse.json(article, { status: 201 });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 409 }
      );
    }
  }
  throw error;
}

// ❌ WRONG: No error handling
const article = await prisma.article.create({ data });
return NextResponse.json(article);
```

---

## 📦 DEPENDENCIES SETUP

### Step 1: Install TipTap Editor

**Package Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-style
```

**Packages Explained:**
- `@tiptap/react` - React wrapper for TipTap
- `@tiptap/starter-kit` - Essential extensions (bold, italic, heading, lists, etc.)
- `@tiptap/extension-link` - Hyperlink support
- `@tiptap/extension-image` - Image embedding
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-text-align` - Text alignment (left, center, right)
- `@tiptap/extension-underline` - Underline text
- `@tiptap/extension-color` - Text color (for icons/emojis)
- `@tiptap/extension-text-style` - Text styling base

### Step 2: Verify Existing Dependencies

These are already installed (verified from package.json):
- ✅ `@prisma/client` - Database ORM
- ✅ `sharp` - Image processing
- ✅ `zod` - Validation
- ✅ `react-hook-form` - Form management
- ✅ `@hookform/resolvers` - Zod resolver for forms
- ✅ `lucide-react` - Icons (includes emoji support)
- ✅ `sonner` - Toast notifications
- ✅ `@radix-ui/*` - UI primitives

---

## 🗄️ DATABASE DESIGN

### Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
// Article Status Enum
enum ArticleStatus {
  DRAFT
  PUBLISHED
}

// Article Category Model - Dynamic categories managed by admin
model ArticleCategory {
  id          String   @id @default(cuid())

  // Category Name
  name        String   @unique
  slug        String   @unique
  description String?

  // Display
  icon        String?  // Icon name (e.g., "BookOpen", "Lightbulb")
  color       String?  // Hex color for category badge
  sortOrder   Int      @default(0)

  // Status
  isActive    Boolean  @default(true)

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?
  updatedBy   String?

  // Relations
  articles    Article[]
  createdByUser User?  @relation("ArticleCategoryCreatedBy", fields: [createdBy], references: [id])
  updatedByUser User?  @relation("ArticleCategoryUpdatedBy", fields: [updatedBy], references: [id])

  @@index([slug])
  @@index([isActive])
  @@index([sortOrder])
  @@map("article_categories")
}

// Article Tag Model - Free-form tags for taxonomy
model ArticleTag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  // Relations
  articles  ArticleToTag[]

  @@index([slug])
  @@map("article_tags")
}

// Article to Tag Junction Table (Many-to-Many)
model ArticleToTag {
  id        String   @id @default(cuid())
  articleId String
  tagId     String
  createdAt DateTime @default(now())

  article   Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       ArticleTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([articleId, tagId])
  @@index([articleId])
  @@index([tagId])
  @@map("article_to_tags")
}

// Article Model
model Article {
  id               String         @id @default(cuid())

  // Basic Content
  title            String         @db.VarChar(200)
  slug             String         @unique @db.VarChar(200)
  excerpt          String?        @db.VarChar(500)
  content          String         @db.Text // Rich text HTML from TipTap
  featuredImage    String         // Required featured image URL
  featuredImageAlt String         @db.VarChar(200)

  // Organization
  categoryId       String
  category         ArticleCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  tags             ArticleToTag[]
  sortOrder        Int            @default(0)

  // SEO Fields
  metaTitle        String?        @db.VarChar(200)
  metaDescription  String?        @db.VarChar(300)
  metaKeywords     String[]       // Array of keywords

  // Author
  authorId         String
  author           User           @relation("ArticleAuthor", fields: [authorId], references: [id])

  // Publishing
  status           ArticleStatus  @default(DRAFT)
  publishedAt      DateTime?

  // Analytics
  viewCount        Int            @default(0)
  readingTimeMin   Int            @default(0) // Auto-calculated

  // Metadata
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdBy        String?
  updatedBy        String?

  // Audit Relations
  createdByUser    User?          @relation("ArticleCreatedBy", fields: [createdBy], references: [id])
  updatedByUser    User?          @relation("ArticleUpdatedBy", fields: [updatedBy], references: [id])

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@index([categoryId])
  @@index([authorId])
  @@index([sortOrder])
  @@index([viewCount])
  @@index([createdAt])
  @@map("articles")
}
```

### Update User Model

Add Article relations to existing User model:

```prisma
model User {
  // ... existing fields ...

  // Article relations
  articles              Article[]          @relation("ArticleAuthor")
  articlesCreated       Article[]          @relation("ArticleCreatedBy")
  articlesUpdated       Article[]          @relation("ArticleUpdatedBy")
  articleCategoriesCreated ArticleCategory[] @relation("ArticleCategoryCreatedBy")
  articleCategoriesUpdated ArticleCategory[] @relation("ArticleCategoryUpdatedBy")
}
```

### Database Indexes Rationale

- `slug`: Primary lookup for public pages (UNIQUE)
- `status`: Frequently filtered (draft vs published)
- `publishedAt`: Sorting published articles by date
- `categoryId`: Filtering by category
- `authorId`: Author-specific queries
- `sortOrder`: Manual ordering in admin
- `viewCount`: Popular articles queries
- `createdAt`: Default sorting

### Migration Command

```bash
# Generate migration
npx prisma migrate dev --name add_article_cms

# If migration fails, check existing schema
npx prisma db pull
npx prisma generate
```

---

## 📘 TYPE DEFINITIONS & CONSTANTS

### Step 1: Create Constants File

**File:** `src/lib/constants/article-constants.ts`

```typescript
/**
 * Article Constants - Single Source of Truth
 * All article-related constants and configurations
 */

export const ARTICLE_CONSTANTS = {
  // Status options
  STATUS: {
    DRAFT: {
      value: 'DRAFT',
      label: 'Draft',
      color: 'gray',
      icon: 'FileEdit',
    },
    PUBLISHED: {
      value: 'PUBLISHED',
      label: 'Published',
      color: 'green',
      icon: 'Globe',
    },
  },

  // Validation limits
  VALIDATION: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 200,
    EXCERPT_MIN_LENGTH: 20,
    EXCERPT_MAX_LENGTH: 500,
    CONTENT_MIN_LENGTH: 100,
    SLUG_MAX_LENGTH: 200,
    META_TITLE_MAX_LENGTH: 200,
    META_DESCRIPTION_MAX_LENGTH: 300,
    FEATURED_IMAGE_ALT_MAX_LENGTH: 200,
    MAX_TAGS: 10,
    READING_SPEED_WPM: 200, // Words per minute for reading time calculation
  },

  // API endpoints
  API_ROUTES: {
    ADMIN_ARTICLES: '/api/admin/articles',
    ADMIN_CATEGORIES: '/api/admin/article-categories',
    PUBLIC_ARTICLES: '/api/public/articles',
  },

  // UI Configuration
  UI: {
    ARTICLES_PER_PAGE: 13,
    RELATED_ARTICLES_COUNT: 3,
    SEARCH_DEBOUNCE_MS: 300,
    EXCERPT_LENGTH: 150, // Characters for auto-generated excerpt
  },
} as const;

// Type helpers
export type ArticleStatusValue = keyof typeof ARTICLE_CONSTANTS.STATUS;

/**
 * Calculate reading time from content
 * @param content HTML content from TipTap
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Count words (split by whitespace)
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

  // Calculate reading time (round up to nearest minute)
  const minutes = Math.ceil(wordCount / ARTICLE_CONSTANTS.VALIDATION.READING_SPEED_WPM);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Generate URL-friendly slug from title
 * @param title Article title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, ARTICLE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Generate excerpt from content
 * @param content HTML content
 * @param length Maximum length
 * @returns Plain text excerpt
 */
export function generateExcerpt(content: string, length: number = ARTICLE_CONSTANTS.UI.EXCERPT_LENGTH): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Trim to length
  if (text.length <= length) {
    return text;
  }

  // Cut at last complete word
  const trimmed = text.substring(0, length);
  const lastSpace = trimmed.lastIndexOf(' ');

  return trimmed.substring(0, lastSpace > 0 ? lastSpace : length) + '...';
}
```

### Step 2: Create Type Definitions

**File:** `src/types/article.types.ts`

```typescript
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
```

---

## ✅ VALIDATION SCHEMAS

### Step 3: Create Zod Schemas

**File:** `src/lib/validations/article-validation.ts`

```typescript
/**
 * Article Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';

// Status enum
const articleStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

// Slug validation - URL-safe characters only
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(ARTICLE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH, 'Slug is too long')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  });

// Base article schema
export const articleBaseSchema = z.object({
  title: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
      `Title must be at least ${ARTICLE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH} characters`
    )
    .max(
      ARTICLE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
      `Title must not exceed ${ARTICLE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters`
    )
    .trim(),

  slug: slugSchema,

  excerpt: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH,
      `Excerpt must be at least ${ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MIN_LENGTH} characters`
    )
    .max(
      ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH,
      `Excerpt must not exceed ${ARTICLE_CONSTANTS.VALIDATION.EXCERPT_MAX_LENGTH} characters`
    )
    .trim()
    .optional(),

  content: z
    .string()
    .min(
      ARTICLE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH,
      `Content must be at least ${ARTICLE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH} characters`
    )
    .trim(),

  featuredImage: z.string().url('Featured image must be a valid URL'),

  featuredImageAlt: z
    .string()
    .min(1, 'Image alt text is required for SEO')
    .max(
      ARTICLE_CONSTANTS.VALIDATION.FEATURED_IMAGE_ALT_MAX_LENGTH,
      'Alt text is too long'
    )
    .trim(),

  categoryId: z.string().cuid('Invalid category ID'),

  tags: z
    .array(z.string().trim().min(1))
    .max(ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS, `Maximum ${ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS} tags allowed`)
    .default([]),

  status: articleStatusEnum.default('DRAFT'),

  publishedAt: z.coerce.date().optional(),

  // SEO fields
  metaTitle: z
    .string()
    .max(
      ARTICLE_CONSTANTS.VALIDATION.META_TITLE_MAX_LENGTH,
      'Meta title is too long'
    )
    .trim()
    .optional(),

  metaDescription: z
    .string()
    .max(
      ARTICLE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH,
      'Meta description is too long'
    )
    .trim()
    .optional(),

  metaKeywords: z
    .array(z.string().trim().min(1))
    .max(10, 'Maximum 10 keywords allowed')
    .default([]),
});

// Create article schema (used in forms and API)
export const articleCreateSchema = articleBaseSchema.refine(
  (data) => {
    // If status is PUBLISHED, publishedAt is required
    if (data.status === 'PUBLISHED' && !data.publishedAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Published date is required when status is Published',
    path: ['publishedAt'],
  }
);

// Update article schema (all fields optional)
export const articleUpdateSchema = articleBaseSchema.partial();

// Reorder schema
export const articleReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid article ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Filter schema
export const articleFilterSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  status: z.union([articleStatusEnum, z.literal('ALL')]).optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(ARTICLE_CONSTANTS.UI.ARTICLES_PER_PAGE),
});

// ID parameter schema
export const articleIdSchema = z.string().cuid('Invalid article ID');

// Slug parameter schema
export const articleSlugSchema = z.string().min(1, 'Slug is required');

// Category validation schemas
export const articleCategoryBaseSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100).trim(),
  slug: slugSchema,
  description: z.string().max(500).trim().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code').optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const articleCategoryCreateSchema = articleCategoryBaseSchema;
export const articleCategoryUpdateSchema = articleCategoryBaseSchema.partial();

// Type exports
export type ArticleCreateSchema = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateSchema = z.infer<typeof articleUpdateSchema>;
export type ArticleReorderSchema = z.infer<typeof articleReorderSchema>;
export type ArticleFilterSchema = z.infer<typeof articleFilterSchema>;
export type ArticleCategoryCreateSchema = z.infer<typeof articleCategoryCreateSchema>;
export type ArticleCategoryUpdateSchema = z.infer<typeof articleCategoryUpdateSchema>;
```

---

## 🔌 API DESIGN

### API Route Structure

```
src/app/api/
├── admin/
│   ├── articles/
│   │   ├── route.ts                    # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   └── route.ts               # GET, PUT, DELETE
│   │   └── reorder/
│   │       └── route.ts               # PATCH
│   └── article-categories/
│       ├── route.ts                    # GET (list), POST (create)
│       ├── [id]/
│       │   └── route.ts               # GET, PUT, DELETE
│       └── reorder/
│           └── route.ts               # PATCH
└── public/
    └── articles/
        ├── route.ts                    # GET (list published)
        └── [slug]/
            └── route.ts               # GET (single article)
```

### Step 4: Admin API - List & Create Articles

**File:** `src/app/api/admin/articles/route.ts`

```typescript
/**
 * Admin Articles API - List & Create
 * GET  /api/admin/articles - List all articles
 * POST /api/admin/articles - Create new article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { articleCreateSchema, articleFilterSchema } from '@/lib/validations/article-validation';
import { calculateReadingTime } from '@/lib/constants/article-constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/articles
 * List all articles with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = articleFilterSchema.parse({
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      status: searchParams.get('status') || undefined,
      author: searchParams.get('author') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    // 3. Build Prisma where clause
    const where: Prisma.ArticleWhereInput = {};

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.tag) {
      where.tags = {
        some: {
          tag: { slug: filters.tag },
        },
      };
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.author) {
      where.authorId = filters.author;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 4. Calculate pagination
    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // 5. Fetch articles with relations and count
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
      prisma.article.count({ where }),
    ]);

    // 6. Calculate total pages
    const totalPages = Math.ceil(total / filters.pageSize);

    // 7. Return response
    return NextResponse.json({
      articles,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/articles
 * Create new article
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const validatedData = articleCreateSchema.parse(json);

    // 3. Calculate reading time from content
    const readingTimeMin = calculateReadingTime(validatedData.content);

    // 4. Handle tags - create new ones if needed
    const tagConnections = await Promise.all(
      validatedData.tags.map(async (tagName) => {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

        // Upsert tag (create if doesn't exist)
        const tag = await prisma.articleTag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: {
            name: tagName,
            slug: tagSlug,
          },
        });

        return { tagId: tag.id };
      })
    );

    // 5. Create article in database
    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        featuredImage: validatedData.featuredImage,
        featuredImageAlt: validatedData.featuredImageAlt,
        categoryId: validatedData.categoryId,
        status: validatedData.status,
        publishedAt: validatedData.status === 'PUBLISHED'
          ? validatedData.publishedAt || new Date()
          : null,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        metaKeywords: validatedData.metaKeywords,
        readingTimeMin,
        authorId: session.user.id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        tags: {
          create: tagConnections,
        },
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 6. Return created article
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
```

### Step 5: Admin API - Get, Update, Delete

**File:** `src/app/api/admin/articles/[id]/route.ts`

```typescript
/**
 * Admin Articles API - Get, Update, Delete
 * GET    /api/admin/articles/[id] - Get single article
 * PUT    /api/admin/articles/[id] - Update article
 * DELETE /api/admin/articles/[id] - Delete article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { articleUpdateSchema, articleIdSchema } from '@/lib/validations/article-validation';
import { calculateReadingTime } from '@/lib/constants/article-constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/articles/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const articleId = articleIdSchema.parse(params.id);

    // 3. Fetch article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/articles/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const articleId = articleIdSchema.parse(params.id);

    // 3. Check article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        tags: true,
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 4. Parse and validate update data
    const json = await request.json();
    const validatedData = articleUpdateSchema.parse(json);

    // 5. Calculate reading time if content changed
    let readingTimeMin = existingArticle.readingTimeMin;
    if (validatedData.content) {
      readingTimeMin = calculateReadingTime(validatedData.content);
    }

    // 6. Handle tags if provided
    let tagOperations = {};
    if (validatedData.tags) {
      // Delete existing tag connections
      await prisma.articleToTag.deleteMany({
        where: { articleId },
      });

      // Create new tag connections
      const tagConnections = await Promise.all(
        validatedData.tags.map(async (tagName) => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

          const tag = await prisma.articleTag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: {
              name: tagName,
              slug: tagSlug,
            },
          });

          return { tagId: tag.id };
        })
      );

      tagOperations = {
        tags: {
          create: tagConnections,
        },
      };
    }

    // 7. Handle publishedAt logic
    let publishedAtUpdate = {};
    if (validatedData.status === 'PUBLISHED' && !existingArticle.publishedAt) {
      publishedAtUpdate = {
        publishedAt: validatedData.publishedAt || new Date(),
      };
    } else if (validatedData.status === 'DRAFT') {
      publishedAtUpdate = {
        publishedAt: null,
      };
    } else if (validatedData.publishedAt) {
      publishedAtUpdate = {
        publishedAt: validatedData.publishedAt,
      };
    }

    // 8. Update article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        ...validatedData,
        ...publishedAtUpdate,
        readingTimeMin,
        updatedBy: session.user.id,
        ...tagOperations,
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/articles/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const articleId = articleIdSchema.parse(params.id);

    // 3. Check article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 4. Delete article (cascade will delete tags relations)
    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json(
      { message: 'Article deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
```

### Step 6: Public API - List Published Articles

**File:** `src/app/api/public/articles/route.ts`

```typescript
/**
 * Public Articles API - List Published Articles
 * GET /api/public/articles - Get all published articles
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(
      searchParams.get('pageSize') || String(ARTICLE_CONSTANTS.UI.ARTICLES_PER_PAGE)
    );

    // 2. Build where clause (only published articles)
    const where: Prisma.ArticleWhereInput = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(), // Only show articles published in the past
      },
    };

    if (category) {
      where.category = { slug: category };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 4. Fetch articles with minimal data for listing
    const [articles, total, categories, tags] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          featuredImageAlt: true,
          category: {
            select: {
              name: true,
              slug: true,
              color: true,
            },
          },
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          publishedAt: true,
          readingTimeMin: true,
          viewCount: true,
        },
        orderBy: [
          { publishedAt: 'desc' },
        ],
        skip,
        take,
      }),
      prisma.article.count({ where }),
      // Get categories with article count
      prisma.articleCategory.findMany({
        where: {
          isActive: true,
          articles: {
            some: {
              status: 'PUBLISHED',
            },
          },
        },
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              articles: {
                where: {
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),
      // Get tags with article count
      prisma.articleTag.findMany({
        where: {
          articles: {
            some: {
              article: {
                status: 'PUBLISHED',
              },
            },
          },
        },
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              articles: {
                where: {
                  article: {
                    status: 'PUBLISHED',
                  },
                },
              },
            },
          },
        },
        take: 20, // Top 20 tags
      }),
    ]);

    // 5. Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    // 6. Format response
    return NextResponse.json({
      articles,
      total,
      page,
      pageSize,
      totalPages,
      categories: categories.map((cat) => ({
        name: cat.name,
        slug: cat.slug,
        count: cat._count.articles,
      })),
      tags: tags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        count: tag._count.articles,
      })),
    });
  } catch (error) {
    console.error('Error fetching public articles:', error);

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
```

### Step 7: Public API - Get Single Article by Slug

**File:** `src/app/api/public/articles/[slug]/route.ts`

```typescript
/**
 * Public Articles API - Get Single Article
 * GET /api/public/articles/[slug] - Get single published article by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { articleSlugSchema } from '@/lib/validations/article-validation';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 1. Validate slug
    const slug = articleSlugSchema.parse(params.slug);

    // 2. Fetch article
    const article = await prisma.article.findUnique({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        featuredImageAlt: true,
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        publishedAt: true,
        readingTimeMin: true,
        viewCount: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 3. Increment view count (async, don't wait)
    prisma.article
      .update({
        where: { id: article.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
      .catch((error) => console.error('Failed to increment view count:', error));

    // 4. Get related articles (same category, exclude current)
    const relatedArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: article.category.slug,
        id: {
          not: article.id,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        featuredImageAlt: true,
        publishedAt: true,
        readingTimeMin: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 3,
    });

    // 5. Format tags
    const formattedArticle = {
      ...article,
      tags: article.tags.map((t) => t.tag),
      relatedArticles,
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error('Error fetching article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid article slug' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
```

---

## 📝 RICH TEXT EDITOR INTEGRATION

### Step 8: Create TipTap Editor Component

**File:** `src/components/admin/TipTapEditor.tsx`

```typescript
/**
 * TipTap Rich Text Editor Component
 * Full-featured editor with toolbar for article content
 */

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ToolbarButton = ({
    onClick,
    active,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      className={cn('h-8 w-8 p-0', active && 'bg-blue-100')}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link & Image */}
        <ToolbarButton onClick={addLink} active={editor.isActive('link')}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        {/* Emoji Helper */}
        <div className="ml-auto flex items-center text-xs text-gray-500">
          <Smile className="h-3 w-3 mr-1" />
          <span>Use emoji keyboard or copy-paste emojis</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

---

---

## 🔄 STEP-BY-STEP IMPLEMENTATION CHECKLIST

### Phase 1: Database & Foundation (3-4 hours)

**✅ Checkpoint 1.1: Install Dependencies**
```bash
# Install TipTap
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-text-style @tiptap/extension-color

# Verify installation
npm list @tiptap/react
```

**✅ Checkpoint 1.2: Database Migration**
```bash
# 1. Add Article models to schema.prisma (copy from Database Design section)
# 2. Generate migration
npx prisma migrate dev --name add_article_cms

# 3. Verify migration
npx prisma studio

# 4. Check tables exist: articles, article_categories, article_tags, article_to_tags
```

**Verification:**
- [ ] TipTap packages installed successfully
- [ ] Migration applied without errors
- [ ] All 4 new tables visible in Prisma Studio
- [ ] User relations added correctly
- [ ] TypeScript compiles: `npm run typecheck`

**✅ Checkpoint 1.3: Create Constants & Types**
```bash
# Create files:
touch src/lib/constants/article-constants.ts
touch src/types/article.types.ts
touch src/lib/validations/article-validation.ts
```

Copy code from:
- Step 1: article-constants.ts
- Step 2: article.types.ts
- Step 3: article-validation.ts

**Verification:**
- [ ] All files created
- [ ] No TypeScript errors
- [ ] Can import constants in test file
- [ ] Zod schemas compile

---

### Phase 2: API Layer (4-5 hours)

**✅ Checkpoint 2.1: Create Article API Routes**
```bash
# Create directory structure
mkdir -p src/app/api/admin/articles/[id]
mkdir -p src/app/api/admin/articles/reorder
mkdir -p src/app/api/admin/article-categories/[id]
mkdir -p src/app/api/admin/article-categories/reorder
mkdir -p src/app/api/public/articles/[slug]

# Create route files
touch src/app/api/admin/articles/route.ts
touch src/app/api/admin/articles/[id]/route.ts
touch src/app/api/admin/articles/reorder/route.ts
```

Copy code from:
- Step 4: `/api/admin/articles/route.ts`
- Step 5: `/api/admin/articles/[id]/route.ts`

**✅ Checkpoint 2.2: Create Category API Routes**
```bash
touch src/app/api/admin/article-categories/route.ts
touch src/app/api/admin/article-categories/[id]/route.ts
touch src/app/api/admin/article-categories/reorder/route.ts
```

Follow FAQ category API pattern from:
`src/app/api/admin/faq-categories/route.ts`

**✅ Checkpoint 2.3: Create Public API Routes**
```bash
touch src/app/api/public/articles/route.ts
touch src/app/api/public/articles/[slug]/route.ts
```

Copy code from:
- Step 6: `/api/public/articles/route.ts`
- Step 7: `/api/public/articles/[slug]/route.ts`

**Testing API Routes:**
```bash
# Start dev server
npm run dev

# Test admin articles list (requires auth)
curl http://localhost:3000/api/admin/articles

# Test public articles list
curl http://localhost:3000/api/public/articles

# Expected: Empty arrays initially, no errors
```

**Verification:**
- [ ] All API routes created
- [ ] No compilation errors
- [ ] Build succeeds: `npm run build`
- [ ] Routes return 401 for admin without auth
- [ ] Public routes return empty list

---

### Phase 3: Rich Text Editor (2 hours)

**✅ Checkpoint 3.1: Create TipTap Editor Component**
```bash
mkdir -p src/components/admin
touch src/components/admin/TipTapEditor.tsx
```

Copy code from Step 8: TipTapEditor.tsx

**✅ Checkpoint 3.2: Test Editor Independently**

Create test page:
```bash
touch src/app/test-editor/page.tsx
```

```typescript
'use client';
import { useState } from 'react';
import TipTapEditor from '@/components/admin/TipTapEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Test content</p>');

  return (
    <div className="container py-8">
      <h1 className="text-2xl mb-4">TipTap Editor Test</h1>
      <TipTapEditor content={content} onChange={setContent} />
      <div className="mt-4">
        <h2 className="font-bold">HTML Output:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">{content}</pre>
      </div>
    </div>
  );
}
```

**Verification:**
- [ ] Editor renders without errors
- [ ] Toolbar buttons work
- [ ] Can type and format text
- [ ] Bold, italic, headings work
- [ ] HTML output updates
- [ ] Can add links
- [ ] Can paste emojis 😊

---

### Phase 4: Admin Interface (5-6 hours)

**✅ Checkpoint 4.1: Category Management**

```bash
mkdir -p src/app/admin/content/article-categories
touch src/app/admin/content/article-categories/page.tsx
touch src/app/admin/content/article-categories/create/page.tsx
touch src/app/admin/content/article-categories/[id]/edit/page.tsx
```

**Follow FAQ category pattern exactly from:**
- `/admin/content/faq-categories/page.tsx`
- Replace "FAQ" with "Article"
- Use ArticleCategory types

**✅ Checkpoint 4.2: Article List Page**

```bash
mkdir -p src/app/admin/content/articles
touch src/app/admin/content/articles/page.tsx
```

**Key features:**
- Table with: Title, Category, Status, Author, Published Date, Views
- Search bar
- Filter by: Category, Status, Author
- Pagination (13 per page)
- Edit, Delete actions
- View count display

**✅ Checkpoint 4.3: Article Create Page**

```bash
touch src/app/admin/content/articles/create/page.tsx
```

**Form fields:**
1. Title (required, 10-200 chars)
2. Slug (auto-generated, editable, required)
3. Featured Image Upload (required)
4. Featured Image Alt Text (required for SEO)
5. Category (select, required)
6. Tags (multi-input, max 10)
7. Content (TipTap editor, min 100 chars)
8. Excerpt (optional, auto-generated from content if empty)
9. Status (Draft/Published)
10. Published Date (required if Published)
11. **SEO Section:**
    - Meta Title (optional, defaults to title)
    - Meta Description (optional, max 300 chars)
    - Meta Keywords (array, max 10)

**✅ Checkpoint 4.4: Article Edit Page**

```bash
mkdir -p src/app/admin/content/articles/[id]/edit
touch src/app/admin/content/articles/[id]/edit/page.tsx
```

Same form as create, but pre-populated with existing data.

**✅ Checkpoint 4.5: Update Admin Navigation**

Edit: `src/components/admin/layout/Sidebar.tsx`

Add to navigation:
```typescript
{
  title: 'Content',
  items: [
    {
      title: 'Articles',
      href: '/admin/content/articles',
      icon: FileText,
    },
    {
      title: 'Article Categories',
      href: '/admin/content/article-categories',
      icon: FolderTree,
    },
    {
      title: 'FAQs',
      href: '/admin/content/faqs',
      icon: HelpCircle,
    },
    {
      title: 'FAQ Categories',
      href: '/admin/content/faq-categories',
      icon: Layers,
    },
  ],
}
```

**Verification:**
- [ ] Can create categories
- [ ] Can reorder categories (drag-drop)
- [ ] Can create articles with all fields
- [ ] Featured image upload works
- [ ] TipTap editor saves HTML correctly
- [ ] Slug auto-generates from title
- [ ] Can edit existing articles
- [ ] Tags create automatically if new
- [ ] Reading time calculates correctly
- [ ] Navigation shows new menu items

---

### Phase 5: Public Interface (3-4 hours)

**✅ Checkpoint 5.1: Article Listing Page**

```bash
mkdir -p src/app/article
touch src/app/article/page.tsx
```

**Features:**
- Hero section with search
- Category filter buttons
- Tag cloud (top 20 tags)
- Article grid (3 columns desktop, responsive)
- Pagination (13 per page)
- Each card shows:
  - Featured image
  - Title
  - Excerpt
  - Category badge
  - Author
  - Published date
  - Reading time
  - View count

**✅ Checkpoint 5.2: Single Article Page**

```bash
mkdir -p src/app/article/[slug]
touch src/app/article/[slug]/page.tsx
```

**Layout:**
- Breadcrumbs (Home > Articles > Category > Title)
- Hero featured image
- Title (H1)
- Meta info (Author, Date, Reading time, Views)
- Category & Tags
- Article content (from TipTap, styled with prose)
- Social share buttons (WhatsApp, Facebook, Twitter, Copy link)
- Related articles (3 from same category)

**✅ Checkpoint 5.3: Update Main Navigation**

Edit: `src/components/layout/Header.tsx` (or equivalent)

Add link:
```typescript
<Link href="/article">Articles</Link>
```

**Verification:**
- [ ] Listing page shows published articles only
- [ ] Search works
- [ ] Category filter works
- [ ] Tag filter works
- [ ] Pagination works
- [ ] Single article page displays correctly
- [ ] Featured image shows
- [ ] Content renders with proper formatting
- [ ] Related articles show
- [ ] Social share buttons work
- [ ] View count increments on visit

---

### Phase 6: SEO Implementation (2 hours)

**✅ Checkpoint 6.1: Update SEO Service**

Edit: `src/lib/seo/seo-service.ts`

Add method:
```typescript
/**
 * Generate SEO metadata for article listing page
 */
static getArticleListingSEO(page: number = 1): SEOData {
  const pageTitle = page > 1 ? ` - Page ${page}` : '';

  return {
    title: `Articles & Tips${pageTitle} | JRM HOLISTIK - Jamu Ratu Malaya`,
    description:
      'Read the latest articles, health tips, and wellness guides about traditional jamu from JRM HOLISTIK. Expert advice on women\'s health and natural remedies.',
    keywords: [
      'JRM HOLISTIK articles',
      'jamu health tips',
      'traditional medicine Malaysia',
      'women health tips',
      'jamu benefits',
      'wellness blog Malaysia',
      'herbal remedies',
      'Jamu Ratu Malaya blog',
    ],
    canonical: `${this.SITE_URL}/article${page > 1 ? `?page=${page}` : ''}`,
    ogType: 'website',
    ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
    twitterCard: 'summary_large_image',
    structuredData: this.generateBlogSchema(),
  };
}

/**
 * Generate SEO metadata for single article page
 */
static getArticleSEO(article: {
  title: string;
  excerpt: string | null;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  category: { name: string };
  author: { firstName: string; lastName: string };
  publishedAt: Date;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[] | null;
}): SEOData {
  const metaTitle = article.metaTitle || article.title;
  const metaDesc = article.metaDescription || article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 157) + '...';
  const authorName = `${article.author.firstName} ${article.author.lastName}`;

  return {
    title: `${metaTitle} | JRM HOLISTIK Blog`,
    description: metaDesc,
    keywords: article.metaKeywords || [
      article.title.toLowerCase(),
      article.category.name.toLowerCase(),
      'JRM HOLISTIK',
      'jamu Malaysia',
      'health tips',
    ],
    canonical: `${this.SITE_URL}/article/${article.slug}`,
    ogType: 'article',
    ogImage: `${this.SITE_URL}${article.featuredImage}`,
    ogImageAlt: article.featuredImageAlt,
    twitterCard: 'summary_large_image',
    structuredData: this.generateArticleSchema(article, authorName),
  };
}

/**
 * Generate Article structured data
 */
private static generateArticleSchema(
  article: {
    title: string;
    excerpt: string | null;
    content: string;
    featuredImage: string;
    publishedAt: Date;
  },
  authorName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt || undefined,
    image: `${this.SITE_URL}${article.featuredImage}`,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.publishedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: this.COMPANY_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${this.SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${this.SITE_URL}/article`,
    },
    inLanguage: 'ms',
  };
}

/**
 * Generate Blog structured data for listing page
 */
private static generateBlogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${this.SITE_URL}/article`,
    name: 'JRM HOLISTIK Blog - Articles & Health Tips',
    description: 'Expert articles and health tips about traditional jamu and women\'s wellness',
    publisher: {
      '@type': 'Organization',
      name: this.COMPANY_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${this.SITE_URL}/images/logo.png`,
      },
    },
    inLanguage: 'ms',
  };
}
```

**✅ Checkpoint 6.2: Implement SEO in Pages**

In `/app/article/page.tsx`:
```typescript
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';

// Inside component
const seoData = SEOService.getArticleListingSEO(page);

return (
  <>
    <SEOHead seo={seoData} />
    {/* Rest of page */}
  </>
);
```

In `/app/article/[slug]/page.tsx`:
```typescript
const seoData = SEOService.getArticleSEO(article);

return (
  <>
    <SEOHead seo={seoData} />
    {/* Rest of page */}
  </>
);
```

**✅ Checkpoint 6.3: Generate Sitemap**

Edit: `src/app/sitemap.ts`

Add articles:
```typescript
// Fetch published articles
const articles = await prisma.article.findMany({
  where: { status: 'PUBLISHED' },
  select: { slug: true, updatedAt: true },
});

// Add to sitemap
...articles.map((article) => ({
  url: `${SITE_URL}/article/${article.slug}`,
  lastModified: article.updatedAt,
  changeFrequency: 'weekly' as const,
  priority: 0.7,
})),
```

**Verification:**
- [ ] Article listing has proper meta tags
- [ ] Single article has proper meta tags
- [ ] Open Graph preview works (test with Facebook Debugger)
- [ ] Twitter Card preview works
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Breadcrumbs schema correct
- [ ] Article schema correct
- [ ] Sitemap includes articles

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist

**Admin - Category Management**
- [ ] Create category with all fields
- [ ] Edit category
- [ ] Delete empty category
- [ ] Cannot delete category with articles
- [ ] Reorder categories (drag-drop)
- [ ] Deactivate category
- [ ] Search categories

**Admin - Article Management**
- [ ] Create article (Draft)
- [ ] Upload featured image
- [ ] Use TipTap editor (bold, italic, headings, lists, links)
- [ ] Add emojis to content
- [ ] Auto-generate slug from title
- [ ] Manually edit slug
- [ ] Select category
- [ ] Add multiple tags (create new)
- [ ] Auto-generate excerpt
- [ ] Manually write excerpt
- [ ] Fill SEO fields
- [ ] Publish article (Draft → Published)
- [ ] Edit published article
- [ ] Unpublish article (Published → Draft)
- [ ] Delete article
- [ ] Search articles
- [ ] Filter by category
- [ ] Filter by status
- [ ] Filter by author
- [ ] Pagination works

**Public - Article Listing**
- [ ] Listing shows only published articles
- [ ] Future-dated articles don't show
- [ ] Search works
- [ ] Category filter works
- [ ] Tag filter works
- [ ] Pagination (13 per page)
- [ ] Mobile responsive
- [ ] Article cards display correctly

**Public - Single Article**
- [ ] Article displays correctly
- [ ] Featured image shows
- [ ] Content renders with formatting
- [ ] Code/bold/italic preserved
- [ ] Links work
- [ ] Breadcrumbs correct
- [ ] Category badge shows
- [ ] Tags display
- [ ] Author shows
- [ ] Published date shows
- [ ] Reading time correct
- [ ] View count increments
- [ ] Related articles show (3 max)
- [ ] Social share works (WhatsApp, Facebook, Copy)
- [ ] Mobile responsive

**SEO Testing**
- [ ] Meta title correct
- [ ] Meta description correct
- [ ] Canonical URL correct
- [ ] Open Graph tags (test with Facebook Debugger)
- [ ] Twitter Card tags (test with Twitter Card Validator)
- [ ] Structured data valid (Google Rich Results Test)
- [ ] Breadcrumbs schema correct
- [ ] Article schema correct
- [ ] Sitemap includes articles
- [ ] Robots.txt allows articles

### Automated Testing (Optional but Recommended)

**Unit Tests - Utilities**
```typescript
// __tests__/lib/constants/article-constants.test.ts
describe('Article Constants', () => {
  it('should calculate reading time correctly', () => {
    const content = '<p>' + 'word '.repeat(200) + '</p>'; // 200 words
    const time = calculateReadingTime(content);
    expect(time).toBe(1); // 200 words / 200 WPM = 1 minute
  });

  it('should generate valid slug', () => {
    const slug = generateSlug('Hello World! 123');
    expect(slug).toBe('hello-world-123');
  });

  it('should generate excerpt', () => {
    const content = '<p>This is a test content with more than 150 characters to ensure it gets truncated properly at the right length.</p>';
    const excerpt = generateExcerpt(content, 50);
    expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(excerpt).toContain('...');
  });
});
```

**API Tests**
```typescript
// __tests__/api/admin/articles.test.ts
describe('POST /api/admin/articles', () => {
  it('should create article with valid data', async () => {
    // Test article creation
  });

  it('should reject duplicate slug', async () => {
    // Test duplicate slug handling
  });

  it('should require authentication', async () => {
    // Test auth requirement
  });
});
```

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment

**Code Quality**
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Fix all linting errors: `npm run lint:fix`
- [ ] Run tests (if written): `npm test`
- [ ] Build succeeds: `npm run build`

**Database**
- [ ] Migration generated: `npx prisma migrate dev`
- [ ] Migration tested locally
- [ ] Backup production database before deployment
- [ ] Migration script ready: `npx prisma migrate deploy`

**Environment Variables**
- [ ] All required vars set in production:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
- [ ] Image upload directory accessible
- [ ] Railway Volume configured (if using Railway)

**Content Preparation**
- [ ] Create initial article categories
- [ ] Prepare 3-5 seed articles (optional)
- [ ] Featured images ready (optimized)

### Deployment Steps

**Step 1: Database Migration**
```bash
# On production server (Railway CLI or similar)
npx prisma migrate deploy
npx prisma generate
```

**Step 2: Verify Migration**
```bash
# Connect to production database
npx prisma studio --browser none
# OR
psql $DATABASE_URL

# Check tables exist:
SELECT * FROM article_categories LIMIT 1;
SELECT * FROM articles LIMIT 1;
SELECT * FROM article_tags LIMIT 1;
```

**Step 3: Deploy Application**
```bash
# Push to main branch (auto-deploys on Railway)
git add .
git commit -m "feat: implement Article CMS with SEO optimization"
git push origin main

# OR manual deploy
railway up
```

**Step 4: Post-Deployment Verification**

Test all endpoints:
```bash
# Public articles (should return empty list initially)
curl https://your-domain.com/api/public/articles

# Admin login and test
# Then test create article
```

Test pages:
- [ ] Visit `/article` - should load without errors
- [ ] Visit `/admin/content/articles` - should load admin panel
- [ ] Create test article via admin
- [ ] Publish test article
- [ ] View test article on public page
- [ ] Check SEO tags with view-source

**Step 5: SEO Validation**
- [ ] Submit sitemap to Google Search Console: `https://your-domain.com/sitemap.xml`
- [ ] Test Open Graph: https://developers.facebook.com/tools/debug/
- [ ] Test Twitter Card: https://cards-dev.twitter.com/validator
- [ ] Test Structured Data: https://search.google.com/test/rich-results
- [ ] Check mobile usability: https://search.google.com/test/mobile-friendly

### Post-Deployment

**Monitoring (First 24 hours)**
- [ ] Check error logs for API errors
- [ ] Monitor database for orphaned records
- [ ] Verify image uploads working
- [ ] Check performance (page load times)
- [ ] Test from mobile devices

**Content Seeding**
- [ ] Create article categories:
  - Kesihatan (Health)
  - Tips & Panduan (Tips & Guides)
  - Produk (Products)
  - Berita (News)
- [ ] Publish first 3-5 articles
- [ ] Share on social media

**Analytics**
- [ ] Set up Google Analytics events for:
  - Article views
  - Category clicks
  - Social shares
  - Related article clicks

---

## 📊 SUCCESS METRICS

### Technical Metrics
- ✅ API response time < 200ms
- ✅ Page load time < 2 seconds
- ✅ Lighthouse SEO score > 95
- ✅ Zero critical bugs
- ✅ 100% TypeScript type coverage
- ✅ All validations working correctly
- ✅ Mobile responsive (all breakpoints)

### SEO Metrics (30 days post-launch)
- 🎯 Article pages indexed by Google
- 🎯 Featured snippets for target keywords
- 🎯 Organic traffic increase
- 🎯 Average session duration > 1 minute
- 🎯 Bounce rate < 60%

### Business Metrics
- 📈 Admin can create article in < 5 minutes
- 📈 Articles display correctly on all devices
- 📈 Users find content through search
- 📈 Social shares increase brand awareness

---

## 🔄 MAINTENANCE & OPTIMIZATION

### Weekly Tasks
- Review article analytics
- Check for broken links
- Monitor page load speeds
- Review search queries (identify content gaps)

### Monthly Tasks
- Update outdated articles
- Optimize top-performing articles
- Review and clean up unused tags
- Analyze related article accuracy

### Quarterly Tasks
- SEO audit (keywords, rankings)
- Content performance review
- Category restructuring (if needed)
- A/B test article layouts

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- TipTap: https://tiptap.dev/docs
- Prisma Relations: https://www.prisma.io/docs/concepts/components/prisma-schema/relations
- Next.js App Router: https://nextjs.org/docs/app
- Schema.org Article: https://schema.org/BlogPosting

### SEO Tools
- Google Search Console: https://search.google.com/search-console
- Google Rich Results Test: https://search.google.com/test/rich-results
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci

### Code Standards Reference
- Project CLAUDE.md
- CODING_STANDARDS.md
- FAQ_CMS_IMPLEMENTATION_PLAN.md (reference patterns)

---

## 🎓 LEARNING OUTCOMES

After completing this implementation, developers will have:

1. **Mastered CMS Patterns**
   - Content management workflows
   - Rich text editing integration
   - Dynamic taxonomy systems
   - SEO optimization techniques

2. **Advanced Next.js Skills**
   - App Router API routes
   - Server-side data fetching
   - Static and dynamic pages
   - Metadata management

3. **Database Design**
   - Many-to-many relationships
   - Indexing strategies
   - Migration management
   - Data integrity

4. **SEO Expertise**
   - Structured data implementation
   - Open Graph optimization
   - Content discoverability
   - Search engine best practices

---

## ✅ FINAL CHECKLIST

Before considering the implementation complete:

**Functionality**
- [ ] All CRUD operations work for articles
- [ ] All CRUD operations work for categories
- [ ] Tags create and associate correctly
- [ ] TipTap editor fully functional
- [ ] Image upload works
- [ ] Search works on admin and public
- [ ] Filters work (category, tag, status)
- [ ] Pagination works correctly
- [ ] View count increments
- [ ] Reading time calculates
- [ ] Related articles show

**User Experience**
- [ ] Admin interface intuitive
- [ ] Public pages fast and responsive
- [ ] Mobile experience smooth
- [ ] Error messages helpful
- [ ] Loading states clear
- [ ] Forms validate properly

**SEO**
- [ ] All meta tags correct
- [ ] Structured data valid
- [ ] Sitemap includes articles
- [ ] Canonical URLs correct
- [ ] Social sharing works
- [ ] Images have alt text
- [ ] URLs are SEO-friendly

**Code Quality**
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Code follows standards
- [ ] Constants used (no hardcoding)
- [ ] Types defined everywhere
- [ ] Comments on complex logic

**Documentation**
- [ ] README updated with article feature
- [ ] API endpoints documented
- [ ] Admin user guide created
- [ ] Deployment notes added

---

**END OF COMPREHENSIVE IMPLEMENTATION PLAN**

This document serves as the complete, systematic guide for implementing the Article CMS. Follow each step in order, verify at each checkpoint, and maintain code quality throughout. The result will be a production-ready, SEO-optimized article management system that drives organic traffic to your e-commerce platform.

**Estimated Total Time:** 12-15 hours
**Recommended Schedule:** 1.5-2 weeks part-time (2-3 hours per day)

Good luck with your implementation! 🚀
