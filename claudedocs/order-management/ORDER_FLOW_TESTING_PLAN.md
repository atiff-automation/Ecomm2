# Order Flow Testing Plan
**Complete Testing Strategy for E-commerce Order Management**

## Document Overview

This document provides a comprehensive testing plan for the complete order flow from checkout to fulfillment, including:
- Testing strategy and approach
- Unit, integration, and E2E test specifications
- EasyParcel production API testing guidelines
- Mock services setup
- Test execution plan and timeline

**Related Documents:**
- `ORDER_MANAGEMENT_TECHNICAL_SPEC.md` - Technical implementation details
- `ORDER_FLOW_E2E_ANALYSIS.md` - End-to-end flow analysis and verification

---

## Table of Contents

1. [Testing Infrastructure](#testing-infrastructure)
2. [Testing Strategy](#testing-strategy)
3. [EasyParcel Production API Testing](#easyparcel-production-api-testing)
4. [Unit Tests Specification](#unit-tests-specification)
5. [Integration Tests Specification](#integration-tests-specification)
6. [End-to-End Tests Specification](#end-to-end-tests-specification)
7. [Test Data Management](#test-data-management)
8. [Test Execution Plan](#test-execution-plan)
9. [Success Criteria](#success-criteria)

---

## Testing Infrastructure

### Current Setup

**Unit & Integration Testing:**
- **Framework:** Jest 30.1.3
- **React Testing:** @testing-library/react 16.3.0
- **Environment:** jsdom
- **Coverage Target:** 80% (branches, functions, lines, statements)

**End-to-End Testing:**
- **Framework:** Playwright 1.48.0
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Test Directory:** `tests/e2e/`
- **Configuration:** `playwright.config.ts`

**Available Test Commands:**
```bash
# Unit Tests
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:unit         # Unit tests only

# E2E Tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Headed browser mode
npm run test:e2e:debug    # Debug mode
npm run test:e2e:report   # Show HTML report
```

---

## Testing Strategy

### Testing Pyramid Approach

```
           ┌──────────────────┐
           │   E2E Tests      │  ← Complete user journeys (Slow, High value)
           │   ~15 tests      │     - Full order flow
           └──────────────────┘     - Payment integration
         ┌────────────────────────┐ - Fulfillment process
         │  Integration Tests     │  ← API routes & services (Medium)
         │    ~30 tests           │     - Order creation API
         └────────────────────────┘     - Payment webhooks
       ┌──────────────────────────────┐ - Fulfillment API
       │      Unit Tests              │  ← Functions & utilities (Fast)
       │      ~50 tests               │     - Utilities
       └──────────────────────────────┘     - Validators
                                             - Formatters
```

### Test Coverage Goals

| Layer | Coverage Target | Execution Time | Priority |
|-------|----------------|----------------|----------|
| Unit Tests | 80% | < 10 seconds | High |
| Integration Tests | 70% | < 30 seconds | High |
| E2E Tests | Critical paths | < 5 minutes | Critical |

### Testing Philosophy

1. **Fast Feedback Loop:** Unit tests run on every save
2. **Comprehensive Integration:** All API endpoints tested
3. **Real-world E2E:** Complete user journeys with actual services
4. **Production-like Testing:** Use production EasyParcel API with test account
5. **Data Integrity:** Verify data flow from checkout → database → fulfillment

---

## EasyParcel Production API Testing

### ⚠️ Important: Sandbox Issues

**Problem:** EasyParcel sandbox environment is unreliable and may not respond correctly.

**Solution:** Use **production API with a dedicated test account** for testing.

### Production API Testing Strategy

#### 1. Test Account Setup

**Create dedicated EasyParcel test account:**
```
Account Name: [Your Company] - Testing
Purpose: Automated and manual testing
Environment: Production
```

**Recommended Setup:**
- Separate account from production operations
- Minimal credit balance (RM 50 - RM 100)
- Enabled for all courier services you plan to support
- WhatsApp notifications enabled for testing

#### 2. Test Credentials Management

**Environment Variables:**
```bash
# .env.test
EASYPARCEL_API_KEY="your-test-account-api-key"
EASYPARCEL_ENVIRONMENT="production"  # Use production, not sandbox
EASYPARCEL_TEST_MODE="true"          # Flag to indicate testing context
```

**Security Considerations:**
- ✅ Store test credentials in `.env.test` (gitignored)
- ✅ Never commit API keys to version control
- ✅ Use separate keys for CI/CD pipelines
- ✅ Rotate keys regularly
- ⚠️ Monitor test account balance

#### 3. Testing Approach with Production API

**Strategy: Controlled Real Transactions**

Instead of mocking, perform actual API calls with safety measures:

```typescript
// tests/helpers/easyparcel-test-client.ts
import { createEasyParcelService } from '@/lib/shipping/easyparcel-service';

export function createTestEasyParcelClient() {
  const settings = {
    apiKey: process.env.EASYPARCEL_API_KEY!,
    environment: 'production' as const,
    businessName: 'Test Business',
    phone: '+60123456789',
    addressLine1: 'Test Address',
    city: 'Kuala Lumpur',
    state: 'Selangor',
    postalCode: '50000',
    country: 'MY',
    whatsappNotificationsEnabled: true
  };

  return createEasyParcelService(settings);
}

export async function ensureSufficientBalance(minimumBalance = 50) {
  const client = createTestEasyParcelClient();
  const balanceResponse = await client.getBalance();

  if (balanceResponse.data.balance < minimumBalance) {
    throw new Error(
      `Insufficient test account balance: RM ${balanceResponse.data.balance}. ` +
      `Minimum required: RM ${minimumBalance}. Please top up test account.`
    );
  }

  return balanceResponse.data.balance;
}
```

#### 4. Test Data for Production API

**Use consistent test addresses:**

```typescript
// tests/fixtures/test-addresses.ts
export const TEST_SHIPPING_ADDRESSES = {
  // Klang Valley - Fast delivery
  kualaLumpur: {
    firstName: 'Test',
    lastName: 'Customer',
    addressLine1: 'Unit 1-1, Test Building',
    addressLine2: 'Jalan Test',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
    postalCode: '50000',
    country: 'MY',
    phone: '+60123456789',
    email: 'test@example.com'
  },

  // East Malaysia - Longer delivery
  sarawak: {
    firstName: 'Test',
    lastName: 'Customer',
    addressLine1: 'Lot 123, Test Street',
    city: 'Kuching',
    state: 'Sarawak',
    postalCode: '93000',
    country: 'MY',
    phone: '+60123456789',
    email: 'test@example.com'
  },

  // Invalid address for error testing
  invalid: {
    firstName: 'Test',
    lastName: 'Invalid',
    addressLine1: 'Invalid Address',
    city: 'Invalid City',
    state: 'Invalid State',
    postalCode: '00000',  // Invalid postcode
    country: 'MY',
    phone: '+60123456789',
    email: 'test@example.com'
  }
};
```

#### 5. Cost Management for Testing

**Minimize Testing Costs:**

```typescript
// tests/helpers/cost-safe-testing.ts

/**
 * Rate checking is FREE - use extensively
 */
export async function testRateChecking() {
  const client = createTestEasyParcelClient();

  // This doesn't cost anything
  const rates = await client.getRates(
    TEST_PICKUP_ADDRESS,
    TEST_SHIPPING_ADDRESSES.kualaLumpur,
    1.0 // 1kg
  );

  return rates;
}

/**
 * Shipment booking COSTS MONEY - use sparingly
 * Only run when explicitly needed
 */
export async function testShipmentBooking(skipIfCIEnvironment = true) {
  // Skip expensive tests in CI unless explicitly enabled
  if (skipIfCIEnvironment && process.env.CI && !process.env.RUN_PAID_TESTS) {
    console.log('⏭️  Skipping paid test in CI environment');
    return null;
  }

  console.log('💰 WARNING: This test will create a real shipment and charge your account');

  await ensureSufficientBalance(50);

  const client = createTestEasyParcelClient();

  // Create shipment
  const shipment = await client.createShipment({
    service_id: 'cheapest-available-service',
    reference: `TEST-${Date.now()}`,
    pickup: TEST_PICKUP_ADDRESS,
    delivery: TEST_SHIPPING_ADDRESSES.kualaLumpur,
    parcel: {
      weight: 0.5  // Use smallest weight to minimize cost
    },
    addon_whatsapp_tracking_enabled: 0  // Disable to save cost
  });

  console.log(`✅ Test shipment created: ${shipment.data.tracking_number}`);
  console.log(`💵 Estimated cost: RM ${shipment.data.price || 'Unknown'}`);

  return shipment;
}
```

#### 6. Test Categorization

**Tag tests by cost:**

```typescript
// Playwright test example
test.describe('EasyParcel Integration', () => {

  test('fetch shipping rates @free @smoke', async ({ page }) => {
    // FREE test - run always
    const rates = await testRateChecking();
    expect(rates.length).toBeGreaterThan(0);
  });

  test('book shipment @paid @manual', async ({ page }) => {
    // PAID test - run manually only
    test.skip(!process.env.RUN_PAID_TESTS, 'Skipping paid test');

    const shipment = await testShipmentBooking(false);
    expect(shipment?.data.tracking_number).toBeDefined();
  });
});
```

**Run specific test categories:**
```bash
# Run only free tests (default)
npm run test:e2e -- --grep @free

# Run paid tests (manual testing only)
RUN_PAID_TESTS=true npm run test:e2e -- --grep @paid
```

#### 7. Monitoring & Alerts

**Balance Monitoring:**

```typescript
// tests/helpers/balance-monitor.ts
export async function checkAndAlertBalance() {
  const client = createTestEasyParcelClient();
  const balance = await client.getBalance();

  if (balance.data.balance < 20) {
    console.error(`
      ⚠️  WARNING: EasyParcel test account balance is low!
      Current balance: RM ${balance.data.balance}
      Please top up to continue testing.
    `);

    // Optional: Send Slack/email alert
    // await sendLowBalanceAlert(balance.data.balance);
  }

  return balance.data.balance;
}
```

**Before test suite:**
```typescript
// tests/e2e/setup/global-setup.ts
import { checkAndAlertBalance } from '../helpers/balance-monitor';

async function globalSetup(config: FullConfig) {
  // Check balance before running tests
  await checkAndAlertBalance();

  // ... rest of setup
}
```

#### 8. Cleanup Strategy

**Important: Track test shipments for cleanup**

```typescript
// tests/helpers/shipment-tracker.ts
import fs from 'fs';

const SHIPMENT_LOG = 'tests/data/test-shipments.json';

export function logTestShipment(shipmentData: {
  trackingNumber: string;
  orderId: string;
  createdAt: string;
  cost: number;
}) {
  const shipments = getTestShipments();
  shipments.push(shipmentData);
  fs.writeFileSync(SHIPMENT_LOG, JSON.stringify(shipments, null, 2));
}

export function getTestShipments() {
  if (!fs.existsSync(SHIPMENT_LOG)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(SHIPMENT_LOG, 'utf-8'));
}

export function calculateTestCosts() {
  const shipments = getTestShipments();
  const totalCost = shipments.reduce((sum, s) => sum + s.cost, 0);

  console.log(`
    📊 Test Shipment Summary:
    - Total shipments: ${shipments.length}
    - Total cost: RM ${totalCost.toFixed(2)}
  `);

  return { shipments, totalCost };
}
```

### Production API Testing Best Practices

✅ **DO:**
- Use production API with dedicated test account
- Run rate checking tests frequently (they're free)
- Monitor test account balance
- Log all test shipments for cost tracking
- Use smallest weights and cheapest couriers
- Tag paid tests separately
- Skip paid tests in CI/CD by default

❌ **DON'T:**
- Use production account for testing
- Create shipments without balance checks
- Run paid tests in CI without explicit flag
- Commit API keys to repository
- Test with expensive couriers unnecessarily
- Create shipments without logging

---

## Unit Tests Specification

### Test Structure

```
src/
├── lib/
│   ├── utils/
│   │   └── __tests__/
│   │       ├── order.test.ts
│   │       ├── currency.test.ts
│   │       └── date.test.ts
│   ├── shipping/
│   │   └── __tests__/
│   │       ├── weight-utils.test.ts
│   │       └── validation.test.ts
│   └── payments/
│       └── __tests__/
│           └── payment-router.test.ts
```

### 1. Order Utilities Tests

**File:** `src/lib/utils/__tests__/order.test.ts`

```typescript
import {
  formatCurrency,
  formatOrderDate,
  getStatusBadge,
  canFulfillOrder,
  hasTracking,
  getCustomerName,
  getTotalItemsCount
} from '../order';

describe('Order Utilities', () => {
  describe('formatCurrency', () => {
    it('formats Malaysian Ringgit correctly', () => {
      expect(formatCurrency(100)).toBe('RM 100.00');
      expect(formatCurrency(99.99)).toBe('RM 99.99');
      expect(formatCurrency(1000)).toBe('RM 1,000.00');
    });

    it('handles Decimal type from Prisma', () => {
      const decimal = new Decimal('150.50');
      expect(formatCurrency(decimal)).toBe('RM 150.50');
    });

    it('handles zero and negative values', () => {
      expect(formatCurrency(0)).toBe('RM 0.00');
      expect(formatCurrency(-50)).toBe('-RM 50.00');
    });
  });

  describe('getStatusBadge', () => {
    it('returns correct config for order status', () => {
      const badge = getStatusBadge('CONFIRMED', 'order');
      expect(badge.label).toBe('Confirmed');
      expect(badge.color).toBe('green');
      expect(badge.icon).toBeDefined();
    });

    it('returns correct config for payment status', () => {
      const badge = getStatusBadge('PAID', 'payment');
      expect(badge.label).toBe('Paid');
      expect(badge.color).toBe('green');
    });

    it('returns default config for unknown status', () => {
      const badge = getStatusBadge('INVALID', 'order');
      expect(badge.label).toBe('INVALID');
      expect(badge.color).toBe('gray');
    });
  });

  describe('canFulfillOrder', () => {
    it('returns true for paid order without shipment', () => {
      const order = {
        paymentStatus: 'PAID',
        shipment: null
      };
      expect(canFulfillOrder(order)).toBe(true);
    });

    it('returns false if payment not completed', () => {
      const order = {
        paymentStatus: 'PENDING',
        shipment: null
      };
      expect(canFulfillOrder(order)).toBe(false);
    });

    it('returns false if already fulfilled', () => {
      const order = {
        paymentStatus: 'PAID',
        shipment: { id: 'ship_123' }
      };
      expect(canFulfillOrder(order)).toBe(false);
    });
  });

  describe('getCustomerName', () => {
    it('returns full name for registered user', () => {
      const order = {
        user: { firstName: 'John', lastName: 'Tan' },
        guestEmail: null
      };
      expect(getCustomerName(order)).toBe('John Tan');
    });

    it('returns guest email for guest order', () => {
      const order = {
        user: null,
        guestEmail: 'guest@example.com'
      };
      expect(getCustomerName(order)).toBe('Guest (guest@example.com)');
    });

    it('returns Unknown Customer as fallback', () => {
      const order = {
        user: null,
        guestEmail: null
      };
      expect(getCustomerName(order)).toBe('Unknown Customer');
    });
  });

  describe('getTotalItemsCount', () => {
    it('calculates total quantity correctly', () => {
      const items = [
        { quantity: 2 },
        { quantity: 3 },
        { quantity: 1 }
      ];
      expect(getTotalItemsCount(items)).toBe(6);
    });

    it('handles empty array', () => {
      expect(getTotalItemsCount([])).toBe(0);
    });
  });
});
```

### 2. Shipping Weight Utilities Tests

**File:** `src/lib/shipping/__tests__/weight-utils.test.ts`

```typescript
import {
  calculateTotalWeight,
  validateWeight,
  roundWeight
} from '../utils/weight-utils';

describe('Weight Utilities', () => {
  describe('calculateTotalWeight', () => {
    it('calculates weight from cart items', () => {
      const items = [
        { product: { weight: 1.5 }, quantity: 2 },
        { product: { weight: 0.5 }, quantity: 1 }
      ];
      expect(calculateTotalWeight(items)).toBe(3.5);
    });

    it('handles missing weight with default', () => {
      const items = [
        { product: { weight: null }, quantity: 1 }
      ];
      expect(calculateTotalWeight(items)).toBe(0.5); // Default weight
    });

    it('rounds to 2 decimal places', () => {
      const items = [
        { product: { weight: 1.234 }, quantity: 1 }
      ];
      expect(calculateTotalWeight(items)).toBe(1.23);
    });
  });

  describe('validateWeight', () => {
    it('accepts valid weight', () => {
      expect(validateWeight(5.0)).toEqual({ valid: true, weight: 5.0 });
    });

    it('rejects negative weight', () => {
      const result = validateWeight(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('rejects zero weight', () => {
      const result = validateWeight(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than zero');
    });

    it('rejects excessive weight', () => {
      const result = validateWeight(1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum');
    });
  });
});
```

### 3. Payment Router Tests

**File:** `src/lib/payments/__tests__/payment-router.test.ts`

```typescript
import { paymentRouter } from '../payment-router';

describe('Payment Router', () => {
  describe('createPayment', () => {
    it('routes to ToyyibPay when specified', async () => {
      const result = await paymentRouter.createPayment({
        orderNumber: 'ORD-123',
        customerInfo: {
          name: 'John Tan',
          email: 'john@example.com',
          phone: '+60123456789'
        },
        amount: 100.00,
        description: 'Test Order',
        paymentMethod: 'TOYYIBPAY'
      });

      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBe('TOYYIBPAY');
      expect(result.paymentUrl).toContain('toyyibpay');
    });

    it('validates required fields', async () => {
      const result = await paymentRouter.createPayment({
        orderNumber: '',
        customerInfo: {
          name: '',
          email: 'invalid-email',
          phone: ''
        },
        amount: 0,
        description: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

**Total Unit Tests: ~50 tests covering all utilities**

---

## Integration Tests Specification

### Test Structure

```
src/
└── __tests__/
    └── api/
        ├── orders.integration.test.ts
        ├── webhooks-toyyibpay.integration.test.ts
        └── admin/
            └── fulfill.integration.test.ts
```

### 1. Order Creation API Tests

**File:** `src/__tests__/api/orders.integration.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/orders/route';
import { prisma } from '@/lib/db/prisma';

describe('POST /api/orders', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany();
  });

  it('creates order with correct shipping data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cartItems: [
          { productId: 'prod_123', quantity: 2 }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Tan',
          addressLine1: '123 Main St',
          city: 'Kuala Lumpur',
          state: 'Selangor',
          postalCode: '50000',
          country: 'MY',
          phone: '+60123456789',
          email: 'john@example.com'
        },
        selectedShipping: {
          serviceId: 'service-123',
          courierName: 'Pos Laju',
          courierServiceType: 'Standard',
          cost: 15.00,
          estimatedDelivery: '2-3 days',
          weight: 1.5
        },
        paymentMethod: 'TOYYIBPAY'
      }
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.order.selectedCourierServiceId).toBe('service-123');
    expect(data.order.courierName).toBe('Pos Laju');
    expect(data.order.shippingWeight).toBe(1.5);
  });

  it('validates required shipping fields', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        cartItems: [],
        shippingAddress: {},
        selectedShipping: null
      }
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('stores calculated weight correctly', async () => {
    // Test implementation
  });

  it('prevents order creation without payment method', async () => {
    // Test implementation
  });

  it('handles guest checkout correctly', async () => {
    // Test implementation
  });
});
```

### 2. Payment Webhook Tests

**File:** `src/__tests__/api/webhooks-toyyibpay.integration.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/webhooks/toyyibpay/route';
import { prisma } from '@/lib/db/prisma';

describe('POST /api/webhooks/toyyibpay', () => {
  let testOrder: any;

  beforeEach(async () => {
    // Create test order
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        total: 165.00,
        toyyibpayBillCode: 'TEST-BILL-123',
        // ... other fields
      }
    });
  });

  it('updates order status on successful payment', async () => {
    const webhookPayload = new URLSearchParams({
      refno: 'REF123',
      status: '1', // Success
      billcode: testOrder.toyyibpayBillCode,
      order_id: testOrder.orderNumber,
      amount: '16500', // RM 165.00 in cents
      transaction_time: new Date().toISOString()
    });

    const { req } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: webhookPayload.toString()
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);

    // Verify order updated
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id }
    });
    expect(updatedOrder?.status).toBe('CONFIRMED');
    expect(updatedOrder?.paymentStatus).toBe('PAID');
  });

  it('activates membership after payment', async () => {
    // Test implementation
  });

  it('reserves inventory after payment', async () => {
    // Test implementation
  });

  it('rejects invalid webhook signatures', async () => {
    // Test implementation
  });

  it('handles duplicate webhook calls idempotently', async () => {
    // Test implementation
  });
});
```

### 3. Fulfillment API Tests

**File:** `src/__tests__/api/admin/orders/fulfill.integration.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/admin/orders/[orderId]/fulfill/route';
import { prisma } from '@/lib/db/prisma';
import { createTestEasyParcelClient } from '@/tests/helpers/easyparcel-test-client';

describe('POST /api/admin/orders/[orderId]/fulfill', () => {
  let testOrder: any;
  let easyParcelClient: any;

  beforeEach(async () => {
    easyParcelClient = createTestEasyParcelClient();

    // Create paid order
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        total: 115.00,
        selectedCourierServiceId: 'test-service-123',
        shippingWeight: 1.5,
        // ... other fields
      }
    });
  });

  it('books shipment with EasyParcel successfully @free', async () => {
    // This test uses real EasyParcel API for rate checking (free)
    const rates = await easyParcelClient.getRates(
      TEST_PICKUP_ADDRESS,
      TEST_SHIPPING_ADDRESS,
      1.5
    );

    expect(rates.length).toBeGreaterThan(0);
    expect(rates[0].service_id).toBeDefined();
  });

  it('validates order is PAID before fulfillment', async () => {
    // Update order to PENDING
    await prisma.order.update({
      where: { id: testOrder.id },
      data: { paymentStatus: 'PENDING' }
    });

    const { req } = createMocks({
      method: 'POST',
      body: {
        serviceId: 'test-service-123',
        pickupDate: '2025-10-11'
      }
    });

    const response = await POST(req as any, {
      params: { orderId: testOrder.id }
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('Payment not confirmed');
  });

  it('stores tracking number correctly @paid @manual', async () => {
    // Skip in CI unless explicitly enabled
    test.skip(!process.env.RUN_PAID_TESTS, 'Skipping paid test');

    // This creates a real shipment - costs money!
    const { req } = createMocks({
      method: 'POST',
      body: {
        serviceId: 'cheapest-service-id',
        pickupDate: getTomorrowDate()
      }
    });

    const response = await POST(req as any, {
      params: { orderId: testOrder.id }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.tracking.trackingNumber).toBeDefined();
  });

  it('handles insufficient EasyParcel balance', async () => {
    // Test implementation with mocked error
  });

  it('tracks failed booking attempts', async () => {
    // Test implementation
  });
});
```

**Total Integration Tests: ~30 tests covering all API routes**

---

## End-to-End Tests Specification

### Test Structure

```
tests/
└── e2e/
    ├── specs/
    │   ├── order-flow-complete.spec.ts
    │   ├── order-payment-failure.spec.ts
    │   ├── order-fulfillment-errors.spec.ts
    │   └── order-guest-checkout.spec.ts
    ├── helpers/
    │   ├── auth-helpers.ts
    │   ├── database-helpers.ts
    │   ├── webhook-simulator.ts
    │   └── easyparcel-test-client.ts
    └── fixtures/
        ├── test-addresses.ts
        └── test-products.ts
```

### 1. Complete Order Flow Test

**File:** `tests/e2e/specs/order-flow-complete.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAsCustomer,
  simulatePaymentWebhook,
  getLatestOrderNumber
} from '../helpers';
import { TEST_SHIPPING_ADDRESSES } from '../fixtures/test-addresses';

test.describe('Complete Order Flow', () => {
  test('customer can complete order from cart to fulfillment @smoke', async ({ page }) => {
    // 1. Login as customer
    await loginAsCustomer(page, 'test@example.com', 'password123');

    // 2. Add product to cart
    await page.goto('/products');
    await page.click('button:has-text("Add to Cart")').first();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // 3. Proceed to checkout
    await page.goto('/cart');
    await page.click('button:has-text("Checkout")');

    // 4. Fill shipping address
    const address = TEST_SHIPPING_ADDRESSES.kualaLumpur;
    await page.fill('[name="shippingAddress.firstName"]', address.firstName);
    await page.fill('[name="shippingAddress.lastName"]', address.lastName);
    await page.fill('[name="shippingAddress.addressLine1"]', address.addressLine1);
    await page.fill('[name="shippingAddress.city"]', address.city);
    await page.selectOption('[name="shippingAddress.state"]', address.state);
    await page.fill('[name="shippingAddress.postalCode"]', address.postalCode);
    await page.fill('[name="shippingAddress.phone"]', address.phone);

    // 5. Wait for shipping rates to load (real EasyParcel API)
    await expect(page.locator('[data-testid="shipping-options"]'))
      .toBeVisible({ timeout: 15000 });

    // 6. Verify shipping options loaded
    const shippingOptions = await page.locator('[data-testid="shipping-option"]').count();
    expect(shippingOptions).toBeGreaterThan(0);

    // 7. Select first shipping option
    await page.click('[data-testid="shipping-option"]').first();

    // 8. Select payment method
    await page.click('[data-testid="payment-method-toyyibpay"]');

    // 9. Submit order
    await page.click('button:has-text("Place Order")');

    // 10. Wait for redirect to payment or success page
    await page.waitForURL(/payment|thank-you/, { timeout: 10000 });

    // 11. Get order number
    const orderNumber = await getLatestOrderNumber();
    console.log(`📦 Order created: ${orderNumber}`);

    // 12. Simulate successful payment webhook
    await simulatePaymentWebhook(orderNumber, 'SUCCESS');

    // 13. Login as admin
    await loginAsAdmin(page);

    // 14. Navigate to orders
    await page.goto('/admin/orders');

    // 15. Find order in processing tab
    await page.click('button:has-text("Processing")');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();

    // 16. Click order to view details
    await page.click(`text=${orderNumber}`);

    // 17. Verify order status is CONFIRMED
    await expect(page.locator('[data-testid="order-status"]'))
      .toContainText('Confirmed');

    // 18. Verify payment status is PAID
    await expect(page.locator('[data-testid="payment-status"]'))
      .toContainText('Paid');

    // 19. Click Fulfill Order
    await page.click('button:has-text("Fulfill Order")');

    // 20. Select pickup date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];
    await page.fill('[name="pickupDate"]', pickupDate);

    // 21. Submit fulfillment (creates real shipment - use @manual tag)
    if (process.env.RUN_PAID_TESTS) {
      await page.click('button:has-text("Book Shipment")');

      // 22. Wait for success message
      await expect(page.locator('text=Shipment booked successfully'))
        .toBeVisible({ timeout: 30000 });

      // 23. Verify tracking number appears
      await expect(page.locator('[data-testid="tracking-number"]'))
        .toBeVisible();

      // 24. Verify AWB download link
      await expect(page.locator('[data-testid="download-awb"]'))
        .toBeVisible();

      console.log('✅ Complete order flow test passed with real shipment');
    } else {
      console.log('⏭️  Skipping paid shipment booking in test environment');
    }
  });
});
```

### 2. Payment Failure Test

**File:** `tests/e2e/specs/order-payment-failure.spec.ts`

```typescript
test('handles payment failure gracefully', async ({ page }) => {
  // 1-9: Create order (same as above)

  const orderNumber = await getLatestOrderNumber();

  // 10. Simulate failed payment webhook
  await simulatePaymentWebhook(orderNumber, 'FAILED');

  // 11. Login as admin and navigate to order
  await loginAsAdmin(page);
  await page.goto('/admin/orders');

  // 12. Verify order in awaiting payment tab
  await page.click('button:has-text("Awaiting Payment")');
  await expect(page.locator(`text=${orderNumber}`)).toBeVisible();

  // 13. Click to view details
  await page.click(`text=${orderNumber}`);

  // 14. Verify payment status shows FAILED
  await expect(page.locator('[data-testid="payment-status"]'))
    .toContainText('Failed');

  // 15. Verify fulfill button is disabled
  await expect(page.locator('button:has-text("Fulfill Order")'))
    .toBeDisabled();
});
```

### 3. Guest Checkout Test

**File:** `tests/e2e/specs/order-guest-checkout.spec.ts`

```typescript
test('guest can complete checkout', async ({ page }) => {
  // Don't login - proceed as guest

  // 1. Add product to cart
  await page.goto('/products');
  await page.click('button:has-text("Add to Cart")').first();

  // 2. Go to checkout
  await page.goto('/cart');
  await page.click('button:has-text("Checkout")');

  // 3. Fill guest email
  await page.fill('[name="guestEmail"]', 'guest@example.com');

  // 4-8: Same shipping/payment flow

  // 9. Verify order created
  const orderNumber = await getLatestOrderNumber();

  // 10. Verify in database that order has guestEmail
  const order = await getOrderByNumber(orderNumber);
  expect(order.guestEmail).toBe('guest@example.com');
  expect(order.userId).toBeNull();
});
```

**Total E2E Tests: ~15 comprehensive scenarios**

---

## Test Data Management

### Database Setup

**File:** `tests/helpers/database-helpers.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resetTestDatabase() {
  // Clean in correct order (foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  // Create test admin
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
      firstName: 'Test',
      lastName: 'Admin'
    }
  });

  // Create test customer
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: await hashPassword('password123'),
      role: 'CUSTOMER',
      firstName: 'Test',
      lastName: 'Customer'
    }
  });

  // Create test products
  await prisma.product.createMany({
    data: [
      {
        name: 'Test Product 1',
        sku: 'TEST-001',
        regularPrice: 100.00,
        memberPrice: 80.00,
        stockQuantity: 100,
        weight: 1.5,
        status: 'ACTIVE',
        isQualifyingForMembership: true
      },
      {
        name: 'Test Product 2',
        sku: 'TEST-002',
        regularPrice: 50.00,
        memberPrice: 40.00,
        stockQuantity: 50,
        weight: 0.5,
        status: 'ACTIVE',
        isQualifyingForMembership: true
      }
    ]
  });
}

export async function createPaidOrder() {
  // Helper to create order ready for fulfillment
  const product = await prisma.product.findFirst();

  return await prisma.order.create({
    data: {
      orderNumber: `TEST-${Date.now()}`,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      subtotal: 100.00,
      shippingCost: 15.00,
      total: 115.00,
      paymentMethod: 'TOYYIBPAY',
      selectedCourierServiceId: 'test-service-123',
      courierName: 'Pos Laju',
      courierServiceType: 'Standard',
      shippingWeight: 1.5,
      orderItems: {
        create: [{
          productId: product!.id,
          quantity: 1,
          regularPrice: 100.00,
          appliedPrice: 100.00,
          totalPrice: 100.00,
          productName: product!.name,
          productSku: product!.sku
        }]
      },
      shippingAddress: {
        create: TEST_SHIPPING_ADDRESSES.kualaLumpur
      }
    }
  });
}

export async function getLatestOrderNumber(): Promise<string> {
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true }
  });
  return order!.orderNumber;
}
```

---

## Test Execution Plan

### Phase 1: Unit Tests (Week 1)

**Goal:** Establish foundation with fast, reliable unit tests

**Tasks:**
1. ✅ Create order utilities tests
2. ✅ Create shipping weight tests
3. ✅ Create payment router tests
4. ✅ Achieve 80% coverage on utilities

**Commands:**
```bash
# Development mode
npm run test:watch

# Full run with coverage
npm run test:coverage

# Specific file
npm run test -- order.test.ts
```

**Success Metrics:**
- All unit tests passing
- Coverage ≥ 80%
- Execution time < 10 seconds

### Phase 2: Integration Tests (Week 2)

**Goal:** Validate API routes and database operations

**Tasks:**
1. ✅ Set up test database
2. ✅ Create order API tests
3. ✅ Create webhook tests
4. ✅ Create fulfillment API tests (without paid calls)

**Commands:**
```bash
# Run integration tests
npm run test -- --testPathPattern=integration

# With database reset
npm run db:reset && npm run test -- integration
```

**Success Metrics:**
- All integration tests passing
- Database operations validated
- Execution time < 30 seconds

### Phase 3: E2E Tests - Free Tests (Week 3)

**Goal:** Test complete flows using free API calls only

**Tasks:**
1. ✅ Complete order flow (up to fulfillment screen)
2. ✅ Payment failure scenarios
3. ✅ Guest checkout
4. ✅ Shipping rate calculation

**Commands:**
```bash
# Run free E2E tests only
npm run test:e2e -- --grep @free

# With UI
npm run test:e2e:ui -- --grep @free
```

**Success Metrics:**
- All free tests passing
- No EasyParcel charges incurred
- Execution time < 5 minutes

### Phase 4: Manual Paid Testing (Week 4)

**Goal:** Verify fulfillment with real shipment booking

**Tasks:**
1. ✅ Check EasyParcel test account balance
2. ✅ Run paid tests manually
3. ✅ Verify AWB generation
4. ✅ Track test costs

**Commands:**
```bash
# Check balance first
npm run test:e2e -- tests/helpers/check-balance.spec.ts

# Run paid tests manually
RUN_PAID_TESTS=true npm run test:e2e -- --grep @paid
```

**Success Metrics:**
- Real shipment created
- AWB downloaded successfully
- Tracking number verified
- Costs logged

---

## Success Criteria

### Overall Testing Goals

✅ **Coverage**
- Unit tests: ≥ 80% coverage
- Integration tests: ≥ 70% coverage
- E2E tests: All critical paths covered

✅ **Quality**
- Zero test flakiness
- All tests reproducible
- Clear error messages

✅ **Performance**
- Unit tests: < 10 seconds
- Integration tests: < 30 seconds
- E2E tests (free): < 5 minutes

✅ **Cost Management**
- Free tests run in CI/CD
- Paid tests manual only
- Monthly test costs < RM 100

### Test Confidence Levels

**High Confidence (Run Always):**
- Unit tests
- Integration tests
- Free E2E tests

**Medium Confidence (Run on Demand):**
- Paid fulfillment tests
- Cross-browser E2E

**Manual Verification:**
- Production EasyParcel integration
- Email delivery
- Actual courier pickup

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test -- integration

  e2e-free-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e -- --grep @free
```

---

## Document Version

**Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** Complete ✅

**Next Steps:**
1. Review and approve testing plan
2. Set up EasyParcel test account
3. Begin Phase 1: Unit Tests
4. Implement test infrastructure
