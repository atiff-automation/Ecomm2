# Landing Page Feature - Phase 1: MVP Implementation Plan

## 🎯 Objective

Create a complete duplicate of the Article CMS system, renamed and adapted for Landing Pages. This provides a solid foundation for marketing-focused landing pages while maintaining all existing article functionality under a separate namespace.

---

## 📋 Project Overview

**Approach**: Complete code duplication (Option 2)
**Rationale**: Landing pages will evolve differently from articles with unique features in Phase 2
**Foundation**: Article CMS system serves as the proven, tested base

---

## 🗂️ Database Schema Changes

### 1. Prisma Schema Updates

**File**: `prisma/schema.prisma`

#### A. Create Landing Page Enums

```prisma
// Landing Page Status Enum
enum LandingPageStatus {
  DRAFT
  PUBLISHED
}
```

#### B. Create Landing Page Category Model

```prisma
// Landing Page Category Model - Dynamic categories managed by admin
model LandingPageCategory {
  id          String   @id @default(cuid())

  // Category Name
  name        String   @unique
  slug        String   @unique
  description String?

  // Display
  icon        String?  // Icon name (e.g., "Rocket", "Target")
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
  landingPages    LandingPage[]
  createdByUser   User?  @relation("LandingPageCategoryCreatedBy", fields: [createdBy], references: [id])
  updatedByUser   User?  @relation("LandingPageCategoryUpdatedBy", fields: [updatedBy], references: [id])

  @@index([slug])
  @@index([isActive])
  @@index([sortOrder])
  @@map("landing_page_categories")
}
```

#### C. Create Landing Page Tag Model

```prisma
// Landing Page Tag Model - Free-form tags for taxonomy
model LandingPageTag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  // Relations
  landingPages  LandingPageToTag[]

  @@index([slug])
  @@map("landing_page_tags")
}
```

#### D. Create Landing Page to Tag Junction Table

```prisma
// Landing Page to Tag Junction Table (Many-to-Many)
model LandingPageToTag {
  id            String   @id @default(cuid())
  landingPageId String
  tagId         String
  createdAt     DateTime @default(now())

  landingPage   LandingPage    @relation(fields: [landingPageId], references: [id], onDelete: Cascade)
  tag           LandingPageTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([landingPageId, tagId])
  @@index([landingPageId])
  @@index([tagId])
  @@map("landing_page_to_tags")
}
```

#### E. Create Landing Page Model

```prisma
// Landing Page Model
model LandingPage {
  id               String              @id @default(cuid())

  // Basic Content
  title            String              @db.VarChar(200)
  slug             String              @unique @db.VarChar(200)
  excerpt          String?             @db.VarChar(500)
  content          String              @db.Text // Rich text HTML from TipTap
  featuredImage    String              // Required featured image URL
  featuredImageAlt String              @db.VarChar(200)

  // Organization
  categoryId       String
  category         LandingPageCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  tags             LandingPageToTag[]
  sortOrder        Int                 @default(0)

  // SEO Fields
  metaTitle        String?             @db.VarChar(200)
  metaDescription  String?             @db.VarChar(300)
  metaKeywords     String[]            // Array of keywords

  // Author
  authorId         String
  author           User                @relation("LandingPageAuthor", fields: [authorId], references: [id])

  // Publishing
  status           LandingPageStatus   @default(DRAFT)
  publishedAt      DateTime?

  // Analytics
  viewCount        Int                 @default(0)
  readingTimeMin   Int                 @default(0) // Auto-calculated

  // Metadata
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  createdBy        String?
  updatedBy        String?

  // Audit Relations
  createdByUser    User?               @relation("LandingPageCreatedBy", fields: [createdBy], references: [id])
  updatedByUser    User?               @relation("LandingPageUpdatedBy", fields: [updatedBy], references: [id])

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@index([categoryId])
  @@index([authorId])
  @@index([sortOrder])
  @@index([viewCount])
  @@index([createdAt])
  @@map("landing_pages")
}
```

#### F. Update User Model Relations

Add these fields to the `User` model:

```prisma
model User {
  // ... existing fields ...

  // Landing Page Relations
  landingPages                 LandingPage[]            @relation("LandingPageAuthor")
  landingPagesCreated          LandingPage[]            @relation("LandingPageCreatedBy")
  landingPagesUpdated          LandingPage[]            @relation("LandingPageUpdatedBy")
  landingPageCategoriesCreated LandingPageCategory[]    @relation("LandingPageCategoryCreatedBy")
  landingPageCategoriesUpdated LandingPageCategory[]    @relation("LandingPageCategoryUpdatedBy")
}
```

### 2. Migration Command

```bash
npx prisma migrate dev --name add_landing_page_system
```

---

## 📁 File Structure & Code Duplication

### Directory Organization

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── landing-pages/          # NEW - Admin API routes
│   │   │       ├── [id]/
│   │   │       │   └── route.ts
│   │   │       ├── reorder/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── public/
│   │   │   └── landing-pages/          # NEW - Public API routes
│   │   │       ├── [slug]/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   ├── (admin)/
│   │   └── admin/
│   │       └── landing-pages/          # NEW - Admin pages
│   │           ├── [id]/
│   │           │   ├── edit/
│   │           │   │   └── page.tsx
│   │           │   └── page.tsx
│   │           ├── create/
│   │           │   └── page.tsx
│   │           └── page.tsx
│   └── (public)/
│       └── landing/                     # NEW - Public pages
│           ├── [slug]/
│           │   └── page.tsx
│           └── page.tsx                 # List page
├── components/
│   ├── admin/
│   │   └── LandingPageForm.tsx         # NEW - Admin form component
│   ├── landing-page/
│   │   ├── embeds/
│   │   │   └── LandingPageContent.tsx  # NEW - Content renderer
│   │   └── LandingPageCard.tsx         # NEW - Landing page card
│   └── seo/
│       └── LandingPageSchema.tsx       # NEW - JSON-LD schema
├── lib/
│   ├── constants/
│   │   └── landing-page-constants.ts   # NEW - Constants
│   ├── validations/
│   │   └── landing-page-validation.ts  # NEW - Zod schemas
│   └── services/
│       └── landing-page-service.ts     # NEW - Business logic
└── types/
    └── landing-page.types.ts           # NEW - TypeScript types
```

---

## 🔄 Step-by-Step Implementation Guide

### Step 1: Create Constants File

**File**: `src/lib/constants/landing-page-constants.ts`

**Action**: Duplicate `article-constants.ts` and replace all instances:
- `ARTICLE` → `LANDING_PAGE`
- `Article` → `LandingPage`
- `article` → `landingPage`
- API routes: `/api/admin/articles` → `/api/admin/landing-pages`

**Key Changes**:
```typescript
export const LANDING_PAGE_CONSTANTS = {
  STATUS: {
    DRAFT: { /* ... */ },
    PUBLISHED: { /* ... */ },
  },
  API_ROUTES: {
    ADMIN_LANDING_PAGES: '/api/admin/landing-pages',
    ADMIN_CATEGORIES: '/api/admin/landing-page-categories',
    PUBLIC_LANDING_PAGES: '/api/public/landing-pages',
  },
  // ... rest identical to article constants
}
```

---

### Step 2: Create Type Definitions

**File**: `src/types/landing-page.types.ts`

**Action**: Duplicate `article.types.ts` and replace all instances:
- Import from Prisma: `LandingPage`, `LandingPageCategory`, `LandingPageTag`, `LandingPageStatus`
- All interface names: `Article*` → `LandingPage*`

**Example**:
```typescript
import {
  LandingPage as PrismaLandingPage,
  LandingPageCategory as PrismaLandingPageCategory,
  LandingPageTag as PrismaLandingPageTag,
  LandingPageStatus,
} from '@prisma/client';

export type LandingPage = PrismaLandingPage;
export type LandingPageCategory = PrismaLandingPageCategory;

export interface LandingPageWithRelations extends LandingPage {
  category: LandingPageCategory;
  tags: Array<{ tag: LandingPageTag }>;
  // ... etc
}
```

---

### Step 3: Create Validation Schemas

**File**: `src/lib/validations/landing-page-validation.ts`

**Action**: Duplicate `article-validation.ts` and replace:
- Import constants from `landing-page-constants`
- All schema names: `article*` → `landingPage*`
- All enum references to `LandingPageStatus`

**Example**:
```typescript
import { z } from 'zod';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';

const landingPageStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

export const landingPageBaseSchema = z.object({
  title: z.string().min(/* ... */),
  slug: /* ... */,
  // ... rest identical
});

export const landingPageCreateSchema = landingPageBaseSchema.refine(/* ... */);
export const landingPageUpdateSchema = landingPageBaseSchema.partial();
```

---

### Step 4: Create Admin API Routes

#### A. Main CRUD Route

**File**: `src/app/api/admin/landing-pages/route.ts`

**Action**: Duplicate `src/app/api/admin/articles/route.ts`

**Replacements**:
- Import from `@prisma/client`: `LandingPage`, `LandingPageStatus`, `Prisma`
- Import validations from `landing-page-validation`
- Import types from `landing-page.types`
- Database queries: `prisma.article` → `prisma.landingPage`
- Tag relations: `articleToTag` → `landingPageToTag`
- Category relations: `articleCategory` → `landingPageCategory`
- Tag table: `prisma.articleTag` → `prisma.landingPageTag`

**Key Code Structure**:
```typescript
// GET - List landing pages
export async function GET(request: Request) {
  // Pagination, filtering, search
  const landingPages = await prisma.landingPage.findMany({
    where: { /* filters */ },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { /* ... */ } },
    },
    orderBy: { sortOrder: 'asc' },
  });
  // ...
}

// POST - Create landing page
export async function POST(request: Request) {
  // Auth check
  // Validation
  // Create with transaction (landing page + tags)
  // ...
}
```

#### B. Individual Landing Page Route

**File**: `src/app/api/admin/landing-pages/[id]/route.ts`

**Action**: Duplicate `src/app/api/admin/articles/[id]/route.ts`

**Replacements**: Same as above

**Key Code Structure**:
```typescript
// GET - Get single landing page
// PUT - Update landing page
// DELETE - Delete landing page
```

#### C. Reorder Route

**File**: `src/app/api/admin/landing-pages/reorder/route.ts`

**Action**: Duplicate `src/app/api/admin/articles/reorder/route.ts`

**Replacements**: Same as above

---

### Step 5: Create Public API Routes

#### A. Public List Route

**File**: `src/app/api/public/landing-pages/route.ts`

**Action**: Create new file (similar to articles public route if exists)

**Key Features**:
- Filter by `status: PUBLISHED` only
- Public filtering by category, tag
- Pagination
- View count tracking (optional for Phase 1)

#### B. Public Single Route

**File**: `src/app/api/public/landing-pages/[slug]/route.ts`

**Action**: Create new file

**Key Features**:
- Fetch by slug
- Status must be PUBLISHED
- Increment view count
- Return with relations (category, tags, author)

---

### Step 6: Create Admin Form Component

**File**: `src/components/admin/LandingPageForm.tsx`

**Action**: Duplicate `src/components/admin/ArticleForm.tsx`

**Replacements**:
- Import from `landing-page-constants`, `landing-page-validation`, `landing-page.types`
- Component name: `ArticleForm` → `LandingPageForm`
- All prop types: `Article*` → `LandingPage*`
- API endpoint: `/api/admin/articles` → `/api/admin/landing-pages`
- Form labels: "Article" → "Landing Page"

**Key Features** (keep identical):
- Rich text editor (TipTap)
- Featured image upload
- Slug auto-generation
- Tag input
- Category selection
- SEO fields
- Draft/Publish toggle
- Product URL embed support (existing feature)

---

### Step 7: Create Admin Pages

#### A. List Page

**File**: `src/app/(admin)/admin/landing-pages/page.tsx`

**Action**: Duplicate admin articles list page

**Features**:
- Table view with search, filter, pagination
- Status badges (Draft/Published)
- Quick actions (Edit, Delete, View)
- Create new button
- Drag-to-reorder (optional)

#### B. Create Page

**File**: `src/app/(admin)/admin/landing-pages/create/page.tsx`

**Action**: Simple page rendering `<LandingPageForm />`

```typescript
import LandingPageForm from '@/components/admin/LandingPageForm';

export default function CreateLandingPagePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create Landing Page</h1>
      <LandingPageForm />
    </div>
  );
}
```

#### C. Edit Page

**File**: `src/app/(admin)/admin/landing-pages/[id]/edit/page.tsx`

**Action**: Fetch landing page and render form

```typescript
export default async function EditLandingPagePage({ params }: { params: { id: string } }) {
  const landingPage = await prisma.landingPage.findUnique({
    where: { id: params.id },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!landingPage) notFound();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Landing Page</h1>
      <LandingPageForm landingPage={landingPage} />
    </div>
  );
}
```

---

### Step 8: Create Public Pages

#### A. Landing Page List

**File**: `src/app/(public)/landing/page.tsx`

**Action**: Duplicate articles list page (if exists)

**Features**:
- Grid/list view of published landing pages
- Filter by category
- Search functionality
- Pagination

#### B. Landing Page Detail

**File**: `src/app/(public)/landing/[slug]/page.tsx`

**Action**: Duplicate article detail page

**Features**:
- Full landing page content
- Featured image
- Rich text rendering
- Product embeds (existing feature)
- SEO meta tags
- JSON-LD structured data

**Example**:
```typescript
import { Metadata } from 'next';
import LandingPageContent from '@/components/landing-page/embeds/LandingPageContent';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landingPage = await prisma.landingPage.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
  });

  return {
    title: landingPage?.metaTitle || landingPage?.title,
    description: landingPage?.metaDescription || landingPage?.excerpt,
    // ... OpenGraph, Twitter cards, etc.
  };
}

export default async function LandingPagePage({ params }: Props) {
  const landingPage = await prisma.landingPage.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { category: true, tags: { include: { tag: true } }, author: true },
  });

  if (!landingPage) notFound();

  return (
    <article>
      <LandingPageContent landingPage={landingPage} />
    </article>
  );
}
```

---

### Step 9: Create Content Renderer Component

**File**: `src/components/landing-page/embeds/LandingPageContent.tsx`

**Action**: Duplicate `src/components/article/embeds/ArticleContent.tsx`

**Purpose**: Render rich text content with product embeds

**Key Features**:
- Parse HTML content
- Detect product URLs
- Render product cards inline
- YouTube embeds (if applicable)
- Responsive layout

---

### Step 10: Create SEO Schema Component

**File**: `src/components/seo/LandingPageSchema.tsx`

**Action**: Duplicate `src/components/seo/ArticleSchema.tsx`

**Purpose**: Generate JSON-LD structured data for SEO

**Example**:
```typescript
export default function LandingPageSchema({ landingPage }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    headline: landingPage.title,
    description: landingPage.excerpt,
    image: landingPage.featuredImage,
    datePublished: landingPage.publishedAt,
    dateModified: landingPage.updatedAt,
    author: {
      '@type': 'Person',
      name: `${landingPage.author.firstName} ${landingPage.author.lastName}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

### Step 11: Update Admin Navigation

**File**: `src/components/admin/AdminSidebar.tsx` (or equivalent)

**Action**: Add "Landing Pages" menu item

```typescript
{
  label: 'Landing Pages',
  href: '/admin/landing-pages',
  icon: RocketIcon, // Or appropriate icon
}
```

---

## ✅ Testing Checklist

### Database Tests
- [ ] Migration runs successfully
- [ ] All tables created with correct schema
- [ ] Indexes created on all specified fields
- [ ] Foreign key constraints work correctly
- [ ] User relations established properly

### API Tests
- [ ] **Create**: Can create landing page with all fields
- [ ] **Read**: Can fetch single landing page by ID
- [ ] **Update**: Can update landing page (partial and full)
- [ ] **Delete**: Can delete landing page (cascades to tags)
- [ ] **List**: Pagination works correctly
- [ ] **Filter**: Can filter by category, status, tags
- [ ] **Search**: Search works on title and content
- [ ] **Reorder**: Can reorder landing pages
- [ ] **Validation**: All Zod schemas validate correctly
- [ ] **Auth**: Admin-only routes protected

### Admin UI Tests
- [ ] Landing pages list displays correctly
- [ ] Create form renders with all fields
- [ ] Edit form pre-populates data correctly
- [ ] Rich text editor works (TipTap)
- [ ] Image upload works for featured image
- [ ] Slug auto-generation works
- [ ] Tag input works (add/remove tags)
- [ ] Category dropdown populated
- [ ] Draft/Publish toggle works
- [ ] Form validation shows errors
- [ ] Success/error messages display
- [ ] Redirect after create/update/delete

### Public UI Tests
- [ ] Landing page list shows only published
- [ ] Landing page detail renders correctly
- [ ] Featured image displays
- [ ] Rich text content renders
- [ ] Product embeds work (from article feature)
- [ ] Category/tag filtering works
- [ ] Pagination works
- [ ] SEO meta tags rendered correctly
- [ ] JSON-LD schema present
- [ ] Responsive on mobile/tablet/desktop

### Integration Tests
- [ ] Create landing page → appears in list
- [ ] Publish landing page → visible on frontend
- [ ] Draft landing page → not visible on frontend
- [ ] Update landing page → changes reflected
- [ ] Delete landing page → removed everywhere
- [ ] View count increments on page view

### Code Quality Tests
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All imports resolve correctly
- [ ] No `any` types used
- [ ] All async operations have try-catch
- [ ] All Zod schemas used for validation
- [ ] Constants used (no hardcoding)

---

## 🚀 Deployment Steps

### 1. Pre-deployment
```bash
# Run type check
npm run typecheck

# Run linter
npm run lint

# Run build
npm run build

# Test production build locally
npm run start
```

### 2. Database Migration
```bash
# Production migration
npx prisma migrate deploy

# Verify schema
npx prisma db pull
npx prisma generate
```

### 3. Post-deployment Verification
- [ ] Create test landing page in production
- [ ] Verify public page accessible
- [ ] Check SEO tags in source
- [ ] Test image uploads
- [ ] Verify product embeds work

---

## 📊 Success Criteria

### Functional Requirements
✅ Landing pages completely independent from articles
✅ All CRUD operations work flawlessly
✅ Admin interface fully functional
✅ Public pages render correctly
✅ SEO optimization identical to articles
✅ Product URL embedding works (existing feature)

### Technical Requirements
✅ Zero TypeScript errors
✅ Zero ESLint errors
✅ Build succeeds without warnings
✅ All validations use Zod schemas
✅ No hardcoded values (constants used)
✅ Database properly indexed
✅ API routes follow RESTful conventions

### Code Quality Requirements
✅ Follows SOLID principles
✅ DRY principle applied (constants, utilities)
✅ Single Source of Truth maintained
✅ Type safety enforced (no `any` types)
✅ Error handling comprehensive
✅ Consistent naming conventions

---

## 🔄 Phase 1 Completion Criteria

**Definition of Done**:
1. All files created and properly organized
2. Database schema migrated successfully
3. All API endpoints functional and tested
4. Admin interface complete and usable
5. Public pages render correctly
6. All tests pass (manual testing checklist)
7. Code review approved
8. Documentation complete
9. Deployed to production successfully
10. Stakeholder sign-off obtained

**Once Phase 1 is complete and tested, proceed to Phase 2 for enhanced features.**

---

## 📝 Notes for Developers

### Naming Conventions
- **Database**: `landing_pages`, `landing_page_categories`, `landing_page_tags`
- **Prisma Models**: `LandingPage`, `LandingPageCategory`, `LandingPageTag`
- **API Routes**: `/api/admin/landing-pages`, `/api/public/landing-pages`
- **Frontend Routes**: `/landing/[slug]`, `/admin/landing-pages`
- **Components**: `LandingPageForm`, `LandingPageContent`, `LandingPageCard`
- **Types**: `LandingPageWithRelations`, `LandingPageCreateInput`
- **Schemas**: `landingPageCreateSchema`, `landingPageUpdateSchema`
- **Constants**: `LANDING_PAGE_CONSTANTS`

### Code Duplication Strategy
1. Copy entire file
2. Find and replace: `Article` → `LandingPage`, `article` → `landingPage`
3. Update imports to use landing page modules
4. Update database queries to use `prisma.landingPage`
5. Update API routes
6. Test thoroughly

### Common Pitfalls to Avoid
- ❌ Don't forget to update User model relations
- ❌ Don't mix article and landing page imports
- ❌ Don't hardcode values (use constants)
- ❌ Don't skip validation on any input
- ❌ Don't use `any` types
- ❌ Don't forget indexes on database fields
- ❌ Don't skip error handling in API routes
- ❌ Don't forget to update navigation menus

### Performance Considerations
- Use database indexes for all query filters
- Implement pagination on list views
- Lazy load images
- Cache product embeds (existing feature)
- Optimize SEO meta tag generation

---

**End of Phase 1 Implementation Plan**

**Next**: Proceed to `LANDING_PAGE_PHASE2_ENHANCEMENTS.md` after Phase 1 completion.
