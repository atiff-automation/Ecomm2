# Sales Reports Implementation Plan
*Malaysian E-commerce Platform - EcomJRM*

## Overview

This document outlines the comprehensive implementation plan for sales reporting functionality following CLAUDE.md principles: systematic implementation, no hardcoding, DRY principle, centralized approach, and best software architecture practices.

## Architecture Design

### Core Principles
- **Single Source of Truth**: Centralized SalesAnalyticsService
- **No Hardcoding**: All configurations and constants properly managed
- **DRY Implementation**: Reusable components and services
- **Malaysian E-commerce Focus**: GST/SST compliance, local payment methods, state-wise analytics

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   API Layer     │    │   Data Layer    │
│                 │    │                 │    │                 │
│ Dashboard       │◄──►│ /api/admin/     │◄──►│ SalesAnalytics  │
│ Components      │    │ reports/sales   │    │ Service         │
│ (shadcn)        │    │                 │    │ (Prisma)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Metrics & Features

### Revenue Analytics
- Total revenue (with/without tax)
- Member vs non-member revenue comparison
- Average order value (AOV) trends
- Payment method distribution (Billplz, cards, etc.)
- Revenue by Malaysian states

### Product Performance
- Best selling products by quantity and revenue
- Revenue analysis by product performance
- Category performance breakdown
- Member pricing impact analysis
- Stock movement analytics

### Customer Insights
- New vs returning customer analysis
- Member conversion rate tracking
- Geographic distribution by Malaysian states
- Customer lifetime value calculation
- Purchase behavior patterns

### Malaysian Tax Compliance
- GST/SST tax collection reporting
- Tax breakdown by product categories
- Compliance-ready export formats
- Business profile integration

## Implementation Phases

### Phase 1: Foundation & Core Service
**Files to Create:**
- `src/lib/types/sales-reports.ts`
- `src/lib/services/sales-analytics.ts`
- `src/app/api/admin/reports/sales/overview/route.ts`

**Key Tasks:**
1. Set up TypeScript interfaces for all data structures
2. Create centralized SalesAnalyticsService class
3. Implement basic overview API endpoint
4. Add proper authentication and authorization

### Phase 2: Revenue Analytics
**Files to Create:**
- `src/app/api/admin/reports/sales/revenue/route.ts`
- `src/components/admin/reports/sales-dashboard.tsx`
- `src/components/admin/reports/metric-card.tsx`

**Key Tasks:**
1. Implement revenue calculation methods
2. Create dashboard layout with metric cards
3. Add date range filtering
4. Implement member vs non-member comparison

### Phase 3: Product & Customer Analytics
**Files to Create:**
- `src/app/api/admin/reports/sales/products/route.ts`
- `src/app/api/admin/reports/sales/customers/route.ts`
- `src/components/admin/reports/product-performance-table.tsx`
- `src/components/admin/reports/customer-insights-table.tsx`

**Key Tasks:**
1. Product performance analysis
2. Customer behavior analytics
3. Geographic distribution analysis
4. Profit margin calculations

### Phase 4: Export & Malaysian Compliance
**Files to Create:**
- `src/app/api/admin/reports/sales/export/route.ts`
- `src/components/admin/reports/revenue-chart.tsx`
- `src/components/admin/reports/date-range-picker.tsx`

**Key Tasks:**
1. CSV/PDF export functionality
2. Tax reporting features
3. Chart visualizations
4. Advanced filtering options

## File Structure

```
src/
├── lib/
│   ├── types/
│   │   └── sales-reports.ts          # TypeScript interfaces
│   └── services/
│       └── sales-analytics.ts        # Centralized service
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── reports/
│   │           └── sales/
│   │               ├── overview/route.ts
│   │               ├── revenue/route.ts
│   │               ├── products/route.ts
│   │               ├── customers/route.ts
│   │               └── export/route.ts
│   └── admin/
│       └── reports/
│           └── sales/
│               └── page.tsx          # Main sales report page
└── components/
    └── admin/
        └── reports/
            ├── sales-dashboard.tsx
            ├── metric-card.tsx
            ├── revenue-chart.tsx
            ├── product-performance-table.tsx
            ├── customer-insights-table.tsx
            └── date-range-picker.tsx
```

## Technical Implementation Details

### Data Types & Interfaces

```typescript
// src/lib/types/sales-reports.ts
export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  memberRevenue: number;
  nonMemberRevenue: number;
  taxCollected: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  profitMargin: number;
  memberSales: number;
  nonMemberSales: number;
}

export interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  memberConversionRate: number;
  avgCustomerLifetimeValue: number;
  topStates: StateAnalytics[];
}

export interface StateAnalytics {
  state: string;
  stateName: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface RevenueAnalytics {
  daily: RevenuePoint[];
  weekly: RevenuePoint[];
  monthly: RevenuePoint[];
  paymentMethods: PaymentMethodAnalytics[];
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
  memberRevenue: number;
  nonMemberRevenue: number;
}

export interface PaymentMethodAnalytics {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
}
```

### Core Service Implementation

```typescript
// src/lib/services/sales-analytics.ts
import { prisma } from '@/lib/db/prisma';
import { 
  SalesOverview, 
  ProductPerformance, 
  CustomerInsight,
  RevenueAnalytics 
} from '@/lib/types/sales-reports';

export class SalesAnalyticsService {
  private static instance: SalesAnalyticsService;
  
  public static getInstance(): SalesAnalyticsService {
    if (!SalesAnalyticsService.instance) {
      SalesAnalyticsService.instance = new SalesAnalyticsService();
    }
    return SalesAnalyticsService.instance;
  }

  async getSalesOverview(
    startDate: Date, 
    endDate: Date
  ): Promise<SalesOverview> {
    const [totalStats, memberStats] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED'
        },
        _sum: {
          total: true,
          taxAmount: true
        },
        _count: true
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED',
          user: { isMember: true }
        },
        _sum: { total: true }
      })
    ]);

    const totalRevenue = totalStats._sum.total?.toNumber() || 0;
    const memberRevenue = memberStats._sum.total?.toNumber() || 0;
    const nonMemberRevenue = totalRevenue - memberRevenue;
    
    return {
      totalRevenue,
      totalOrders: totalStats._count,
      averageOrderValue: totalRevenue / totalStats._count || 0,
      memberRevenue,
      nonMemberRevenue,
      taxCollected: totalStats._sum.taxAmount?.toNumber() || 0,
      period: { startDate, endDate }
    };
  }

  async getProductPerformance(
    startDate: Date, 
    endDate: Date,
    limit: number = 20
  ): Promise<ProductPerformance[]> {
    const productStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: limit
    });

    // Get product details and calculate member vs non-member sales
    const performanceData = await Promise.all(
      productStats.map(async (stat) => {
        const [product, memberSales] = await Promise.all([
          prisma.product.findUnique({
            where: { id: stat.productId },
            select: { name: true, sku: true }
          }),
          prisma.orderItem.aggregate({
            where: {
              productId: stat.productId,
              order: {
                createdAt: { gte: startDate, lte: endDate },
                paymentStatus: 'COMPLETED',
                user: { isMember: true }
              }
            },
            _sum: { totalPrice: true }
          })
        ]);

        const totalRevenue = stat._sum.totalPrice?.toNumber() || 0;
        const memberRevenue = memberSales._sum.totalPrice?.toNumber() || 0;
        // Cost price calculation removed as not needed for business
        const quantity = stat._sum.quantity || 0;

        return {
          productId: stat.productId,
          productName: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
          totalQuantitySold: quantity,
          totalRevenue,
          profitMargin: 0, // Profit calculation removed as cost price is not tracked
          memberSales: memberRevenue,
          nonMemberSales: totalRevenue - memberRevenue
        };
      })
    );

    return performanceData;
  }

  async getCustomerInsights(
    startDate: Date, 
    endDate: Date
  ): Promise<CustomerInsight> {
    const [
      totalCustomers,
      newCustomers,
      returningCustomers,
      stateStats
    ] = await Promise.all([
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED'
        },
        select: { userId: true },
        distinct: ['userId']
      }),
      this.getStateAnalytics(startDate, endDate)
    ]);

    // Calculate member conversion rate
    const memberCount = await prisma.user.count({
      where: { role: 'CUSTOMER', isMember: true }
    });

    return {
      totalCustomers,
      newCustomers,
      returningCustomers: returningCustomers.length,
      memberConversionRate: (memberCount / totalCustomers) * 100,
      avgCustomerLifetimeValue: 0, // Calculate based on user.membershipTotal
      topStates: stateStats
    };
  }

  private async getStateAnalytics(
    startDate: Date, 
    endDate: Date
  ): Promise<StateAnalytics[]> {
    // Implementation for state-wise analytics
    // Group orders by shipping address state
    return [];
  }
}

export const salesAnalyticsService = SalesAnalyticsService.getInstance();
```

### API Endpoint Examples

```typescript
// src/app/api/admin/reports/sales/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { salesAnalyticsService } from '@/lib/services/sales-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const endDate = new Date(searchParams.get('endDate') || 
      new Date().toISOString());

    const overview = await salesAnalyticsService.getSalesOverview(
      startDate, 
      endDate
    );

    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    console.error('Sales overview error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch sales overview' },
      { status: 500 }
    );
  }
}
```

### UI Components with shadcn

```tsx
// src/components/admin/reports/metric-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  formatAsCurrency?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  description,
  formatAsCurrency = false 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (formatAsCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR'
      }).format(val);
    }
    return val;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {change !== undefined && (
          <Badge variant={change >= 0 ? 'default' : 'destructive'}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

```tsx
// src/components/admin/reports/sales-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download } from 'lucide-react';
import { MetricCard } from './metric-card';
import { ProductPerformanceTable } from './product-performance-table';
import { CustomerInsightsTable } from './customer-insights-table';
import { DateRangePicker } from './date-range-picker';
import { RevenueChart } from './revenue-chart';
import type { SalesOverview } from '@/lib/types/sales-reports';

export function SalesDashboard() {
  const [overview, setOverview] = useState<SalesOverview | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesOverview();
  }, [dateRange]);

  const fetchSalesOverview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });

      const response = await fetch(`/api/admin/reports/sales/overview?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setOverview(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    // Implementation for export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Reports</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {!loading && overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={overview.totalRevenue}
            formatAsCurrency
            description="Completed orders only"
          />
          <MetricCard
            title="Total Orders"
            value={overview.totalOrders}
            description={`Avg: RM ${overview.averageOrderValue.toFixed(2)}`}
          />
          <MetricCard
            title="Member Revenue"
            value={overview.memberRevenue}
            formatAsCurrency
            description={`${((overview.memberRevenue / overview.totalRevenue) * 100).toFixed(1)}% of total`}
          />
          <MetricCard
            title="Tax Collected"
            value={overview.taxCollected}
            formatAsCurrency
            description="GST/SST total"
          />
        </div>
      )}

      {/* Detailed Reports */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart 
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductPerformanceTable
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInsightsTable
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Performance Optimizations

### Database Indexing
```sql
-- Add these indexes for optimal query performance
CREATE INDEX idx_order_created_payment ON "Order"(created_at, payment_status);
CREATE INDEX idx_order_user_member ON "Order"(user_id) WHERE payment_status = 'COMPLETED';
CREATE INDEX idx_orderitem_product_order ON "OrderItem"(product_id, order_id);
CREATE INDEX idx_user_member_created ON "User"(is_member, created_at) WHERE role = 'CUSTOMER';
```

### Caching Strategy
- Cache expensive aggregations for 15 minutes
- Use Redis for production, memory cache for development
- Invalidate cache on new completed orders

### Query Optimization
- Use Prisma's `aggregate` and `groupBy` for calculations
- Batch related queries with `Promise.all`
- Implement pagination for large datasets
- Use database views for complex joins if needed

## Security Considerations

### Authentication & Authorization
- Admin role required (ADMIN, SUPERADMIN)
- Session validation on all endpoints
- Rate limiting: 100 requests per minute per user

### Data Protection
- No sensitive customer data in logs
- Sanitize all input parameters
- Use parameterized queries (Prisma handles this)
- Audit trail for report access

### API Security
```typescript
// Rate limiting middleware example
import rateLimit from 'express-rate-limit';

const reportRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many report requests'
});
```

## Testing Strategy

### Unit Tests
```typescript
// tests/services/sales-analytics.test.ts
import { SalesAnalyticsService } from '@/lib/services/sales-analytics';

describe('SalesAnalyticsService', () => {
  it('calculates revenue correctly', async () => {
    // Mock Prisma data
    // Test revenue calculation logic
  });
  
  it('handles member vs non-member split', async () => {
    // Test member pricing logic
  });
});
```

### Integration Tests
- Test API endpoints with test database
- Verify data accuracy with sample orders
- Test Malaysian tax calculations
- Validate export functionality

### Performance Tests
- Load test with large datasets
- Monitor query performance
- Test caching effectiveness

## Malaysian E-commerce Specific Features

### State Mapping
```typescript
const MALAYSIAN_STATES = {
  'JHR': 'Johor',
  'KDH': 'Kedah',
  'KTN': 'Kelantan',
  'MLK': 'Malacca',
  'NSN': 'Negeri Sembilan',
  'PHG': 'Pahang',
  'PNG': 'Penang',
  'PRK': 'Perak',
  'PLS': 'Perlis',
  'SGR': 'Selangor',
  'TRG': 'Terengganu',
  'SBH': 'Sabah',
  'SWK': 'Sarawak',
  'KUL': 'Kuala Lumpur',
  'LBN': 'Labuan',
  'PJY': 'Putrajaya'
} as const;
```

### Tax Compliance Features
- GST (6%) and SST tracking
- Tax-exempt product handling
- Business registration integration
- Export formats for accounting software

### Payment Method Analytics
- Billplz transaction tracking
- Credit/debit card analysis
- Bank transfer reporting
- E-wallet integration stats

## Deployment Checklist

### Prerequisites
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Authentication system verified
- [ ] shadcn components installed

### Phase 1 Deployment
- [ ] SalesAnalyticsService implemented
- [ ] Overview API endpoint working
- [ ] Basic dashboard created
- [ ] Authentication tested

### Phase 2 Deployment
- [ ] Revenue analytics implemented
- [ ] Chart components working
- [ ] Date range filtering functional
- [ ] Performance optimized

### Phase 3 Deployment
- [ ] Product performance complete
- [ ] Customer insights working
- [ ] All tables responsive
- [ ] Export functionality ready

### Phase 4 Deployment
- [ ] Tax reporting complete
- [ ] Malaysian compliance verified
- [ ] Full testing completed
- [ ] Documentation updated

## Maintenance & Monitoring

### Performance Monitoring
- Track API response times
- Monitor database query performance
- Cache hit/miss ratios
- User engagement metrics

### Data Integrity Checks
- Verify revenue calculations monthly
- Cross-check with accounting records
- Monitor for data anomalies
- Validate tax calculations

### Future Enhancements
- Real-time analytics dashboard
- Predictive sales forecasting
- Advanced customer segmentation
- Mobile app integration
- Integration with accounting software (e.g., SQL Accounting, AutoCount)

---

## Implementation Timeline

**Week 1**: Phase 1 - Foundation & Core Service
**Week 2**: Phase 2 - Revenue Analytics & Basic UI
**Week 3**: Phase 3 - Product & Customer Analytics
**Week 4**: Phase 4 - Export & Malaysian Compliance Features

**Total Estimated Time**: 4 weeks for complete implementation

This implementation plan provides a systematic, well-architected solution for sales reporting that aligns with your Malaysian e-commerce business needs while following CLAUDE.md principles for maintainable, scalable code.