## Code Quality & Best Practices

This section ensures our implementation follows software engineering best practices, maintainability standards, and produces clean, scalable code.

---

### TypeScript Best Practices

**1. Type Safety**

```typescript
// ✅ GOOD: Strict typing with interfaces
interface ShippingRate {
  serviceId: string;
  courierName: string;
  cost: number;
  estimatedDays: string;
}

async function calculateShipping(address: DeliveryAddress): Promise<ShippingRate[]> {
  // Implementation
}

// ❌ BAD: Using 'any' or loose typing
async function calculateShipping(address: any): Promise<any> {
  // Implementation
}
```

**2. Null Safety**

```typescript
// ✅ GOOD: Proper null handling
interface Order {
  trackingNumber: string | null;
  awbNumber: string | null;
}

function getTrackingUrl(order: Order): string | null {
  return order.trackingNumber
    ? `https://track.easyparcel.com/${order.trackingNumber}`
    : null;
}

// ❌ BAD: Assuming values exist
function getTrackingUrl(order: Order): string {
  return `https://track.easyparcel.com/${order.trackingNumber}`; // Crash if null!
}
```

**3. Enum Usage for Constants**

```typescript
// ✅ GOOD: Type-safe enums
enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  READY_TO_SHIP = 'READY_TO_SHIP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED'
}

// Usage
if (order.status === OrderStatus.PAID) {
  // Safe, autocomplete works
}

// ❌ BAD: String literals everywhere
if (order.status === 'paid') { // Typo-prone, no autocomplete
  // Implementation
}
```

---

### React Component Best Practices

**1. Component Structure**

```typescript
// ✅ GOOD: Clear component structure with proper typing
interface FulfillmentWidgetProps {
  orderId: string;
  orderStatus: OrderStatus;
  onSuccess?: (tracking: string) => void;
}

export default function FulfillmentWidget({
  orderId,
  orderStatus,
  onSuccess
}: FulfillmentWidgetProps) {
  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Load initial data
  }, [orderId]);

  // Event handlers
  const handleFulfill = async () => {
    // Implementation
  };

  // Render
  return (
    // JSX
  );
}
```

**2. State Management**

```typescript
// ✅ GOOD: Consolidated state with proper types
interface FulfillmentState {
  status: 'idle' | 'loading' | 'success' | 'error';
  selectedCourier?: CourierOption;
  pickupDate: Date;
  error?: FulfillmentError;
}

const [state, setState] = useState<FulfillmentState>({
  status: 'idle',
  pickupDate: getNextBusinessDay()
});

// Update state immutably
setState(prev => ({ ...prev, status: 'loading' }));

// ❌ BAD: Multiple useState for related data
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState(false); // Can't be all true/false!
```

**3. Error Boundaries**

```typescript
// ✅ GOOD: Wrap critical components in error boundaries
<ErrorBoundary fallback={<FulfillmentErrorFallback />}>
  <FulfillmentWidget orderId={order.id} />
</ErrorBoundary>
```

**4. Loading States**

```typescript
// ✅ GOOD: Clear loading indicators
{loading ? (
  <LoadingSpinner message="Booking shipment..." />
) : (
  <button onClick={handleFulfill}>Book Shipment</button>
)}

// ❌ BAD: No loading feedback
<button onClick={handleFulfill}>Book Shipment</button>
```

---

### API Integration Best Practices

**1. Centralized API Client**

```typescript
// ✅ GOOD: Single source of truth for API calls
// src/lib/shipping/easyparcel-client.ts

class EasyParcelClient {
  private baseUrl: string;
  private apiKey: string;

  async getShippingRates(params: RateParams): Promise<ShippingRate[]> {
    const response = await fetch(`${this.baseUrl}/rates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new EasyParcelError(await response.json());
    }

    return response.json();
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
}

export const easyParcel = new EasyParcelClient();

// ❌ BAD: Scattered fetch calls throughout codebase
// Multiple places with different error handling, headers, etc.
```

**2. Error Handling Pattern**

```typescript
// ✅ GOOD: Custom error class with structured data
class EasyParcelError extends Error {
  constructor(
    public code: string,
    public details: unknown,
    public retryable: boolean = false
  ) {
    super(`EasyParcel Error: ${code}`);
    this.name = 'EasyParcelError';
  }
}

// Usage in API route
try {
  const result = await easyParcel.createShipment(data);
  return NextResponse.json({ success: true, result });
} catch (error) {
  if (error instanceof EasyParcelError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable
      }
    }, { status: 502 });
  }

  // Unknown error
  return NextResponse.json({
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
  }, { status: 500 });
}
```

**3. Response Validation**

```typescript
// ✅ GOOD: Validate API responses with Zod
import { z } from 'zod';

const ShippingRateSchema = z.object({
  service_id: z.string(),
  courier_name: z.string(),
  cost: z.number().positive(),
  estimated_days: z.string()
});

const response = await easyParcel.getShippingRates(params);
const validated = ShippingRateSchema.array().parse(response);

// ❌ BAD: Trust API responses blindly
const response = await easyParcel.getShippingRates(params);
// What if courier_name is missing? Code crashes later!
```

**4. Product Weight Validation (GAP #2 RESOLVED)**

```typescript
// ✅ GOOD: Validate product weight on creation/update
import { z } from 'zod';

// Product creation/update schema
const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be greater than 0"),
  weight: z.number()
    .positive("Weight must be greater than 0")
    .min(0.01, "Weight must be at least 0.01 kg")
    .max(1000, "Weight cannot exceed 1000 kg"),
  // ... other fields
});

// API Route: src/app/api/admin/products/create/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Validate with Zod
  const validation = ProductSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      errors: validation.error.flatten().fieldErrors
    }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: validation.data
  });

  return NextResponse.json({ success: true, product });
}

// ❌ BAD: No weight validation
const product = await prisma.product.create({
  data: {
    weight: 0 // This will cause shipping calculation failures!
  }
});
```

**Frontend Validation (Product Form):**
```typescript
// src/app/admin/products/create/page.tsx

const [formData, setFormData] = useState({
  name: '',
  price: 0,
  weight: 0.1, // Default to 0.1 kg (not 0)
  // ... other fields
});

const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name) {
    newErrors.name = 'Product name is required';
  }

  if (formData.price <= 0) {
    newErrors.price = 'Price must be greater than RM 0';
  }

  // CRITICAL: Validate weight > 0
  if (formData.weight <= 0) {
    newErrors.weight = 'Weight must be greater than 0 kg';
  } else if (formData.weight < 0.01) {
    newErrors.weight = 'Weight must be at least 0.01 kg (10 grams)';
  } else if (formData.weight > 1000) {
    newErrors.weight = 'Weight cannot exceed 1000 kg';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return; // Show errors to user
  }

  // Proceed with API call
  const response = await fetch('/api/admin/products/create', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  // ... handle response
};

return (
  <form>
    <label>Weight (kg) *</label>
    <input
      type="number"
      step="0.01"
      min="0.01"
      max="1000"
      value={formData.weight}
      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
    />
    {errors.weight && <span className="error">{errors.weight}</span>}

    <p className="help-text">
      Enter product weight in kilograms (e.g., 0.5 for 500g, 2.5 for 2.5kg)
    </p>
  </form>
);
```

**Database Constraint (Additional Safety):**
```prisma
// prisma/schema.prisma

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Decimal  @db.Decimal(10, 2)
  weight      Decimal  @db.Decimal(8, 2)  // NOT nullable - required

  // ... other fields

  @@check([weight > 0], name: "product_weight_positive")
}
```

**Migration:**
```bash
# Add database-level constraint
npx prisma migrate dev --name add_product_weight_constraint
```

**Why This Matters:**
- ❌ Without validation: Products with weight = 0 → Shipping calculation fails → Checkout broken
- ✅ With validation: All products guaranteed to have valid weight → Shipping always calculates correctly

---

### Database Best Practices

**1. Prisma Transaction Usage**

```typescript
// ✅ GOOD: Use transactions for multi-step database operations
await prisma.$transaction(async (tx) => {
  // Update order
  const order = await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'READY_TO_SHIP',
      trackingNumber,
      awbNumber,
      fulfilledAt: new Date()
    }
  });

  // Create tracking event
  await tx.trackingEvent.create({
    data: {
      orderId,
      eventName: 'Shipment created',
      timestamp: new Date()
    }
  });

  return order;
});

// ❌ BAD: Separate operations (can fail halfway)
await prisma.order.update({ ... });
await prisma.trackingEvent.create({ ... }); // What if this fails?
```

**2. Indexing**

```sql
-- ✅ GOOD: Index frequently queried fields
CREATE INDEX idx_order_status ON Order(status);
CREATE INDEX idx_order_tracking ON Order(trackingNumber);
CREATE INDEX idx_order_created ON Order(createdAt DESC);

-- Performance for:
-- SELECT * FROM Order WHERE status = 'PAID';
-- SELECT * FROM Order WHERE trackingNumber = 'EPX123';
```

**3. Query Optimization**

```typescript
// ✅ GOOD: Select only needed fields
const orders = await prisma.order.findMany({
  where: { status: 'PAID' },
  select: {
    id: true,
    orderNumber: true,
    shippingAddress: true,
    selectedCourierServiceId: true
  }
});

// ❌ BAD: Select all fields when not needed
const orders = await prisma.order.findMany({
  where: { status: 'PAID' }
  // Returns 30+ fields, slows down query
});
```

---

### Error Handling Standards

**1. Graceful Degradation**

```typescript
// ✅ GOOD: Provide fallback when EasyParcel API fails
async function getAvailableCouriers(orderId: string) {
  try {
    const couriers = await easyParcel.getCouriers(orderId);
    return couriers;
  } catch (error) {
    console.error('Failed to fetch couriers:', error);

    // Fallback: Return customer's original selection
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { selectedCourierServiceId: true, courierName: true }
    });

    return [{
      serviceId: order.selectedCourierServiceId,
      courierName: order.courierName,
      note: 'Original customer selection (alternatives unavailable)'
    }];
  }
}
```

**2. User-Friendly Error Messages**

```typescript
// ✅ GOOD: Translate technical errors to user-friendly messages
function getUserFriendlyError(error: EasyParcelError): string {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      return 'Your EasyParcel balance is too low. Please top up your account.';
    case 'INVALID_ADDRESS':
      return 'The shipping address could not be validated. Please check for errors.';
    case 'API_TIMEOUT':
      return 'Connection timeout. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please contact support.';
  }
}

// ❌ BAD: Show technical errors to users
alert(error.message); // "ERR_CONN_REFUSED" - What does this mean?
```

---

### Testing Strategy

**1. Unit Tests (Business Logic)**

```typescript
// ✅ GOOD: Test pure functions and business logic
describe('getNextBusinessDay', () => {
  it('should skip Sunday', () => {
    const saturday = new Date('2025-10-11'); // Saturday
    const result = getNextBusinessDay(saturday);
    expect(result).toEqual(new Date('2025-10-13')); // Monday
  });

  it('should skip public holidays', () => {
    const beforeMerdeka = new Date('2025-08-30');
    const result = getNextBusinessDay(beforeMerdeka);
    expect(result).toEqual(new Date('2025-09-01')); // After Merdeka Day
  });
});
```

**2. Integration Tests (API Routes)**

```typescript
// ✅ GOOD: Test API endpoints with mocked external services
describe('POST /api/admin/orders/[id]/fulfill', () => {
  beforeEach(() => {
    mockEasyParcelAPI.mockReset();
  });

  it('should create shipment successfully', async () => {
    mockEasyParcelAPI.createShipment.mockResolvedValue({
      tracking_number: 'EPX123',
      awb_number: 'CL456'
    });

    const response = await POST(request, { params: { id: 'ord_123' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.shipment.trackingNumber).toBe('EPX123');
  });

  it('should handle insufficient balance error', async () => {
    mockEasyParcelAPI.createShipment.mockRejectedValue(
      new EasyParcelError('INSUFFICIENT_BALANCE', { balance: 5 }, true)
    );

    const response = await POST(request, { params: { id: 'ord_123' } });
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(data.error.retryable).toBe(true);
  });
});
```

**3. E2E Tests (Critical Flows)**

```typescript
// ✅ GOOD: Test complete user journeys
test('Admin can fulfill order with courier override', async ({ page }) => {
  // Login as admin
  await page.goto('/admin/orders/ord_123');

  // Wait for fulfillment widget
  await page.waitForSelector('[data-testid="fulfillment-widget"]');

  // Change courier
  await page.selectOption('[data-testid="courier-dropdown"]', { label: 'J&T Express' });

  // Select pickup date
  await page.fill('[data-testid="pickup-date"]', '2025-10-09');

  // Click fulfill
  await page.click('[data-testid="fulfill-button"]');

  // Wait for success
  await page.waitForSelector('[data-testid="success-message"]');

  // Verify tracking number displayed
  const tracking = await page.textContent('[data-testid="tracking-number"]');
  expect(tracking).toMatch(/EPX\d+/);
});
```

---

### Performance Optimization

**1. Debouncing User Input**

```typescript
// ✅ GOOD: Debounce address input before calculating shipping
import { useDebouncedCallback } from 'use-debounce';

const debouncedCalculate = useDebouncedCallback(
  async (address: DeliveryAddress) => {
    const rates = await calculateShipping(address);
    setShippingRates(rates);
  },
  500 // Wait 500ms after user stops typing
);

// ❌ BAD: Call API on every keystroke
onChange={(e) => {
  setAddress(e.target.value);
  calculateShipping(e.target.value); // API call spam!
}}
```

**2. Caching Strategy**

```typescript
// ✅ GOOD: Cache balance for 5 minutes
const BALANCE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCreditBalance(): Promise<number> {
  const cached = await redis.get('easyparcel:balance');

  if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL) {
    return cached.amount;
  }

  const balance = await easyParcel.getBalance();
  await redis.set('easyparcel:balance', {
    amount: balance,
    timestamp: Date.now()
  });

  return balance;
}
```

**3. Lazy Loading**

```typescript
// ✅ GOOD: Load tracking history only when requested
const [showTracking, setShowTracking] = useState(false);

{showTracking && (
  <Suspense fallback={<LoadingSpinner />}>
    <TrackingHistory orderId={orderId} />
  </Suspense>
)}
```

---

### Security Best Practices

**1. Input Validation**

```typescript
// ✅ GOOD: Validate and sanitize all inputs
import { z } from 'zod';

const FulfillRequestSchema = z.object({
  serviceId: z.string().min(1).max(100),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overriddenByAdmin: z.boolean(),
  overrideReason: z.string().max(500).optional()
});

// API route
const body = await request.json();
const validated = FulfillRequestSchema.parse(body);
// Now safe to use validated.serviceId, etc.
```

**2. Authorization Checks**

```typescript
// ✅ GOOD: Verify admin role before fulfillment
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Proceed with fulfillment
}
```

**3. Prevent SQL Injection**

```typescript
// ✅ GOOD: Use Prisma parameterized queries (safe by default)
const order = await prisma.order.findUnique({
  where: { id: orderId } // Automatically parameterized
});

// ❌ BAD: Raw SQL with string concatenation
const result = await prisma.$queryRaw(
  `SELECT * FROM Order WHERE id = '${orderId}'` // SQL injection risk!
);
```

---

### Code Organization Standards

**1. File Structure**

```
src/lib/shipping/
├── client/
│   ├── easyparcel-client.ts      # API client
│   └── easyparcel-client.test.ts # Unit tests
├── services/
│   ├── shipping-calculator.ts    # Business logic
│   ├── balance-service.ts        # Balance management
│   └── tracking-service.ts       # Tracking logic
├── utils/
│   ├── date-utils.ts             # Date helpers (getNextBusinessDay, validatePickupDate)
│   ├── date-utils.test.ts        # Date utilities tests
│   ├── validation.ts             # Input validation
│   └── error-mapping.ts          # Error translation
├── types/
│   ├── easyparcel.ts             # EasyParcel API types
│   └── shipping.ts               # Internal types
└── index.ts                      # Public API exports
```

---

### Critical Implementation: Weight Calculation Utility

**MUST IMPLEMENT:** This utility is required for shipping rate calculation

#### File: `src/lib/shipping/utils/weight-utils.ts`

```typescript
/**
 * Calculate total order weight from cart items
 *
 * IMPORTANT: Product.weight is a REQUIRED field in Prisma schema (line 154)
 * No default fallback needed - all products MUST have weight at creation
 *
 * @param items - Array of cart items with product details
 * @returns Total weight in kilograms (kg)
 *
 * @example
 * const items = [
 *   { product: { weight: 0.5 }, quantity: 2 },  // 1.0 kg total
 *   { product: { weight: 1.5 }, quantity: 1 }   // 1.5 kg total
 * ];
 * const totalWeight = calculateTotalWeight(items); // Returns: 2.5 kg
 */
export function calculateTotalWeight(items: Array<{ product: { weight: number | string }; quantity: number }>): number {
  return items.reduce((total, item) => {
    const itemWeight = Number(item.product.weight);
    return total + (itemWeight * item.quantity);
  }, 0);
}
```

**Usage in API Route:**

```typescript
// src/app/api/shipping/calculate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateTotalWeight } from '@/lib/shipping/utils/weight-utils';
import { easyParcelClient } from '@/lib/shipping/easyparcel';
import { getSystemConfig } from '@/lib/system-config';
import { MALAYSIAN_STATES } from '@/lib/shipping/constants';

// ✅ MANDATORY: Zod validation schema (Layer 2: API Validation)
const ShippingCalculateSchema = z.object({
  deliveryAddress: z.object({
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().regex(/^\+60[0-9]{8,10}$/, "Invalid Malaysian phone number"),
    addressLine1: z.string().min(1, "Address is required").max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1, "City is required").max(100),
    state: z.enum(MALAYSIAN_STATES, { errorMap: () => ({ message: "Invalid state code" }) }),
    postalCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"),
    country: z.literal('MY').default('MY')
  }),
  items: z.array(z.object({
    productId: z.string().cuid(),
    name: z.string().min(1),
    quantity: z.number().int().positive().max(999),
    weight: z.number().positive().min(0.01).max(1000),
    price: z.number().positive()
  })).min(1, "At least one item is required"),
  orderValue: z.number().positive("Order value must be positive")
});

export async function POST(request: Request) {
  try {
    // ✅ LAYER 2: API Validation with Zod
    const body = await request.json();
    const validation = ShippingCalculateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { items, deliveryAddress, orderValue } = validation.data;

    // Calculate total weight from cart items
    const totalWeight = calculateTotalWeight(items);

    // Validation: Check if weight is reasonable
    if (totalWeight <= 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_WEIGHT',
        message: 'Total weight must be greater than 0'
      }, { status: 400 });
    }

    // Get settings for free shipping threshold
    const settings = await getSystemConfig('easyparcel_settings');
    const freeShippingThreshold = settings.freeShipping?.threshold || null;

    // Call EasyParcel API with calculated weight
    const rates = await easyParcelClient.getRates({
      destination: deliveryAddress,
      weight: totalWeight,
      orderValue
    });

    // Apply free shipping logic
    // IMPORTANT: Applied to orderValue (cart subtotal before shipping, before tax)
    if (freeShippingThreshold && orderValue >= freeShippingThreshold) {
      // If multiple couriers available, select cheapest for free shipping
      const cheapestRate = rates.reduce((min, rate) =>
        rate.cost < min.cost ? rate : min
      );

      return NextResponse.json({
        success: true,
        shipping: {
          available: true,
          serviceId: cheapestRate.serviceId,
          courierName: cheapestRate.courierName,
          serviceType: cheapestRate.serviceType,
          cost: 0.00,  // Free shipping
          originalCost: cheapestRate.cost,
          freeShipping: true,
          savedAmount: cheapestRate.cost,
          estimatedDays: cheapestRate.estimatedDays,
          totalWeight
        }
      });
    }

    return NextResponse.json({
      success: true,
      shipping: {
        available: rates.length > 0,
        options: rates,
        totalWeight
      }
    });

  } catch (error) {
    console.error('[ShippingCalculate] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'CALCULATION_FAILED',
      message: 'Failed to calculate shipping rates'
    }, { status: 500 });
  }
}
```

**Key Points:**
- ✅ Simple reduce operation - no complex logic needed
- ✅ Product.weight is REQUIRED (Prisma schema enforces this)
- ✅ No default/fallback needed
- ✅ Converts to number to handle Decimal type from database
- ✅ Returns weight in kilograms for EasyParcel API

**Free Shipping Logic:**
- ✅ Applied to `orderValue` (cart subtotal before shipping, before tax)
- ✅ If subtotal >= threshold, select cheapest courier and set cost to RM 0.00
- ✅ Original cost shown in `savedAmount` field
- ✅ Returns single option (cheapest) when free shipping applies

---

### Critical Implementation: Pickup Date Utilities

**MUST IMPLEMENT:** These utilities are required for Feature #5 (Pickup Date Selection)

#### File: `src/lib/shipping/utils/date-utils.ts`

```typescript
/**
 * Malaysian public holidays for 2025
 * Update this list annually (especially Islamic calendar dates)
 */
const MALAYSIAN_PUBLIC_HOLIDAYS_2025: string[] = [
  '2025-01-01', // New Year's Day
  '2025-01-25', // Thaipusam
  '2025-01-29', // Chinese New Year
  '2025-01-30', // Chinese New Year (2nd day)
  '2025-03-31', // Hari Raya Aidilfitri (estimated)
  '2025-04-01', // Hari Raya Aidilfitri (2nd day)
  '2025-05-01', // Labour Day
  '2025-05-12', // Wesak Day
  '2025-06-02', // Agong's Birthday
  '2025-06-07', // Hari Raya Aidiladha (estimated)
  '2025-06-28', // Awal Muharram
  '2025-08-31', // Merdeka Day
  '2025-09-16', // Malaysia Day
  '2025-09-27', // Prophet Muhammad's Birthday (estimated)
  '2025-10-24', // Deepavali (estimated)
  '2025-12-25', // Christmas Day
];

/**
 * Check if a date is a Malaysian public holiday
 */
export function isMalaysianPublicHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return MALAYSIAN_PUBLIC_HOLIDAYS_2025.includes(dateStr);
}

/**
 * Get the next business day (skip Sundays and public holidays)
 *
 * Used as default value for pickup date selector in fulfillment widget
 */
export function getNextBusinessDay(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1); // Start with tomorrow

  // Skip Sunday
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1); // Move to Monday
  }

  // Skip public holidays
  while (isMalaysianPublicHoliday(date)) {
    date.setDate(date.getDate() + 1);

    // Skip Sunday again if we land on it after holiday
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
  }

  return date;
}

/**
 * Validate pickup date meets EasyParcel requirements
 */
export function validatePickupDate(date: Date): {
  valid: boolean;
  error?: string;
  errorCode?: string;
} {
  // Not Sunday
  if (date.getDay() === 0) {
    return {
      valid: false,
      error: 'Pickup not available on Sundays. Please select a weekday.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not public holiday
  if (isMalaysianPublicHoliday(date)) {
    return {
      valid: false,
      error: 'Pickup not available on public holidays. Please select another date.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(date);
  pickupDate.setHours(0, 0, 0, 0);

  if (pickupDate < today) {
    return {
      valid: false,
      error: 'Pickup date cannot be in the past.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not more than 7 days ahead
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(0, 0, 0, 0);

  if (pickupDate > maxDate) {
    return {
      valid: false,
      error: 'Pickup date cannot be more than 7 days ahead.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  return { valid: true };
}

/**
 * Format date to EasyParcel API format (YYYY-MM-DD)
 *
 * CRITICAL: EasyParcel API expects 'collect_date' in this format
 */
export function formatPickupDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

#### File: `src/lib/shipping/utils/date-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getNextBusinessDay,
  validatePickupDate,
  isMalaysianPublicHoliday,
  formatPickupDate,
} from './date-utils';

describe('getNextBusinessDay', () => {
  it('should return next day if it is a weekday', () => {
    const monday = new Date('2025-10-06'); // Monday
    const result = getNextBusinessDay(monday);
    expect(result.getDate()).toBe(7); // Tuesday
  });

  it('should skip Sunday and return Monday', () => {
    const saturday = new Date('2025-10-11'); // Saturday
    const result = getNextBusinessDay(saturday);
    expect(result.getDate()).toBe(13); // Monday
    expect(result.getDay()).not.toBe(0); // Not Sunday
  });

  it('should skip public holidays', () => {
    const beforeMerdeka = new Date('2025-08-30');
    const result = getNextBusinessDay(beforeMerdeka);
    // Should skip Aug 31 (Merdeka Day)
    expect(result.getDate()).toBe(1); // Sept 1
    expect(result.getMonth()).toBe(8); // September (0-indexed)
  });
});

describe('validatePickupDate', () => {
  it('should reject Sundays', () => {
    const sunday = new Date('2025-10-12'); // Sunday
    const result = validatePickupDate(sunday);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_PICKUP_DATE');
    expect(result.error).toContain('Sunday');
  });

  it('should reject public holidays', () => {
    const merdeka = new Date('2025-08-31'); // Merdeka Day
    const result = validatePickupDate(merdeka);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('public holiday');
  });

  it('should reject past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = validatePickupDate(yesterday);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('past');
  });

  it('should reject dates more than 7 days ahead', () => {
    const tooFar = new Date();
    tooFar.setDate(tooFar.getDate() + 8);
    const result = validatePickupDate(tooFar);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('7 days');
  });

  it('should accept valid business day within 7 days', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);

    // Skip test if it's Sunday or holiday
    if (nextWeek.getDay() === 0 || isMalaysianPublicHoliday(nextWeek)) {
      return;
    }

    const result = validatePickupDate(nextWeek);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('formatPickupDate', () => {
  it('should format date as YYYY-MM-DD for EasyParcel API', () => {
    const date = new Date('2025-10-09T14:30:00Z');
    const result = formatPickupDate(date);
    expect(result).toBe('2025-10-09');
  });

  it('should handle dates with single-digit months/days', () => {
    const date = new Date('2025-01-05T00:00:00Z');
    const result = formatPickupDate(date);
    expect(result).toBe('2025-01-05');
  });
});
```

---

**2. Naming Conventions**

```typescript
// ✅ GOOD: Descriptive, consistent names
// Files: kebab-case
shipping-calculator.ts
easyparcel-client.ts

// Classes: PascalCase
class EasyParcelClient {}
class FulfillmentWidget {}

// Functions: camelCase
function calculateShippingCost() {}
async function getAvailableCouriers() {}

// Constants: UPPER_SNAKE_CASE
const MAX_PICKUP_DAYS_AHEAD = 7;
const DEFAULT_BALANCE_THRESHOLD = 50;

// Malaysian State Codes (EasyParcel API Requirement - Appendix III)
// IMPORTANT: Must be lowercase 3-letter codes as per official documentation
const MALAYSIAN_STATES = {
  'jhr': 'Johor',
  'kdh': 'Kedah',
  'ktn': 'Kelantan',
  'mlk': 'Melaka',
  'nsn': 'Negeri Sembilan',
  'phg': 'Pahang',
  'prk': 'Perak',
  'pls': 'Perlis',
  'png': 'Pulau Pinang',
  'sgr': 'Selangor',
  'trg': 'Terengganu',
  'kul': 'Kuala Lumpur',
  'pjy': 'Putrajaya',
  'srw': 'Sarawak',
  'sbh': 'Sabah',
  'lbn': 'Labuan'
} as const;

// Helper: Validate Malaysian state code
function isValidMalaysianState(code: string): boolean {
  return code in MALAYSIAN_STATES;
}

// Type for state codes (GAP #3 RESOLVED)
type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;

// Helper: Get state name from code
function getStateName(code: MalaysianStateCode): string {
  return MALAYSIAN_STATES[code];
}

// Types/Interfaces: PascalCase
interface ShippingRate {}
type OrderStatus = 'PAID' | 'READY_TO_SHIP';
```

**3. Documentation**

```typescript
/**
 * Calculate shipping rates for a given delivery address
 *
 * @param address - Customer's delivery address
 * @param weight - Total order weight in kg
 * @param orderValue - Total order value for free shipping check
 * @returns Array of available courier options with rates
 * @throws {EasyParcelError} When API fails or no couriers available
 *
 * @example
 * const rates = await calculateShippingRates({
 *   state: 'sgr',  // Lowercase 3-letter state code
 *   postcode: '50000'
 * }, 2.5, 150);
 */
async function calculateShippingRates(
  address: DeliveryAddress,
  weight: number,
  orderValue: number
): Promise<ShippingRate[]> {
  // Implementation
}
```

---

### UI Components Best Practices (GAP #3 RESOLVED)

**1. State Dropdown Component**

```typescript
// src/components/admin/StateDropdown.tsx

import { MALAYSIAN_STATES, type MalaysianStateCode } from '@/lib/shipping/constants';

interface StateDropdownProps {
  value: string;
  onChange: (stateCode: MalaysianStateCode) => void;
  error?: string;
  required?: boolean;
}

export default function StateDropdown({
  value,
  onChange,
  error,
  required = true
}: StateDropdownProps) {
  return (
    <div className="form-field">
      <label htmlFor="state">
        State {required && <span className="required">*</span>}
      </label>

      <select
        id="state"
        name="state"
        value={value}
        onChange={(e) => onChange(e.target.value as MalaysianStateCode)}
        className={error ? 'error' : ''}
        required={required}
      >
        <option value="">Select State</option>
        {Object.entries(MALAYSIAN_STATES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>

      {error && <span className="error-message">{error}</span>}

      <p className="help-text">
        Select the Malaysian state for pickup/delivery
      </p>
    </div>
  );
}
```

**Usage in Admin Settings:**
```typescript
// src/app/admin/shipping/page.tsx

import StateDropdown from '@/components/admin/StateDropdown';

export default function ShippingSettingsPage() {
  const [formData, setFormData] = useState({
    pickupAddress: {
      businessName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '', // Will be MalaysianStateCode
      postalCode: '',
      country: 'MY'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStateChange = (stateCode: MalaysianStateCode) => {
    setFormData(prev => ({
      ...prev,
      pickupAddress: {
        ...prev.pickupAddress,
        state: stateCode
      }
    }));

    // Clear error when user selects a state
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: '' }));
    }
  };

  return (
    <form>
      {/* Other fields */}

      <StateDropdown
        value={formData.pickupAddress.state}
        onChange={handleStateChange}
        error={errors.state}
        required
      />

      {/* Other fields */}
    </form>
  );
}
```

**Why Dropdown Over Free Text:**
- ✅ Prevents typos (e.g., "KL" instead of "kul")
- ✅ Enforces valid state codes
- ✅ Better UX (users see state names, system stores codes)
- ✅ Type-safe with TypeScript
- ✅ Consistent with EasyParcel API requirements

**Customer Checkout State Selector:**
```typescript
// src/components/checkout/AddressForm.tsx

import StateDropdown from '@/components/shared/StateDropdown';

export default function AddressForm({ onChange }) {
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const handleStateChange = (stateCode: MalaysianStateCode) => {
    const updatedAddress = { ...address, state: stateCode };
    setAddress(updatedAddress);

    // Notify parent (triggers shipping calculation)
    onChange(updatedAddress);
  };

  return (
    <div>
      {/* Other address fields */}

      <StateDropdown
        value={address.state}
        onChange={handleStateChange}
        required
      />

      {/* Other address fields */}
    </div>
  );
}
```

**Alternative: Searchable Dropdown (Better UX for Mobile):**
```typescript
// Using react-select or similar library

import Select from 'react-select';
import { MALAYSIAN_STATES } from '@/lib/shipping/constants';

const stateOptions = Object.entries(MALAYSIAN_STATES).map(([code, name]) => ({
  value: code,
  label: name
}));

<Select
  options={stateOptions}
  value={stateOptions.find(opt => opt.value === formData.state)}
  onChange={(option) => handleStateChange(option?.value || '')}
  placeholder="Select State"
  isSearchable
  isClearable={false}
/>
```

**Constants File Location:**
```typescript
// src/lib/shipping/constants.ts

export const MALAYSIAN_STATES = {
  'jhr': 'Johor',
  'kdh': 'Kedah',
  'ktn': 'Kelantan',
  'mlk': 'Melaka',
  'nsn': 'Negeri Sembilan',
  'phg': 'Pahang',
  'prk': 'Perak',
  'pls': 'Perlis',
  'png': 'Pulau Pinang',
  'sgr': 'Selangor',
  'trg': 'Terengganu',
  'kul': 'Kuala Lumpur',
  'pjy': 'Putrajaya',
  'srw': 'Sarawak',
  'sbh': 'Sabah',
  'lbn': 'Labuan'
} as const;

export type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;

export function isValidMalaysianState(code: string): boolean {
  return code in MALAYSIAN_STATES;
}

export function getStateName(code: MalaysianStateCode): string {
  return MALAYSIAN_STATES[code];
}

// Export for use in both frontend and backend
export default {
  MALAYSIAN_STATES,
  isValidMalaysianState,
  getStateName
};
```

---

### Monitoring & Logging

**1. Structured Logging**

```typescript
// ✅ GOOD: Structured logs for easy parsing
logger.info('Fulfillment started', {
  orderId,
  serviceId,
  pickupDate,
  overriddenByAdmin
});

logger.error('Fulfillment failed', {
  orderId,
  errorCode: error.code,
  errorMessage: error.message,
  retryable: error.retryable,
  timestamp: new Date().toISOString()
});

// ❌ BAD: Unstructured string logs
console.log('Fulfilling order ' + orderId);
console.log('Error: ' + error.message); // Hard to parse
```

**2. Performance Tracking**

```typescript
// ✅ GOOD: Track API response times
const start = Date.now();
try {
  const result = await easyParcel.createShipment(data);
  const duration = Date.now() - start;

  metrics.recordAPILatency('easyparcel.createShipment', duration);

  if (duration > 5000) {
    logger.warn('Slow API response', { duration, endpoint: 'createShipment' });
  }

  return result;
} catch (error) {
  metrics.incrementCounter('easyparcel.errors', { code: error.code });
  throw error;
}
```

---

### Summary Checklist

**Before merging code, verify:**

- ✅ All functions have proper TypeScript types (no `any`)
- ✅ Error handling in place for all async operations
- ✅ Input validation for all API endpoints
- ✅ User-friendly error messages (no technical jargon)
- ✅ Loading states for all async UI operations
- ✅ Database operations use transactions where needed
- ✅ API calls are debounced/cached appropriately
- ✅ Authorization checks on admin endpoints
- ✅ Unit tests for business logic
- ✅ Integration tests for API routes
- ✅ Consistent naming conventions
- ✅ Structured logging with context
- ✅ No hardcoded secrets (use env variables)
- ✅ Code follows DRY principle
- ✅ Documentation for complex functions

---
