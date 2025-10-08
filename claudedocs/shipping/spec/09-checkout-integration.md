## Checkout Integration & Order Creation

**CRITICAL:** This section documents how shipping data flows from checkout to order creation. This integration is essential for the fulfillment widget to display customer's selected courier.

---

### Overview: Data Flow

```
1. Customer enters shipping address at checkout
   ↓
2. ShippingSelector calls /api/shipping/calculate
   ↓
3. ShippingSelector displays options (based on strategy)
   ↓
4. Customer selects courier (or auto-selected if "cheapest")
   ↓
5. ShippingSelector stores selection in checkout state
   ↓
6. Customer completes payment
   ↓
7. Payment webhook/success handler creates order
   ↓
8. Order creation includes shipping data from checkout state
   ↓
9. Order record now has selectedCourierServiceId populated
   ↓
10. Admin fulfillment widget reads this field to show "Customer Selected"
```

---

### 1. ShippingSelector Component State Management

**File:** `src/components/checkout/ShippingSelector.tsx`

**Component State:**
```typescript
interface ShippingState {
  loading: boolean;
  error: string | null;
  options: ShippingOption[];
  selected: ShippingOption | null;
  strategy: 'cheapest' | 'all' | 'selected';
}

interface ShippingOption {
  serviceId: string;              // EasyParcel service_id (e.g., "123")
  courierName: string;             // e.g., "City-Link Express"
  serviceType: string;             // e.g., "Pick-up", "Drop-off"
  cost: number;                    // e.g., 5.50
  originalCost: number;            // Original cost before free shipping
  freeShipping: boolean;           // true if free shipping applied
  estimatedDays: string;           // e.g., "2-3 working days"
  savedAmount?: number;            // Amount saved if free shipping
}
```

**Key Implementation Points:**

```typescript
export default function ShippingSelector({
  deliveryAddress,
  items,
  orderValue,
  onShippingSelected
}: ShippingSelectorProps) {
  const [state, setState] = useState<ShippingState>({
    loading: false,
    error: null,
    options: [],
    selected: null,
    strategy: 'cheapest'
  });

  // Auto-calculate when address changes
  useEffect(() => {
    if (isAddressComplete(deliveryAddress)) {
      calculateShipping();
    }
  }, [deliveryAddress]);

  const calculateShipping = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
          items,
          orderValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          options: data.shipping.options,
          strategy: data.shipping.strategy,
          // Auto-select if only one option or "cheapest" strategy
          selected: data.shipping.options.length === 1 || data.shipping.strategy === 'cheapest'
            ? data.shipping.options[0]
            : null
        }));

        // CRITICAL: Notify parent component of selection
        if (data.shipping.options.length === 1 || data.shipping.strategy === 'cheapest') {
          onShippingSelected(data.shipping.options[0]);
        }
      } else {
        setState(prev => ({ ...prev, loading: false, error: data.error }));
        onShippingSelected(null); // Clear selection on error
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to calculate shipping' }));
      onShippingSelected(null);
    }
  };

  const handleCourierSelect = (option: ShippingOption) => {
    setState(prev => ({ ...prev, selected: option }));

    // CRITICAL: Notify parent of selection change
    onShippingSelected(option);
  };

  // Render UI based on strategy and options
  // ... (UI implementation)
}
```

**Parent Integration (Checkout Page):**

```typescript
// src/app/checkout/page.tsx

export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState({
    // ... other checkout fields
    shippingAddress: {},
    selectedShipping: null as ShippingOption | null,
    calculatedWeight: 0
  });

  const handleShippingSelected = (option: ShippingOption | null) => {
    setCheckoutData(prev => ({
      ...prev,
      selectedShipping: option
    }));
  };

  const isCheckoutValid = () => {
    return (
      checkoutData.shippingAddress.complete &&
      checkoutData.selectedShipping !== null &&
      checkoutData.paymentMethod !== null
    );
  };

  return (
    <div>
      {/* Address Form */}
      <AddressForm
        onChange={(address) => setCheckoutData(prev => ({ ...prev, shippingAddress: address }))}
      />

      {/* CRITICAL: ShippingSelector with callback */}
      <ShippingSelector
        deliveryAddress={checkoutData.shippingAddress}
        items={cartItems}
        orderValue={cartSubtotal}
        onShippingSelected={handleShippingSelected}
      />

      {/* Payment Button */}
      <button
        disabled={!isCheckoutValid()}
        onClick={() => handlePayment(checkoutData)}
      >
        Proceed to Payment
      </button>
    </div>
  );
}
```

---

### 2. Order Creation Payload Modification

**CRITICAL:** When creating an order (after payment success), include all shipping fields from checkout state.

#### Scenario A: Existing Order Creation API Route

**File:** `src/app/api/orders/create/route.ts` (or similar)

**Before (Missing Shipping Data):**
```typescript
// ❌ BAD: Missing shipping fields
export async function POST(request: Request) {
  const { userId, items, shippingAddress, total, subtotal } = await request.json();

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      total,
      subtotal,
      shippingCost: 0, // ❌ Missing
      shippingAddress,
      // ❌ Missing: selectedCourierServiceId, courierName, etc.
    }
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
```

**After (Complete Shipping Data):**
```typescript
// ✅ GOOD: Include all shipping fields
export async function POST(request: Request) {
  const {
    userId,
    items,
    shippingAddress,
    total,
    subtotal,
    // CRITICAL: Add these fields
    selectedShipping,
    calculatedWeight
  } = await request.json();

  // Validate shipping data exists
  if (!selectedShipping || !selectedShipping.serviceId) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_SHIPPING_DATA',
      message: 'Shipping information is required'
    }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      total,
      subtotal,

      // ✅ CRITICAL: Include shipping fields
      shippingCost: selectedShipping.cost,
      selectedCourierServiceId: selectedShipping.serviceId,
      courierName: selectedShipping.courierName,
      courierServiceType: selectedShipping.serviceType,
      estimatedDelivery: selectedShipping.estimatedDays,
      shippingWeight: calculatedWeight,
      shippingAddress,

      // Items relation
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
```

---

#### Scenario B: Payment Webhook (e.g., Stripe, Toyyibpay)

**File:** `src/app/api/webhooks/payment/route.ts`

**Payment Flow:**
```
1. Customer clicks "Pay Now"
2. Frontend calls payment provider API
3. Payment provider processes payment
4. Payment provider calls our webhook
5. Webhook creates order with payment confirmed
```

**Webhook Implementation:**
```typescript
export async function POST(request: Request) {
  const signature = request.headers.get('webhook-signature');
  const body = await request.text();

  // Verify webhook authenticity
  const event = verifyWebhookSignature(body, signature);

  if (event.type === 'payment.success') {
    const paymentData = event.data;

    // CRITICAL: Payment metadata must include shipping data
    // This is set when creating payment intent in frontend
    const {
      userId,
      items,
      shippingAddress,
      total,
      subtotal,
      selectedShipping,
      calculatedWeight
    } = paymentData.metadata;

    // Create order with PAID status
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PAID', // Payment already confirmed
        paymentStatus: 'COMPLETED',
        total,
        subtotal,

        // ✅ CRITICAL: Include shipping data from payment metadata
        shippingCost: parseFloat(selectedShipping.cost),
        selectedCourierServiceId: selectedShipping.serviceId,
        courierName: selectedShipping.courierName,
        courierServiceType: selectedShipping.serviceType,
        estimatedDelivery: selectedShipping.estimatedDays,
        shippingWeight: parseFloat(calculatedWeight),
        shippingAddress: JSON.parse(shippingAddress),

        items: {
          create: JSON.parse(items).map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // Send order confirmation email
    await sendOrderConfirmationEmail(order);

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
```

**Frontend: Setting Payment Metadata:**
```typescript
// src/app/checkout/page.tsx

const handlePayment = async (checkoutData: CheckoutData) => {
  // Create payment intent with metadata
  const response = await fetch('/api/payment/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: checkoutData.total,
      currency: 'MYR',

      // ✅ CRITICAL: Include shipping data in payment metadata
      metadata: {
        userId: user?.id,
        items: JSON.stringify(cartItems),
        shippingAddress: JSON.stringify(checkoutData.shippingAddress),
        total: checkoutData.total,
        subtotal: checkoutData.subtotal,

        // CRITICAL: Shipping data
        selectedShipping: JSON.stringify(checkoutData.selectedShipping),
        calculatedWeight: calculateTotalWeight(cartItems)
      }
    })
  });

  const { clientSecret } = await response.json();

  // Redirect to payment provider with client secret
  // ...
};
```

---

### 3. Weight Calculation Integration

**File:** `src/lib/shipping/utils/weight-utils.ts`

```typescript
/**
 * Calculate total order weight from cart items
 * Called during checkout to get accurate weight for shipping calculation
 */
export function calculateTotalWeight(
  items: Array<{ product: { weight: number | string }; quantity: number }>
): number {
  return items.reduce((total, item) => {
    const itemWeight = Number(item.product.weight);
    return total + (itemWeight * item.quantity);
  }, 0);
}
```

**Usage in Checkout:**
```typescript
// Calculate weight before calling shipping API
const totalWeight = calculateTotalWeight(cartItems);

// Store in checkout state for later use
setCheckoutData(prev => ({
  ...prev,
  calculatedWeight: totalWeight
}));

// Pass to shipping calculator
const shippingOptions = await fetchShippingRates({
  address: deliveryAddress,
  weight: totalWeight,
  orderValue: cartSubtotal
});
```

---

### 4. Validation Before Order Creation

**CRITICAL:** Always validate shipping data exists before creating order.

```typescript
function validateShippingData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.selectedShipping) {
    errors.push('Shipping option not selected');
  } else {
    if (!data.selectedShipping.serviceId) {
      errors.push('Shipping service ID missing');
    }
    if (!data.selectedShipping.courierName) {
      errors.push('Courier name missing');
    }
    if (typeof data.selectedShipping.cost !== 'number') {
      errors.push('Shipping cost invalid');
    }
  }

  if (!data.calculatedWeight || data.calculatedWeight <= 0) {
    errors.push('Order weight not calculated');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Use in order creation
const validation = validateShippingData(checkoutData);
if (!validation.valid) {
  return NextResponse.json({
    success: false,
    errors: validation.errors
  }, { status: 400 });
}
```

---

### 5. Complete Integration Checklist

**Day 2 Implementation Tasks:**

- [ ] **ShippingSelector Component**
  - [ ] State management with ShippingOption interface
  - [ ] `onShippingSelected` callback to parent
  - [ ] Auto-selection for "cheapest" strategy
  - [ ] Manual selection for "all"/"selected" strategies
  - [ ] Loading and error states

- [ ] **Checkout Page Integration**
  - [ ] Add `selectedShipping` to checkout state
  - [ ] Add `calculatedWeight` to checkout state
  - [ ] Connect ShippingSelector callback
  - [ ] Update payment button validation
  - [ ] Calculate weight before shipping API call

- [ ] **Order Creation Modification**
  - [ ] Add shipping fields to order creation payload
  - [ ] Validate shipping data exists
  - [ ] Store `selectedCourierServiceId` in database
  - [ ] Store `courierName`, `courierServiceType`, `estimatedDelivery`
  - [ ] Store `shippingWeight` and `shippingCost`

- [ ] **Payment Integration**
  - [ ] Include shipping data in payment metadata
  - [ ] Webhook extracts shipping from metadata
  - [ ] Webhook creates order with shipping fields populated
  - [ ] Handle payment metadata size limits (JSON stringify)

- [ ] **Testing**
  - [ ] Test "cheapest" strategy (auto-selection)
  - [ ] Test "all" strategy (manual selection)
  - [ ] Test "selected" strategy
  - [ ] Test free shipping flow
  - [ ] Verify order record has `selectedCourierServiceId` populated
  - [ ] Verify fulfillment widget shows "Customer Selected: [courier]"

---

### 6. Common Integration Issues & Solutions

**Issue 1: selectedCourierServiceId is null in database**

**Cause:** Checkout didn't pass shipping data to order creation

**Solution:**
- Verify `onShippingSelected` callback is working
- Check browser console for shipping state
- Verify payment metadata includes `selectedShipping`
- Add logging in order creation to see received payload

---

**Issue 2: Fulfillment widget shows "Customer Selected: undefined"**

**Cause:** `courierName` not stored in order record

**Solution:**
- Verify order creation includes `courierName` field
- Check database schema has `courierName` column
- Verify ShippingOption interface includes `courierName`

---

**Issue 3: Payment button remains disabled**

**Cause:** `selectedShipping` is null in checkout state

**Solution:**
- Check if ShippingSelector renders
- Verify shipping calculation API returns options
- Check if auto-selection logic triggers for "cheapest"
- Add console.log in `handleShippingSelected`

---

**Issue 4: Weight is 0.00 in order**

**Cause:** `calculatedWeight` not passed to order creation

**Solution:**
- Call `calculateTotalWeight()` before payment
- Store result in checkout state
- Pass to order creation payload
- Verify all products have weight > 0

---

### 7. Database Migration for New Fields

**Run this Prisma migration before implementation:**

```prisma
// prisma/schema.prisma

model Order {
  // ... existing fields

  // Add these new fields:
  selectedCourierServiceId String?   @db.VarChar(100)
  courierName              String?   @db.VarChar(100)
  courierServiceType       String?   @db.VarChar(50)
  trackingNumber           String?   @db.VarChar(100)
  awbNumber                String?   @db.VarChar(100)
  estimatedDelivery        String?   @db.VarChar(50)
  shippingWeight           Decimal?  @db.Decimal(10, 2)
  labelUrl                 String?   @db.Text
  fulfilledAt              DateTime?

  // WooCommerce-inspired fields
  scheduledPickupDate      DateTime? @db.Date
  overriddenByAdmin        Boolean   @default(false)
  adminOverrideReason      String?   @db.Text
  failedBookingAttempts    Int       @default(0)
  lastBookingError         String?   @db.Text
  autoStatusUpdate         Boolean   @default(true)
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_shipping_fields
```

---

### 8. End-to-End Flow Example

**Complete flow from checkout to fulfillment:**

```
1. Customer adds products to cart
   → Total weight: 2.5 kg (calculated from product weights)

2. Customer goes to checkout
   → Enters shipping address: Selangor, 50000

3. ShippingSelector auto-triggers calculation
   → POST /api/shipping/calculate
   → Returns: City-Link RM 5.50, J&T RM 5.30, Poslaju RM 7.00

4. Strategy = "cheapest" → Auto-select J&T RM 5.30
   → onShippingSelected({ serviceId: "123", courierName: "J&T Express", cost: 5.30, ... })
   → Checkout state updated: selectedShipping = { serviceId: "123", ... }

5. Customer clicks "Pay Now"
   → Create payment with metadata including selectedShipping
   → Redirect to payment gateway

6. Customer completes payment
   → Payment webhook triggered
   → Extract metadata.selectedShipping
   → Create order with:
     - selectedCourierServiceId: "123"
     - courierName: "J&T Express"
     - courierServiceType: "Pick-up"
     - shippingCost: 5.30
     - shippingWeight: 2.5
     - status: "PAID"

7. Admin views order in admin panel
   → Fulfillment widget shows: "Customer Selected: J&T Express - RM 5.30"
   → Admin can override to different courier if needed
   → Click "Book Shipment" → Uses order.selectedCourierServiceId

✅ Complete integration successful
```

---
