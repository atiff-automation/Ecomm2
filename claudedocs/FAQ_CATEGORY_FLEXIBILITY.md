# FAQ Category Flexibility Limitation

## Current Status

**FAQ categories are hardcoded in the PostgreSQL database schema as an ENUM type.**

## Technical Details

### Database Schema
```prisma
// prisma/schema.prisma
enum FAQCategory {
  ABOUT_US
  PRODUCTS
  SHIPPING
  PAYMENT
  MEMBERSHIP
  SAFETY
}

model FAQ {
  category    FAQCategory
  // ... other fields
}
```

### Current Categories
1. **ABOUT_US** - About Us / Tentang Kami
2. **PRODUCTS** - Products / Produk
3. **SHIPPING** - Shipping / Penghantaran
4. **PAYMENT** - Payment / Pembayaran
5. **MEMBERSHIP** - Membership / Keahlian
6. **SAFETY** - Safety / Keselamatan

## Limitation

**You cannot add new categories without a database migration.**

PostgreSQL ENUMs are database-level types that require a schema migration to modify. This means:

- ✅ Categories are consistent across the system
- ✅ Categories are type-safe (TypeScript + Database level)
- ❌ **Cannot add new categories through admin interface**
- ❌ **Requires developer intervention via migration**

## How to Add New Categories

If you need to add a new category, you must follow these steps:

### 1. Update Prisma Schema
```prisma
// prisma/schema.prisma
enum FAQCategory {
  ABOUT_US
  PRODUCTS
  SHIPPING
  PAYMENT
  MEMBERSHIP
  SAFETY
  NEW_CATEGORY  // Add your new category here
}
```

### 2. Update FAQ Constants
```typescript
// src/lib/constants/faq-constants.ts
export const FAQ_CONSTANTS = {
  CATEGORIES: {
    // ... existing categories
    NEW_CATEGORY: {
      value: 'NEW_CATEGORY',
      label: 'New Category',
      labelMalay: 'Kategori Baru',
      description: 'Description of new category',
      icon: 'Icon',
    },
  },
};
```

### 3. Create and Run Migration
```bash
# Create migration
npx prisma migrate dev --name add_faq_category_new_category

# Deploy to production
npx prisma migrate deploy
```

### 4. Update Type Definitions
TypeScript types will automatically update after running the migration since they're generated from Prisma schema.

## Alternative Approaches

If you need more flexibility, you could consider:

### Option 1: Convert to String Field (More Flexible)
- Change `category` from ENUM to String
- Lose database-level type safety
- Gain ability to add categories dynamically
- **Not recommended for current use case**

### Option 2: Separate Category Table (Best for Dynamic Categories)
```prisma
model FAQCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  nameEnglish String
  nameMalay   String
  description String?
  icon        String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  faqs        FAQ[]
}

model FAQ {
  categoryId  String
  category    FAQCategory @relation(fields: [categoryId], references: [id])
  // ... other fields
}
```

**Pros:**
- Categories can be managed through admin interface
- Full flexibility to add/edit/remove categories
- Maintains referential integrity

**Cons:**
- More complex queries (JOIN operations)
- Need to build category management UI
- No ENUM type safety

## Recommendation

For **JRM HOLISTIK FAQ system**, the current ENUM approach is appropriate because:

1. **Stable Categories** - FAQ categories rarely change
2. **Type Safety** - ENUM provides compile-time and runtime safety
3. **Performance** - No JOIN operations needed
4. **Simplicity** - Easier to maintain and understand

If you find yourself needing to add categories frequently (more than once per quarter), consider migrating to the separate category table approach.

## Decision Tracking

**Date:** 2025-11-11
**Status:** ENUM approach chosen for stability and type safety
**Review:** Revisit if categories need to be added more than once per quarter
