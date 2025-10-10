# Order Management QA Specification
**Testing Requirements & Quality Assurance Guidelines**

## Document Purpose

This document defines **complete testing and quality assurance requirements** for the Order Management Redesign. It includes:
- Unit test requirements and examples
- Integration test specifications
- End-to-end test scenarios
- Accessibility requirements (WCAG 2.1 Level AA)
- Performance targets and optimization
- Browser compatibility matrix
- Edge case scenarios
- Test data fixtures

**Related Documents:**
- `ORDER_MANAGEMENT_REDESIGN_PLAN.md` - High-level design
- `ORDER_MANAGEMENT_INTEGRATION_PLAN.md` - Integration strategy
- `ORDER_MANAGEMENT_TECHNICAL_SPEC.md` - Technical implementation
- `ORDER_MANAGEMENT_DEV_GUIDE.md` - Development workflow

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Accessibility Requirements](#accessibility-requirements)
6. [Performance Targets](#performance-targets)
7. [Browser Compatibility](#browser-compatibility)
8. [Edge Case Scenarios](#edge-case-scenarios)
9. [Test Data Fixtures](#test-data-fixtures)

---

## Testing Strategy

### Testing Pyramid

```
      /\
     /E2E\      (Few) - Critical user journeys
    /------\
   /  INT   \   (Some) - API integration, component integration
  /----------\
 /   UNIT     \ (Many) - Pure functions, utils, components
/--------------\
```

### Test Coverage Requirements

| Type | Minimum Coverage | Priority |
|------|-----------------|----------|
| Unit Tests | 80% | 🔴 CRITICAL |
| Integration Tests | 60% | 🟡 IMPORTANT |
| E2E Tests | Critical paths only | 🟢 RECOMMENDED |

### Testing Tools

```bash
# Unit & Integration Tests
- Jest (test runner)
- React Testing Library (component testing)
- MSW (Mock Service Worker for API mocking)

# E2E Tests
- Playwright (browser automation)

# Accessibility Tests
- axe-core (automated accessibility testing)
- jest-axe (Jest integration for axe)

# Performance Tests
- Lighthouse CI (automated performance testing)
```

---

## Unit Tests

### 1. Constants Tests

#### Test: ORDER_STATUSES constant

```typescript
// src/lib/constants/__tests__/order.test.ts
import { ORDER_STATUSES, PAYMENT_STATUSES, SHIPMENT_STATUSES } from '../order';

describe('ORDER_STATUSES', () => {
  it('should have all required order statuses', () => {
    expect(ORDER_STATUSES.PENDING).toBeDefined();
    expect(ORDER_STATUSES.PAID).toBeDefined();
    expect(ORDER_STATUSES.READY_TO_SHIP).toBeDefined();
    expect(ORDER_STATUSES.IN_TRANSIT).toBeDefined();
    expect(ORDER_STATUSES.OUT_FOR_DELIVERY).toBeDefined();
    expect(ORDER_STATUSES.DELIVERED).toBeDefined();
    expect(ORDER_STATUSES.CANCELLED).toBeDefined();
    expect(ORDER_STATUSES.REFUNDED).toBeDefined();
  });

  it('should have correct structure for each status', () => {
    Object.values(ORDER_STATUSES).forEach((status) => {
      expect(status).toHaveProperty('value');
      expect(status).toHaveProperty('label');
      expect(status).toHaveProperty('color');
      expect(status).toHaveProperty('icon');
    });
  });

  it('should have unique values', () => {
    const values = Object.values(ORDER_STATUSES).map((s) => s.value);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('should have valid color values', () => {
    const validColors = ['gray', 'green', 'blue', 'purple', 'indigo', 'yellow', 'red', 'orange'];
    Object.values(ORDER_STATUSES).forEach((status) => {
      expect(validColors).toContain(status.color);
    });
  });
});

describe('ORDER_STATUS_TABS', () => {
  it('should have all required tabs', () => {
    const tabIds = ORDER_STATUS_TABS.map((tab) => tab.id);
    expect(tabIds).toContain('all');
    expect(tabIds).toContain('awaiting-payment');
    expect(tabIds).toContain('processing');
    expect(tabIds).toContain('shipped');
    expect(tabIds).toContain('delivered');
    expect(tabIds).toContain('cancelled');
  });

  it('should have correct filter structure', () => {
    ORDER_STATUS_TABS.forEach((tab) => {
      expect(tab).toHaveProperty('id');
      expect(tab).toHaveProperty('label');
      expect(tab).toHaveProperty('filter');
      expect(tab).toHaveProperty('icon');
    });
  });

  it('should have null filter for "all" tab', () => {
    const allTab = ORDER_STATUS_TABS.find((tab) => tab.id === 'all');
    expect(allTab?.filter).toBeNull();
  });
});
```

---

### 2. Utility Function Tests

#### Test: formatCurrency()

```typescript
// src/lib/utils/__tests__/order.test.ts
import {
  formatCurrency,
  formatOrderDate,
  getStatusBadge,
  getStatusColor,
  getCustomerName,
  canFulfillOrder,
} from '../order';
import { Decimal } from '@prisma/client/runtime/library';

describe('formatCurrency', () => {
  it('should format number to currency', () => {
    expect(formatCurrency(150.5)).toBe('RM 150.50');
    expect(formatCurrency(1000)).toBe('RM 1,000.00');
  });

  it('should format Decimal to currency', () => {
    const decimal = new Decimal(99.99);
    expect(formatCurrency(decimal)).toBe('RM 99.99');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('RM 0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-50)).toBe('-RM 50.00');
  });
});

describe('getStatusBadge', () => {
  it('should return correct badge for order status', () => {
    const badge = getStatusBadge('PAID', 'order');
    expect(badge.label).toBe('Paid');
    expect(badge.color).toBe('green');
    expect(badge.icon).toBe('CheckCircle');
  });

  it('should return correct badge for payment status', () => {
    const badge = getStatusBadge('PENDING', 'payment');
    expect(badge.label).toBe('Awaiting Payment');
    expect(badge.color).toBe('yellow');
  });

  it('should return default badge for unknown status', () => {
    const badge = getStatusBadge('UNKNOWN', 'order');
    expect(badge.label).toBe('UNKNOWN');
    expect(badge.color).toBe('gray');
    expect(badge.icon).toBe('HelpCircle');
  });
});

describe('getCustomerName', () => {
  it('should return full name for user orders', () => {
    const order = {
      user: { firstName: 'John', lastName: 'Tan' },
    };
    expect(getCustomerName(order)).toBe('John Tan');
  });

  it('should return guest email for guest orders', () => {
    const order = {
      user: null,
      guestEmail: 'guest@example.com',
    };
    expect(getCustomerName(order)).toBe('Guest (guest@example.com)');
  });

  it('should return "Unknown Customer" for orders with no user or email', () => {
    const order = {
      user: null,
      guestEmail: null,
    };
    expect(getCustomerName(order)).toBe('Unknown Customer');
  });
});

describe('canFulfillOrder', () => {
  it('should return true for paid orders without shipment', () => {
    const order = {
      paymentStatus: 'PAID' as const,
      shipment: null,
    };
    expect(canFulfillOrder(order)).toBe(true);
  });

  it('should return false for unpaid orders', () => {
    const order = {
      paymentStatus: 'PENDING' as const,
      shipment: null,
    };
    expect(canFulfillOrder(order)).toBe(false);
  });

  it('should return false for orders with existing shipment', () => {
    const order = {
      paymentStatus: 'PAID' as const,
      shipment: { id: 'ship_123' },
    };
    expect(canFulfillOrder(order)).toBe(false);
  });
});
```

---

### 3. Component Tests

#### Test: OrderStatusBadge

```typescript
// src/components/admin/orders/__tests__/OrderStatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from '../OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('should render order status badge', () => {
    render(<OrderStatusBadge status="PAID" type="order" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should apply correct color class for status', () => {
    const { container } = render(<OrderStatusBadge status="PAID" type="order" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render icon when showIcon is true', () => {
    const { container } = render(<OrderStatusBadge status="PAID" type="order" showIcon={true} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should not render icon when showIcon is false', () => {
    const { container } = render(<OrderStatusBadge status="PAID" type="order" showIcon={false} />);
    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { container: smContainer } = render(
      <OrderStatusBadge status="PAID" type="order" size="sm" />
    );
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: mdContainer } = render(
      <OrderStatusBadge status="PAID" type="order" size="md" />
    );
    expect(mdContainer.firstChild).toHaveClass('text-sm');

    const { container: lgContainer } = render(
      <OrderStatusBadge status="PAID" type="order" size="lg" />
    );
    expect(lgContainer.firstChild).toHaveClass('text-base');
  });

  it('should handle unknown status gracefully', () => {
    render(<OrderStatusBadge status="UNKNOWN" type="order" />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OrderStatusBadge status="PAID" type="order" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

#### Test: OrderTable

```typescript
// src/components/admin/orders/__tests__/OrderTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderTable } from '../OrderTable';
import { mockOrders } from '@/test/fixtures/orders';

describe('OrderTable', () => {
  it('should render table with orders', () => {
    render(<OrderTable orders={mockOrders} />);
    expect(screen.getByText('ORD-20251009-ABCD')).toBeInTheDocument();
    expect(screen.getByText('John Tan')).toBeInTheDocument();
  });

  it('should show empty state when no orders', () => {
    render(<OrderTable orders={[]} />);
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
  });

  it('should call onSelectOrder when checkbox is clicked', () => {
    const handleSelectOrder = jest.fn();
    render(<OrderTable orders={mockOrders} onSelectOrder={handleSelectOrder} />);

    const checkbox = screen.getAllByRole('checkbox')[1]; // First order checkbox (0 is select all)
    fireEvent.click(checkbox);

    expect(handleSelectOrder).toHaveBeenCalledWith(mockOrders[0].id, true);
  });

  it('should call onSelectAll when header checkbox is clicked', () => {
    const handleSelectAll = jest.fn();
    render(<OrderTable orders={mockOrders} onSelectAll={handleSelectAll} />);

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(handleSelectAll).toHaveBeenCalledWith(true);
  });

  it('should render loading skeleton when isLoading is true', () => {
    render(<OrderTable orders={[]} isLoading={true} />);
    expect(screen.queryByText('No orders yet')).not.toBeInTheDocument();
    // Skeleton should be rendered
  });

  it('should display correct order count', () => {
    render(<OrderTable orders={mockOrders} />);
    expect(screen.getByText(`${mockOrders.length} orders`)).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(<OrderTable orders={mockOrders} />);
    expect(screen.getByText('RM 165.00')).toBeInTheDocument();
  });

  it('should render status badges', () => {
    render(<OrderTable orders={mockOrders} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });
});
```

---

## Integration Tests

### 1. API Integration Tests

```typescript
// src/app/api/orders/__tests__/route.test.ts
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/db/prisma');
jest.mock('next-auth');

describe('Orders API', () => {
  describe('GET /api/orders', () => {
    it('should return paginated orders for authenticated user', async () => {
      // Mock authentication
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user_123', role: 'ADMIN' },
      });

      // Mock database response
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(47);

      const request = new NextRequest('http://localhost/api/orders?page=1&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orders).toHaveLength(mockOrders.length);
      expect(data.pagination.totalCount).toBe(47);
    });

    it('should return 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/orders');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should filter orders by status', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user_123', role: 'ADMIN' },
      });

      const request = new NextRequest('http://localhost/api/orders?status=PAID');
      await GET(request);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PAID' }),
        })
      );
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with valid data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user_123', email: 'user@example.com' },
      });

      (prisma.$transaction as jest.Mock).mockResolvedValue(mockCreatedOrder);

      const request = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        body: JSON.stringify(mockOrderRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orderId).toBeDefined();
      expect(data.orderNumber).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
```

---

### 2. Component Integration Tests

```typescript
// src/app/admin/orders/__tests__/page.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersPage from '../page';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('Orders Page Integration', () => {
  it('should fetch and display orders on mount', async () => {
    render(<OrdersPage searchParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText('ORD-20251009-ABCD')).toBeInTheDocument();
    });
  });

  it('should filter orders by status tab', async () => {
    const user = userEvent.setup();
    render(<OrdersPage searchParams={{}} />);

    // Click "Processing" tab
    const processingTab = screen.getByRole('tab', { name: /Processing/i });
    await user.click(processingTab);

    // Verify filtered orders are displayed
    await waitFor(() => {
      expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    });
  });

  it('should search orders by order number', async () => {
    const user = userEvent.setup();
    render(<OrdersPage searchParams={{}} />);

    const searchInput = screen.getByPlaceholderText(/Search orders/i);
    await user.type(searchInput, 'ORD-20251009');

    await waitFor(() => {
      expect(screen.getByText('ORD-20251009-ABCD')).toBeInTheDocument();
    });
  });

  it('should update order status inline', async () => {
    const user = userEvent.setup();
    render(<OrdersPage searchParams={{}} />);

    // Find status dropdown for first order
    const statusDropdown = screen.getAllByRole('combobox')[0];
    await user.click(statusDropdown);

    // Select new status
    const shippedOption = screen.getByText('Shipped');
    await user.click(shippedOption);

    // Verify API was called
    await waitFor(() => {
      expect(screen.getByText('Order status updated')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('/api/orders', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<OrdersPage searchParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument();
    });
  });
});
```

---

## End-to-End Tests

### Critical User Journeys

```typescript
// tests/e2e/orders.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display orders list', async ({ page }) => {
    await page.goto('/admin/orders');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Orders');

    // Verify table is displayed
    await expect(page.locator('table')).toBeVisible();

    // Verify at least one order is displayed
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(await rows.count());
  });

  test('should filter orders by status tab', async ({ page }) => {
    await page.goto('/admin/orders');

    // Click "Processing" tab
    await page.click('button:has-text("Processing")');

    // Wait for URL to update
    await page.waitForURL(/status=processing/);

    // Verify filtered results
    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      const badge = statusBadges.nth(i);
      const text = await badge.textContent();
      expect(['Paid', 'Processing']).toContain(text);
    }
  });

  test('should search orders', async ({ page }) => {
    await page.goto('/admin/orders');

    // Type in search box
    await page.fill('[placeholder*="Search"]', 'ORD-20251009');
    await page.waitForTimeout(500); // Debounce

    // Verify results contain search term
    await expect(page.locator('tbody tr')).toContainText('ORD-20251009');
  });

  test('should update order status', async ({ page }) => {
    await page.goto('/admin/orders');

    // Click first row status dropdown
    await page.click('tbody tr:first-child [data-testid="status-dropdown"]');

    // Select new status
    await page.click('text=Shipped');

    // Verify success notification
    await expect(page.locator('[role="status"]')).toContainText('updated successfully');
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/admin/orders');

    // Click "View" button for first order
    await page.click('tbody tr:first-child a:has-text("View"), tbody tr:first-child button[title*="View"]');

    // Wait for details page
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify order details are displayed
    await expect(page.locator('h1')).toContainText('Order #');
    await expect(page.locator('text=Customer')).toBeVisible();
    await expect(page.locator('text=Shipping Address')).toBeVisible();
  });

  test('should download invoice', async ({ page }) => {
    await page.goto('/admin/orders');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click invoice button
    await page.click('tbody tr:first-child [title*="Invoice"], tbody tr:first-child button:has-text("Invoice")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/Receipt.*\.pdf/);
  });

  test('should export orders', async ({ page }) => {
    await page.goto('/admin/orders');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select options
    await page.selectOption('[name="format"]', 'csv');
    await page.check('[name="includeCustomerDetails"]');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await page.click('button:has-text("Download")');

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/admin/orders');

    // Click next page
    await page.click('button:has-text("Next")');

    // Verify URL updated
    await page.waitForURL(/page=2/);

    // Verify different orders displayed
    const firstOrderNumber = await page.locator('tbody tr:first-child').textContent();

    // Go back
    await page.click('button:has-text("Previous")');
    await page.waitForURL(/page=1/);

    // Verify original orders displayed
    const newFirstOrderNumber = await page.locator('tbody tr:first-child').textContent();
    expect(firstOrderNumber).not.toBe(newFirstOrderNumber);
  });
});
```

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

#### 1. Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Tab order must be logical
- Focus indicators must be visible
- Escape key closes modals/dropdowns

**Test:**
```typescript
test('should navigate table with keyboard', async ({ page }) => {
  await page.goto('/admin/orders');

  // Tab through interactive elements
  await page.keyboard.press('Tab');
  let focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'A', 'INPUT']).toContain(focused);

  // Verify focus indicator is visible
  const focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    const styles = window.getComputedStyle(el!);
    return styles.outline !== 'none' || styles.boxShadow !== 'none';
  });
  expect(focusedElement).toBe(true);
});
```

#### 2. Screen Reader Support

**Requirements:**
- All images must have alt text
- Form inputs must have labels
- Tables must have proper headers
- Status changes must be announced
- Loading states must be announced

**Implementation:**
```typescript
// Proper ARIA labels
<button
  aria-label="Update order status"
  aria-describedby="status-help-text"
>
  Update
</button>

// Status announcements
<div role="status" aria-live="polite">
  {orderCount} orders found
</div>

// Loading announcements
<div role="status" aria-live="polite" aria-busy="true">
  Loading orders...
</div>

// Table headers
<table>
  <thead>
    <tr>
      <th scope="col">Order Number</th>
      <th scope="col">Customer</th>
      <th scope="col">Total</th>
    </tr>
  </thead>
</table>
```

#### 3. Color Contrast

**Requirements:**
- Normal text (< 18px): Minimum 4.5:1 contrast ratio
- Large text (≥ 18px): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

**Automated Test:**
```typescript
import { checkA11y } from 'axe-playwright';

test('should pass accessibility audit', async ({ page }) => {
  await page.goto('/admin/orders');
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

#### 4. Focus Management

**Requirements:**
- Focus trap in modals
- Focus restoration after modal close
- Skip to main content link
- No keyboard traps

**Implementation:**
```typescript
// Focus trap in modal
import { FocusTrap } from '@/components/ui/focus-trap';

<Dialog open={isOpen} onOpenChange={onClose}>
  <FocusTrap>
    <DialogContent>
      {/* Modal content */}
    </DialogContent>
  </FocusTrap>
</Dialog>

// Focus restoration
const previousFocus = useRef<HTMLElement>();

const openModal = () => {
  previousFocus.current = document.activeElement as HTMLElement;
  setIsOpen(true);
};

const closeModal = () => {
  setIsOpen(false);
  previousFocus.current?.focus();
};
```

---

## Performance Targets

### 1. Page Load Performance

**Targets:**
- **Largest Contentful Paint (LCP):** < 2.5 seconds
- **First Input Delay (FID):** < 100 milliseconds
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.5 seconds

**Optimization Strategies:**
- Server-side rendering (SSR) for initial load
- Incremental Static Regeneration (ISR) for static content
- Code splitting by route
- Lazy loading for non-critical components
- Image optimization with Next.js Image component

**Measurement:**
```bash
# Run Lighthouse CI
npm run lighthouse:ci

# Expected scores:
# Performance: > 90
# Accessibility: 100
# Best Practices: > 95
# SEO: > 90
```

---

### 2. API Performance

**Targets:**
- **Order list query:** < 200ms (p95)
- **Order details query:** < 150ms (p95)
- **Status update:** < 100ms (p95)
- **Invoice generation:** < 2 seconds (p95)

**Optimization:**
- Database indexing on frequently queried fields
- Selective field loading (don't fetch unnecessary relations)
- Query result caching (30 seconds)
- Pagination to limit result sets

**Database Indexes:**
```sql
-- Ensure these indexes exist
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(paymentStatus);
CREATE INDEX idx_orders_created_at ON orders(createdAt DESC);
CREATE INDEX idx_orders_user_id ON orders(userId);
CREATE INDEX idx_orders_order_number ON orders(orderNumber);
```

---

### 3. Client-Side Performance

**Targets:**
- **Table rendering:** < 100ms for 20 rows
- **Status badge rendering:** < 10ms per badge
- **Filter update:** < 50ms
- **Search debounce:** 300ms

**Optimization:**
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for event handlers
- Virtual scrolling for large lists (> 100 items)

**Example:**
```typescript
// Memoize expensive computations
const sortedOrders = useMemo(() => {
  return orders.sort((a, b) => {
    // Sorting logic
  });
}, [orders, sortColumn, sortDirection]);

// Memoize components
const OrderRow = React.memo(({ order }) => {
  // Row rendering
});
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Priority |
|---------|----------------|----------|
| Chrome | 90+ | 🔴 PRIMARY |
| Edge | 90+ | 🔴 PRIMARY |
| Safari | 14+ | 🟡 SECONDARY |
| Firefox | 88+ | 🟡 SECONDARY |
| Mobile Safari (iOS) | 14+ | 🟡 SECONDARY |
| Chrome Mobile (Android) | 90+ | 🟡 SECONDARY |

### Browser Testing Matrix

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### Known Issues & Workarounds

**Safari Date Input:**
- Issue: Date picker UI differs from other browsers
- Workaround: Use custom date picker component

**IE11 (Not Supported):**
- Next.js 14 does not support IE11
- Show unsupported browser message

---

## Edge Case Scenarios

### 1. Guest Orders

**Scenario:** Order placed by guest (no user account)

**Expected Behavior:**
- Display "Guest" instead of user name
- Show guest email
- All functions work (status update, invoice, etc.)

**Test:**
```typescript
test('should handle guest orders correctly', () => {
  const guestOrder = {
    ...mockOrder,
    user: null,
    guestEmail: 'guest@example.com',
  };

  render(<OrderTable orders={[guestOrder]} />);
  expect(screen.getByText(/Guest/)).toBeInTheDocument();
  expect(screen.getByText('guest@example.com')).toBeInTheDocument();
});
```

---

### 2. Deleted Products

**Scenario:** Order contains product that has been deleted

**Expected Behavior:**
- Show cached product name from `orderItems.productName`
- Disable product link
- Show "Product unavailable" badge

**Test:**
```typescript
test('should handle deleted products', () => {
  const orderWithDeletedProduct = {
    ...mockOrder,
    orderItems: [{
      ...mockOrderItem,
      product: null, // Product deleted
      productName: 'Deleted Product',
    }],
  };

  render(<OrderDetails order={orderWithDeletedProduct} />);
  expect(screen.getByText('Deleted Product')).toBeInTheDocument();
  expect(screen.getByText('Product unavailable')).toBeInTheDocument();
});
```

---

### 3. Orders Without Shipment

**Scenario:** Paid order hasn't been fulfilled yet

**Expected Behavior:**
- Hide tracking section
- Show "Awaiting fulfillment" message
- Enable "Fulfill" button

**Test:**
```typescript
test('should show fulfill button for unfulfilled orders', () => {
  const unfulfilledOrder = {
    ...mockOrder,
    paymentStatus: 'PAID',
    shipment: null,
  };

  render(<OrderInlineActions order={unfulfilledOrder} />);
  expect(screen.getByRole('button', { name: /Fulfill/i })).toBeEnabled();
});
```

---

### 4. Failed Shipment Booking

**Scenario:** Shipment booking failed with courier

**Expected Behavior:**
- Show error badge on order
- Display failure reason
- Provide "Retry" button
- Send admin notification

**Test:**
```typescript
test('should handle failed shipment booking', () => {
  const failedOrder = {
    ...mockOrder,
    shipment: {
      status: 'FAILED',
      statusDescription: 'Invalid address',
    },
  };

  render(<OrderDetails order={failedOrder} />);
  expect(screen.getByText(/Shipment Failed/i)).toBeInTheDocument();
  expect(screen.getByText('Invalid address')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
});
```

---

### 5. Concurrent Status Updates

**Scenario:** Two admins update same order simultaneously

**Expected Behavior:**
- Use optimistic updates
- Handle race condition with version field
- Show conflict error if needed
- Refresh order data after update

**Implementation:**
```typescript
// Optimistic update
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  // Optimistically update UI
  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
  );

  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      // Revert optimistic update
      setOrders((prev) => prev); // Refresh from server
      throw new Error('Update failed');
    }
  } catch (error) {
    toast.error('Failed to update status. Please refresh and try again.');
  }
};
```

---

### 6. Very Long Order Numbers

**Scenario:** Custom order number exceeds display width

**Expected Behavior:**
- Truncate with ellipsis
- Show full number on hover (tooltip)
- Full number visible in details page

**Implementation:**
```typescript
<Tooltip content={order.orderNumber}>
  <span className="truncate max-w-[200px]">
    {order.orderNumber}
  </span>
</Tooltip>
```

---

### 7. Large Order Item Count

**Scenario:** Order contains > 20 items

**Expected Behavior:**
- Show first 5 items in table view
- Display "+ 15 more" indicator
- Expand on click or show all in details page

**Implementation:**
```typescript
const visibleItems = showAll ? orderItems : orderItems.slice(0, 5);
const remainingCount = orderItems.length - 5;

<div>
  {visibleItems.map((item) => (
    <OrderItemRow key={item.id} item={item} />
  ))}
  {!showAll && remainingCount > 0 && (
    <Button variant="link" onClick={() => setShowAll(true)}>
      + {remainingCount} more items
    </Button>
  )}
</div>
```

---

### 8. Timezone Handling

**Scenario:** Admin in different timezone views orders

**Expected Behavior:**
- All dates displayed in admin's local timezone
- Show timezone indicator (e.g., "GMT+8")
- Use consistent timezone throughout admin panel

**Implementation:**
```typescript
// Always use Malaysian timezone for consistency
export function formatOrderDate(date: Date | string): string {
  return formatDate(date, {
    format: 'medium',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

// Show timezone indicator
<p className="text-xs text-gray-500">
  {formatOrderDateTime(order.createdAt)} (MYT)
</p>
```

---

## Test Data Fixtures

### Mock Orders

```typescript
// test/fixtures/orders.ts
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';

export const mockOrders: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'ORD-20251009-ABCD',
    userId: 'user_1',
    guestEmail: null,
    status: 'PAID' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    subtotal: new Decimal(150.00),
    taxAmount: new Decimal(0.00),
    shippingCost: new Decimal(15.00),
    discountAmount: new Decimal(0.00),
    total: new Decimal(165.00),
    memberDiscount: new Decimal(0.00),
    wasEligibleForMembership: false,
    shippingAddressId: 'addr_1',
    billingAddressId: 'addr_2',
    paymentMethod: 'toyyibpay',
    paymentId: 'pay_123',
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    customerNotes: null,
    adminNotes: null,
    createdAt: new Date('2025-10-09T10:30:00Z'),
    updatedAt: new Date('2025-10-09T10:35:00Z'),
    // ... other fields
    user: {
      firstName: 'John',
      lastName: 'Tan',
      email: 'john@example.com',
    },
    orderItems: [
      {
        id: 'item_1',
        orderId: 'ord_1',
        productId: 'prod_1',
        quantity: 2,
        regularPrice: new Decimal(80.00),
        memberPrice: new Decimal(75.00),
        appliedPrice: new Decimal(75.00),
        totalPrice: new Decimal(150.00),
        productName: 'Product A',
        productSku: 'SKU-001',
        discountCodeId: null,
        createdAt: new Date(),
      },
    ],
    shipment: null,
  },
  {
    id: 'ord_2',
    orderNumber: 'ORD-20251009-EFGH',
    userId: null,
    guestEmail: 'guest@example.com',
    status: 'PENDING' as OrderStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    subtotal: new Decimal(89.00),
    taxAmount: new Decimal(0.00),
    shippingCost: new Decimal(15.00),
    discountAmount: new Decimal(0.00),
    total: new Decimal(104.00),
    memberDiscount: new Decimal(0.00),
    wasEligibleForMembership: true,
    shippingAddressId: 'addr_3',
    billingAddressId: 'addr_3',
    paymentMethod: 'toyyibpay',
    paymentId: null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    customerNotes: 'Please pack carefully',
    adminNotes: null,
    createdAt: new Date('2025-10-09T11:00:00Z'),
    updatedAt: new Date('2025-10-09T11:00:00Z'),
    // ... other fields
    user: null,
    orderItems: [
      {
        id: 'item_2',
        orderId: 'ord_2',
        productId: 'prod_2',
        quantity: 1,
        regularPrice: new Decimal(89.00),
        memberPrice: new Decimal(89.00),
        appliedPrice: new Decimal(89.00),
        totalPrice: new Decimal(89.00),
        productName: 'Product B',
        productSku: 'SKU-002',
        discountCodeId: null,
        createdAt: new Date(),
      },
    ],
    shipment: null,
  },
];

export const mockOrderWithShipment = {
  ...mockOrders[0],
  status: 'IN_TRANSIT' as OrderStatus,
  shipment: {
    id: 'ship_1',
    orderId: 'ord_1',
    easyParcelShipmentId: 'ep_123',
    trackingNumber: 'TRACK123456',
    courierId: 'poslaju',
    courierName: 'Pos Laju',
    serviceName: 'Standard Delivery',
    serviceType: 'parcel',
    serviceDetail: 'pickup',
    selectedDropoffPoint: null,
    pickupAddress: {},
    deliveryAddress: {},
    parcelDetails: {},
    originalPrice: new Decimal(15.00),
    finalPrice: new Decimal(15.00),
    insuranceAmount: null,
    codAmount: null,
    status: 'IN_TRANSIT' as ShipmentStatus,
    statusDescription: 'Package in transit',
    estimatedDelivery: new Date('2025-10-12T00:00:00Z'),
    actualDelivery: null,
    labelUrl: 'https://cdn.example.com/labels/label_1.pdf',
    labelGenerated: true,
    pickupScheduled: true,
    pickupDate: new Date('2025-10-10T00:00:00Z'),
    pickupTimeSlot: '09:00-12:00',
    specialInstructions: null,
    signatureRequired: false,
    insuranceRequired: false,
    createdAt: new Date('2025-10-09T11:00:00Z'),
    updatedAt: new Date('2025-10-10T09:30:00Z'),
    trackingEvents: [
      {
        id: 'event_1',
        shipmentId: 'ship_1',
        eventCode: 'PICKED_UP',
        eventName: 'Picked Up',
        description: 'Package picked up by courier',
        location: 'Kuala Lumpur Hub',
        eventTime: new Date('2025-10-10T09:30:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
        createdAt: new Date('2025-10-10T09:35:00Z'),
      },
      {
        id: 'event_2',
        shipmentId: 'ship_1',
        eventCode: 'IN_TRANSIT',
        eventName: 'In Transit',
        description: 'Package in transit to destination',
        location: 'Shah Alam Hub',
        eventTime: new Date('2025-10-10T14:00:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
        createdAt: new Date('2025-10-10T14:05:00Z'),
      },
    ],
  },
};
```

---

## Summary

This QA specification provides:

✅ **Testing Strategy** - Pyramid approach with coverage targets
✅ **Unit Tests** - Examples for constants, utils, components
✅ **Integration Tests** - API and component integration tests
✅ **E2E Tests** - Critical user journey scenarios
✅ **Accessibility** - WCAG 2.1 Level AA requirements
✅ **Performance** - Targets and optimization strategies
✅ **Browser Compatibility** - Support matrix and testing
✅ **Edge Cases** - 8 scenarios with expected behavior
✅ **Test Fixtures** - Mock data for testing

**Next Steps:**
1. Set up testing infrastructure (Jest, RTL, Playwright)
2. Write tests incrementally during development
3. Run tests in CI/CD pipeline
4. Monitor test coverage
5. Update tests when requirements change

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Complete ✅
