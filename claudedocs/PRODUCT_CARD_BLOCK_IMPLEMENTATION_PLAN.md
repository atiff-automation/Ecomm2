# Product Card Block Implementation Plan
**Feature**: Add Product Card Block to Click Pages
**Date**: 2025-12-03
**Status**: Planning

## Executive Summary

This document outlines the implementation of a new `PRODUCT_CARD` block type for Click Pages, enabling users to embed product cards directly into landing pages. This feature mirrors the product embedding functionality currently available in Articles, but adapts it to the Click Page block-based architecture.

---

## 🎯 Goals

1. **Enable product promotion** on Click Pages (landing pages, campaigns)
2. **Reuse existing product card logic** from the main product catalog
3. **Maintain consistency** with article product embeds
4. **Follow DRY principle** - centralize product display logic
5. **Type-safe implementation** - no `any` types, full TypeScript coverage

---

## 📋 Requirements

### Functional Requirements

1. **Product Selection**
   - Admin can select product from searchable dropdown
   - Support for product search by name, SKU, or slug
   - Display product preview in settings panel

2. **Display Options**
   - Layout variants: `compact`, `standard`, `detailed`
   - Toggles: Show member price, show stock status, show description
   - Custom CTA text override
   - Full styling control via Style tab

3. **Pricing Integration**
   - **CRITICAL**: Must use centralized `PricingService` (Single Source of Truth)
   - Display regular price, member price, early access price
   - Show badges (Member Only, Early Access, etc.)
   - Respect user membership status

4. **Click Tracking**
   - Track product card clicks via existing Click Page analytics
   - Record which products are viewed/clicked
   - UTM parameter support

5. **Error Handling**
   - Graceful degradation if product is deleted
   - Show placeholder or hide block
   - Admin warning for deleted products

### Non-Functional Requirements

1. **Performance**
   - Client-side data fetching with SWR/React Query for caching
   - No unnecessary re-renders
   - Optimized images (Next.js Image component)

2. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader friendly

3. **Responsive Design**
   - Mobile-first approach
   - Follows existing Click Page responsive patterns
   - Adapts to container width tiers

---

## 🏗️ Architecture Design

### Single Source of Truth Principles

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT DATA SOURCES                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Database (Prisma)                                           │
│       ↓                                                      │
│  Product Model (prisma/schema.prisma)                        │
│       ↓                                                      │
│  ProductPricingData Type (lib/types/pricing.ts)              │
│       ↓                                                      │
│  PricingService (lib/services/pricing-service.ts)            │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────┐           │
│  │  PRODUCT CARD RENDERING (Centralized)        │           │
│  │                                              │           │
│  │  • ProductCard (components/product/)         │           │
│  │  • usePricing hook                           │           │
│  │  • Badge generation                          │           │
│  │  • Price display logic                       │           │
│  └──────────────────────────────────────────────┘           │
│       ↓              ↓               ↓                       │
│  Article Embed  Click Page Block  Product Grid              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: All product card displays (articles, click pages, product grids) MUST use the same `ProductCard` component and `PricingService`.

---

## 📁 File Structure

### New Files to Create

```
src/
├── components/
│   └── click-pages/
│       └── blocks/
│           └── ProductCardBlock.tsx              # ✅ New block component
│
├── lib/
│   ├── constants/
│   │   └── click-page-blocks.ts                  # ✏️ Update with PRODUCT_CARD
│   │
│   └── utils/
│       └── block-registry.ts                     # ✏️ Update with PRODUCT_CARD
│
├── types/
│   └── click-page.types.ts                       # ✏️ Add ProductCardBlock interface
│
└── app/
    └── admin/
        └── click-pages/
            └── _components/
                ├── BlockPalette.tsx              # ✏️ Add PRODUCT_CARD to palette
                └── BlockSettingsPanel.tsx        # ✏️ Add settings UI
```

### Modified Files

```
src/
├── components/
│   └── click-pages/
│       └── blocks/
│           ├── BlockRenderer.tsx                 # ✏️ Add PRODUCT_CARD case
│           └── index.ts                          # ✏️ Export ProductCardBlock
│
└── lib/
    └── validation/
        └── click-page-schemas.ts                 # ✏️ Add validation schema
```

---

## 🔧 Implementation Details

### Step 1: Type Definitions

**File**: `src/types/click-page.types.ts`

```typescript
/**
 * Product Card Block - Displays a product with pricing and CTA
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
```

**Add to Block union type**:
```typescript
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
  | ProductCardBlock; // ✅ Add this
```

---

### Step 2: Block Registry

**File**: `src/lib/utils/block-registry.ts`

```typescript
export const BLOCK_REGISTRY: BlockRegistryType = {
  // ... existing blocks ...

  PRODUCT_CARD: {
    type: 'PRODUCT_CARD',
    label: 'Product Card',
    description: 'Display a product with pricing and call-to-action',
    icon: 'ShoppingBag', // Lucide icon
    category: 'cta',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.PRODUCT_CARD,
  },
};
```

---

### Step 3: Default Settings Constant

**File**: `src/lib/constants/click-page-constants.ts`

```typescript
export const CLICK_PAGE_CONSTANTS = {
  BLOCKS: {
    DEFAULT_SETTINGS: {
      // ... existing blocks ...

      PRODUCT_CARD: {
        productId: '', // Empty - user must select
        layout: 'standard',
        showMemberPrice: true,
        showStock: true,
        showDescription: true,
        showRating: true,
        ctaAction: 'view',
        fullWidth: false,
      },
    },
  },
};
```

---

### Step 4: Validation Schema

**File**: `src/lib/validation/click-page-schemas.ts`

```typescript
import { z } from 'zod';

// Product Card Block Schema
const productCardBlockSettingsSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productSlug: z.string().optional(),
  layout: z.enum(['compact', 'standard', 'detailed']),
  showMemberPrice: z.boolean(),
  showStock: z.boolean(),
  showDescription: z.boolean(),
  showRating: z.boolean(),
  ctaText: z.string().max(50).optional(),
  ctaAction: z.enum(['view', 'cart']),
  fullWidth: z.boolean().optional(),
  styles: styleSettingsSchema.optional(),
});

const productCardBlockSchema = baseBlockSchema.extend({
  type: z.literal('PRODUCT_CARD'),
  settings: productCardBlockSettingsSchema,
});

// Add to block union schema
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
  videoBlockSchema,
  formBlockSchema,
  imageGalleryBlockSchema,
  embedBlockSchema,
  accordionBlockSchema,
  productCardBlockSchema, // ✅ Add this
]);
```

---

### Step 5: Product Card Block Component

**File**: `src/components/click-pages/blocks/ProductCardBlock.tsx`

```typescript
'use client';

/**
 * Product Card Block Component
 * Displays a product card within Click Pages
 *
 * IMPORTANT: This component MUST reuse the existing ProductCard component
 * from src/components/product/ProductCard.tsx to maintain Single Source of Truth
 */

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductPricingData } from '@/lib/types/pricing';
import type { ProductCardBlock as ProductCardBlockType } from '@/types/click-page.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProductCardBlockProps {
  block: ProductCardBlockType;
  onProductClick?: (productId: string, productSlug: string) => void;
}

export function ProductCardBlockComponent({
  block,
  onProductClick
}: ProductCardBlockProps) {
  const [product, setProduct] = useState<ProductPricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { settings } = block;

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public/products/${settings.productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found or deleted');
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    if (settings.productId) {
      fetchProduct();
    } else {
      setLoading(false);
      setError('No product selected');
    }
  }, [settings.productId]);

  // Handle product click for analytics
  const handleProductClick = () => {
    if (product && onProductClick) {
      onProductClick(product.id, product.slug);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Skeleton className="w-full h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <Alert variant="destructive" className="max-w-sm mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Unable to display product'}
        </AlertDescription>
      </Alert>
    );
  }

  // Determine display options based on layout
  const showDescription = settings.layout !== 'compact' && settings.showDescription;
  const showRating = settings.layout !== 'compact' && settings.showRating;

  // Container width class based on layout
  const widthClass = settings.fullWidth
    ? 'w-full'
    : settings.layout === 'detailed'
      ? 'max-w-md mx-auto'
      : 'max-w-sm mx-auto';

  return (
    <div className={widthClass} onClick={handleProductClick}>
      <ProductCard
        product={product}
        size={settings.layout === 'compact' ? 'sm' : 'md'}
        showDescription={showDescription}
        showRating={showRating}
        className="h-full"
      />
    </div>
  );
}

export default ProductCardBlockComponent;
```

---

### Step 6: Block Renderer Integration

**File**: `src/components/click-pages/blocks/BlockRenderer.tsx`

```typescript
// Import the new component
import { ProductCardBlockComponent } from './ProductCardBlock';

// Add to renderBlock() switch statement
const renderBlock = () => {
  switch (block.type) {
    // ... existing cases ...

    case 'PRODUCT_CARD':
      return (
        <ProductCardBlockComponent
          block={block}
          onProductClick={(productId, productSlug) =>
            handleClick(`/products/${productSlug}`)
          }
        />
      );

    default:
      console.warn(`Unknown block type: ${(block as Block).type}`);
      return null;
  }
};
```

---

### Step 7: Admin UI - Product Selector

**File**: `src/app/admin/click-pages/_components/BlockSettingsPanel.tsx`

Add a new settings panel section for PRODUCT_CARD:

```typescript
// Product Card Settings Section
{block.type === 'PRODUCT_CARD' && (
  <div className="space-y-4">
    {/* Product Selection */}
    <div>
      <Label>Product</Label>
      <ProductSelector
        value={block.settings.productId}
        onChange={(productId, productSlug) => {
          handleSettingChange('productId', productId);
          handleSettingChange('productSlug', productSlug);
        }}
      />
      <p className="text-xs text-muted-foreground mt-1">
        Select a product to display
      </p>
    </div>

    {/* Layout Selection */}
    <div>
      <Label>Layout</Label>
      <Select
        value={block.settings.layout}
        onValueChange={(value) => handleSettingChange('layout', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="compact">Compact</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="detailed">Detailed</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Display Options */}
    <div className="space-y-2">
      <Label>Display Options</Label>

      <div className="flex items-center justify-between">
        <Label htmlFor="showMemberPrice" className="font-normal">
          Show Member Price
        </Label>
        <Switch
          id="showMemberPrice"
          checked={block.settings.showMemberPrice}
          onCheckedChange={(checked) =>
            handleSettingChange('showMemberPrice', checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showStock" className="font-normal">
          Show Stock Status
        </Label>
        <Switch
          id="showStock"
          checked={block.settings.showStock}
          onCheckedChange={(checked) =>
            handleSettingChange('showStock', checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showDescription" className="font-normal">
          Show Description
        </Label>
        <Switch
          id="showDescription"
          checked={block.settings.showDescription}
          onCheckedChange={(checked) =>
            handleSettingChange('showDescription', checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showRating" className="font-normal">
          Show Rating
        </Label>
        <Switch
          id="showRating"
          checked={block.settings.showRating}
          onCheckedChange={(checked) =>
            handleSettingChange('showRating', checked)
          }
        />
      </div>
    </div>

    {/* CTA Customization */}
    <div>
      <Label>Button Action</Label>
      <Select
        value={block.settings.ctaAction}
        onValueChange={(value) => handleSettingChange('ctaAction', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="view">View Product</SelectItem>
          <SelectItem value="cart">Add to Cart</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label>Custom Button Text (Optional)</Label>
      <Input
        type="text"
        value={block.settings.ctaText || ''}
        onChange={(e) => handleSettingChange('ctaText', e.target.value)}
        placeholder="Leave empty for default"
      />
    </div>
  </div>
)}
```

---

### Step 8: Product Selector Component (New Utility)

**File**: `src/components/admin/ProductSelector.tsx`

```typescript
'use client';

/**
 * Product Selector Component
 * Searchable dropdown for selecting products
 * Used in Click Page Product Card block settings
 */

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  regularPrice: number;
  stockQuantity: number;
}

interface ProductSelectorProps {
  value: string; // Product ID
  onChange: (productId: string, productSlug: string) => void;
}

export function ProductSelector({ value, onChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/products?pageSize=100&status=ACTIVE');

        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!search) return products;

    const query = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
    );
  }, [products, search]);

  // Find selected product
  const selectedProduct = products.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{selectedProduct.name}</span>
              <Badge variant="outline" className="text-xs">
                RM {selectedProduct.regularPrice.toFixed(2)}
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground">Select product...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search products..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            {loading ? 'Loading products...' : 'No products found.'}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => {
                  onChange(product.id, product.slug);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === product.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {product.sku} • Stock: {product.stockQuantity}
                    </div>
                  </div>
                  <Badge variant="outline">
                    RM {product.regularPrice.toFixed(2)}
                  </Badge>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

### Step 9: API Endpoint for Product Fetch

**File**: `src/app/api/public/products/[id]/route.ts` (May already exist)

Ensure this endpoint returns product data in `ProductPricingData` format:

```typescript
/**
 * GET /api/public/products/[id]
 * Fetch single product by ID for public display
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: {
        id,
        status: 'ACTIVE',
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    // Transform to ProductPricingData format
    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      metaTitle: product.metaTitle,
      regularPrice: Number(product.regularPrice),
      memberPrice: Number(product.memberPrice),
      earlyAccessPrice: Number(product.earlyAccessPrice),
      earlyAccessStartDate: product.earlyAccessStartDate,
      earlyAccessEndDate: product.earlyAccessEndDate,
      stockQuantity: product.stockQuantity,
      memberOnlyAccess: product.memberOnlyAccess,
      averageRating,
      reviewCount: product.reviews.length,
      categories: product.categories.map(pc => ({
        category: {
          name: pc.category.name,
          slug: pc.category.slug,
        },
      })),
      images: product.images.map(img => ({
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      })),
    };

    return NextResponse.json({ product: productData });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
```

---

### Step 10: Block Palette Update

**File**: `src/app/admin/click-pages/_components/BlockPalette.tsx`

Add PRODUCT_CARD to the block palette:

```typescript
// The block should automatically appear in the palette
// because it's registered in BLOCK_REGISTRY
// Just verify it's in the 'cta' category section
```

---

## 🧪 Testing Plan

### Unit Tests

1. **Type Validation**
   - Test `productCardBlockSchema` with valid/invalid data
   - Ensure required fields are enforced

2. **Component Tests**
   - ProductCardBlockComponent renders loading state
   - ProductCardBlockComponent renders error state
   - ProductCardBlockComponent renders product correctly
   - ProductSelector filters products correctly

### Integration Tests

1. **Block Creation**
   - Create new Click Page with Product Card block
   - Select product from dropdown
   - Configure display options
   - Save and publish

2. **Public Display**
   - View Click Page with Product Card
   - Verify pricing displays correctly
   - Test click tracking
   - Verify responsive behavior

3. **Error Scenarios**
   - Product deleted after block created
   - Invalid product ID
   - Network failure during fetch

### Manual Testing Checklist

- [ ] Add Product Card block to Click Page
- [ ] Search and select product
- [ ] Test all layout variants (compact, standard, detailed)
- [ ] Toggle display options
- [ ] Verify pricing service integration
- [ ] Test on mobile/tablet/desktop
- [ ] Verify click tracking in analytics
- [ ] Test with deleted product
- [ ] Test with out-of-stock product
- [ ] Test member vs non-member pricing

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript types defined
- [ ] Validation schemas complete
- [ ] Component tests passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated

### Deployment Steps

1. **Database Migration** (if needed)
   - No schema changes required
   - Existing `Product` table sufficient

2. **Code Deployment**
   - Deploy to staging first
   - Test all functionality
   - Deploy to production

3. **Post-Deployment Verification**
   - Create test Click Page with Product Card
   - Verify public display
   - Check analytics tracking
   - Monitor error logs

---

## 📊 Success Metrics

1. **Adoption**
   - Number of Product Card blocks created in first week
   - Number of Click Pages using Product Cards

2. **Performance**
   - Product Card load time < 500ms
   - No degradation in Click Page load times
   - Zero critical errors in production

3. **Engagement**
   - Click-through rate on Product Cards
   - Conversion rate from Click Pages with Product Cards

---

## 🔄 Future Enhancements (Out of Scope)

1. **Multi-Product Grid**
   - Display multiple products in a grid
   - Automatic product recommendations

2. **Dynamic Pricing Rules**
   - Countdown-based pricing
   - Bundle discounts

3. **A/B Testing**
   - Test different layouts
   - Test different CTA texts

4. **Advanced Analytics**
   - Heatmaps for product cards
   - Scroll depth tracking

---

## 🎯 Coding Standards Compliance

### Single Source of Truth ✅
- **Product Data**: Fetched from Prisma Product model
- **Pricing Logic**: Uses centralized `PricingService`
- **Product Card Display**: Reuses existing `ProductCard` component
- **Type Definitions**: Single `ProductCardBlock` interface

### No Hardcoding ✅
- All settings in constants (`CLICK_PAGE_CONSTANTS`)
- No magic strings or numbers
- Validation rules in Zod schemas

### DRY Principle ✅
- Reuses `ProductCard` component (not duplicated)
- Reuses `usePricing` hook
- Reuses existing product API endpoints

### SOLID Principles ✅
- **Single Responsibility**: Each component has one clear purpose
- **Open/Closed**: Block system extensible without modifying core
- **Type Safety**: Full TypeScript coverage, no `any` types

### Three-Layer Validation ✅
1. **Frontend**: React component validation
2. **API**: Zod schema validation
3. **Database**: Prisma constraints

---

## 📝 Implementation Order

### Phase 1: Foundation (No Code Changes)
1. ✅ Create this plan document
2. ✅ Review and approve plan
3. ✅ Verify existing `ProductCard` component compatibility

### Phase 2: Type System (Low Risk)
1. Add `ProductCardBlock` interface to types
2. Add to Block union type
3. Create validation schema
4. Update block registry

### Phase 3: Components (Medium Risk)
1. Create `ProductCardBlockComponent`
2. Create `ProductSelector` component
3. Update `BlockRenderer`
4. Export new components

### Phase 4: Admin UI (Medium Risk)
1. Update `BlockSettingsPanel`
2. Verify block palette displays correctly
3. Test product selection flow

### Phase 5: API & Integration (High Risk)
1. Verify/create product fetch endpoint
2. Test data fetching
3. Test click tracking integration

### Phase 6: Testing & Polish (Critical)
1. Write unit tests
2. Write integration tests
3. Manual testing on all devices
4. Fix bugs and edge cases

### Phase 7: Documentation & Deployment
1. Update user documentation
2. Deploy to staging
3. Final testing
4. Deploy to production
5. Monitor for 24 hours

---

## ⚠️ Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Product deleted after block created | Medium | Medium | Show placeholder, admin warning |
| Pricing service changes break display | Low | High | Use stable interface, version carefully |
| Performance degradation | Low | Medium | Implement caching, optimize queries |
| Mobile rendering issues | Medium | Low | Use existing responsive patterns |
| Click tracking not working | Low | Medium | Comprehensive integration tests |

---

## 📞 Support & Rollback Plan

### Rollback Plan
If critical issues arise:
1. Remove `PRODUCT_CARD` from block palette (users can't create new ones)
2. Existing blocks will show error state (graceful degradation)
3. Fix issues in development
4. Re-enable after verification

### Monitoring
- Track error rates in Sentry/logs
- Monitor API response times
- Track user adoption metrics

---

## ✅ Sign-Off

**Plan Created By**: Claude (AI Assistant)
**Date**: 2025-12-03
**Reviewed By**: _[To be filled]_
**Approved By**: _[To be filled]_
**Approval Date**: _[To be filled]_

---

## 📚 References

- [CLAUDE.md](../CLAUDE.md) - Coding Standards
- [Click Pages Implementation Plan](./CLICK_PAGES_IMPLEMENTATION_PLAN.md)
- [Product Card Component](../src/components/product/ProductCard.tsx)
- [Pricing Service Architecture](../PRICING_CENTRALIZATION_IMPLEMENTATION.md)

---

**Ready for Review** ✅
Please review this plan and approve before proceeding with implementation.
