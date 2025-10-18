# 🔴 MANDATORY CODING STANDARDS

**⚠️ CRITICAL:** These coding standards are **NON-NEGOTIABLE** and must be followed throughout all development work in the EcomJRM application. Failure to adhere to these standards will result in technical debt, bugs, and maintenance nightmares.

**📋 Project:** EcomJRM E-commerce Application
**🎯 Applies To:** All implementation work across the entire codebase

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
- ✅ Example: Payment strategy pattern allows new payment methods without modifying core logic

### **3. Don't Repeat Yourself (DRY)**
- No code duplication - extract common functionality
- Reuse utilities, constants, and validation logic
- ✅ Example: `PAYMENT_STATUSES` constant used everywhere, defined once
- ❌ Anti-pattern: Hardcoding status strings in multiple places

### **4. Keep It Simple, Stupid (KISS)**
- Simple solutions over complex architectures
- If there's a simpler way that works, use it
- ✅ Example: Direct database queries instead of complex repository patterns
- Complexity should be justified by real requirements, not theoretical future needs

### **5. Single Source of Truth**
- Every piece of data or configuration has ONE authoritative source
- Never duplicate data definitions across files
- ✅ Example: Navigation items defined once, imported everywhere
- ❌ Anti-pattern: Copy-pasting route definitions in multiple components

---

## Non-Negotiable Standards

### **🔴 Type Safety (TypeScript)**
```typescript
// ✅ MANDATORY: Strict typing everywhere
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
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

**Example - Product Price:**
```typescript
// LAYER 1: Frontend
<input
  type="number"
  min="0.01"     // ✅ Prevents 0 or negative
  max="999999"   // ✅ Prevents unrealistic values
  step="0.01"    // ✅ Allows decimal precision
  required       // ✅ Makes field mandatory
/>

// LAYER 2: API
const ProductSchema = z.object({
  price: z.number()
    .positive("Price must be greater than 0")    // ✅ Business rule
    .min(0.01, "Minimum price is RM 0.01")       // ✅ Realistic minimum
    .max(999999, "Maximum price is RM 999,999")  // ✅ Realistic maximum
});

// LAYER 3: Database
model Product {
  price Decimal @db.Decimal(10, 2)  // ✅ NOT NULL (required)

  @@check([price > 0])                // ✅ Database-level constraint
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
  const result = await processPayment(data);
  return NextResponse.json({ success: true, result });
} catch (error) {
  if (error instanceof PaymentError) {
    // Handle known errors
    console.error('[Payment] Processing error:', {
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
  console.error('[Payment] Unexpected error:', error);
  return NextResponse.json({
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  }, { status: 500 });
}

// ❌ BAD: Silent failure
const result = await processPayment(data); // No try-catch!
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

const CheckoutSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+60[0-9]{8,10}$/),
    addressLine1: z.string().min(1).max(200),
    postalCode: z.string().regex(/^\d{5}$/)
  }),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive().max(999)
  })).min(1),
  totalAmount: z.number().positive()
});

// API route
export async function POST(request: Request) {
  const body = await request.json();

  // ✅ MANDATORY: Validate before processing
  const validation = CheckoutSchema.safeParse(body);

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
const apiKey = process.env.PAYMENT_API_KEY;

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
    data: { status: 'COMPLETED', paidAt: new Date() }
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
    totalAmount: true,
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
const [checkoutState, setCheckoutState] = useState({
  status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  selectedPayment: null as PaymentMethod | null,
  error: null as string | null
});

// Update immutably
setCheckoutState(prev => ({ ...prev, status: 'loading' }));

// ❌ BAD: Multiple related useState
const [status, setStatus] = useState('idle');
const [selectedPayment, setSelectedPayment] = useState(null);
const [error, setError] = useState(null);
// Hard to keep synchronized, error-prone
```

---

### **🔴 Responsive Grid System**

**MANDATORY:** All responsive grids MUST use the centralized Grid component system.

**✅ DO THIS:**
```typescript
import { ProductGrid } from '@/components/ui/layout';

<ProductGrid>
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</ProductGrid>
```

**❌ DON'T DO THIS:**
```typescript
// FORBIDDEN: Hardcoded grid classes
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

**Available Grid Components:**

| Component | Use Case | Mobile | Tablet | Desktop | XL |
|-----------|----------|--------|--------|---------|-----|
| `ProductGrid` | Product listings | 2 | 3 | 4 | 5 |
| `CompactProductGrid` | Sidebars, recommendations | 2 | 2 | 3 | 4 |
| `SearchResultsGrid` | Search results | 2 | 2 | 3 | 4 |
| `WishlistGrid` | Wishlist page | 2 | 2 | 3 | 4 |
| `CategoryGrid` | Category tiles | 2 | 3 | 4 | 6 |
| `FeatureGrid` | Feature highlights | 1 | 2 | 3 | 3 |
| `BlogGrid` | Blog/article cards | 1 | 2 | 3 | 3 |

**Custom Grid Configuration:**
```typescript
import { Grid } from '@/components/ui/layout';

<Grid
  cols={2}
  responsive={{
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  }}
  gap="md"
>
  {/* content */}
</Grid>
```

**Grid Constants (for programmatic use):**
```typescript
import { GRID_COLUMNS, getGridClasses } from '@/lib/design-system';

// Get grid configuration
const productGridConfig = GRID_COLUMNS.product;
// { mobile: 2, sm: 2, md: 3, lg: 4, xl: 5 }

// Generate grid classes
const classes = getGridClasses('product', 'md');
// "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
```

**Why This Matters:**
1. **Single Source of Truth** - One place to update all grid configurations
2. **No Hardcoding** - Configuration-driven, not magic strings
3. **DRY Principle** - Reuse, don't duplicate
4. **Type Safety** - Full TypeScript support
5. **Consistency** - Same behavior across entire app

**Enforcement:**
- ESLint will error on hardcoded `grid-cols-*` classes
- See `claudedocs/GRID_REFACTORING_IMPLEMENTATION_PLAN.md` for complete documentation

---

## Testing Requirements

**Unit Tests (Mandatory for Utils):**
```typescript
// MUST test: Date utilities, price calculations, validation functions
describe('calculateDiscount', () => {
  it('applies percentage discount correctly', () => {
    const result = calculateDiscount(100, { type: 'percentage', value: 10 });
    expect(result).toBe(90);
  });

  it('applies fixed discount correctly', () => {
    const result = calculateDiscount(100, { type: 'fixed', value: 15 });
    expect(result).toBe(85);
  });

  it('prevents negative prices', () => {
    const result = calculateDiscount(10, { type: 'fixed', value: 20 });
    expect(result).toBe(0); // Not negative
  });
});
```

**Integration Tests (Required for Critical Paths):**
- ✅ Checkout flow with payment processing
- ✅ Order creation and inventory updates
- ✅ User authentication and authorization
- ✅ Admin operations (product CRUD, order management)

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
- [ ] ✅ Single source of truth maintained (no data duplication)
- [ ] ✅ No hardcoded values (use constants and configuration)

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
   if (status === 'pending') { } // FORBIDDEN - use constants
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

8. **Data duplication**
   ```typescript
   // FORBIDDEN - route definitions duplicated
   // File 1: const routes = ['/admin', '/products']
   // File 2: const routes = ['/admin', '/products']
   // Use single source of truth instead
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
✅ No hardcoded values or duplicated data
✅ Single source of truth principle maintained

---

**🔄 Last Updated:** 2025-10-09
**📖 Applies To:** All code in EcomJRM application
