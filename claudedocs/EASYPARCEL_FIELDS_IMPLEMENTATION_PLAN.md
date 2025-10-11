# 📋 Complete Implementation Plan: EasyParcel Fields Integration

**Date:** 2025-10-11
**Purpose:** Add missing EasyParcel fields from EPPayOrderBulk API response to database and UI for audit and reconciliation purposes.

---

## 🎯 Fields to Add (4 Total)

### From EPPayOrderBulk API Response:
```typescript
{
  result: [{
    orderno: "EI-12345",           // → easyparcelOrderNumber
    messagenow: "Fully Paid",      // → easyparcelPaymentStatus
    parcel: [{
      parcelno: "EP-PQKTE",        // → easyparcelParcelNumber
      awb: "631867054753",         // ✅ Already stored
      awb_id_link: "http://...",   // ✅ Already stored
      tracking_url: "https://..."  // ✅ Already stored
    }]
  }],
  api_status: "Success",
  error_code: "0",
  error_remark: ""
}
```

### From EPSubmitOrderBulk API Response:
```typescript
{
  result: {
    orderno: "EI-12345",
    parcels: [{
      service_id: "EP-CS0D0P",
      service_name: "Dropoff - Parcel",
      courier_name: "Skynet",
      price: "6.49",               // → shippingCostCharged
      parcel_id: "EP-PQKTE"
    }]
  }
}
```

### New Database Fields:

1. **`easyparcelOrderNumber`** (String, nullable)
   - Source: EPPayOrderBulk `result[0].orderno` (e.g., "EI-12345")
   - Purpose: EasyParcel's internal order reference for reconciliation
   - Use case: Match orders between our system and EasyParcel dashboard

2. **`easyparcelPaymentStatus`** (String, nullable)
   - Source: EPPayOrderBulk `result[0].messagenow` (e.g., "Fully Paid")
   - Purpose: Payment status message from EasyParcel for audit trail
   - Use case: Audit trail, verify payment completion status

3. **`easyparcelParcelNumber`** (String, nullable)
   - Source: EPPayOrderBulk `result[0].parcel[0].parcelno` (e.g., "EP-PQKTE")
   - Purpose: EasyParcel's internal parcel reference for support tickets
   - Use case: Reference when contacting EasyParcel support

4. **`shippingCostCharged`** (Decimal, nullable)
   - Source: EPSubmitOrderBulk `result.parcels[0].price` (e.g., "6.49")
   - Purpose: Track actual cost charged vs estimated cost
   - Use case: Financial reconciliation, cost variance analysis
   - **Important:** Stored BEFORE payment (from EPSubmitOrderBulk), not after

---

## 📂 Files That Will Be Modified

### **1. Database Schema**
**File:** `prisma/schema.prisma`

**Location:** Order model (around line 239-306)

**Changes:**
```prisma
model Order {
  id                       String             @id @default(cuid())
  orderNumber              String             @unique
  // ... existing fields ...

  // Existing AWB fields (lines 271-275)
  airwayBillGenerated      Boolean            @default(false)
  airwayBillGeneratedAt    DateTime?
  airwayBillNumber         String?
  airwayBillUrl            String?
  trackingUrl              String?

  // ✅ ADD THESE NEW FIELDS (after trackingUrl, before selectedCourierServiceId)
  easyparcelOrderNumber    String?            // EasyParcel order number (e.g., "EI-12345")
  easyparcelPaymentStatus  String?            // Payment status (e.g., "Fully Paid")
  easyparcelParcelNumber   String?            // Parcel number (e.g., "EP-PQKTE")
  shippingCostCharged      Decimal?           @db.Decimal(10, 2) // Actual cost charged

  selectedCourierServiceId String?
  courierName              String?
  // ... rest of fields ...
}
```

**After editing, run:**
```bash
npx prisma migrate dev --name add_easyparcel_fields
```

---

### **2. Fulfillment API Route** (Where EPPayOrderBulk response is processed)

**File:** `src/app/api/admin/orders/[orderId]/fulfill/route.ts`

**Location:** After successful EPPayOrderBulk payment (search for `prisma.order.update`)

**Current Code (needs update):**
```typescript
// After successful EPPayOrderBulk payment response
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'READY_TO_SHIP',
    trackingNumber: parcelDetails.awb,
    airwayBillNumber: parcelDetails.awb,
    airwayBillUrl: parcelDetails.awb_id_link,
    airwayBillGenerated: true,
    airwayBillGeneratedAt: new Date(),
    trackingUrl: parcelDetails.tracking_url,
  }
});
```

**Updated Code:**
```typescript
// Step 1: Submit order to EasyParcel (BEFORE payment)
const submitResponse = await easyparcel.submitOrderBulk(...);
const actualPrice = submitResponse.result.parcels[0].price; // Get actual cost

// Store the actual cost immediately after submission
await prisma.order.update({
  where: { id: orderId },
  data: {
    shippingCostCharged: actualPrice, // From EPSubmitOrderBulk
  }
});

// Step 2: Pay for the order
const paymentResponse = await easyparcel.payOrderBulk(orderNumber);
const orderData = paymentResponse.result[0];
const parcelDetails = orderData.parcel[0];

// Step 3: Update order with AWB details and EasyParcel references
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'READY_TO_SHIP',

    // Existing AWB fields
    trackingNumber: parcelDetails.awb,
    airwayBillNumber: parcelDetails.awb,
    airwayBillUrl: parcelDetails.awb_id_link,
    airwayBillGenerated: true,
    airwayBillGeneratedAt: new Date(),
    trackingUrl: parcelDetails.tracking_url,

    // ✅ NEW EASYPARCEL FIELDS (from EPPayOrderBulk)
    easyparcelOrderNumber: orderData.orderno,
    easyparcelPaymentStatus: orderData.messagenow,
    easyparcelParcelNumber: parcelDetails.parcelno,
    // shippingCostCharged already saved in Step 1
  }
});
```

**Notes:**
- `shippingCostCharged` comes from **EPSubmitOrderBulk** (`result.parcels[0].price`)
- Store it BEFORE calling EPPayOrderBulk
- `orderno`, `messagenow`, `parcelno` come from **EPPayOrderBulk**
- EPPayOrderBulk does NOT return `total_amount` (per official API docs)

---

### **3. Order Details API Route** (Returns order data to frontend)

**File:** `src/app/api/orders/[orderId]/route.ts`

**Location:** Response transformation (lines 118-132, after existing AWB fields)

**Current Code (recently added, lines 118-123):**
```typescript
// AWB (Airway Bill) Information
airwayBillGenerated: order.airwayBillGenerated,
airwayBillGeneratedAt: order.airwayBillGeneratedAt?.toISOString() || null,
airwayBillNumber: order.airwayBillNumber,
airwayBillUrl: order.airwayBillUrl,
trackingUrl: order.trackingUrl,

// Courier/shipping information
selectedCourierServiceId: order.selectedCourierServiceId,
```

**Updated Code:**
```typescript
// AWB (Airway Bill) Information
airwayBillGenerated: order.airwayBillGenerated,
airwayBillGeneratedAt: order.airwayBillGeneratedAt?.toISOString() || null,
airwayBillNumber: order.airwayBillNumber,
airwayBillUrl: order.airwayBillUrl,
trackingUrl: order.trackingUrl,

// ✅ NEW EASYPARCEL FIELDS
easyparcelOrderNumber: order.easyparcelOrderNumber,
easyparcelPaymentStatus: order.easyparcelPaymentStatus,
easyparcelParcelNumber: order.easyparcelParcelNumber,
shippingCostCharged: order.shippingCostCharged ? Number(order.shippingCostCharged) : null,

// Courier/shipping information
selectedCourierServiceId: order.selectedCourierServiceId,
```

---

### **4. Admin Order Details Page UI**

**File:** `src/app/admin/orders/[orderId]/page.tsx`

**Location:** Shipping Information card (lines 658-717)

**Current Code (existing Shipping Information card):**
```tsx
{/* AWB Information (when no shipment but AWB exists) */}
{!order.shipment && order.airwayBillGenerated && order.trackingNumber && (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Shipping Information
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <p className="text-sm text-gray-500">Tracking Number</p>
        <p className="font-medium font-mono">{order.trackingNumber}</p>
      </div>
      {order.airwayBillNumber && order.airwayBillNumber !== order.trackingNumber && (
        <div>
          <p className="text-sm text-gray-500">AWB Number</p>
          <p className="font-medium font-mono">{order.airwayBillNumber}</p>
        </div>
      )}
      {order.courierName && (
        <div>
          <p className="text-sm text-gray-500">Courier</p>
          <p className="font-medium">{order.courierName}</p>
        </div>
      )}
      {order.trackingUrl && (
        <div>
          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
             className="text-sm text-blue-600 hover:text-blue-800 underline">
            Track Shipment →
          </a>
        </div>
      )}
      {order.airwayBillUrl && (
        <div>
          <Button variant="outline" size="sm"
                  onClick={() => window.open(order.airwayBillUrl || '', '_blank')}
                  className="w-full">
            <Package className="h-4 w-4 mr-2" />
            View Airway Bill
          </Button>
        </div>
      )}
      {order.airwayBillGeneratedAt && (
        <div>
          <p className="text-xs text-gray-500">
            Generated: {formatOrderDateTime(order.airwayBillGeneratedAt)}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

**Updated Code (insert new sections in order shown):**
```tsx
{/* AWB Information (when no shipment but AWB exists) */}
{!order.shipment && order.airwayBillGenerated && order.trackingNumber && (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Shipping Information
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Existing Tracking Number */}
      <div>
        <p className="text-sm text-gray-500">Tracking Number</p>
        <p className="font-medium font-mono">{order.trackingNumber}</p>
      </div>

      {/* ✅ NEW: EasyParcel Order Number - Insert after Tracking Number */}
      {order.easyparcelOrderNumber && (
        <div>
          <p className="text-sm text-gray-500">EasyParcel Order No.</p>
          <p className="font-medium font-mono text-blue-600">{order.easyparcelOrderNumber}</p>
        </div>
      )}

      {/* ✅ NEW: EasyParcel Parcel Number - Insert after Order Number */}
      {order.easyparcelParcelNumber && (
        <div>
          <p className="text-sm text-gray-500">EasyParcel Parcel No.</p>
          <p className="font-medium font-mono text-purple-600">{order.easyparcelParcelNumber}</p>
        </div>
      )}

      {/* Existing AWB Number (if different from tracking) */}
      {order.airwayBillNumber && order.airwayBillNumber !== order.trackingNumber && (
        <div>
          <p className="text-sm text-gray-500">AWB Number</p>
          <p className="font-medium font-mono">{order.airwayBillNumber}</p>
        </div>
      )}

      {/* Existing Courier Name */}
      {order.courierName && (
        <div>
          <p className="text-sm text-gray-500">Courier</p>
          <p className="font-medium">{order.courierName}</p>
        </div>
      )}

      {/* ✅ NEW: Shipping Cost Charged - Insert after Courier */}
      {order.shippingCostCharged && (
        <div>
          <p className="text-sm text-gray-500">Shipping Cost Charged</p>
          <p className="font-medium">RM {Number(order.shippingCostCharged).toFixed(2)}</p>
          {order.shippingCost && Number(order.shippingCost) !== Number(order.shippingCostCharged) && (
            <p className="text-xs text-orange-600">
              (Estimated: RM {Number(order.shippingCost).toFixed(2)})
            </p>
          )}
        </div>
      )}

      {/* ✅ NEW: EasyParcel Payment Status - Insert after Cost */}
      {order.easyparcelPaymentStatus && (
        <div>
          <p className="text-sm text-gray-500">Payment Status</p>
          <p className="font-medium text-green-600">{order.easyparcelPaymentStatus}</p>
        </div>
      )}

      {/* Existing Tracking URL */}
      {order.trackingUrl && (
        <div>
          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
             className="text-sm text-blue-600 hover:text-blue-800 underline">
            Track Shipment →
          </a>
        </div>
      )}

      {/* Existing AWB Button */}
      {order.airwayBillUrl && (
        <div>
          <Button variant="outline" size="sm"
                  onClick={() => window.open(order.airwayBillUrl || '', '_blank')}
                  className="w-full">
            <Package className="h-4 w-4 mr-2" />
            View Airway Bill
          </Button>
        </div>
      )}

      {/* Existing Generated Timestamp */}
      {order.airwayBillGeneratedAt && (
        <div>
          <p className="text-xs text-gray-500">
            Generated: {formatOrderDateTime(order.airwayBillGeneratedAt)}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

**Visual Layout (top to bottom):**
1. Tracking Number (existing)
2. ✅ EasyParcel Order No. (NEW - blue text)
3. ✅ EasyParcel Parcel No. (NEW - purple text)
4. AWB Number (existing, conditional)
5. Courier (existing)
6. ✅ Shipping Cost Charged (NEW - with variance indicator)
7. ✅ Payment Status (NEW - green text)
8. Track Shipment link (existing)
9. View Airway Bill button (existing)
10. Generated timestamp (existing)

---

### **5. Mock Fulfillment Script** (For testing)

**File:** `scripts/direct-mock-fulfillment.ts`

**Location:** Mock response data (lines 15-35) and database update (lines 95-107)

**Current Mock Data:**
```typescript
const MOCK_PAYMENT_RESPONSE = {
  result: [
    {
      orderno: 'EI-MOCK2025', // Mock EasyParcel order number
      messagenow: 'Fully Paid',
      parcel: [
        {
          parcelno: 'EP-MOCK123', // EasyParcel internal reference
          awb: '631867054753', // ✅ REAL tracking number from WhatsApp
          awb_id_link: 'http://demo.connect.easyparcel.my/?ac=AWBLabel&id=mock-awb-123456',
          tracking_url: 'https://easyparcel.com/my/en/track/details/?courier=J&T%20Express&awb=631867054753',
        },
      ],
    },
  ],
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
};
```

**Updated Mock Data (Two Separate Responses):**
```typescript
// Mock EPSubmitOrderBulk Response (for shippingCostCharged)
const MOCK_SUBMIT_RESPONSE = {
  result: {
    orderno: 'EI-MOCK2025',
    parcels: [{
      service_id: 'EP-CS0D0P',
      service_name: 'Dropoff - Parcel',
      courier_name: 'Skynet',
      price: '6.49',              // ✅ Will map to shippingCostCharged
      parcel_id: 'EP-MOCK123'
    }]
  }
};

// Mock EPPayOrderBulk Response (for AWB and EasyParcel fields)
const MOCK_PAYMENT_RESPONSE = {
  result: [
    {
      orderno: 'EI-MOCK2025',        // ✅ Will map to easyparcelOrderNumber
      messagenow: 'Fully Paid',      // ✅ Will map to easyparcelPaymentStatus
      parcel: [
        {
          parcelno: 'EP-MOCK123',    // ✅ Will map to easyparcelParcelNumber
          awb: '631867054753',       // ✅ REAL tracking number from WhatsApp
          awb_id_link: 'http://demo.connect.easyparcel.my/?ac=AWBLabel&id=mock-awb-123456',
          tracking_url: 'https://easyparcel.com/my/en/track/details/?courier=J&T%20Express&awb=631867054753',
        },
      ],
    },
  ],
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
  // ❌ NO total_amount field (per official API docs)
};
```

**Current Database Update Code (lines 95-107):**
```typescript
const updatedOrder = await prisma.order.update({
  where: { id: order.id },
  data: {
    status: 'READY_TO_SHIP',
    trackingNumber: parcelDetails.awb,
    airwayBillNumber: parcelDetails.awb,
    airwayBillUrl: parcelDetails.awb_id_link,
    airwayBillGenerated: true,
    airwayBillGeneratedAt: new Date(),
    trackingUrl: parcelDetails.tracking_url,
    adminNotes: `[MOCK FULFILLMENT] Testing field mapping without EasyParcel API call. Mock data injected: ${new Date().toISOString()}`,
  },
});
```

**Updated Database Update Code (Two-Step Process):**
```typescript
// Step 1: Extract price from submit response
const submitPrice = MOCK_SUBMIT_RESPONSE.result.parcels[0].price;

// Step 2: Extract parcel details from payment response
const orderData = MOCK_PAYMENT_RESPONSE.result[0];
const parcelDetails = orderData.parcel[0];

// Step 3: Update database with all fields
const updatedOrder = await prisma.order.update({
  where: { id: order.id },
  data: {
    status: 'READY_TO_SHIP',

    // Existing AWB fields
    trackingNumber: parcelDetails.awb,
    airwayBillNumber: parcelDetails.awb,
    airwayBillUrl: parcelDetails.awb_id_link,
    airwayBillGenerated: true,
    airwayBillGeneratedAt: new Date(),
    trackingUrl: parcelDetails.tracking_url,

    // ✅ NEW EASYPARCEL FIELDS
    easyparcelOrderNumber: orderData.orderno,           // From EPPayOrderBulk
    easyparcelPaymentStatus: orderData.messagenow,      // From EPPayOrderBulk
    easyparcelParcelNumber: parcelDetails.parcelno,     // From EPPayOrderBulk
    shippingCostCharged: submitPrice,                   // From EPSubmitOrderBulk

    adminNotes: `[MOCK FULFILLMENT] Testing field mapping without EasyParcel API call. Mock data injected: ${new Date().toISOString()}`,
  },
});
```

**Update Validation Checks (add after line 176):**
```typescript
const checks = [
  // ... existing checks ...
  {
    name: 'EasyParcel Order Number is EI-MOCK2025',
    pass: updatedOrder.easyparcelOrderNumber === 'EI-MOCK2025',
    expected: 'EI-MOCK2025',
    actual: updatedOrder.easyparcelOrderNumber,
  },
  {
    name: 'EasyParcel Payment Status is Fully Paid',
    pass: updatedOrder.easyparcelPaymentStatus === 'Fully Paid',
    expected: 'Fully Paid',
    actual: updatedOrder.easyparcelPaymentStatus,
  },
  {
    name: 'EasyParcel Parcel Number is EP-MOCK123',
    pass: updatedOrder.easyparcelParcelNumber === 'EP-MOCK123',
    expected: 'EP-MOCK123',
    actual: updatedOrder.easyparcelParcelNumber,
  },
  {
    name: 'Shipping Cost Charged is 6.49',
    pass: Number(updatedOrder.shippingCostCharged) === 6.49,
    expected: '6.49',
    actual: updatedOrder.shippingCostCharged?.toString(),
  },
];
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1A. EasyParcel API - EPSubmitOrderBulk (FIRST)                        │
│                                                                         │
│    POST https://connect.easyparcel.my/api/v2/order/submit              │
│                                                                         │
│    Response:                                                            │
│    {                                                                    │
│      result: {                                                          │
│        orderno: "EI-12345",                                            │
│        parcels: [{                                                      │
│          service_id: "EP-CS0D0P",                                      │
│          price: "6.49",               // → shippingCostCharged         │
│          parcel_id: "EP-PQKTE"                                         │
│        }]                                                               │
│      }                                                                  │
│    }                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 1B. EasyParcel API - EPPayOrderBulk (SECOND)                          │
│                                                                         │
│    POST https://connect.easyparcel.my/api/v2/order/payment             │
│                                                                         │
│    Response:                                                            │
│    {                                                                    │
│      result: [{                                                         │
│        orderno: "EI-12345",           // → easyparcelOrderNumber       │
│        messagenow: "Fully Paid",      // → easyparcelPaymentStatus     │
│        parcel: [{                                                       │
│          parcelno: "EP-PQKTE",        // → easyparcelParcelNumber      │
│          awb: "631867054753",         // → trackingNumber              │
│          awb_id_link: "http://...",   // → airwayBillUrl               │
│          tracking_url: "https://..."  // → trackingUrl                 │
│        }]                                                               │
│      }],                                                                │
│      api_status: "Success"           // ❌ NO total_amount field       │
│    }                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Fulfill API Route                                                   │
│    /api/admin/orders/[orderId]/fulfill/route.ts                        │
│                                                                         │
│    Step 1: Extract price from EPSubmitOrderBulk:                       │
│    - const actualPrice = submitResponse.result.parcels[0].price       │
│    - Save shippingCostCharged to database                              │
│                                                                         │
│    Step 2: Call EPPayOrderBulk and extract AWB data:                   │
│    - const orderData = paymentResponse.result[0]                       │
│    - const parcelDetails = orderData.parcel[0]                         │
│                                                                         │
│    Step 3: Map to database fields:                                      │
│    - easyparcelOrderNumber: orderData.orderno                          │
│    - easyparcelPaymentStatus: orderData.messagenow                     │
│    - easyparcelParcelNumber: parcelDetails.parcelno                    │
│    - shippingCostCharged: (already saved in Step 1)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Database (PostgreSQL via Prisma)                                    │
│    Table: orders                                                        │
│                                                                         │
│    Order Record:                                                        │
│    {                                                                    │
│      id: "cmglkvopy0004gskwivn2wt8v",                                  │
│      orderNumber: "ORD-20251011-Y323",                                 │
│      status: "READY_TO_SHIP",                                          │
│      trackingNumber: "631867054753",                                   │
│      airwayBillNumber: "631867054753",                                 │
│      airwayBillUrl: "http://demo.connect.easyparcel.my/...",          │
│      trackingUrl: "https://easyparcel.com/my/en/track/...",           │
│      airwayBillGenerated: true,                                        │
│      airwayBillGeneratedAt: "2025-10-11T03:12:59.905Z",               │
│                                                                         │
│      // ✅ NEW FIELDS                                                   │
│      easyparcelOrderNumber: "EI-12345",                                │
│      easyparcelPaymentStatus: "Fully Paid",                            │
│      easyparcelParcelNumber: "EP-PQKTE",                               │
│      shippingCostCharged: 6.49                                         │
│    }                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Order API Route                                                     │
│    GET /api/orders/[orderId]/route.ts                                  │
│                                                                         │
│    Fetches order from database via Prisma                              │
│    Transforms and returns to frontend:                                  │
│    {                                                                    │
│      orderNumber: "ORD-20251011-Y323",                                 │
│      status: "READY_TO_SHIP",                                          │
│      trackingNumber: "631867054753",                                   │
│      airwayBillUrl: "http://...",                                      │
│                                                                         │
│      // ✅ NEW FIELDS INCLUDED IN RESPONSE                             │
│      easyparcelOrderNumber: "EI-12345",                                │
│      easyparcelPaymentStatus: "Fully Paid",                            │
│      easyparcelParcelNumber: "EP-PQKTE",                               │
│      shippingCostCharged: 6.49                                         │
│    }                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Admin UI (React Component)                                          │
│    /admin/orders/[orderId]/page.tsx                                    │
│                                                                         │
│    Shipping Information Card displays:                                  │
│                                                                         │
│    ┌────────────────────────────────────────┐                          │
│    │ 🚚 Shipping Information               │                          │
│    ├────────────────────────────────────────┤                          │
│    │ Tracking Number                        │                          │
│    │ 631867054753                           │                          │
│    │                                        │                          │
│    │ EasyParcel Order No.       ✅ NEW     │                          │
│    │ EI-12345                               │                          │
│    │                                        │                          │
│    │ EasyParcel Parcel No.      ✅ NEW     │                          │
│    │ EP-PQKTE                               │                          │
│    │                                        │                          │
│    │ Courier                                │                          │
│    │ J&T Express (Malaysia) Sdn. Bhd.      │                          │
│    │                                        │                          │
│    │ Shipping Cost Charged      ✅ NEW     │                          │
│    │ RM 6.49                                │                          │
│    │ (Estimated: RM 6.49)                   │                          │
│    │                                        │                          │
│    │ Payment Status             ✅ NEW     │                          │
│    │ Fully Paid                             │                          │
│    │                                        │                          │
│    │ Track Shipment →                      │                          │
│    │ [View Airway Bill Button]             │                          │
│    │                                        │                          │
│    │ Generated: 11 Oct 2025, 11:12 AM      │                          │
│    └────────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Database Schema
- [ ] Add 4 new fields to Order model in `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name add_easyparcel_fields`
- [ ] Verify migration success
- [ ] Run `npx prisma generate` to update Prisma Client

### Phase 2: Backend API Updates
- [ ] Update `fulfill/route.ts` to save new fields from EPPayOrderBulk response
- [ ] Update `[orderId]/route.ts` to return new fields in API response
- [ ] Test API endpoints return correct data structure

### Phase 3: Frontend UI Updates
- [ ] Add new field displays to Shipping Information card
- [ ] Add color coding (blue for order no, purple for parcel no, green for status)
- [ ] Add cost variance indicator
- [ ] Test UI renders correctly with new fields

### Phase 4: Testing Infrastructure
- [ ] Update `direct-mock-fulfillment.ts` script with new fields
- [ ] Add validation checks for new fields (4 new checks)
- [ ] Run mock fulfillment test
- [ ] Verify all 12 validation checks pass (8 existing + 4 new)

### Phase 5: Validation
- [ ] Run mock fulfillment script: `npx tsx scripts/direct-mock-fulfillment.ts`
- [ ] Verify database contains all 4 new fields
- [ ] Refresh admin order page and verify UI displays all new fields
- [ ] Check field formatting and colors
- [ ] Verify cost variance calculation works
- [ ] Take screenshots for documentation

### Phase 6: Real Fulfillment Test
- [ ] Create new test order (do NOT use ORD-20251011-Y323)
- [ ] Run real EasyParcel fulfillment
- [ ] Verify all 4 fields populate from real API response
- [ ] Compare estimated vs actual shipping cost
- [ ] Document any discrepancies

---

## 🎨 UI Design Specifications

### Color Coding
- **EasyParcel Order No.**: `text-blue-600` (Blue - official order reference)
- **EasyParcel Parcel No.**: `text-purple-600` (Purple - internal tracking)
- **Payment Status**: `text-green-600` (Green - successful payment)
- **Cost Variance**: `text-orange-600` (Orange - when estimate differs from actual)

### Field Order (Top to Bottom)
1. Tracking Number (black, monospace)
2. EasyParcel Order No. (blue, monospace)
3. EasyParcel Parcel No. (purple, monospace)
4. AWB Number (conditional, black, monospace)
5. Courier (black)
6. Shipping Cost Charged (black, with orange variance note)
7. Payment Status (green)
8. Track Shipment link (blue underline)
9. View Airway Bill button (outlined)
10. Generated timestamp (gray small text)

### Spacing
- `space-y-3` between field groups
- Consistent label styling: `text-sm text-gray-500`
- Consistent value styling: `font-medium` + specific colors

---

## 🔍 Audit & Reconciliation Use Cases

### Use Case 1: Financial Reconciliation
**Problem:** Need to verify actual shipping costs vs estimated costs
**Solution:** Compare `shippingCost` (estimate) vs `shippingCostCharged` (actual)
**Benefit:** Identify cost discrepancies, adjust pricing strategy

### Use Case 2: EasyParcel Dashboard Matching
**Problem:** Admin needs to find order in EasyParcel dashboard
**Solution:** Use `easyparcelOrderNumber` (EI-12345) to search
**Benefit:** Quick cross-reference between systems

### Use Case 3: Support Ticket Resolution
**Problem:** Customer reports shipping issue, need to contact EasyParcel
**Solution:** Provide `easyparcelParcelNumber` (EP-PQKTE) to support team
**Benefit:** Faster support resolution

### Use Case 4: Payment Verification
**Problem:** Need audit trail of payment status from EasyParcel
**Solution:** Check `easyparcelPaymentStatus` field history
**Benefit:** Complete audit trail for financial compliance

---

## 📊 Database Field Details

| Field Name | Type | Nullable | Purpose | Example Value |
|------------|------|----------|---------|---------------|
| `easyparcelOrderNumber` | String | Yes | EasyParcel's order reference | "EI-12345" |
| `easyparcelPaymentStatus` | String | Yes | Payment status from EasyParcel | "Fully Paid" |
| `easyparcelParcelNumber` | String | Yes | Parcel reference for support | "EP-PQKTE" |
| `shippingCostCharged` | Decimal(10,2) | Yes | Actual cost charged by EasyParcel | 6.49 |

**Notes:**
- All fields are nullable (orders created before this feature won't have these values)
- Decimal precision: 10 digits total, 2 after decimal point (supports up to RM 99,999,999.99)
- All String fields have no max length constraint (can store any length)

---

## 🚨 Important Notes

1. **Backward Compatibility:** All new fields are nullable to support existing orders
2. **Cost Variance:** `shippingCost` is the estimate, `shippingCostCharged` is actual - show variance in UI
3. **Mock vs Real:** Mock fulfillment should populate all fields for complete testing
4. **API Source Clarification:**
   - `shippingCostCharged` comes from **EPSubmitOrderBulk** (`result.parcels[0].price`)
   - EPPayOrderBulk does **NOT** return `total_amount` (per official API docs)
   - All other new fields come from EPPayOrderBulk response
5. **Error Handling:** If any field is missing from API response, store as NULL (don't fail the fulfillment)
6. **Fulfillment Flow:** Two-step process required:
   - Step 1: Submit order → Store `shippingCostCharged` from submit response
   - Step 2: Pay order → Store AWB fields and EasyParcel references from payment response

---

## 📝 Testing Scenario

### Test Case: Mock Fulfillment with New Fields

**Given:**
- Order ORD-20251011-Y323 in PAID status
- Mock EPSubmitOrderBulk response with price: "6.49"
- Mock EPPayOrderBulk response with all AWB and EasyParcel fields

**When:**
- Run `npx tsx scripts/direct-mock-fulfillment.ts`

**Then:**
- Database should contain:
  - ✅ easyparcelOrderNumber: "EI-MOCK2025" (from EPPayOrderBulk)
  - ✅ easyparcelPaymentStatus: "Fully Paid" (from EPPayOrderBulk)
  - ✅ easyparcelParcelNumber: "EP-MOCK123" (from EPPayOrderBulk)
  - ✅ shippingCostCharged: 6.49 (from EPSubmitOrderBulk)

**And:**
- Admin UI should display all fields correctly
- Cost variance should show "(Estimated: RM 6.49)" since both are same
- Payment status should be green text
- Order/Parcel numbers should be monospace font with color coding

---

## 🎯 Success Criteria

1. ✅ All 4 fields added to database schema
2. ✅ Migration runs without errors
3. ✅ Fulfill API implements two-step process:
   - Step 1: Saves `shippingCostCharged` from EPSubmitOrderBulk response
   - Step 2: Saves 3 EasyParcel fields from EPPayOrderBulk response
4. ✅ Order API returns all 4 fields to frontend
5. ✅ UI displays all 4 fields with correct styling
6. ✅ Mock fulfillment test passes all 12 validation checks (8 existing + 4 new)
7. ✅ Real fulfillment test populates fields from actual API responses
8. ✅ Cost variance indicator works correctly (compares estimated vs actual)

---

**Status:** Ready for implementation
**Estimated Time:** 30-45 minutes
**Risk Level:** Low (all nullable fields, backward compatible)
