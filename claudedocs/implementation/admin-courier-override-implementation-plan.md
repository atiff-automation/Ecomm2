# Admin Courier Override - Complete Implementation Plan

**Project**: EcomJRM E-commerce Platform
**Feature**: Admin Courier Override in Fulfillment Dialog
**Status**: Ready for Implementation
**Version**: 1.0
**Date**: 2025-10-17

---

## Executive Summary

This document provides a complete implementation plan for adding admin courier override capability to the order fulfillment workflow. The feature allows admin users to change the courier selection made by customers during checkout, with full tracking and financial transparency.

### Current State
- ✅ **Backend API**: Fully supports courier override (no changes needed)
- ✅ **Database Schema**: All required fields exist (no migration needed)
- ❌ **Frontend**: Missing courier selection UI in active dialog component

### Solution Overview
Enhance the existing `FulfillmentConfirmDialog` component to allow courier selection in Step 1, leveraging the existing `shipping-options` API to pre-load all available couriers with prices.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [User Flow](#user-flow)
5. [Implementation Steps](#implementation-steps)
6. [Code Changes](#code-changes)
7. [Testing Plan](#testing-plan)
8. [Edge Cases](#edge-cases)
9. [Rollout Plan](#rollout-plan)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
├─────────────────────────────────────────────────────────┤
│ FulfillmentConfirmDialog (ENHANCED)                     │
│ ├─ Step 1: Courier & Pickup Selection                   │
│ │  ├─ Load shipping-options API                         │
│ │  ├─ Display customer's original selection             │
│ │  ├─ Dropdown with all courier alternatives + prices   │
│ │  └─ Pickup date selector                              │
│ └─ Step 2: Price Confirmation (unchanged)               │
│    ├─ Display final quote from EasyParcel               │
│    ├─ Show override indicator                           │
│    └─ Confirm & Pay button                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     API LAYER                           │
├─────────────────────────────────────────────────────────┤
│ GET /api/admin/orders/[orderId]/shipping-options        │
│ └─ Returns: ALL available couriers with prices          │
│                                                          │
│ POST /api/admin/orders/[orderId]/fulfill/quote          │
│ └─ Creates: Draft shipment for selected courier         │
│                                                          │
│ POST /api/admin/orders/[orderId]/fulfill                │
│ └─ Processes: Payment and order update                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                        │
├─────────────────────────────────────────────────────────┤
│ Order Table (Prisma)                                    │
│ ├─ selectedCourierServiceId (updated if override)       │
│ ├─ courierName (updated from EasyParcel response)       │
│ ├─ overriddenByAdmin (set to true if changed)           │
│ ├─ shippingCost (customer paid - unchanged)             │
│ └─ shippingCostCharged (actual cost - from EasyParcel)  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **External Service**: EasyParcel API

---

## Database Schema

### Order Table Fields

**Good News**: All required fields already exist. **No migration needed!**

```prisma
model Order {
  // Courier Information
  selectedCourierServiceId String?   // EasyParcel service ID
  courierName              String?   // Courier company name
  courierServiceType       String?   // 'parcel' or 'document'
  courierServiceDetail     String?   // 'pickup', 'dropoff', etc.

  // Scheduling
  scheduledPickupDate      DateTime? // Admin-selected pickup date
  estimatedDelivery        String?   // Estimated delivery time

  // Override Tracking
  overriddenByAdmin        Boolean   @default(false)
  adminOverrideReason      String?   @db.Text
  adminNotes               String?   @db.Text

  // Financial Tracking
  shippingCost             Decimal   @db.Decimal(10, 2)  // Customer paid
  shippingCostCharged      Decimal?  @db.Decimal(10, 2)  // Actual cost

  // Tracking Information
  trackingNumber           String?
  airwayBillNumber         String?
  airwayBillUrl            String?
  trackingUrl              String?
  easyparcelOrderNumber    String?

  // Status
  status                   OrderStatus
  airwayBillGeneratedAt    DateTime?
}
```

### Fields Updated During Override

| Field | Before Override | After Override | Notes |
|-------|----------------|----------------|-------|
| `selectedCourierServiceId` | `abc123` (City-Link) | `xyz789` (J&T) | Changes to new courier |
| `courierName` | City-Link Express | J&T Express | From EasyParcel response |
| `overriddenByAdmin` | `false` | `true` | Override flag |
| `adminNotes` | NULL or existing | Appended with override details | Automatic documentation |
| `shippingCost` | RM 5.50 | RM 5.50 | **UNCHANGED** (what customer paid) |
| `shippingCostCharged` | NULL | RM 5.30 | Actual EasyParcel cost |
| `trackingNumber` | NULL | JT987654321 | From new courier |
| `status` | PAID | READY_TO_SHIP | After successful fulfillment |

---

## API Endpoints

### 1. GET Shipping Options

**Endpoint**: `/api/admin/orders/[orderId]/shipping-options`
**File**: `src/app/api/admin/orders/[orderId]/shipping-options/route.ts`
**Status**: ✅ Already Implemented

**Purpose**: Fetch all available courier options with prices for the order.

**Request**:
```typescript
GET /api/admin/orders/order_123/shipping-options
```

**Response**:
```typescript
{
  "success": true,
  "options": [
    {
      "serviceId": "abc123",
      "courierName": "City-Link Express",
      "serviceType": "parcel",
      "cost": 5.50,
      "estimatedDays": "2-3 business days",
      "isCustomerChoice": true  // ← Customer selected this
    },
    {
      "serviceId": "xyz789",
      "courierName": "J&T Express",
      "serviceType": "parcel",
      "cost": 5.30,  // ← Cheaper!
      "estimatedDays": "2-3 business days",
      "isCustomerChoice": false
    },
    {
      "serviceId": "def456",
      "courierName": "Poslaju",
      "serviceType": "parcel",
      "cost": 6.00,
      "estimatedDays": "1-2 business days",
      "isCustomerChoice": false
    }
  ]
}
```

**Key Implementation Details**:
- Line 139: Calls `easyParcelService.getRates()`
- Line 168-177: Formats and returns courier list
- Already marks customer's selection with `isCustomerChoice: true`

---

### 2. POST Fulfillment Quote

**Endpoint**: `/api/admin/orders/[orderId]/fulfill/quote`
**File**: `src/app/api/admin/orders/[orderId]/fulfill/quote/route.ts`
**Status**: ✅ Already Implemented

**Purpose**: Create draft shipment and get final quote for selected courier.

**Request**:
```typescript
POST /api/admin/orders/order_123/fulfill/quote
{
  "serviceId": "xyz789",      // Admin-selected courier (can be different!)
  "pickupDate": "2025-10-18"
}
```

**Response**:
```typescript
{
  "success": true,
  "quote": {
    "shipmentId": "EP-67890",  // Draft shipment ID for payment
    "price": 5.30,
    "courierName": "J&T Express",
    "serviceType": "parcel"
  }
}
```

**Key Implementation Details**:
- Line 30: Accepts `serviceId` parameter
- Line 226: Calls `createShipment()` for that specific courier
- Returns `shipmentId` for Step 2 payment

---

### 3. POST Fulfillment (Payment)

**Endpoint**: `/api/admin/orders/[orderId]/fulfill`
**File**: `src/app/api/admin/orders/[orderId]/fulfill/route.ts`
**Status**: ✅ Already Implemented (Backend supports override)

**Purpose**: Process payment and update order with new courier information.

**Request**:
```typescript
POST /api/admin/orders/order_123/fulfill
{
  "shipmentId": "EP-67890",        // From Step 1 quote
  "pickupDate": "2025-10-18",
  "overriddenByAdmin": true,       // ← Set dynamically in frontend
  "adminOverrideReason": null      // Optional reason
}
```

**Response**:
```typescript
{
  "success": true,
  "message": "Order fulfilled successfully",
  "order": {
    "id": "order_123",
    "status": "READY_TO_SHIP",
    "courierName": "J&T Express",
    "trackingNumber": "JT987654321",
    "overriddenByAdmin": true
  }
}
```

**Key Implementation Details** (route.ts):
- Lines 36-44: API accepts `overriddenByAdmin` and `adminOverrideReason`
- Lines 496-508: Handles courier override logic
- Line 500: Sets `overriddenByAdmin: true` in database
- Lines 506-508: Appends admin notes with override details

**Admin Notes Example**:
```
Admin overrode courier selection. Original: City-Link Express. Selected: xyz789. Actual: J&T Express
```

---

## User Flow

### Complete Admin Journey

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Courier & Pickup Selection                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ On Dialog Open:                                         │
│   → API: GET /shipping-options (fetch all couriers)     │
│   → Loading state while fetching                        │
│   → Pre-select customer's choice                        │
│                                                          │
│ ┌────────────────────────────────────────────────┐     │
│ │ Customer Selected:                              │     │
│ │ ✓ City-Link Express - RM 5.50                  │     │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ Change Courier (Optional): ▼                            │
│ ┌────────────────────────────────────────────────┐     │
│ │ City-Link Express - RM 5.50 (Customer Choice)  │     │
│ │ J&T Express - RM 5.30 💰 CHEAPER               │     │ ← Admin selects this
│ │ Poslaju - RM 6.00                              │     │
│ │ Skynet - RM 5.80                               │     │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ 💰 Save RM 0.20 vs customer selection                   │ ← Cost indicator
│                                                          │
│ Pickup Date: [2025-10-18 📅]                            │
│                                                          │
│ ℹ️ Prices shown are current EasyParcel rates            │
│                                                          │
│ [Cancel]  [Next: Get Quote] ──────────┐                │
└───────────────────────────────────────┼─────────────────┘
                                        │
                                        ↓
                      API: POST /fulfill/quote
                      Body: {
                        serviceId: "xyz789",
                        pickupDate: "2025-10-18"
                      }
                                        ↓
┌───────────────────────────────────────┴─────────────────┐
│ STEP 2: Price Confirmation                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✅ Shipping quote retrieved successfully                │
│                                                          │
│ ┌────────────────────────────────────────────────┐     │
│ │  Shipping Cost: RM 5.30                        │     │
│ │  💰 You saved RM 0.20 vs customer selection    │     │
│ └────────────────────────────────────────────────┘     │
│                                                          │
│ Courier: J&T Express (Admin Override) ⚠️                │ ← Override indicator
│ Service Type: parcel                                    │
│ Pickup Date: Oct 18, 2025                              │
│                                                          │
│ ⚠️ Confirming will process payment with EasyParcel      │
│                                                          │
│ [Back]  [Confirm & Pay RM 5.30] ──────┐                │
└───────────────────────────────────────┼─────────────────┘
                                        │
                                        ↓
                      API: POST /fulfill
                      Body: {
                        shipmentId: "EP-67890",
                        pickupDate: "2025-10-18",
                        overriddenByAdmin: true  ← Calculated!
                      }
                                        ↓
                      ┌─────────────────────┐
                      │ Success!            │
                      │ Order → READY_TO_SHIP│
                      │ Email sent          │
                      └─────────────────────┘
```

### API Call Sequence

**Total API Calls**: 3

1. **Dialog Opens**
   `GET /shipping-options` → Returns all courier options with prices

2. **Admin Clicks "Get Quote"**
   `POST /fulfill/quote` → Creates draft shipment for selected courier

3. **Admin Clicks "Confirm & Pay"**
   `POST /fulfill` → Processes payment and updates order

**No Additional Calls**: Changing courier in dropdown does NOT trigger API calls (prices already loaded).

---

## Implementation Steps

### Phase 1: Frontend Component Enhancement

**File**: `src/components/admin/orders/FulfillmentConfirmDialog.tsx`

#### 1.1 Add New State Variables

```typescript
// NEW: Courier selection state
const [availableCouriers, setAvailableCouriers] = useState<CourierOption[]>([]);
const [loadingCouriers, setLoadingCouriers] = useState(false);
const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);

// MODIFIED: Update step names
const [currentStep, setCurrentStep] = useState<'COURIER_PICKUP' | 'PRICE_CONFIRMATION'>('COURIER_PICKUP');
```

#### 1.2 Add TypeScript Interface

```typescript
interface CourierOption {
  serviceId: string;
  courierName: string;
  cost: number;
  estimatedDays: string;
  isCustomerChoice: boolean;
}
```

#### 1.3 Implement Courier Loading

```typescript
useEffect(() => {
  if (open) {
    loadAvailableCouriers();
  }
}, [open]);

const loadAvailableCouriers = async () => {
  setLoadingCouriers(true);
  try {
    const response = await fetch(`/api/admin/orders/${order.id}/shipping-options`);
    const data = await response.json();

    if (data.success) {
      setAvailableCouriers(data.options);

      // Pre-select customer's choice
      const customerChoice = data.options.find((opt: CourierOption) => opt.isCustomerChoice);
      setSelectedCourier(customerChoice || data.options[0]);
    }
  } catch (error) {
    console.error('Failed to load courier options:', error);
    toast({
      title: 'Error',
      description: 'Failed to load courier options',
      variant: 'destructive',
    });
  } finally {
    setLoadingCouriers(false);
  }
};
```

#### 1.4 Update Quote Handler

```typescript
const handleGetQuote = async () => {
  if (!selectedCourier || !pickupDate) return;

  setIsGettingQuote(true);
  try {
    const response = await fetch(`/api/admin/orders/${order.id}/fulfill/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: selectedCourier.serviceId,  // ← Use selected courier!
        pickupDate,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setQuoteData(data.quote);
      setCurrentStep('PRICE_CONFIRMATION');
    }
  } finally {
    setIsGettingQuote(false);
  }
};
```

#### 1.5 Update Payment Confirmation

```typescript
const handleConfirmPayment = async () => {
  if (!quoteData || !selectedCourier) return;

  // Calculate override flag dynamically
  const isOverride = selectedCourier.serviceId !== order.selectedCourierServiceId;

  await onConfirm(pickupDate, quoteData.shipmentId, {
    overriddenByAdmin: isOverride,  // ← Dynamic flag!
    selectedServiceId: selectedCourier.serviceId,
  });
};
```

#### 1.6 Update Parent Component Handler

**File**: `src/app/admin/orders/[orderId]/page.tsx` (Line 170-207)

```typescript
const handleConfirmFulfillment = async (
  pickupDate: string,
  shipmentId?: string,
  options?: {
    overriddenByAdmin?: boolean;
    selectedServiceId?: string;
  }
) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupDate,
        shipmentId,
        overriddenByAdmin: options?.overriddenByAdmin || false,  // ← Use passed value
        adminOverrideReason: null,
      }),
    });

    // ... rest of handler
  }
};
```

**Also Update**: `src/components/admin/orders/OrderTable.tsx` (Line 109-151) with same pattern.

---

### Phase 2: UI Components

#### 2.1 Step 1 Render Function

```typescript
const renderStep1 = () => (
  <>
    <DialogHeader>
      <DialogTitle>Select Courier & Pickup Date</DialogTitle>
      <DialogDescription>
        Choose the courier and schedule the pickup date for this shipment
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Customer's Original Selection */}
      {order.courierName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Label className="text-sm font-medium text-blue-900">
            Customer Selected:
          </Label>
          <p className="text-blue-800 font-semibold mt-1">
            ✓ {order.courierName} - RM {parseFloat(order.shippingCost).toFixed(2)}
          </p>
        </div>
      )}

      {/* Courier Override Dropdown */}
      <div>
        <Label htmlFor="courier-select">
          Change Courier (Optional):
        </Label>

        {loadingCouriers ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">
              Loading available couriers...
            </span>
          </div>
        ) : (
          <Select
            value={selectedCourier?.serviceId || ''}
            onValueChange={(serviceId) => {
              const courier = availableCouriers.find(c => c.serviceId === serviceId);
              if (courier) setSelectedCourier(courier);
            }}
          >
            <SelectTrigger id="courier-select" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCouriers.map((courier) => (
                <SelectItem key={courier.serviceId} value={courier.serviceId}>
                  {courier.courierName} - RM {courier.cost.toFixed(2)}
                  {courier.isCustomerChoice && ' (Customer Choice)'}
                  {courier.cost < parseFloat(order.shippingCost || '0') && ' 💰 CHEAPER'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Cost Difference Indicator */}
        {selectedCourier && !selectedCourier.isCustomerChoice && (
          <p className="text-xs mt-2">
            {selectedCourier.cost < parseFloat(order.shippingCost || '0') ? (
              <span className="text-green-600 font-medium">
                💰 Save RM {(parseFloat(order.shippingCost || '0') - selectedCourier.cost).toFixed(2)} vs customer selection
              </span>
            ) : selectedCourier.cost > parseFloat(order.shippingCost || '0') ? (
              <span className="text-orange-600 font-medium">
                ⚠️ RM {(selectedCourier.cost - parseFloat(order.shippingCost || '0')).toFixed(2)} more expensive
              </span>
            ) : null}
          </p>
        )}
      </div>

      {/* Pickup Date (existing code) */}
      <div>
        <Label htmlFor="pickup-date">Pickup Date:</Label>
        <Input
          id="pickup-date"
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1"
        />
      </div>

      {/* Info Message */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          ℹ️ Prices shown are current EasyParcel rates. Final price will be confirmed in the next step.
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button onClick={handleClose} variant="outline">
        Cancel
      </Button>
      <Button
        onClick={handleGetQuote}
        disabled={!selectedCourier || !pickupDate || isGettingQuote}
      >
        {isGettingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Next: Get Quote
      </Button>
    </DialogFooter>
  </>
);
```

#### 2.2 Step 2 Enhancement (Add Override Indicator)

```typescript
const renderStep2 = () => {
  const isOverride = selectedCourier?.serviceId !== order.selectedCourierServiceId;
  const savedAmount = parseFloat(order.shippingCost || '0') - (quoteData?.price || 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Shipment Details</DialogTitle>
        <DialogDescription>
          Review the shipping quote and confirm payment
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Quote Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium">
            ✅ Shipping quote retrieved successfully
          </p>
        </div>

        {/* Price Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Shipping Cost:</span>
            <span className="text-2xl font-bold text-gray-900">
              RM {quoteData?.price?.toFixed(2)}
            </span>
          </div>

          {/* Savings Indicator */}
          {savedAmount > 0 && (
            <p className="text-sm text-green-600 font-medium mt-2">
              💰 You saved RM {savedAmount.toFixed(2)} vs customer selection
            </p>
          )}
          {savedAmount < 0 && (
            <p className="text-sm text-orange-600 font-medium mt-2">
              ⚠️ Business absorbing RM {Math.abs(savedAmount).toFixed(2)} extra cost
            </p>
          )}
        </div>

        {/* Shipment Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Courier:</span>
            <span className="font-medium">
              {quoteData?.courierName}
              {isOverride && (
                <span className="ml-2 text-orange-600 text-xs">
                  ⚠️ Admin Override
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Type:</span>
            <span className="font-medium">{quoteData?.serviceType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pickup Date:</span>
            <span className="font-medium">
              {new Date(pickupDate).toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Override Warning */}
        {isOverride && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              ⚠️ You are overriding the customer's courier selection.
              Original: <strong>{order.courierName}</strong>
            </p>
          </div>
        )}

        {/* Payment Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Confirming will process payment with EasyParcel and cannot be undone.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleBackToStep1} variant="outline">
          Back
        </Button>
        <Button onClick={handleConfirmPayment} disabled={isProcessing}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & Pay RM {quoteData?.price?.toFixed(2)}
        </Button>
      </DialogFooter>
    </>
  );
};
```

---

## Testing Plan

### Unit Tests

#### Test 1: Courier Loading
```typescript
describe('FulfillmentConfirmDialog - Courier Loading', () => {
  it('should load available couriers on dialog open', async () => {
    const { getByText } = render(<FulfillmentConfirmDialog open={true} order={mockOrder} />);

    await waitFor(() => {
      expect(getByText('City-Link Express - RM 5.50 (Customer Choice)')).toBeInTheDocument();
      expect(getByText('J&T Express - RM 5.30 💰 CHEAPER')).toBeInTheDocument();
    });
  });

  it('should pre-select customer choice by default', async () => {
    const { getByRole } = render(<FulfillmentConfirmDialog open={true} order={mockOrder} />);

    const select = getByRole('combobox');
    expect(select).toHaveValue('abc123'); // City-Link service ID
  });
});
```

#### Test 2: Override Detection
```typescript
describe('FulfillmentConfirmDialog - Override Detection', () => {
  it('should set overriddenByAdmin to true when courier changes', async () => {
    const mockOnConfirm = jest.fn();
    const { getByRole, getByText } = render(
      <FulfillmentConfirmDialog
        open={true}
        order={mockOrder}
        onConfirm={mockOnConfirm}
      />
    );

    // Change courier
    const select = getByRole('combobox');
    fireEvent.change(select, { target: { value: 'xyz789' } }); // J&T

    // Get quote
    fireEvent.click(getByText('Next: Get Quote'));

    // Confirm payment
    await waitFor(() => getByText('Confirm & Pay'));
    fireEvent.click(getByText('Confirm & Pay'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        overriddenByAdmin: true,
        selectedServiceId: 'xyz789'
      })
    );
  });

  it('should set overriddenByAdmin to false when keeping customer choice', async () => {
    const mockOnConfirm = jest.fn();
    const { getByText } = render(
      <FulfillmentConfirmDialog
        open={true}
        order={mockOrder}
        onConfirm={mockOnConfirm}
      />
    );

    // Don't change courier, use default (customer's choice)

    // Get quote
    fireEvent.click(getByText('Next: Get Quote'));

    // Confirm payment
    await waitFor(() => getByText('Confirm & Pay'));
    fireEvent.click(getByText('Confirm & Pay'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        overriddenByAdmin: false,
        selectedServiceId: 'abc123'
      })
    );
  });
});
```

#### Test 3: Cost Indicators
```typescript
describe('FulfillmentConfirmDialog - Cost Indicators', () => {
  it('should show savings indicator for cheaper courier', () => {
    const { getByText } = render(<FulfillmentConfirmDialog open={true} order={mockOrder} />);

    // Select J&T (RM 5.30, cheaper than City-Link RM 5.50)
    // ... select J&T ...

    expect(getByText(/💰 Save RM 0.20 vs customer selection/)).toBeInTheDocument();
  });

  it('should show warning indicator for more expensive courier', () => {
    const { getByText } = render(<FulfillmentConfirmDialog open={true} order={mockOrder} />);

    // Select Poslaju (RM 6.00, more expensive than City-Link RM 5.50)
    // ... select Poslaju ...

    expect(getByText(/⚠️ RM 0.50 more expensive/)).toBeInTheDocument();
  });
});
```

### Integration Tests

#### Test 4: End-to-End Flow
```typescript
describe('Admin Courier Override - E2E', () => {
  it('should complete full override flow', async () => {
    // 1. Open dialog
    await page.click('[data-testid="fulfill-order-button"]');

    // 2. Wait for couriers to load
    await page.waitForSelector('select[id="courier-select"]');

    // 3. Verify customer's choice is pre-selected
    const selectedValue = await page.$eval('select[id="courier-select"]', el => el.value);
    expect(selectedValue).toBe('abc123'); // City-Link

    // 4. Change to J&T
    await page.selectOption('select[id="courier-select"]', 'xyz789');

    // 5. Verify savings indicator
    await page.waitForSelector('text=/💰 Save RM 0.20/');

    // 6. Select pickup date
    await page.fill('input[type="date"]', '2025-10-18');

    // 7. Get quote
    await page.click('button:has-text("Next: Get Quote")');

    // 8. Wait for Step 2
    await page.waitForSelector('text=/Confirm & Pay/');

    // 9. Verify override indicator
    await page.waitForSelector('text=/⚠️ Admin Override/');

    // 10. Confirm payment
    await page.click('button:has-text("Confirm & Pay")');

    // 11. Verify success
    await page.waitForSelector('text=/Order fulfilled successfully/');

    // 12. Verify database update
    const order = await prisma.order.findUnique({ where: { id: 'order_123' } });
    expect(order.courierName).toBe('J&T Express');
    expect(order.overriddenByAdmin).toBe(true);
    expect(order.shippingCost).toBe('5.50'); // Unchanged
    expect(order.shippingCostCharged).toBe('5.30'); // New cost
  });
});
```

### API Tests

#### Test 5: Override Flag Persistence
```typescript
describe('Fulfillment API - Override Tracking', () => {
  it('should save override flag when courier changes', async () => {
    const response = await fetch('/api/admin/orders/order_123/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'xyz789',
        pickupDate: '2025-10-18',
        overriddenByAdmin: true,
        adminOverrideReason: null
      })
    });

    const data = await response.json();
    expect(data.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: 'order_123' } });
    expect(order.overriddenByAdmin).toBe(true);
    expect(order.adminNotes).toContain('Admin overrode courier selection');
  });

  it('should update courier fields correctly', async () => {
    await fetch('/api/admin/orders/order_123/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'xyz789',
        pickupDate: '2025-10-18',
        overriddenByAdmin: true
      })
    });

    const order = await prisma.order.findUnique({ where: { id: 'order_123' } });

    expect(order.selectedCourierServiceId).toBe('xyz789');
    expect(order.courierName).toBe('J&T Express');
    expect(order.shippingCost.toString()).toBe('5.50'); // Original
    expect(order.shippingCostCharged.toString()).toBe('5.30'); // New
  });
});
```

### Manual Testing Checklist

- [ ] Dialog opens and loads couriers successfully
- [ ] Customer's choice is pre-selected by default
- [ ] Changing courier shows correct cost difference
- [ ] Cheaper courier shows green savings indicator
- [ ] More expensive courier shows orange warning
- [ ] Pickup date validation works
- [ ] "Get Quote" button disabled without courier/date
- [ ] Step 2 shows override indicator when courier changed
- [ ] Step 2 shows correct final price
- [ ] "Back" button returns to Step 1 with selections preserved
- [ ] Payment processes successfully
- [ ] Database updates with correct courier information
- [ ] `overriddenByAdmin` flag set correctly
- [ ] Admin notes contain override details
- [ ] Email sent to customer with new courier info
- [ ] Order status changes to READY_TO_SHIP

---

## Edge Cases

### Edge Case 1: Two-Step Flow Incompatibility

**Problem**: If courier changes between Step 1 and Step 2, the `shipmentId` from quote won't match.

**Solution**: Courier selection happens BEFORE quote in Step 1, so `shipmentId` is always for the selected courier.

**Status**: ✅ Solved by design

---

### Edge Case 2: Shipping Options API Failure

**Scenario**: EasyParcel API fails to return courier rates.

**Handling**:
```typescript
const loadAvailableCouriers = async () => {
  setLoadingCouriers(true);
  try {
    const response = await fetch(`/api/admin/orders/${order.id}/shipping-options`);
    const data = await response.json();

    if (!data.success || !data.options) {
      throw new Error(data.message || 'Failed to load courier options');
    }

    setAvailableCouriers(data.options);
  } catch (error) {
    console.error('Failed to load courier options:', error);

    // Show error toast
    toast({
      title: 'Error Loading Couriers',
      description: 'Unable to fetch courier options. Please try again or contact support.',
      variant: 'destructive',
    });

    // Fallback: Use customer's original selection only
    if (order.selectedCourierServiceId && order.courierName) {
      setAvailableCouriers([{
        serviceId: order.selectedCourierServiceId,
        courierName: order.courierName,
        cost: parseFloat(order.shippingCost || '0'),
        estimatedDays: 'N/A',
        isCustomerChoice: true
      }]);
      setSelectedCourier(availableCouriers[0]);
    }
  } finally {
    setLoadingCouriers(false);
  }
};
```

---

### Edge Case 3: Price Discrepancy (Quote vs Actual)

**Scenario**: Price in `shipping-options` differs from `fulfill/quote`.

**Expected Behavior**:
- Step 1 shows approximate price from `shipping-options` (for comparison)
- Step 2 shows exact price from `fulfill/quote` (actual EasyParcel quote)
- Always charge the Step 2 price (source of truth)

**UI Messaging**:
```
Step 1: "ℹ️ Prices shown are current EasyParcel rates. Final price will be confirmed in the next step."
Step 2: "Shipping Cost: RM 5.30" (exact quote)
```

---

### Edge Case 4: Customer Email Notification

**Problem**: Customer receives email with different courier than they selected.

**Solution**: Update email template to include override notice.

**File**: `src/app/api/admin/orders/[orderId]/fulfill/route.ts` (Lines 537-575)

**Email Template Enhancement**:
```typescript
// Add to email template when overriddenByAdmin === true
const emailTemplate = `
  <h2>Your Order Has Been Shipped</h2>
  <p>Order #${order.orderNumber} is on its way!</p>

  ${order.overriddenByAdmin ? `
    <div style="background-color: #FFF3CD; border: 1px solid #FFC107; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;">
        <strong>ℹ️ Note:</strong> Your selected courier (${originalCourierName}) was not available.
        We've arranged shipping with ${order.courierName} at no additional cost to you.
      </p>
    </div>
  ` : ''}

  <p><strong>Courier:</strong> ${order.courierName}</p>
  <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
  <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
`;
```

---

### Edge Case 5: Financial Discrepancy Tracking

**Problem**: No visibility into profit/loss when admin overrides.

**Optional Enhancement**: Add admin dashboard report.

**Query Example**:
```typescript
// Get orders with shipping cost variance
const ordersWithVariance = await prisma.order.findMany({
  where: {
    overriddenByAdmin: true,
    shippingCostCharged: { not: null }
  },
  select: {
    orderNumber: true,
    courierName: true,
    shippingCost: true,
    shippingCostCharged: true,
    createdAt: true
  }
});

// Calculate profit/loss
const report = ordersWithVariance.map(order => ({
  orderNumber: order.orderNumber,
  courier: order.courierName,
  customerPaid: order.shippingCost,
  actualCost: order.shippingCostCharged,
  variance: parseFloat(order.shippingCost) - parseFloat(order.shippingCostCharged || '0'),
  status: parseFloat(order.shippingCost) > parseFloat(order.shippingCostCharged || '0') ? 'PROFIT' : 'LOSS'
}));
```

**Status**: Not required for MVP, can be added later.

---

### Edge Case 6: Concurrent Admin Actions

**Scenario**: Two admins try to fulfill the same order simultaneously.

**Existing Protection** (from API):
```typescript
// route.ts already has status check
if (order.status !== 'PAID') {
  return NextResponse.json(
    { success: false, error: 'Order cannot be fulfilled in current status' },
    { status: 400 }
  );
}
```

**Status**: ✅ Already handled by backend validation.

---

## Rollout Plan

### Phase 1: Development (Week 1)
- [ ] Implement frontend changes in `FulfillmentConfirmDialog.tsx`
- [ ] Update parent component handlers (`page.tsx`, `OrderTable.tsx`)
- [ ] Add TypeScript interfaces and types
- [ ] Implement UI components (Step 1 & Step 2)
- [ ] Add loading states and error handling

### Phase 2: Testing (Week 2)
- [ ] Write unit tests for courier loading
- [ ] Write unit tests for override detection
- [ ] Write integration tests for API flow
- [ ] Manual testing with staging environment
- [ ] Test all edge cases
- [ ] Performance testing (API response times)

### Phase 3: Code Review (Week 2)
- [ ] Internal code review
- [ ] Security review (ensure no sensitive data exposure)
- [ ] UX review (verify indicators and messaging)
- [ ] Database query optimization review

### Phase 4: Staging Deployment (Week 3)
- [ ] Deploy to staging environment
- [ ] End-to-end testing with real EasyParcel API (sandbox)
- [ ] Test with various order scenarios
- [ ] Verify email notifications
- [ ] Load testing with concurrent users

### Phase 5: Production Deployment (Week 3)
- [ ] Deploy to production during low-traffic window
- [ ] Monitor error logs for 24 hours
- [ ] Monitor EasyParcel API response times
- [ ] Monitor database performance
- [ ] Collect user feedback from admin team

### Phase 6: Post-Launch (Week 4)
- [ ] Analyze override usage patterns
- [ ] Review financial impact (profit/loss from overrides)
- [ ] Gather admin feedback
- [ ] Plan Phase 2 enhancements (reporting, etc.)

---

## Success Metrics

### Technical Metrics
- **API Response Time**: < 2 seconds for `shipping-options` API
- **Error Rate**: < 1% for fulfillment flow
- **Database Query Performance**: < 100ms for order updates

### Business Metrics
- **Override Rate**: Track % of orders where admin changes courier
- **Cost Savings**: Track total RM saved/lost via overrides
- **Admin Satisfaction**: Collect feedback on new workflow

### User Experience Metrics
- **Time to Fulfill**: Measure average time from dialog open to payment
- **Error Recovery**: Track how often admins go "Back" to Step 1
- **Customer Complaints**: Monitor courier-related support tickets

---

## Rollback Plan

### If Critical Issues Arise

**Immediate Rollback**:
1. Revert frontend changes to `FulfillmentConfirmDialog.tsx`
2. Restore hardcoded `overriddenByAdmin: false` in parent handlers
3. Deploy rollback to production
4. Notify admin team of temporary reversion

**Database State**: No rollback needed (all fields already existed, no migration).

**API Compatibility**: Backend continues to work with old frontend (backward compatible).

---

## Future Enhancements

### Phase 2 (Optional)
1. **Admin Override Reason Field**
   - Add optional text input for `adminOverrideReason`
   - Require reason when selecting more expensive courier
   - Display reason in order history

2. **Shipping Cost Variance Report**
   - Dashboard showing profit/loss from overrides
   - Filter by date range, courier, admin user
   - Export to CSV for accounting

3. **Courier Availability Indicators**
   - Show real-time courier availability status
   - Display estimated pickup times
   - Highlight recommended couriers

4. **Bulk Courier Override**
   - Select multiple orders
   - Change courier for all at once
   - Useful for service disruptions

5. **Customer Notification Preferences**
   - Let customer opt-in to courier change notifications
   - Send SMS for major changes
   - Show change reason in tracking page

---

## Appendix

### A. File Structure

```
src/
├─ components/admin/orders/
│  ├─ FulfillmentConfirmDialog.tsx        ← Primary changes
│  └─ OrderTable.tsx                      ← Update handler
├─ app/admin/orders/
│  └─ [orderId]/page.tsx                  ← Update handler
└─ app/api/admin/orders/[orderId]/
   ├─ shipping-options/route.ts           ← Already exists
   ├─ fulfill/quote/route.ts              ← Already exists
   └─ fulfill/route.ts                    ← Already exists
```

### B. Key Constants

```typescript
// Minimum pickup date (today + 1 day)
const MIN_PICKUP_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

// Maximum pickup date (today + 30 days)
const MAX_PICKUP_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

// Cost difference threshold for warning (RM)
const COST_WARNING_THRESHOLD = 1.00;
```

### C. Error Messages

```typescript
const ERROR_MESSAGES = {
  COURIERS_LOAD_FAILED: 'Unable to fetch courier options. Please try again or contact support.',
  QUOTE_FAILED: 'Failed to get shipping quote. Please check your selection and try again.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again or contact support.',
  INVALID_PICKUP_DATE: 'Please select a valid pickup date (tomorrow or later).',
  NO_COURIER_SELECTED: 'Please select a courier before proceeding.',
};
```

### D. Related Documentation

- [EasyParcel API Documentation](https://docs.easyparcel.com)
- [Shipping Spec: Admin Fulfillment](claudedocs/shipping/spec/06-admin-fulfillment.md)
- [Database Schema](prisma/schema.prisma)
- [Coding Standards](claudedocs/CODING_STANDARDS.md)

---

## Approval & Sign-off

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Created By**: Claude (AI Assistant)
**Reviewed By**: _[Pending]_
**Approved By**: _[Pending]_

**Approval Checklist**:
- [ ] Technical approach validated
- [ ] Database impact understood
- [ ] API changes reviewed
- [ ] UI/UX design approved
- [ ] Testing plan accepted
- [ ] Rollout timeline confirmed
- [ ] Success metrics defined

---

**Ready for implementation!** 🚀
