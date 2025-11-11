# FAQ CMS - COMPREHENSIVE IMPLEMENTATION PLAN

**Project:** JRM HOLISTIK E-commerce Platform
**Feature:** FAQ Content Management System
**Timeline:** 8-10 hours (1 week part-time)
**Developer Guide:** Step-by-step systematic implementation
**Date Created:** November 11, 2025

---

## 📋 TABLE OF CONTENTS

1. [Overview & Architecture](#overview--architecture)
2. [Coding Standards Compliance](#coding-standards-compliance)
3. [Database Design](#database-design)
4. [Type Definitions & Constants](#type-definitions--constants)
5. [Validation Schemas](#validation-schemas)
6. [API Design](#api-design)
7. [Admin Interface](#admin-interface)
8. [Public Interface](#public-interface)
9. [Implementation Steps](#implementation-steps)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Checklist](#deployment-checklist)

---

## 🎯 OVERVIEW & ARCHITECTURE

### Purpose
Build a CMS for managing FAQ (Soalan Lazim) content that allows non-technical users to create, edit, reorder, and categorize frequently asked questions.

### Key Features
- ✅ Create, Read, Update, Delete FAQs
- ✅ Categorize FAQs (Tentang Kami, Produk, Penghantaran, etc.)
- ✅ Reorder FAQs with drag-and-drop
- ✅ Rich text formatting for answers
- ✅ Active/Inactive status
- ✅ Search and filter in admin
- ✅ SEO schema for featured snippets
- ✅ Accordion UI on public page

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Rich Text Editor:** TipTap
- **Validation:** Zod
- **UI Components:** Existing component library + Radix UI (Accordion)

### Architecture Diagram
```
┌─────────────────────────────────────────────────────┐
│                    CLIENT SIDE                       │
├─────────────────────────────────────────────────────┤
│  Public Page              Admin Interface            │
│  /soalan-lazim           /admin/content/faqs         │
│  ├─ Accordion UI         ├─ List FAQs                │
│  ├─ Category filter      ├─ Create FAQ               │
│  └─ Search               ├─ Edit FAQ                 │
│                          ├─ Delete FAQ               │
│                          └─ Reorder FAQs             │
└─────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────┐
│                    API LAYER                         │
├─────────────────────────────────────────────────────┤
│  /api/admin/faqs                                     │
│  ├─ GET    /api/admin/faqs        (List all)        │
│  ├─ POST   /api/admin/faqs        (Create)          │
│  ├─ GET    /api/admin/faqs/[id]   (Get one)         │
│  ├─ PUT    /api/admin/faqs/[id]   (Update)          │
│  ├─ DELETE /api/admin/faqs/[id]   (Delete)          │
│  └─ PATCH  /api/admin/faqs/reorder (Reorder)        │
│                                                       │
│  /api/public/faqs                                    │
│  └─ GET    /api/public/faqs       (Active only)     │
└─────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────┐
│                 DATABASE LAYER                       │
├─────────────────────────────────────────────────────┤
│  Prisma ORM → PostgreSQL                            │
│  ├─ FAQ Model                                       │
│  ├─ FAQCategory Model                               │
│  └─ Relationships & Indexes                         │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 CODING STANDARDS COMPLIANCE

All code MUST follow `claudedocs/CODING_STANDARDS.md`. Key requirements:

### 1. Single Source of Truth
```typescript
// ✅ CORRECT: Constants in one place
// src/lib/constants/faq-constants.ts
export const FAQ_CONSTANTS = {
  CATEGORIES: {
    ABOUT_US: 'ABOUT_US',
    PRODUCTS: 'PRODUCTS',
    SHIPPING: 'SHIPPING',
    PAYMENT: 'PAYMENT',
    MEMBERSHIP: 'MEMBERSHIP',
    SAFETY: 'SAFETY',
  },
  STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },
} as const;

// ❌ WRONG: Hardcoding values everywhere
if (faq.category === 'ABOUT_US') { ... }
if (faq.status === 'ACTIVE') { ... }
```

### 2. No Hardcoding
```typescript
// ✅ CORRECT: Environment variables and constants
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const endpoint = `${API_BASE}/admin/faqs`;

// ❌ WRONG: Hardcoded URLs
const endpoint = '/api/admin/faqs';
```

### 3. Type Safety
```typescript
// ✅ CORRECT: Explicit types
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  status: FAQStatus;
  sortOrder: number;
}

// ❌ WRONG: Using 'any'
function updateFAQ(data: any) { ... }
```

### 4. Three-Layer Validation
```typescript
// Layer 1: Frontend validation (React Hook Form + Zod)
const formSchema = z.object({ ... });

// Layer 2: API validation (Zod in API route)
const body = faqCreateSchema.parse(await request.json());

// Layer 3: Database constraints (Prisma schema)
model FAQ {
  question String @db.VarChar(500)
}
```

### 5. Error Handling
```typescript
// ✅ CORRECT: Try-catch with proper error types
try {
  const faq = await prisma.fAQ.create({ data });
  return NextResponse.json(faq, { status: 201 });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
  throw error;
}

// ❌ WRONG: No error handling
const faq = await prisma.fAQ.create({ data });
return NextResponse.json(faq);
```

---

## 🗄️ DATABASE DESIGN

### Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
// FAQ Categories Enum
enum FAQCategory {
  ABOUT_US         // Tentang Kami
  PRODUCTS         // Produk
  SHIPPING         // Penghantaran
  PAYMENT          // Pembayaran
  MEMBERSHIP       // Keahlian
  SAFETY           // Keselamatan
}

// FAQ Status Enum
enum FAQStatus {
  ACTIVE
  INACTIVE
}

// FAQ Model
model FAQ {
  id          String      @id @default(cuid())

  // Content
  question    String      @db.VarChar(500)
  answer      String      @db.Text

  // Organization
  category    FAQCategory
  sortOrder   Int         @default(0)

  // Status
  status      FAQStatus   @default(ACTIVE)

  // Metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  createdBy   String?     // User ID who created
  updatedBy   String?     // User ID who last updated

  // Audit
  createdByUser User?     @relation("FAQCreatedBy", fields: [createdBy], references: [id])
  updatedByUser User?     @relation("FAQUpdatedBy", fields: [updatedBy], references: [id])

  @@index([category])
  @@index([status])
  @@index([sortOrder])
  @@index([createdAt])
  @@map("faqs")
}
```

### Update User Model

Add FAQ relations to existing User model:

```prisma
model User {
  // ... existing fields ...

  // FAQ relations
  faqsCreated      FAQ[] @relation("FAQCreatedBy")
  faqsUpdated      FAQ[] @relation("FAQUpdatedBy")
}
```

### Migration Command

```bash
# Generate migration
npx prisma migrate dev --name add_faq_cms

# If migration fails, check existing schema
npx prisma db pull
npx prisma generate
```

### Database Indexes Rationale

- `category`: Frequently filtered by category
- `status`: Frequently queried for active FAQs only
- `sortOrder`: Essential for ordering display
- `createdAt`: Used for admin sorting

---

## 📘 TYPE DEFINITIONS & CONSTANTS

### Step 1: Create Constants File

**File:** `src/lib/constants/faq-constants.ts`

```typescript
/**
 * FAQ Constants - Single Source of Truth
 * All FAQ-related constants and configurations
 */

export const FAQ_CONSTANTS = {
  // Categories with Bahasa Malaysia labels
  CATEGORIES: {
    ABOUT_US: {
      value: 'ABOUT_US',
      label: 'Tentang Kami',
      description: 'Soalan tentang syarikat dan jenama',
      icon: 'Info',
    },
    PRODUCTS: {
      value: 'PRODUCTS',
      label: 'Produk',
      description: 'Soalan tentang produk jamu',
      icon: 'Package',
    },
    SHIPPING: {
      value: 'SHIPPING',
      label: 'Penghantaran',
      description: 'Soalan tentang penghantaran dan pos',
      icon: 'Truck',
    },
    PAYMENT: {
      value: 'PAYMENT',
      label: 'Pembayaran',
      description: 'Soalan tentang kaedah pembayaran',
      icon: 'CreditCard',
    },
    MEMBERSHIP: {
      value: 'MEMBERSHIP',
      label: 'Keahlian',
      description: 'Soalan tentang program keahlian',
      icon: 'Users',
    },
    SAFETY: {
      value: 'SAFETY',
      label: 'Keselamatan',
      description: 'Soalan tentang keselamatan produk',
      icon: 'Shield',
    },
  },

  // Status options
  STATUS: {
    ACTIVE: {
      value: 'ACTIVE',
      label: 'Aktif',
      color: 'green',
      icon: 'CheckCircle',
    },
    INACTIVE: {
      value: 'INACTIVE',
      label: 'Tidak Aktif',
      color: 'gray',
      icon: 'XCircle',
    },
  },

  // Validation limits
  VALIDATION: {
    QUESTION_MIN_LENGTH: 10,
    QUESTION_MAX_LENGTH: 500,
    ANSWER_MIN_LENGTH: 20,
    ANSWER_MAX_LENGTH: 5000,
  },

  // API endpoints
  API_ROUTES: {
    ADMIN_BASE: '/api/admin/faqs',
    PUBLIC_BASE: '/api/public/faqs',
  },

  // UI Configuration
  UI: {
    ITEMS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
  },
} as const;

// Type helpers
export type FAQCategoryValue = keyof typeof FAQ_CONSTANTS.CATEGORIES;
export type FAQStatusValue = keyof typeof FAQ_CONSTANTS.STATUS;

// Helper function to get category label
export function getFAQCategoryLabel(category: string): string {
  const categoryKey = category as FAQCategoryValue;
  return FAQ_CONSTANTS.CATEGORIES[categoryKey]?.label || category;
}

// Helper function to get all categories as array
export function getFAQCategories() {
  return Object.values(FAQ_CONSTANTS.CATEGORIES);
}

// Helper function to get all statuses as array
export function getFAQStatuses() {
  return Object.values(FAQ_CONSTANTS.STATUS);
}
```

### Step 2: Create Type Definitions

**File:** `src/types/faq.types.ts`

```typescript
/**
 * FAQ Type Definitions
 * Centralized TypeScript types for FAQ feature
 */

import { FAQ as PrismaFAQ, FAQCategory, FAQStatus } from '@prisma/client';

// Base FAQ type from Prisma
export type FAQ = PrismaFAQ;

// FAQ with relations
export interface FAQWithRelations extends FAQ {
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

// FAQ for display (public)
export interface FAQPublic {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  sortOrder: number;
}

// FAQ create input
export interface FAQCreateInput {
  question: string;
  answer: string;
  category: FAQCategory;
  sortOrder?: number;
  status?: FAQStatus;
}

// FAQ update input
export interface FAQUpdateInput {
  question?: string;
  answer?: string;
  category?: FAQCategory;
  sortOrder?: number;
  status?: FAQStatus;
}

// FAQ filter options
export interface FAQFilter {
  category?: FAQCategory | 'ALL';
  status?: FAQStatus | 'ALL';
  search?: string;
}

// FAQ reorder input
export interface FAQReorderInput {
  id: string;
  sortOrder: number;
}

// API Response types
export interface FAQListResponse {
  faqs: FAQWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FAQResponse {
  faq: FAQWithRelations;
}

export interface FAQPublicListResponse {
  faqs: FAQPublic[];
}

// Form types for admin
export interface FAQFormData {
  question: string;
  answer: string;
  category: FAQCategory;
  sortOrder: number;
  status: FAQStatus;
}
```

---

## ✅ VALIDATION SCHEMAS

### Step 3: Create Zod Schemas

**File:** `src/lib/validations/faq-validation.ts`

```typescript
/**
 * FAQ Validation Schemas (Zod)
 * Three-layer validation: Frontend → API → Database
 */

import { z } from 'zod';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';

// Category enum
const faqCategoryEnum = z.enum([
  'ABOUT_US',
  'PRODUCTS',
  'SHIPPING',
  'PAYMENT',
  'MEMBERSHIP',
  'SAFETY',
]);

// Status enum
const faqStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

// Base FAQ schema
export const faqBaseSchema = z.object({
  question: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH,
      `Soalan mesti sekurang-kurangnya ${FAQ_CONSTANTS.VALIDATION.QUESTION_MIN_LENGTH} aksara`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH,
      `Soalan tidak boleh melebihi ${FAQ_CONSTANTS.VALIDATION.QUESTION_MAX_LENGTH} aksara`
    )
    .trim(),

  answer: z
    .string()
    .min(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH,
      `Jawapan mesti sekurang-kurangnya ${FAQ_CONSTANTS.VALIDATION.ANSWER_MIN_LENGTH} aksara`
    )
    .max(
      FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH,
      `Jawapan tidak boleh melebihi ${FAQ_CONSTANTS.VALIDATION.ANSWER_MAX_LENGTH} aksara`
    )
    .trim(),

  category: faqCategoryEnum,

  sortOrder: z
    .number()
    .int('Sort order mesti nombor bulat')
    .min(0, 'Sort order mesti 0 atau lebih')
    .default(0),

  status: faqStatusEnum.default('ACTIVE'),
});

// Create FAQ schema (used in forms and API)
export const faqCreateSchema = faqBaseSchema;

// Update FAQ schema (all fields optional)
export const faqUpdateSchema = faqBaseSchema.partial();

// Reorder schema
export const faqReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().cuid('Invalid FAQ ID'),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// Filter schema
export const faqFilterSchema = z.object({
  category: z.union([faqCategoryEnum, z.literal('ALL')]).optional(),
  status: z.union([faqStatusEnum, z.literal('ALL')]).optional(),
  search: z.string().optional(),
});

// ID parameter schema
export const faqIdSchema = z.string().cuid('Invalid FAQ ID');

// Type exports
export type FAQCreateSchema = z.infer<typeof faqCreateSchema>;
export type FAQUpdateSchema = z.infer<typeof faqUpdateSchema>;
export type FAQReorderSchema = z.infer<typeof faqReorderSchema>;
export type FAQFilterSchema = z.infer<typeof faqFilterSchema>;
```

---

## 🔌 API DESIGN

### API Route Structure

```
src/app/api/
├── admin/
│   └── faqs/
│       ├── route.ts              # GET (list), POST (create)
│       ├── [id]/
│       │   └── route.ts         # GET, PUT, DELETE
│       └── reorder/
│           └── route.ts         # PATCH
└── public/
    └── faqs/
        └── route.ts             # GET (active only)
```

### Step 4: Admin API - List & Create

**File:** `src/app/api/admin/faqs/route.ts`

```typescript
/**
 * Admin FAQ API - List & Create
 * GET  /api/admin/faqs - List all FAQs
 * POST /api/admin/faqs - Create new FAQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { faqCreateSchema, faqFilterSchema } from '@/lib/validations/faq-validation';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/faqs
 * List all FAQs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = faqFilterSchema.parse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // 3. Build Prisma where clause
    const where: Prisma.FAQWhereInput = {};

    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { question: { contains: filters.search, mode: 'insensitive' } },
        { answer: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 4. Fetch FAQs with relations
    const faqs = await prisma.fAQ.findMany({
      where,
      include: {
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
    });

    // 5. Return response
    return NextResponse.json({
      faqs,
      total: faqs.length,
    });

  } catch (error) {
    console.error('Error fetching FAQs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/faqs
 * Create new FAQ
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const validatedData = faqCreateSchema.parse(json);

    // 3. Create FAQ in database
    const faq = await prisma.fAQ.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 4. Return created FAQ
    return NextResponse.json(
      { faq },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
```

### Step 5: Admin API - Get, Update, Delete

**File:** `src/app/api/admin/faqs/[id]/route.ts`

```typescript
/**
 * Admin FAQ API - Get, Update, Delete
 * GET    /api/admin/faqs/[id] - Get single FAQ
 * PUT    /api/admin/faqs/[id] - Update FAQ
 * DELETE /api/admin/faqs/[id] - Delete FAQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { faqUpdateSchema, faqIdSchema } from '@/lib/validations/faq-validation';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/faqs/[id]
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
    const faqId = faqIdSchema.parse(params.id);

    // 3. Fetch FAQ
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Error fetching FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid FAQ ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch FAQ' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/faqs/[id]
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
    const faqId = faqIdSchema.parse(params.id);

    // 3. Check FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // 4. Parse and validate update data
    const json = await request.json();
    const validatedData = faqUpdateSchema.parse(json);

    // 5. Update FAQ
    const updatedFAQ = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ faq: updatedFAQ });

  } catch (error) {
    console.error('Error updating FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/faqs/[id]
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
    const faqId = faqIdSchema.parse(params.id);

    // 3. Check FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // 4. Delete FAQ
    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    return NextResponse.json(
      { message: 'FAQ deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid FAQ ID' },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
```

### Step 6: Admin API - Reorder

**File:** `src/app/api/admin/faqs/reorder/route.ts`

```typescript
/**
 * Admin FAQ API - Reorder
 * PATCH /api/admin/faqs/reorder - Batch update sort orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { faqReorderSchema } from '@/lib/validations/faq-validation';
import { z } from 'zod';

export async function PATCH(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request
    const json = await request.json();
    const { updates } = faqReorderSchema.parse(json);

    // 3. Update all FAQs in a transaction
    await prisma.$transaction(
      updates.map(({ id, sortOrder }) =>
        prisma.fAQ.update({
          where: { id },
          data: {
            sortOrder,
            updatedBy: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'FAQs reordered successfully',
    });

  } catch (error) {
    console.error('Error reordering FAQs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder FAQs' },
      { status: 500 }
    );
  }
}
```

### Step 7: Public API - List Active FAQs

**File:** `src/app/api/public/faqs/route.ts`

```typescript
/**
 * Public FAQ API - List Active FAQs
 * GET /api/public/faqs - Get all active FAQs for public display
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse category filter (optional)
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // 2. Build where clause
    const where: any = {
      status: 'ACTIVE',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    // 3. Fetch active FAQs (minimal data for public)
    const faqs = await prisma.fAQ.findMany({
      where,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 4. Return FAQs
    return NextResponse.json({ faqs });

  } catch (error) {
    console.error('Error fetching public FAQs:', error);

    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 ADMIN INTERFACE

### Step 8: Admin FAQ List Page

**File:** `src/app/admin/content/faqs/page.tsx`

```typescript
/**
 * Admin FAQ List Page
 * /admin/content/faqs
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  GripVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { FAQ_CONSTANTS, getFAQCategoryLabel } from '@/lib/constants/faq-constants';
import { FAQWithRelations } from '@/types/faq.types';
import { useToast } from '@/components/ui/use-toast';

export default function AdminFAQListPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [faqs, setFaqs] = useState<FAQWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch FAQs
  useEffect(() => {
    fetchFAQs();
  }, [categoryFilter, statusFilter]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(
        `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}?${params}`
      );

      if (!response.ok) throw new Error('Failed to fetch FAQs');

      const data = await response.json();
      setFaqs(data.faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch FAQs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam FAQ ini?')) return;

    try {
      const response = await fetch(
        `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete FAQ');

      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });

      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive',
      });
    }
  };

  // Filter FAQs by search
  const filteredFAQs = faqs.filter(faq =>
    search
      ? faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">
            Manage frequently asked questions
          </p>
        </div>
        <Link href="/admin/content/faqs/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New FAQ
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.values(FAQ_CONSTANTS.CATEGORIES).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.values(FAQ_CONSTANTS.STATUS).map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No FAQs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="cursor-move">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{faq.question}</h3>
                      <div className="flex items-center gap-2">
                        {faq.status === 'ACTIVE' ? (
                          <span className="flex items-center text-sm text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-sm text-gray-500">
                            <XCircle className="w-4 h-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {faq.answer}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Category: {getFAQCategoryLabel(faq.category)}
                        </span>
                        <span>Order: {faq.sortOrder}</span>
                        <span>
                          Updated:{' '}
                          {new Date(faq.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/admin/content/faqs/${faq.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 9: Admin FAQ Create/Edit Form

**File:** `src/app/admin/content/faqs/create/page.tsx`

```typescript
/**
 * Admin FAQ Create Page
 * /admin/content/faqs/create
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';
import { faqCreateSchema } from '@/lib/validations/faq-validation';
import type { FAQFormData } from '@/types/faq.types';

export default function AdminFAQCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<FAQFormData>({
    resolver: zodResolver(faqCreateSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: 'ABOUT_US',
      sortOrder: 0,
      status: 'ACTIVE',
    },
  });

  // Submit handler
  const onSubmit = async (data: FAQFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create FAQ');
      }

      toast({
        title: 'Success',
        description: 'FAQ created successfully',
      });

      router.push('/admin/content/faqs');
      router.refresh();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create FAQ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/content/faqs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to FAQs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New FAQ</h1>
        <p className="text-muted-foreground">
          Add a new frequently asked question
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Question (Bahasa Malaysia) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apa itu JRM HOLISTIK?"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The question that customers ask (10-500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answer */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Answer (Bahasa Malaysia) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="JRM HOLISTIK adalah..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The detailed answer (20-5000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FAQ_CONSTANTS.CATEGORIES).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label} - {cat.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Group this FAQ under a category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sort Order */}
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first (0 = top)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FAQ_CONSTANTS.STATUS).map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Active FAQs are visible on the website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/content/faqs">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create FAQ'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

**File:** `src/app/admin/content/faqs/[id]/edit/page.tsx`

Similar to create page, but fetch existing FAQ and use PUT method. (Implementation follows same pattern)

---

## 🌐 PUBLIC INTERFACE

### Step 10: Public FAQ Page

**File:** `src/app/soalan-lazim/page.tsx`

```typescript
/**
 * Public FAQ Page
 * /soalan-lazim
 */

'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';
import { FAQ_CONSTANTS, getFAQCategoryLabel } from '@/lib/constants/faq-constants';
import type { FAQPublic } from '@/types/faq.types';

export default function SoalanLazimPage() {
  const [faqs, setFaqs] = useState<FAQPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Fetch FAQs
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/public/faqs');
      if (!response.ok) throw new Error('Failed to fetch FAQs');

      const data = await response.json();
      setFaqs(data.faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQPublic[]>);

  // SEO
  const seoData = SEOService.generateFAQPageSEO(faqs);

  return (
    <div>
      <SEOHead seo={seoData} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-16">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Soalan Lazim (FAQ)
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan
              produk jamu kami
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari soalan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('ALL')}
            >
              Semua
            </Button>
            {Object.values(FAQ_CONSTANTS.CATEGORIES).map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-16 max-w-4xl">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tiada soalan dijumpai. Cuba cari dengan kata kunci lain.
            </div>
          ) : (
            Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {getFAQCategoryLabel(category)}
                </h2>

                <Accordion type="single" collapsible className="space-y-4">
                  {categoryFAQs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 leading-relaxed pb-4">
                        <div
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                          className="prose prose-sm max-w-none"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tidak jumpa jawapan?
          </h2>
          <p className="text-gray-600 mb-6">
            Hubungi kami untuk bantuan lanjut
          </p>
          <Button size="lg">Hubungi Support</Button>
        </div>
      </section>
    </div>
  );
}
```

---

## 🧪 IMPLEMENTATION STEPS

### Phase 1: Database Setup (2-3 hours)

**Step 1.1: Update Prisma Schema**
```bash
# 1. Add FAQ and enum to schema.prisma (see Database Design section)
# 2. Generate migration
npx prisma migrate dev --name add_faq_cms

# 3. Generate Prisma Client
npx prisma generate

# 4. Verify migration
npx prisma studio
```

**Step 1.2: Create Constants & Types**
```bash
# Create files in order:
1. src/lib/constants/faq-constants.ts
2. src/types/faq.types.ts
3. src/lib/validations/faq-validation.ts
```

**Verification:**
- TypeScript compiles without errors
- Constants are importable
- Types are recognized

---

### Phase 2: API Layer (3-4 hours)

**Step 2.1: Create Admin API Routes**
```bash
# Create in order:
1. src/app/api/admin/faqs/route.ts (GET, POST)
2. src/app/api/admin/faqs/[id]/route.ts (GET, PUT, DELETE)
3. src/app/api/admin/faqs/reorder/route.ts (PATCH)
```

**Step 2.2: Create Public API Route**
```bash
4. src/app/api/public/faqs/route.ts (GET)
```

**Testing:**
```bash
# Test with curl or Postman
# GET all FAQs
curl -X GET http://localhost:3000/api/admin/faqs \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# POST create FAQ
curl -X POST http://localhost:3000/api/admin/faqs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "question": "Test question?",
    "answer": "Test answer",
    "category": "ABOUT_US",
    "sortOrder": 0,
    "status": "ACTIVE"
  }'
```

---

### Phase 3: Admin Interface (3-4 hours)

**Step 3.1: Create Admin Pages**
```bash
# Create pages in order:
1. src/app/admin/content/faqs/page.tsx (List)
2. src/app/admin/content/faqs/create/page.tsx (Create)
3. src/app/admin/content/faqs/[id]/edit/page.tsx (Edit)
```

**Step 3.2: Update Admin Navigation**

**File:** `src/components/admin/AdminSidebar.tsx`

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
      title: 'FAQs',
      href: '/admin/content/faqs',
      icon: HelpCircle,
      badge: faqCount, // Optional: show count
    },
  ],
}
```

---

### Phase 4: Public Interface (2-3 hours)

**Step 4.1: Create Public FAQ Page**
```bash
1. src/app/soalan-lazim/page.tsx
```

**Step 4.2: Add to Main Navigation**

Update header navigation to include FAQ link:
```typescript
<Link href="/soalan-lazim">Soalan Lazim</Link>
```

**Step 4.3: Add SEO Method**

**File:** `src/lib/seo/seo-service.ts`

Add method:
```typescript
static generateFAQPageSEO(faqs: FAQ[]): SEOData {
  return {
    title: 'Soalan Lazim (FAQ) | JRM HOLISTIK - Jamu Ratu Malaya',
    description: 'Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK, produk jamu, penghantaran, dan keahlian.',
    keywords: [
      'FAQ JRM HOLISTIK',
      'soalan lazim jamu',
      'JRM HOLISTIK FAQ',
      'soalan tentang jamu',
      'Jamu Ratu Malaya FAQ',
    ],
    canonical: `${this.SITE_URL}/soalan-lazim`,
    ogType: 'website',
    structuredData: this.generateFAQSchema(
      faqs.map(f => ({ question: f.question, answer: f.answer }))
    ),
  };
}
```

---

## 🧪 TESTING STRATEGY

### Unit Tests

**Test Constants:**
```typescript
// __tests__/constants/faq-constants.test.ts
describe('FAQ Constants', () => {
  it('should have all required categories', () => {
    expect(FAQ_CONSTANTS.CATEGORIES).toBeDefined();
    expect(Object.keys(FAQ_CONSTANTS.CATEGORIES).length).toBeGreaterThan(0);
  });

  it('should get category label correctly', () => {
    const label = getFAQCategoryLabel('ABOUT_US');
    expect(label).toBe('Tentang Kami');
  });
});
```

**Test Validation:**
```typescript
// __tests__/validations/faq-validation.test.ts
describe('FAQ Validation', () => {
  it('should validate correct FAQ data', () => {
    const validData = {
      question: 'Test question?',
      answer: 'Test answer with enough characters',
      category: 'ABOUT_US',
      sortOrder: 0,
      status: 'ACTIVE',
    };

    const result = faqCreateSchema.parse(validData);
    expect(result).toMatchObject(validData);
  });

  it('should reject short question', () => {
    const invalidData = {
      question: 'Test',
      answer: 'Test answer',
      category: 'ABOUT_US',
    };

    expect(() => faqCreateSchema.parse(invalidData)).toThrow();
  });
});
```

### Integration Tests

**Test API Routes:**
```typescript
// __tests__/api/admin/faqs.test.ts
describe('POST /api/admin/faqs', () => {
  it('should create FAQ with valid data', async () => {
    const response = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=valid_session',
      },
      body: JSON.stringify({
        question: 'Test FAQ?',
        answer: 'Test answer',
        category: 'ABOUT_US',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.faq).toBeDefined();
  });

  it('should reject unauthorized request', async () => {
    const response = await fetch('/api/admin/faqs', {
      method: 'POST',
      body: JSON.stringify({ /* ... */ }),
    });

    expect(response.status).toBe(401);
  });
});
```

### E2E Tests (Optional)

**Test Admin Flow:**
```typescript
// e2e/admin-faq.spec.ts
test('Admin can create, edit, and delete FAQ', async ({ page }) => {
  // Login as admin
  await page.goto('/auth/signin');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');

  // Navigate to FAQ management
  await page.goto('/admin/content/faqs');
  await page.click('text=Create New FAQ');

  // Fill form
  await page.fill('[name="question"]', 'Test FAQ Question?');
  await page.fill('[name="answer"]', 'Test FAQ Answer');
  await page.selectOption('[name="category"]', 'ABOUT_US');

  // Submit
  await page.click('text=Create FAQ');

  // Verify redirect and success
  await page.waitForURL('/admin/content/faqs');
  await expect(page.locator('text=Test FAQ Question?')).toBeVisible();
});
```

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Build project: `npm run build`
- [ ] Verify database migration: `npx prisma migrate deploy`
- [ ] Test all API endpoints manually
- [ ] Test admin interface in staging
- [ ] Test public FAQ page in staging
- [ ] Verify SEO metadata and schema
- [ ] Check mobile responsiveness

### Deployment Steps

1. **Database Migration:**
```bash
# On production server
npx prisma migrate deploy
npx prisma generate
```

2. **Environment Variables:**
```bash
# Verify all required env vars are set
DATABASE_URL=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=xxx
```

3. **Deploy Application:**
```bash
# Railway auto-deploys on push
git push origin main

# Or manual deploy
railway up
```

4. **Post-Deployment Verification:**
- [ ] FAQ admin page loads
- [ ] Can create FAQ
- [ ] Can edit FAQ
- [ ] Can delete FAQ
- [ ] Public FAQ page displays correctly
- [ ] SEO schema validates (use Google Rich Results Test)

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check database for orphaned records
- [ ] Verify analytics tracking
- [ ] Test performance (page load times)
- [ ] Create initial FAQ content (seed data)

---

## 📊 SUCCESS METRICS

### Technical Metrics
- API response time < 200ms
- Page load time < 2 seconds
- Zero critical bugs
- 100% upfront type coverage
- All validation working correctly

### Business Metrics
- Admin can create FAQ in < 2 minutes
- FAQs display correctly on public page
- SEO schema passes Google validation
- Mobile experience is smooth
- Search functionality works

---

## 🔄 MAINTENANCE

### Regular Tasks
- **Weekly:** Review FAQ analytics
- **Monthly:** Update outdated FAQs
- **Quarterly:** Optimize frequently accessed FAQs

### Monitoring
- Database query performance
- API error rates
- User search queries (identify new FAQ needs)

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- Prisma Docs: https://www.prisma.io/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Zod Validation: https://zod.dev
- TipTap Editor: https://tiptap.dev

### Code Standards Reference
- Project CLAUDE.md
- CODING_STANDARDS.md

---

**END OF IMPLEMENTATION PLAN**

This document should serve as the single source of truth for FAQ CMS development. Follow each step systematically, verify at each checkpoint, and maintain code quality throughout.
