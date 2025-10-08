## Admin Fulfillment Process

### Order Detail Page - Fulfillment Widget

**Location:** Sidebar widget (right side of order detail page, high priority position)

**Purpose:** Single-stop interface for all fulfillment actions

---

### Pre-Fulfillment State (Order Status: PAID)

```
┌─────────────────────────────────────────────────┐
│ 📦 Shipping & Fulfillment                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Customer Selected:                              │
│ City-Link Express - RM 5.50                     │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Change Courier (Optional):                      │
│ [City-Link Express - RM 5.50  ▼]               │
│                                                 │
│ Available alternatives:                         │
│   • J&T Express - RM 5.30                       │
│   • Skynet - RM 6.00                            │
│   • Poslaju - RM 7.00                           │
│                                                 │
│ ℹ️ Admin override: You can select a different   │
│   courier if the customer's choice is no        │
│   longer available or if you prefer another     │
│   option.                                       │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Pickup Date: *                                  │
│ [2025-10-09 📅]                                 │
│                                                 │
│ ℹ️ Default: Next business day                   │
│   Can schedule up to 7 days ahead               │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Shipment Summary:                               │
│ • Destination: Selangor, 50000                  │
│ • Weight: 2.5 kg                                │
│ • Estimated Delivery: 2-3 days                  │
│                                                 │
│ [Book Shipment with EasyParcel]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Features:**
1. **Customer's Choice Displayed:** Shows what customer selected at checkout
2. **Admin Override Dropdown:** Can change courier if needed
3. **Pickup Date Selector:** Date picker with smart defaults
4. **Shipment Summary:** Quick reference for destination/weight
5. **Single Action Button:** One click to book shipment

---

### During Fulfillment (Processing State)

```
┌─────────────────────────────────────────────────┐
│ 📦 Shipping & Fulfillment                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⏳ Booking Shipment...                          │
│                                                 │
│ [████████████████░░░░░] 80%                     │
│                                                 │
│ Creating shipment with EasyParcel...            │
│                                                 │
│ • Validating details...           ✓            │
│ • Creating shipment...             ⏳           │
│ • Generating AWB...                ⋯            │
│ • Downloading label...             ⋯            │
│                                                 │
│ Please wait, do not close this page.            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Progress indicator
- Step-by-step status
- Prevents accidental page close

---

### Post-Fulfillment State (Order Status: READY_TO_SHIP)

```
┌─────────────────────────────────────────────────┐
│ 📦 Shipping & Fulfillment                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ✅ Shipment Booked Successfully                 │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Courier: City-Link Express                      │
│ Service: Standard (Pick-up)                     │
│                                                 │
│ Tracking Number:                                │
│ [EPX123456789] 📋 Copy                          │
│                                                 │
│ AWB Number:                                     │
│ CL987654321                                     │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Pickup Details:                                 │
│ Date: 2025-10-09                                │
│ Status: Scheduled                               │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Quick Actions:                                  │
│ [Download AWB] [View Tracking] [Copy URL]      │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Customer Notified:                              │
│ ✓ Order confirmation sent                       │
│ ✓ Tracking information sent                     │
│                                                 │
│ Last updated: Just now                          │
│ [Refresh Status]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Clear success indicator
- All tracking details visible
- Quick action buttons
- Customer notification status
- Manual refresh option

---

### Failed Fulfillment State (With Retry)

```
┌─────────────────────────────────────────────────┐
│ 📦 Shipping & Fulfillment                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ❌ Booking Failed                               │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Error: Insufficient EasyParcel credit balance   │
│                                                 │
│ Current Balance: RM 3.50                        │
│ Required: RM 5.50                               │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ What to do:                                     │
│ 1. Top up your EasyParcel account               │
│    [Go to Top Up Page]                          │
│                                                 │
│ 2. After topping up, retry booking:             │
│    [Retry Booking]                              │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Alternative Actions:                            │
│ • [Change Courier] (try cheaper option)         │
│ • [Contact Support]                             │
│                                                 │
│ Error Code: INSUFFICIENT_BALANCE                │
│ Timestamp: 2025-10-07 14:30:00                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Clear error message
- Current balance display
- Actionable solutions
- Retry button (Feature #3: Retry Failed Bookings)
- Alternative actions
- Error details for support

**Other common errors:**
- `INVALID_ADDRESS` → Review shipping address, suggest corrections
- `COURIER_UNAVAILABLE` → Offer alternative couriers
- `API_TIMEOUT` → Simple retry with same options
- `SERVICE_UNAVAILABLE` → Suggest trying later, notify when back

---

### Partial Success State (AWB Retrieval Failed)

```
┌─────────────────────────────────────────────────┐
│ 📦 Shipping & Fulfillment                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⚠️ Shipment Created (AWB Pending)               │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Good news: Your shipment was created            │
│ successfully in EasyParcel system.              │
│                                                 │
│ However: The AWB label download failed due to   │
│ a temporary connection issue.                   │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ Shipment Reference:                             │
│ EP-ORDER-123456                                 │
│                                                 │
│ Status: READY_TO_SHIP                           │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ [Retry AWB Download]                            │
│                                                 │
│ ℹ️ The courier has been notified and will       │
│   pick up as scheduled. You can retry the       │
│   label download anytime.                       │
│                                                 │
│ Alternatively:                                  │
│ • [Download from EasyParcel Dashboard]          │
│ • [Contact Support]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Distinguishes between shipment created vs AWB download
- Doesn't re-create shipment on retry
- Reassures admin pickup is still scheduled
- Provides alternative download method

---

### Implementation Guidelines

**Component Structure (React/TypeScript):**

```typescript
// src/components/admin/FulfillmentWidget.tsx

interface FulfillmentWidgetProps {
  orderId: string;
  orderStatus: OrderStatus;
}

interface FulfillmentState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'partial';
  selectedCourier?: CourierOption;
  pickupDate: Date;
  trackingNumber?: string;
  awbNumber?: string;
  labelUrl?: string;
  error?: FulfillmentError;
}

interface CourierOption {
  serviceId: string;
  courierName: string;
  cost: number;
  estimatedDays: string;
  isCustomerSelected: boolean; // Flag to highlight customer's choice
}

interface FulfillmentError {
  code: string;
  message: string;
  suggestedActions: Action[];
  retryable: boolean;
}
```

**Best Practices:**

1. **State Management**
   - Use controlled components for dropdowns/date picker
   - Validate pickup date (not Sunday/public holidays)
   - Disable submit during loading
   - Clear error on retry

2. **Error Handling**
   - Specific error messages (not generic "Failed")
   - Actionable suggestions
   - Error codes for support
   - Retry capability

3. **User Experience**
   - Default pickup date = next business day
   - Pre-select customer's courier
   - Show loading progress
   - Auto-download AWB on success
   - Confirm before expensive actions

4. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation support
   - Focus management (modal/dropdown)
   - Color-blind friendly icons (not just color)

5. **Performance**
   - Debounce courier dropdown changes
   - Cache available couriers list (5 min)
   - Lazy load tracking URL
   - Optimize re-renders

**API Integration:**

```typescript
// Pre-load available couriers when order detail opens
GET /api/admin/orders/{orderId}/shipping-options

Response:
{
  "customerSelected": {
    "serviceId": "123",
    "courierName": "City-Link Express",
    "cost": 5.50,
    "selectedAtCheckout": true
  },
  "alternatives": [
    {
      "serviceId": "456",
      "courierName": "J&T Express",
      "cost": 5.30
    },
    // ...
  ],
  "destination": {
    "state": "sgr",
    "postcode": "50000"
  },
  "weight": 2.5
}

// Book shipment
POST /api/admin/orders/{orderId}/fulfill

Request:
{
  "serviceId": "123", // Can be different from customerSelected
  "pickupDate": "2025-10-09",
  "overriddenByAdmin": false // Track if admin changed courier
}

Response (Success):
{
  "success": true,
  "tracking": {
    "trackingNumber": "EPX123456789",
    "awbNumber": "CL987654321",
    "labelUrl": "/downloads/awb_ord_123.pdf",
    "trackingUrl": "https://track.easyparcel.com/EPX123456789"
  },
  "pickup": {
    "scheduledDate": "2025-10-09",
    "status": "scheduled"
  }
}

Response (Error):
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient EasyParcel credit balance",
    "details": {
      "currentBalance": 3.50,
      "required": 5.50,
      "currency": "MYR"
    },
    "retryable": true,
    "suggestedActions": [
      {
        "type": "TOPUP",
        "label": "Top Up Account",
        "url": "https://app.easyparcel.com/my/en/account/topup"
      },
      {
        "type": "RETRY",
        "label": "Retry Booking"
      }
    ]
  }
}

// Retry AWB download (for partial success)
POST /api/admin/orders/{orderId}/retry-awb

Response:
{
  "success": true,
  "labelUrl": "/downloads/awb_ord_123.pdf",
  "message": "AWB downloaded successfully"
}
```

---

### Widget Placement

**Desktop Layout:**
```
┌────────────────────────────────────────────────────┐
│ Admin Dashboard                                     │
└────────────────────────────────────────────────────┘

┌──────────────────────────┬─────────────────────────┐
│ Order #1234              │ 📦 Shipping &           │
│ Status: PAID             │    Fulfillment          │
│ Date: Oct 7, 2025        │ ─────────────────────   │
│                          │                         │
│ ━━━ Customer Info ━━━    │ [Widget content here]   │
│ John Doe                 │                         │
│ john@example.com         │                         │
│                          │ [Book Shipment]         │
│ ━━━ Items ━━━            │                         │
│ Product A x2  RM 100     │                         │
│ Product B x1  RM 80      │                         │
│                          │                         │
│ ━━━ Address ━━━          │                         │
│ No. 123, Jalan Example   │                         │
│ 50000 Kuala Lumpur       │                         │
│                          │                         │
│ [Cancel Order]           │                         │
└──────────────────────────┴─────────────────────────┘
```

**Mobile Layout:**
```
┌────────────────────────────┐
│ Order #1234                │
│ Status: PAID               │
├────────────────────────────┤
│ ━━━ Fulfillment ━━━        │
│ [Fulfillment widget]       │
│ [Book Shipment]            │
├────────────────────────────┤
│ ━━━ Customer Info ━━━      │
│ ...                        │
│ ━━━ Items ━━━              │
│ ...                        │
└────────────────────────────┘
```

**Position Logic:**
- Desktop: Sidebar (right), high priority
- Tablet: Below order header, full width
- Mobile: Top section (most important action)

**Order detail updated:**
```
━━━ Shipping Details ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: READY_TO_SHIP
Courier: City-Link Express (Pick-up)
Tracking: EP123456789MY
AWB: CL987654321
Label: [Download PDF]

━━━ Tracking History ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025-10-07 14:30 - Shipment created
2025-10-07 14:30 - Label generated
2025-10-07 14:30 - Customer notified

[Refresh Tracking]
```

### Error State

**If fulfillment fails:**
```
┌─────────────────────────────────────────────────┐
│ ❌ Shipment Creation Failed                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Error: Unable to connect to EasyParcel API      │
│                                                 │
│ Possible reasons:                               │
│ • Network connectivity issue                    │
│ • EasyParcel service temporarily down           │
│ • Invalid API credentials                       │
│                                                 │
│ Order status remains: PAID                      │
│ You can retry or contact support.               │
│                                                 │
│ [Retry]  [Contact Support]  [Close]             │
└─────────────────────────────────────────────────┘
```

### Duplicate Prevention

**If order already has tracking number:**
```
[Fulfill Order] button is disabled (greyed out)

Tooltip: "Order already fulfilled"

Display message:
"✓ This order has already been fulfilled.
Tracking: EP123456789MY"
```

---
