## Customer Checkout Experience

### Shipping Address Form

**Fields (standard):**
- Full Name *
- Phone Number *
- Address Line 1 *
- Address Line 2
- City *
- State * (dropdown)
- Postal Code *
- Country (default: Malaysia, hidden)

### Shipping Rate Display

Display varies based on admin's configured **Courier Selection Strategy**:

#### Strategy A: "Cheapest Courier" (Default)

**Scenario 1: Couriers Available, No Free Shipping**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ 📦 Standard Shipping                            │
│                                                 │
│ Via: City-Link Express (Pick-up)                │
│ Delivery: 2-3 working days                      │
│ Cost: RM 5.50                                   │
│                                                 │
│ (Cheapest option automatically selected)        │
└─────────────────────────────────────────────────┘
```

**Customer sees:** One shipping option (no choice needed)

#### Strategy B: "Show All Couriers"

**Scenario 1: Multiple Couriers Available**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method (Choose one)                    │
├─────────────────────────────────────────────────┤
│ ◉ City-Link Express         RM 5.50             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ J&T Express               RM 5.80             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ Skynet                    RM 6.00             │
│   Delivery: 1-2 working days                    │
│                                                 │
│ ○ Poslaju                   RM 7.00             │
│   Delivery: 1-2 working days                    │
└─────────────────────────────────────────────────┘
```

**Customer sees:** All available couriers, selects preferred one

#### Strategy C: "Selected Couriers"

**Scenario 1: Admin Selected Only 2 Couriers (City-Link + Skynet)**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method (Choose one)                    │
├─────────────────────────────────────────────────┤
│ ◉ City-Link Express         RM 5.50             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ Skynet                    RM 6.00             │
│   Delivery: 1-2 working days                    │
└─────────────────────────────────────────────────┘
```

**Customer sees:** Only admin-approved couriers

**Note:** If admin selected 3+ couriers but only 1 is available for this destination, customer sees that 1 option only (no choice needed).

---

**Scenario 2: Free Shipping Threshold Met**

**Logic:** Cart subtotal >= threshold (before shipping, before tax) → Select cheapest courier, show RM 0.00

```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ 🎉 FREE SHIPPING                                │
│                                                 │
│ Via: J&T Express (Pick-up)                      │
│ Delivery: 2-3 working days                      │
│ Cost: RM 0.00                                   │
│                                                 │
│ ✓ You saved RM 10.00 on shipping!              │
└─────────────────────────────────────────────────┘
```

**Note:** If multiple couriers available, system automatically selects cheapest option for free shipping.

**Scenario 3: Calculating (Loading State)**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ⏳ Calculating shipping cost...                 │
│                                                 │
│ Please wait while we check available couriers   │
│ for your address.                               │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

**Scenario 4: No Couriers Available**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ❌ Shipping Not Available                       │
│                                                 │
│ Sorry, we cannot ship to this address.          │
│                                                 │
│ Please try:                                     │
│ • A different delivery address                  │
│ • Contact us for assistance                     │
│                                                 │
│ 📧 Email: support@ecomjrm.com                   │
│ 📱 WhatsApp: +60123456789                       │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

**Scenario 5: API Error**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ⚠️ Unable to Calculate Shipping                 │
│                                                 │
│ We're having trouble connecting to our          │
│ shipping service. Please try again.             │
│                                                 │
│ [Retry Calculation]                             │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

### Checkout Behavior

**When address is complete:**
1. Auto-trigger shipping calculation (500ms debounce)
2. Show loading state
3. Call `/api/shipping/calculate`
4. Display result (rate or error)
5. Enable/disable payment button accordingly

**Payment button logic:**
```javascript
Enabled when:
✅ Address valid
✅ Shipping rate available
✅ Payment method selected

Disabled when:
❌ Address incomplete
❌ No shipping available
❌ Calculating shipping
❌ Shipping API error
```

---
