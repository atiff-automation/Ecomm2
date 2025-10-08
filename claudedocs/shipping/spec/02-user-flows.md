## User Flows

### Customer Journey

```
1. Browse Products
   ↓
2. Add to Cart
   ↓
3. Go to Checkout
   ↓
4. Enter Shipping Address
   ↓
5. System Auto-Calculates Shipping
   │
   ├─ Couriers Available
   │  ↓
   │  Show: "Shipping: RM 8.00 via City-Link (2-3 days)"
   │  OR
   │  Show: "Shipping: FREE via J&T Express"
   │  ↓
   │  [Proceed to Payment] button enabled
   │  ↓
   │  Payment Success
   │  ↓
   │  Order Created (Status: PAID)
   │  ↓
   │  Email #1: Order Confirmation
   │
   └─ No Couriers Available
      ↓
      Show: "❌ Sorry, we cannot ship to this address.
             Please try a different address or contact us."
      ↓
      [Proceed to Payment] button disabled
```

### Admin Journey

```
1. Login to Admin Panel
   ↓
2. View Orders List
   ↓
3. See Order (Status: PAID)
   ↓
4. Click Order to View Details
   ↓
5. Review Order Information
   - Customer details
   - Items ordered
   - Shipping address
   - Pre-selected courier & cost
   ↓
6. Click "Fulfill Order" Button
   ↓
7. System Calls EasyParcel API
   │
   ├─ Success
   │  ↓
   │  Get AWB and Tracking Number
   │  ↓
   │  Update Order Status → READY_TO_SHIP
   │  ↓
   │  Download Label Automatically
   │  ↓
   │  Email #2: Tracking Info to Customer
   │  ↓
   │  Show Success Message
   │
   └─ Failure
      ↓
      Show Error Message
      ↓
      Keep Order Status: PAID
      ↓
      Show "Retry" Button
```

---
