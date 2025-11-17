# Landing Page Feature - Phase 2: Business Enhancement Features

## 🎯 Objective

Add 4 high-impact features that transform landing pages from content pages into powerful conversion tools. Focus on simple, practical implementations that deliver serious business value without over-engineering.

---

## 📋 Phase 2 Overview

**Prerequisites**: Phase 1 MVP must be complete and tested

**4 Core Features**:
1. **Conversion Tracking** - Measure what works (views → clicks → sales)
2. **Product Showcase** - Sell products beautifully with curated displays
3. **Campaign Scheduling** - Automate promotions and sales
4. **SEO Enhancement** - Advanced social sharing, pixels, and analytics

**Implementation Approach**: Incremental, feature-by-feature deployment

---

## 🎯 Feature 1: Conversion Tracking

### Business Value
**Problem**: No visibility into landing page performance
**Solution**: Track the full funnel (Views → Product Clicks → Purchases)
**Impact**: Data-driven decisions on which landing pages drive revenue

### Database Schema Changes

```prisma
// Add to existing LandingPage model
model LandingPage {
  // ... existing fields ...

  // Conversion Tracking (Phase 2)
  clickCount       Int      @default(0)  // Total clicks on CTAs/products
  conversionCount  Int      @default(0)  // Total purchases attributed
  conversionValue  Decimal  @default(0)  @db.Decimal(10, 2) // Total revenue

  // Relations
  clicks           LandingPageClick[]
  conversions      LandingPageConversion[]
}

// Landing Page Click Event
model LandingPageClick {
  id            String       @id @default(cuid())
  landingPageId String
  clickType     ClickType    // PRODUCT, CTA, EXTERNAL_LINK
  targetUrl     String?      // What was clicked
  targetId      String?      // Product ID if applicable
  sessionId     String?      // Session tracking
  userId        String?      // If logged in
  utmSource     String?      // UTM tracking
  utmMedium     String?
  utmCampaign   String?
  createdAt     DateTime     @default(now())

  landingPage   LandingPage  @relation(fields: [landingPageId], references: [id], onDelete: Cascade)

  @@index([landingPageId])
  @@index([clickType])
  @@index([targetId])
  @@index([createdAt])
  @@map("landing_page_clicks")
}

// Landing Page Conversion Event
model LandingPageConversion {
  id            String       @id @default(cuid())
  landingPageId String
  orderId       String       @unique
  orderValue    Decimal      @db.Decimal(10, 2)
  sessionId     String?
  userId        String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  createdAt     DateTime     @default(now())

  landingPage   LandingPage  @relation(fields: [landingPageId], references: [id], onDelete: Cascade)
  order         Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([landingPageId])
  @@index([orderId])
  @@index([createdAt])
  @@map("landing_page_conversions")
}

// Click Type Enum
enum ClickType {
  PRODUCT        // Product card click
  CTA            // Call-to-action button
  EXTERNAL_LINK  // External link click
}

// Update Order model to add landing page tracking
model Order {
  // ... existing fields ...

  landingPageConversion LandingPageConversion?
}
```

### API Endpoints

#### A. Track Page View (Increment)
**Endpoint**: `POST /api/public/landing-pages/[slug]/track-view`

```typescript
// Simple view counter increment
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    await prisma.landingPage.update({
      where: { slug: params.slug, status: 'PUBLISHED' },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
```

#### B. Track Click Event
**Endpoint**: `POST /api/public/landing-pages/[slug]/track-click`

```typescript
interface TrackClickRequest {
  clickType: 'PRODUCT' | 'CTA' | 'EXTERNAL_LINK';
  targetUrl?: string;
  targetId?: string; // Product ID
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const body: TrackClickRequest = await request.json();

  const landingPage = await prisma.landingPage.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });

  if (!landingPage) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
  }

  // Create click event + increment counter
  await prisma.$transaction([
    prisma.landingPageClick.create({
      data: {
        landingPageId: landingPage.id,
        clickType: body.clickType,
        targetUrl: body.targetUrl,
        targetId: body.targetId,
        sessionId: body.sessionId,
        userId: session?.user?.id,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      },
    }),
    prisma.landingPage.update({
      where: { id: landingPage.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
```

#### C. Track Conversion (Order Placed)
**Endpoint**: Internal function called during order creation

```typescript
// In order creation API route
export async function createOrderWithLandingPageTracking(orderData, sessionData) {
  const { landingPageId, sessionId, utmParams } = sessionData;

  const order = await prisma.order.create({
    data: orderData,
  });

  // If order originated from landing page, track conversion
  if (landingPageId) {
    await prisma.$transaction([
      prisma.landingPageConversion.create({
        data: {
          landingPageId,
          orderId: order.id,
          orderValue: order.total,
          sessionId,
          userId: order.userId,
          utmSource: utmParams?.source,
          utmMedium: utmParams?.medium,
          utmCampaign: utmParams?.campaign,
        },
      }),
      prisma.landingPage.update({
        where: { id: landingPageId },
        data: {
          conversionCount: { increment: 1 },
          conversionValue: { increment: order.total },
        },
      }),
    ]);
  }

  return order;
}
```

#### D. Get Analytics Dashboard
**Endpoint**: `GET /api/admin/landing-pages/[id]/analytics`

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Auth check (admin only)

  const analytics = await prisma.landingPage.findUnique({
    where: { id: params.id },
    select: {
      viewCount: true,
      clickCount: true,
      conversionCount: true,
      conversionValue: true,
      clicks: {
        select: {
          clickType: true,
          targetId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      conversions: {
        select: {
          orderValue: true,
          createdAt: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Calculate metrics
  const conversionRate = analytics.viewCount > 0
    ? (analytics.conversionCount / analytics.viewCount) * 100
    : 0;

  const clickThroughRate = analytics.viewCount > 0
    ? (analytics.clickCount / analytics.viewCount) * 100
    : 0;

  const averageOrderValue = analytics.conversionCount > 0
    ? Number(analytics.conversionValue) / analytics.conversionCount
    : 0;

  return NextResponse.json({
    summary: {
      views: analytics.viewCount,
      clicks: analytics.clickCount,
      conversions: analytics.conversionCount,
      revenue: analytics.conversionValue,
      conversionRate,
      clickThroughRate,
      averageOrderValue,
    },
    clicks: analytics.clicks,
    conversions: analytics.conversions,
  });
}
```

### Frontend Implementation

#### A. Client-Side Tracking Hook

**File**: `src/hooks/useLandingPageTracking.ts`

```typescript
export function useLandingPageTracking(slug: string) {
  const trackView = useCallback(async () => {
    try {
      await fetch(`/api/public/landing-pages/${slug}/track-view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }, [slug]);

  const trackClick = useCallback(async (clickData: TrackClickData) => {
    try {
      await fetch(`/api/public/landing-pages/${slug}/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clickData,
          sessionId: getSessionId(), // Get from cookie/localStorage
          ...getUTMParams(), // Parse from URL
        }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }, [slug]);

  return { trackView, trackClick };
}
```

#### B. Analytics Dashboard Component

**File**: `src/components/admin/LandingPageAnalytics.tsx`

```typescript
export default function LandingPageAnalytics({ landingPageId }: Props) {
  const { data, isLoading } = useSWR(
    `/api/admin/landing-pages/${landingPageId}/analytics`,
    fetcher
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Summary Cards */}
      <MetricCard
        title="Total Views"
        value={data.summary.views}
        icon={<EyeIcon />}
      />
      <MetricCard
        title="Click-Through Rate"
        value={`${data.summary.clickThroughRate.toFixed(2)}%`}
        icon={<CursorClickIcon />}
      />
      <MetricCard
        title="Conversions"
        value={data.summary.conversions}
        icon={<ShoppingCartIcon />}
      />
      <MetricCard
        title="Revenue"
        value={`RM ${data.summary.revenue.toFixed(2)}`}
        icon={<CurrencyDollarIcon />}
      />

      {/* Conversion Funnel Chart */}
      <ConversionFunnelChart
        views={data.summary.views}
        clicks={data.summary.clicks}
        conversions={data.summary.conversions}
      />

      {/* Recent Conversions Table */}
      <ConversionsTable conversions={data.conversions} />
    </div>
  );
}
```

### Testing Checklist
- [ ] View count increments on page load
- [ ] Click tracking works for product cards
- [ ] Click tracking works for CTA buttons
- [ ] Conversion tracking works on order creation
- [ ] UTM parameters captured correctly
- [ ] Analytics dashboard displays correctly
- [ ] Conversion rate calculated accurately
- [ ] Revenue totals correct

---

## 🎯 Feature 2: Product Showcase

### Business Value
**Problem**: Product URLs in content are not optimal for selling
**Solution**: Curated product sections with beautiful layouts
**Impact**: Better product presentation = higher conversion rates

### Database Schema Changes

```prisma
// Add to existing LandingPage model
model LandingPage {
  // ... existing fields ...

  // Product Showcase (Phase 2)
  featuredProductIds String[] @default([]) // Array of product IDs to showcase
  productShowcaseLayout String @default("GRID") // GRID, CAROUSEL, FEATURED
}

// No new tables needed - reuse existing Product model
```

### Constants Update

**File**: `src/lib/constants/landing-page-constants.ts`

```typescript
export const LANDING_PAGE_CONSTANTS = {
  // ... existing ...

  PRODUCT_SHOWCASE: {
    MAX_FEATURED_PRODUCTS: 12,
    LAYOUTS: {
      GRID: { value: 'GRID', label: 'Grid Layout', cols: 3 },
      CAROUSEL: { value: 'CAROUSEL', label: 'Carousel', autoplay: true },
      FEATURED: { value: 'FEATURED', label: 'Featured Hero', cols: 4 },
    },
    CARD_STYLE: 'compact', // Optimized for landing pages
  },
};
```

### Validation Schema Update

**File**: `src/lib/validations/landing-page-validation.ts`

```typescript
export const landingPageBaseSchema = z.object({
  // ... existing fields ...

  // Product Showcase
  featuredProductIds: z
    .array(z.string().cuid())
    .max(LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.MAX_FEATURED_PRODUCTS)
    .default([]),
  productShowcaseLayout: z.enum(['GRID', 'CAROUSEL', 'FEATURED']).default('GRID'),
});
```

### API Enhancement

#### Update Create/Update Endpoints

**File**: `src/app/api/admin/landing-pages/route.ts`

```typescript
// In POST/PUT handlers, include new fields
const landingPageData = {
  // ... existing fields ...
  featuredProductIds: validatedData.featuredProductIds,
  productShowcaseLayout: validatedData.productShowcaseLayout,
};
```

#### Product Search for Showcase
**Endpoint**: `GET /api/admin/products/search`

```typescript
// For product selection in admin form
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      regularPrice: true,
      memberPrice: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 20,
  });

  return NextResponse.json({ products });
}
```

### Frontend Components

#### A. Product Showcase Selector (Admin)

**File**: `src/components/admin/ProductShowcaseSelector.tsx`

```typescript
export default function ProductShowcaseSelector({
  selectedProductIds,
  onProductsChange,
  layout,
  onLayoutChange,
}: Props) {
  const [search, setSearch] = useState('');
  const { data: products } = useSWR(
    `/api/admin/products/search?q=${search}`,
    fetcher
  );

  return (
    <div className="space-y-4">
      {/* Layout Selector */}
      <div>
        <label>Showcase Layout</label>
        <select value={layout} onChange={(e) => onLayoutChange(e.target.value)}>
          <option value="GRID">Grid Layout</option>
          <option value="CAROUSEL">Carousel</option>
          <option value="FEATURED">Featured Hero</option>
        </select>
      </div>

      {/* Product Search */}
      <div>
        <label>Search Products</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
        />
      </div>

      {/* Selected Products (Drag to Reorder) */}
      <div>
        <label>Featured Products ({selectedProductIds.length}/12)</label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="selected-products">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {selectedProducts.map((product, index) => (
                  <Draggable key={product.id} draggableId={product.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <ProductRow
                          product={product}
                          dragHandleProps={provided.dragHandleProps}
                          onRemove={() => removeProduct(product.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Available Products */}
      <div>
        <label>Add Products</label>
        {products?.products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            onAdd={() => addProduct(product.id)}
            isAdded={selectedProductIds.includes(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### B. Product Showcase Display (Public)

**File**: `src/components/landing-page/ProductShowcase.tsx`

```typescript
export default async function ProductShowcase({
  productIds,
  layout,
}: Props) {
  // Fetch products
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: 'ACTIVE',
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  // Maintain order from productIds
  const orderedProducts = productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  if (layout === 'GRID') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orderedProducts.map((product) => (
          <ProductCard key={product.id} product={product} variant="compact" />
        ))}
      </div>
    );
  }

  if (layout === 'CAROUSEL') {
    return (
      <Carousel autoplay interval={5000}>
        {orderedProducts.map((product) => (
          <ProductCard key={product.id} product={product} variant="hero" />
        ))}
      </Carousel>
    );
  }

  if (layout === 'FEATURED') {
    const [hero, ...rest] = orderedProducts;
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <ProductCard product={hero} variant="hero-large" />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {rest.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} variant="compact" />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
```

#### C. Update Landing Page Form

**File**: `src/components/admin/LandingPageForm.tsx`

```typescript
// Add Product Showcase section
<section>
  <h3>Product Showcase</h3>
  <ProductShowcaseSelector
    selectedProductIds={formData.featuredProductIds}
    onProductsChange={(ids) => setFormData({ ...formData, featuredProductIds: ids })}
    layout={formData.productShowcaseLayout}
    onLayoutChange={(layout) => setFormData({ ...formData, productShowcaseLayout: layout })}
  />
</section>
```

#### D. Update Public Landing Page

**File**: `src/app/(public)/landing/[slug]/page.tsx`

```typescript
export default async function LandingPagePage({ params }: Props) {
  const landingPage = await prisma.landingPage.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { /* ... */ },
  });

  return (
    <article>
      {/* Hero Section */}
      <FeaturedImage image={landingPage.featuredImage} alt={landingPage.featuredImageAlt} />

      {/* Product Showcase (if configured) */}
      {landingPage.featuredProductIds.length > 0 && (
        <section className="my-12">
          <h2>Featured Products</h2>
          <ProductShowcase
            productIds={landingPage.featuredProductIds}
            layout={landingPage.productShowcaseLayout}
          />
        </section>
      )}

      {/* Main Content */}
      <LandingPageContent landingPage={landingPage} />
    </article>
  );
}
```

### Testing Checklist
- [ ] Can select products in admin form
- [ ] Can reorder products (drag-and-drop)
- [ ] Can remove products from showcase
- [ ] Maximum 12 products enforced
- [ ] Grid layout displays correctly
- [ ] Carousel layout works (autoplay)
- [ ] Featured layout works (hero + grid)
- [ ] Product order maintained
- [ ] Only active products shown
- [ ] Responsive on all devices

---

## 🎯 Feature 3: Campaign Scheduling

### Business Value
**Problem**: Manual publish/unpublish is time-consuming and error-prone
**Solution**: Auto-schedule campaigns to run during specific periods
**Impact**: Automation saves time, ensures timely promotions

### Database Schema Changes

```prisma
// Add to existing LandingPage model
model LandingPage {
  // ... existing fields ...

  // Campaign Scheduling (Phase 2)
  scheduledPublishAt DateTime? // Auto-publish at this time
  scheduledUnpublishAt DateTime? // Auto-unpublish at this time
  campaignName String? @db.VarChar(100) // Campaign identifier
  isScheduled Boolean @default(false) // Has scheduling enabled
}

// Add enum value to existing LandingPageStatus
enum LandingPageStatus {
  DRAFT
  SCHEDULED  // NEW - Waiting to be published
  PUBLISHED
}
```

### Validation Schema Update

```typescript
export const landingPageBaseSchema = z.object({
  // ... existing fields ...

  // Campaign Scheduling
  scheduledPublishAt: z.coerce.date().optional(),
  scheduledUnpublishAt: z.coerce.date().optional(),
  campaignName: z.string().max(100).trim().optional(),
  isScheduled: z.boolean().default(false),
}).refine(
  (data) => {
    // If scheduled, must have publish date
    if (data.isScheduled && !data.scheduledPublishAt) {
      return false;
    }
    // Unpublish must be after publish
    if (data.scheduledPublishAt && data.scheduledUnpublishAt) {
      return data.scheduledUnpublishAt > data.scheduledPublishAt;
    }
    return true;
  },
  {
    message: 'Invalid scheduling configuration',
    path: ['scheduledPublishAt'],
  }
);
```

### Cron Job Implementation

#### A. Scheduler Service

**File**: `src/lib/services/landing-page-scheduler.ts`

```typescript
/**
 * Landing Page Scheduler Service
 * Handles auto-publish and auto-unpublish
 */

export async function processScheduledLandingPages() {
  const now = new Date();

  try {
    // Auto-publish scheduled pages
    const toPublish = await prisma.landingPage.findMany({
      where: {
        status: 'SCHEDULED',
        isScheduled: true,
        scheduledPublishAt: {
          lte: now, // Publish time has passed
        },
      },
    });

    for (const landingPage of toPublish) {
      await prisma.landingPage.update({
        where: { id: landingPage.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
        },
      });

      console.log(`✅ Auto-published: ${landingPage.title} (${landingPage.id})`);
    }

    // Auto-unpublish expired pages
    const toUnpublish = await prisma.landingPage.findMany({
      where: {
        status: 'PUBLISHED',
        isScheduled: true,
        scheduledUnpublishAt: {
          lte: now, // Unpublish time has passed
        },
      },
    });

    for (const landingPage of toUnpublish) {
      await prisma.landingPage.update({
        where: { id: landingPage.id },
        data: {
          status: 'DRAFT',
        },
      });

      console.log(`⏸️  Auto-unpublished: ${landingPage.title} (${landingPage.id})`);
    }

    return {
      published: toPublish.length,
      unpublished: toUnpublish.length,
    };
  } catch (error) {
    console.error('❌ Landing page scheduler error:', error);
    throw error;
  }
}
```

#### B. Cron API Route

**File**: `src/app/api/cron/landing-page-scheduler/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { processScheduledLandingPages } from '@/lib/services/landing-page-scheduler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Cron Job: Landing Page Scheduler
 * Runs every minute to check for scheduled publish/unpublish
 * Vercel Cron: */1 * * * *
 */
export async function GET(request: Request) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processScheduledLandingPages();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scheduler failed', details: error.message },
      { status: 500 }
    );
  }
}
```

#### C. Vercel Cron Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/landing-page-scheduler",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

**Or use Next.js Middleware** (alternative to Vercel Cron):

**File**: `src/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  // Run scheduler on every request (debounced)
  if (shouldRunScheduler()) {
    processScheduledLandingPages().catch(console.error);
  }

  return NextResponse.next();
}

// Debounce: Only run once per minute
let lastRun = 0;
function shouldRunScheduler() {
  const now = Date.now();
  if (now - lastRun > 60000) { // 1 minute
    lastRun = now;
    return true;
  }
  return false;
}
```

### Frontend Implementation

#### A. Scheduling Form Section

**File**: `src/components/admin/LandingPageSchedulingForm.tsx`

```typescript
export default function LandingPageSchedulingForm({
  scheduledPublishAt,
  scheduledUnpublishAt,
  campaignName,
  isScheduled,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isScheduled}
          onChange={(e) => onChange({ isScheduled: e.target.checked })}
        />
        <label>Enable Campaign Scheduling</label>
      </div>

      {isScheduled && (
        <>
          <div>
            <label>Campaign Name (Optional)</label>
            <input
              type="text"
              value={campaignName || ''}
              onChange={(e) => onChange({ campaignName: e.target.value })}
              placeholder="e.g., Summer Sale 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Auto-Publish At</label>
              <input
                type="datetime-local"
                value={scheduledPublishAt ? formatDateTimeLocal(scheduledPublishAt) : ''}
                onChange={(e) => onChange({ scheduledPublishAt: new Date(e.target.value) })}
                required
              />
            </div>

            <div>
              <label>Auto-Unpublish At (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledUnpublishAt ? formatDateTimeLocal(scheduledUnpublishAt) : ''}
                onChange={(e) => onChange({ scheduledUnpublishAt: new Date(e.target.value) })}
              />
              <p className="text-sm text-gray-500">
                Leave empty for permanent campaign
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-medium">Schedule Preview</h4>
            <p>
              {scheduledPublishAt && (
                <>Will publish on {formatDateTime(scheduledPublishAt)}</>
              )}
            </p>
            {scheduledUnpublishAt && (
              <p>Will unpublish on {formatDateTime(scheduledUnpublishAt)}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

#### B. Status Badge Update

**File**: `src/components/admin/LandingPageStatusBadge.tsx`

```typescript
export default function LandingPageStatusBadge({ status, scheduledPublishAt }: Props) {
  if (status === 'SCHEDULED') {
    return (
      <Badge color="blue">
        <ClockIcon className="w-4 h-4" />
        Scheduled for {formatDate(scheduledPublishAt)}
      </Badge>
    );
  }

  if (status === 'PUBLISHED') {
    return <Badge color="green">Published</Badge>;
  }

  return <Badge color="gray">Draft</Badge>;
}
```

#### C. Admin List View Enhancement

**File**: `src/app/(admin)/admin/landing-pages/page.tsx`

```typescript
// Show scheduled landing pages with countdown
<Table>
  {landingPages.map((lp) => (
    <TableRow key={lp.id}>
      <TableCell>{lp.title}</TableCell>
      <TableCell>
        <LandingPageStatusBadge
          status={lp.status}
          scheduledPublishAt={lp.scheduledPublishAt}
        />
      </TableCell>
      <TableCell>
        {lp.isScheduled && lp.scheduledPublishAt && (
          <CountdownTimer targetDate={lp.scheduledPublishAt} />
        )}
      </TableCell>
    </TableRow>
  ))}
</Table>
```

### Testing Checklist
- [ ] Can enable scheduling in form
- [ ] Publish date validation works
- [ ] Unpublish must be after publish
- [ ] Status changes to SCHEDULED on save
- [ ] Cron job runs successfully
- [ ] Auto-publish works at scheduled time
- [ ] Auto-unpublish works at scheduled time
- [ ] Status badge shows correct state
- [ ] Countdown timer displays correctly
- [ ] Manual publish still works

---

## 🎯 Feature 4: SEO Enhancement

### Business Value
**Problem**: Basic SEO is not enough for marketing campaigns
**Solution**: Advanced social sharing, pixel tracking, and analytics
**Impact**: Better social reach, accurate campaign attribution, higher ROI

### Database Schema Changes

```prisma
// Add to existing LandingPage model
model LandingPage {
  // ... existing fields ...

  // Advanced SEO (Phase 2)
  ogImageUrl        String?  // Custom Open Graph image
  twitterImageUrl   String?  // Custom Twitter card image
  canonicalUrl      String?  // Custom canonical URL
  noIndex           Boolean  @default(false) // Exclude from search engines (for test pages)

  // Pixel & Analytics
  fbPixelId         String?  // Facebook Pixel ID
  gaTrackingId      String?  // Google Analytics tracking ID
  gtmContainerId    String?  // Google Tag Manager container ID
  customHeadScripts String?  @db.Text // Custom scripts for <head>
  customBodyScripts String?  @db.Text // Custom scripts for <body>
}
```

### Validation Schema Update

```typescript
export const landingPageBaseSchema = z.object({
  // ... existing fields ...

  // Advanced SEO
  ogImageUrl: z.string().url().optional(),
  twitterImageUrl: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().default(false),

  // Pixels & Analytics
  fbPixelId: z.string().regex(/^\d{15,16}$/).optional(), // FB Pixel format
  gaTrackingId: z.string().regex(/^(UA-|G-).+$/).optional(), // GA format
  gtmContainerId: z.string().regex(/^GTM-.+$/).optional(), // GTM format
  customHeadScripts: z.string().max(5000).optional(),
  customBodyScripts: z.string().max(5000).optional(),
});
```

### Frontend Components

#### A. Advanced SEO Form Section

**File**: `src/components/admin/AdvancedSEOForm.tsx`

```typescript
export default function AdvancedSEOForm({ formData, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Social Media Images */}
      <section>
        <h3>Social Media Sharing</h3>

        <div className="space-y-4">
          <div>
            <label>Open Graph Image (Facebook, LinkedIn)</label>
            <ImageUpload
              value={formData.ogImageUrl}
              onChange={(url) => onChange({ ogImageUrl: url })}
              recommended="1200x630px"
            />
            <p className="text-sm text-gray-500">
              Default: Featured image will be used if not set
            </p>
          </div>

          <div>
            <label>Twitter Card Image</label>
            <ImageUpload
              value={formData.twitterImageUrl}
              onChange={(url) => onChange({ twitterImageUrl: url })}
              recommended="1200x600px"
            />
          </div>
        </div>

        {/* Social Preview */}
        <SocialPreview
          title={formData.metaTitle || formData.title}
          description={formData.metaDescription || formData.excerpt}
          image={formData.ogImageUrl || formData.featuredImage}
        />
      </section>

      {/* Advanced SEO Settings */}
      <section>
        <h3>Advanced SEO</h3>

        <div>
          <label>Canonical URL (Optional)</label>
          <input
            type="url"
            value={formData.canonicalUrl || ''}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
            placeholder="https://example.com/canonical-page"
          />
          <p className="text-sm text-gray-500">
            Use if this landing page is duplicate content
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.noIndex}
            onChange={(e) => onChange({ noIndex: e.target.checked })}
          />
          <label>Exclude from Search Engines (noindex)</label>
          <p className="text-sm text-gray-500">
            Enable for test pages or private campaigns
          </p>
        </div>
      </section>

      {/* Tracking Pixels */}
      <section>
        <h3>Tracking & Analytics</h3>

        <div className="space-y-4">
          <div>
            <label>Facebook Pixel ID</label>
            <input
              type="text"
              value={formData.fbPixelId || ''}
              onChange={(e) => onChange({ fbPixelId: e.target.value })}
              placeholder="123456789012345"
            />
          </div>

          <div>
            <label>Google Analytics Tracking ID</label>
            <input
              type="text"
              value={formData.gaTrackingId || ''}
              onChange={(e) => onChange({ gaTrackingId: e.target.value })}
              placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
            />
          </div>

          <div>
            <label>Google Tag Manager Container ID</label>
            <input
              type="text"
              value={formData.gtmContainerId || ''}
              onChange={(e) => onChange({ gtmContainerId: e.target.value })}
              placeholder="GTM-XXXXXXX"
            />
          </div>
        </div>
      </section>

      {/* Custom Scripts (Advanced Users Only) */}
      <section>
        <details>
          <summary className="cursor-pointer font-medium">
            Custom Scripts (Advanced)
          </summary>

          <div className="mt-4 space-y-4">
            <div>
              <label>Custom Head Scripts</label>
              <textarea
                value={formData.customHeadScripts || ''}
                onChange={(e) => onChange({ customHeadScripts: e.target.value })}
                rows={5}
                placeholder="<script>/* Your custom scripts */</script>"
                className="font-mono text-sm"
              />
              <p className="text-sm text-yellow-600">
                ⚠️ Only add trusted scripts. Malicious code can harm your site.
              </p>
            </div>

            <div>
              <label>Custom Body Scripts</label>
              <textarea
                value={formData.customBodyScripts || ''}
                onChange={(e) => onChange({ customBodyScripts: e.target.value })}
                rows={5}
                placeholder="<script>/* Your custom scripts */</script>"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
```

#### B. Enhanced SEO Head Component

**File**: `src/components/seo/LandingPageHead.tsx`

```typescript
export default function LandingPageHead({ landingPage }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const pageUrl = `${baseUrl}/landing/${landingPage.slug}`;

  const ogImage = landingPage.ogImageUrl || landingPage.featuredImage;
  const twitterImage = landingPage.twitterImageUrl || ogImage;

  return (
    <>
      {/* Basic SEO */}
      <title>{landingPage.metaTitle || landingPage.title}</title>
      <meta
        name="description"
        content={landingPage.metaDescription || landingPage.excerpt || ''}
      />
      {landingPage.metaKeywords && landingPage.metaKeywords.length > 0 && (
        <meta name="keywords" content={landingPage.metaKeywords.join(', ')} />
      )}

      {/* Canonical URL */}
      <link
        rel="canonical"
        href={landingPage.canonicalUrl || pageUrl}
      />

      {/* No Index */}
      {landingPage.noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={landingPage.metaTitle || landingPage.title} />
      <meta
        property="og:description"
        content={landingPage.metaDescription || landingPage.excerpt || ''}
      />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={landingPage.metaTitle || landingPage.title} />
      <meta
        name="twitter:description"
        content={landingPage.metaDescription || landingPage.excerpt || ''}
      />
      <meta name="twitter:image" content={twitterImage} />

      {/* Facebook Pixel */}
      {landingPage.fbPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${landingPage.fbPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Google Analytics */}
      {landingPage.gaTrackingId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${landingPage.gaTrackingId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${landingPage.gaTrackingId}');
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager */}
      {landingPage.gtmContainerId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${landingPage.gtmContainerId}');
            `,
          }}
        />
      )}

      {/* Custom Head Scripts */}
      {landingPage.customHeadScripts && (
        <div dangerouslySetInnerHTML={{ __html: landingPage.customHeadScripts }} />
      )}
    </>
  );
}
```

#### C. Custom Body Scripts Component

**File**: `src/components/landing-page/CustomBodyScripts.tsx`

```typescript
export default function CustomBodyScripts({ landingPage }: Props) {
  if (!landingPage.customBodyScripts && !landingPage.gtmContainerId) {
    return null;
  }

  return (
    <>
      {/* GTM noscript fallback */}
      {landingPage.gtmContainerId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${landingPage.gtmContainerId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      )}

      {/* Custom Body Scripts */}
      {landingPage.customBodyScripts && (
        <div dangerouslySetInnerHTML={{ __html: landingPage.customBodyScripts }} />
      )}
    </>
  );
}
```

#### D. Update Landing Page Layout

**File**: `src/app/(public)/landing/[slug]/page.tsx`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landingPage = await getLandingPage(params.slug);

  return {
    title: landingPage.metaTitle || landingPage.title,
    description: landingPage.metaDescription || landingPage.excerpt,
    openGraph: {
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/landing/${landingPage.slug}`,
      title: landingPage.metaTitle || landingPage.title,
      description: landingPage.metaDescription || landingPage.excerpt,
      images: [
        {
          url: landingPage.ogImageUrl || landingPage.featuredImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: landingPage.metaTitle || landingPage.title,
      description: landingPage.metaDescription || landingPage.excerpt,
      images: [landingPage.twitterImageUrl || landingPage.ogImageUrl || landingPage.featuredImage],
    },
    robots: landingPage.noIndex ? 'noindex, nofollow' : 'index, follow',
  };
}

export default async function LandingPagePage({ params }: Props) {
  const landingPage = await getLandingPage(params.slug);

  return (
    <>
      <LandingPageHead landingPage={landingPage} />

      <article>
        <CustomBodyScripts landingPage={landingPage} />
        {/* ... rest of content ... */}
      </article>
    </>
  );
}
```

### Testing Checklist
- [ ] OG image displayed correctly on Facebook share
- [ ] Twitter card preview works
- [ ] Canonical URL set correctly
- [ ] noindex meta tag present when enabled
- [ ] Facebook Pixel fires on page view
- [ ] Google Analytics tracks page view
- [ ] GTM container loads correctly
- [ ] Custom scripts execute properly
- [ ] Social preview shows correct data
- [ ] Image uploads work for OG/Twitter

---

## 🚀 Phase 2 Deployment Plan

### Step 1: Feature 1 - Conversion Tracking
1. Run database migration for tracking tables
2. Deploy API endpoints
3. Deploy frontend tracking hooks
4. Deploy analytics dashboard
5. Test tracking flow end-to-end
6. Monitor for 1 week

### Step 2: Feature 2 - Product Showcase
1. Update database schema
2. Deploy product selector in admin
3. Deploy showcase display components
4. Test all layouts (grid, carousel, featured)
5. Verify product ordering
6. Monitor performance

### Step 3: Feature 3 - Campaign Scheduling
1. Update database schema for scheduling
2. Deploy scheduler service
3. Deploy cron job (Vercel or middleware)
4. Deploy scheduling UI
5. Test auto-publish/unpublish
6. Monitor scheduler logs

### Step 4: Feature 4 - SEO Enhancement
1. Update database schema for SEO fields
2. Deploy advanced SEO form
3. Deploy enhanced meta tags
4. Deploy pixel tracking scripts
5. Test all tracking pixels
6. Verify social sharing previews

---

## ✅ Phase 2 Success Criteria

### Business Metrics
- [ ] Conversion tracking accurately attributes sales
- [ ] Product showcase increases click-through rates
- [ ] Campaign scheduling saves admin time
- [ ] SEO enhancements improve social reach

### Technical Metrics
- [ ] All features deployed without errors
- [ ] No performance degradation
- [ ] Database queries optimized (indexes used)
- [ ] Analytics data accurate
- [ ] Scheduler runs reliably

### Code Quality
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All validations use Zod
- [ ] No hardcoded values
- [ ] Comprehensive error handling
- [ ] Security best practices followed

---

## 📊 Post-Phase 2 Analysis

### Data to Track
1. **Conversion Tracking**
   - Average conversion rate per landing page
   - Most effective landing pages
   - UTM campaign performance

2. **Product Showcase**
   - Click-through rate by layout type
   - Most clicked products
   - Conversion rate from showcase vs. content embeds

3. **Campaign Scheduling**
   - Number of scheduled campaigns
   - Time saved vs. manual publishing
   - Scheduling accuracy (success rate)

4. **SEO Enhancement**
   - Social share count increase
   - Traffic from social platforms
   - Pixel event accuracy

---

**End of Phase 2 Implementation Plan**

**This completes the Landing Page feature implementation. All enhancements are practical, business-focused, and designed for maximum ROI without over-engineering.**
