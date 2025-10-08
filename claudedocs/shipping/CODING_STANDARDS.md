# 🔴 MANDATORY CODING STANDARDS

**⚠️ CRITICAL:** These coding standards are **NON-NEGOTIABLE** and must be followed throughout the entire shipping implementation. Failure to adhere to these standards will result in technical debt, bugs, and maintenance nightmares.

**📋 Project:** EcomJRM Shipping System Integration
**🎯 Applies To:** All implementation work related to `SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md`

---

## Core Principles (SOLID + DRY + KISS)

### **1. Single Responsibility Principle (SRP)**
- Each function, component, and class has ONE clear purpose
- If you can't describe what something does in one sentence, it's doing too much
- ✅ Example: `calculateTotalWeight()` - calculates weight, nothing else
- ❌ Anti-pattern: `processOrderAndSendEmailAndUpdateInventory()` - does too many things

### **2. Open/Closed Principle**
- Code open for extension, closed for modification
- Use interfaces and abstractions to allow new features without changing existing code
- ✅ Example: Courier strategy pattern allows new strategies without modifying core logic

### **3. Don't Repeat Yourself (DRY)**
- No code duplication - extract common functionality
- Reuse utilities, constants, and validation logic
- ✅ Example: `MALAYSIAN_STATES` constant used everywhere, defined once
- ❌ Anti-pattern: Hardcoding state codes in multiple places

### **4. Keep It Simple, Stupid (KISS)**
- Simple solutions over complex architectures
- If there's a simpler way that works, use it
- ✅ Example: Direct database queries instead of complex repository patterns
- Complexity should be justified by real requirements, not theoretical future needs

---

## Non-Negotiable Standards

### **🔴 Type Safety (TypeScript)**
```typescript
// ✅ MANDATORY: Strict typing everywhere
interface CourierOption {
  serviceId: string;
  courierName: string;
  cost: number;
}

// ❌ FORBIDDEN: Never use 'any' type
function process(data: any) { } // WILL BE REJECTED IN CODE REVIEW
```

**Rules:**
- ❌ NO `any` types (use `unknown` if truly dynamic, then narrow with type guards)
- ❌ NO implicit `any` (enable `strict` mode in tsconfig.json)
- ✅ ALL function parameters must have explicit types
- ✅ ALL function return types must be explicit
- ✅ Use type inference only for simple variable assignments

---

### **🔴 Validation at Every Layer**

**Three-Layer Validation Principle:**

```
┌─────────────────────────────────────────┐
│ 1. FRONTEND VALIDATION                  │
│    Purpose: Immediate user feedback     │
│    Tool: HTML5 validation + React state │
│    Example: required, min, max, pattern │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. API VALIDATION                       │
│    Purpose: Prevent bad data from DB    │
│    Tool: Zod schema validation          │
│    Example: z.string().min(1).email()   │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. DATABASE CONSTRAINTS                 │
│    Purpose: Data integrity guarantee    │
│    Tool: Prisma schema + DB constraints │
│    Example: @db.VarChar(100), NOT NULL  │
└─────────────────────────────────────────┘
```

**Example - Product Weight:**
```typescript
// LAYER 1: Frontend
<input
  type="number"
  min="0.01"     // ✅ Prevents 0 or negative
  max="1000"     // ✅ Prevents unrealistic values
  step="0.01"    // ✅ Allows decimal precision
  required       // ✅ Makes field mandatory
/>

// LAYER 2: API
const ProductSchema = z.object({
  weight: z.number()
    .positive("Weight must be greater than 0")    // ✅ Business rule
    .min(0.01, "Minimum weight is 0.01 kg")       // ✅ Realistic minimum
    .max(1000, "Maximum weight is 1000 kg")       // ✅ Realistic maximum
});

// LAYER 3: Database
model Product {
  weight Decimal @db.Decimal(8, 2)  // ✅ NOT NULL (required)

  @@check([weight > 0])              // ✅ Database-level constraint
}
```

**Why Three Layers?**
- Frontend validation can be bypassed (browser tools, API calls)
- API validation can have bugs or be missing
- Database is the FINAL line of defense

---

### **🔴 Error Handling**

**Every async operation MUST have error handling:**

```typescript
// ✅ GOOD: Comprehensive error handling
try {
  const result = await easyParcel.createShipment(data);
  return NextResponse.json({ success: true, result });
} catch (error) {
  if (error instanceof EasyParcelError) {
    // Handle known errors
    console.error('[Fulfillment] EasyParcel error:', {
      code: error.code,
      orderId: data.orderId,
      message: error.message
    });

    return NextResponse.json({
      success: false,
      error: error.code,
      message: error.userMessage, // User-friendly message
      retryable: error.retryable
    }, { status: 502 });
  }

  // Handle unknown errors
  console.error('[Fulfillment] Unexpected error:', error);
  return NextResponse.json({
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  }, { status: 500 });
}

// ❌ BAD: Silent failure
const result = await easyParcel.createShipment(data); // No try-catch!
```

**Error Handling Rules:**
- ✅ Every `await` must be in a `try-catch` block
- ✅ Log errors with context (orderId, userId, action)
- ✅ Return user-friendly error messages (not technical stack traces)
- ✅ Distinguish between retryable and non-retryable errors
- ❌ Never expose internal error details to customers
- ❌ Never swallow errors silently

---

### **🔴 Security Standards**

**Input Validation & Sanitization:**
```typescript
// ✅ MANDATORY: Validate ALL inputs
import { z } from 'zod';

const ShippingCalculateSchema = z.object({
  deliveryAddress: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+60[0-9]{8,10}$/),
    state: z.enum(['jhr', 'kdh', 'ktn', /* ... */]),
    postalCode: z.string().regex(/^\d{5}$/)
  }),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive().max(999)
  })).min(1),
  orderValue: z.number().positive()
});

// API route
export async function POST(request: Request) {
  const body = await request.json();

  // ✅ MANDATORY: Validate before processing
  const validation = ShippingCalculateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      errors: validation.error.flatten()
    }, { status: 400 });
  }

  // Now safe to use validation.data
}
```

**Authorization Checks:**
```typescript
// ✅ MANDATORY: Check permissions before sensitive operations
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Login required' },
      { status: 401 }
    );
  }

  // Check authorization
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  // Proceed with operation
}
```

**Secrets Management:**
```typescript
// ✅ GOOD: Environment variables
const apiKey = process.env.EASYPARCEL_API_KEY;

// ❌ BAD: Hardcoded secrets
const apiKey = "sk_live_abc123xyz"; // SECURITY BREACH!
```

---

### **🔴 Database Best Practices**

**Use Transactions for Multi-Step Operations:**
```typescript
// ✅ GOOD: Atomic operations
await prisma.$transaction(async (tx) => {
  // All succeed or all fail
  const order = await tx.order.update({
    where: { id: orderId },
    data: { status: 'READY_TO_SHIP', trackingNumber }
  });

  await tx.inventory.updateMany({
    where: { productId: { in: order.items.map(i => i.productId) } },
    data: { quantity: { decrement: 1 } }
  });
});

// ❌ BAD: No transaction - can result in inconsistent state
await prisma.order.update({ /* ... */ });
await prisma.inventory.updateMany({ /* ... */ }); // If this fails, order updated but inventory not!
```

**Query Optimization:**
```typescript
// ✅ GOOD: Select only needed fields
const order = await prisma.order.findUnique({
  where: { id: orderId },
  select: {
    id: true,
    status: true,
    trackingNumber: true,
    shippingAddress: true
  }
});

// ❌ BAD: Select all fields when only need a few
const order = await prisma.order.findUnique({
  where: { id: orderId }
  // Returns 30+ fields when we only need 4
});
```

---

### **🔴 React Component Standards**

**Component Structure (Mandatory Order):**
```typescript
export default function ComponentName({ props }: Props) {
  // 1. Hooks (always at top, never conditional)
  const [state, setState] = useState(initialValue);

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 3. Event Handlers
  const handleAction = async () => {
    // Handler logic
  };

  // 4. Computed Values
  const computedValue = useMemo(() => {
    // Expensive computation
  }, [dependencies]);

  // 5. Early Returns (guard clauses)
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  // 6. Main Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

**State Management:**
```typescript
// ✅ GOOD: Consolidated related state
const [fulfillmentState, setFulfillmentState] = useState({
  status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  selectedCourier: null as CourierOption | null,
  error: null as string | null
});

// Update immutably
setFulfillmentState(prev => ({ ...prev, status: 'loading' }));

// ❌ BAD: Multiple related useState
const [status, setStatus] = useState('idle');
const [selectedCourier, setSelectedCourier] = useState(null);
const [error, setError] = useState(null);
// Hard to keep synchronized, error-prone
```

---

## Testing Requirements

**Unit Tests (Mandatory for Utils):**
```typescript
// MUST test: Date utilities, weight calculations, validation functions
describe('getNextBusinessDay', () => {
  it('skips Sunday', () => {
    const saturday = new Date('2025-10-11'); // Saturday
    const result = getNextBusinessDay(saturday);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('skips public holidays', () => {
    const dayBeforeHoliday = new Date('2025-08-30'); // Day before Merdeka
    const result = getNextBusinessDay(dayBeforeHoliday);
    expect(result).not.toEqual(new Date('2025-08-31')); // Skip holiday
  });
});
```

**Integration Tests (Required for Critical Paths):**
- ✅ Checkout flow with shipping calculation
- ✅ Order fulfillment with EasyParcel API (use mock in test environment)
- ✅ Tracking updates

---

## Code Review Checklist

**Before submitting code, verify:**

- [ ] ✅ No `any` types used
- [ ] ✅ All functions have explicit parameter and return types
- [ ] ✅ All user inputs validated with Zod schemas
- [ ] ✅ All async operations have try-catch blocks
- [ ] ✅ All database operations use Prisma (no raw SQL)
- [ ] ✅ All sensitive operations check authentication/authorization
- [ ] ✅ No secrets hardcoded (all in environment variables)
- [ ] ✅ Loading states shown for all async UI operations
- [ ] ✅ Error messages are user-friendly (not technical jargon)
- [ ] ✅ Console logs include context (orderId, action, error details)
- [ ] ✅ Component state is immutable (use spread operator)
- [ ] ✅ No code duplication (DRY principle followed)
- [ ] ✅ Functions are small and focused (SRP followed)
- [ ] ✅ Complex logic has comments explaining "why" not "what"
- [ ] ✅ Tests written for utility functions

---

## Forbidden Patterns

**❌ These patterns will be REJECTED in code review:**

1. **Using `any` type**
   ```typescript
   function process(data: any) { } // FORBIDDEN
   ```

2. **Skipping validation**
   ```typescript
   const { orderId } = await request.json(); // FORBIDDEN - no validation
   await processOrder(orderId);
   ```

3. **Hardcoded values**
   ```typescript
   if (state === 'kul') { } // FORBIDDEN - use constants
   const apiKey = "sk_live_123"; // FORBIDDEN - use env vars
   ```

4. **Silent error handling**
   ```typescript
   try {
     await operation();
   } catch (e) {} // FORBIDDEN - swallowing errors
   ```

5. **No loading states**
   ```typescript
   <button onClick={asyncOperation}>Submit</button> // FORBIDDEN - no loading indicator
   ```

6. **Direct state mutation**
   ```typescript
   state.items.push(newItem); // FORBIDDEN - mutating state
   setState(state); // FORBIDDEN - same reference
   ```

7. **Missing authorization checks**
   ```typescript
   export async function DELETE(request: Request) {
     await prisma.order.delete({ where: { id } }); // FORBIDDEN - no auth check
   }
   ```

---

## Success Criteria

**Code is considered acceptable when:**

✅ All automated tests pass
✅ TypeScript compiles with no errors or warnings
✅ ESLint passes with no errors
✅ All checklist items above are verified
✅ Code review approved by lead developer
✅ Manual testing confirms expected behavior

---

**📖 Related Documents:**
- `SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md` - Main implementation specification
- `SPEC_AUDIT_REPORT.md` - Specification audit and validation report

**🔄 Last Updated:** 2025-10-07
