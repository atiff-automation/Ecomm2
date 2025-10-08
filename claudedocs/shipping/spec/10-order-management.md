## Order Management Page Integration

**CRITICAL:** This section documents how the Order Detail page receives shipping data and displays it in the fulfillment widget for AWB creation.

---

### Overview: Order Detail Page Data Flow

```
1. Admin navigates to Order Detail page
   ↓
2. Page loads order data from database
   ↓
3. Order includes shipping fields (from checkout)
   ↓
4. FulfillmentWidget component receives order data
   ↓
5. Widget displays customer's selected courier
   ↓
6. Widget fetches alternative couriers (optional)
   ↓
7. Admin reviews/overrides courier selection
   ↓
8. Admin clicks "Book Shipment"
   ↓
9. API creates shipment with EasyParcel
   ↓
10. AWB/tracking number returned and stored
   ↓
11. Widget displays tracking info and label download
```

---

### 1. Order Detail Page Implementation

**File:** `src/app/admin/orders/[id]/page.tsx`

```typescript
import { prisma } from '@/lib/prisma';
import FulfillmentWidget from '@/components/admin/FulfillmentWidget';
import OrderSummary from '@/components/admin/OrderSummary';

interface OrderDetailPageProps {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Fetch complete order data including shipping fields
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true // Need product details for weight calculation
        }
      },
      user: true // Customer info
    }
  });

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="order-detail-layout">
      {/* Main Content Area */}
      <div className="order-main">
        <OrderSummary order={order} />

        {/* Order Items */}
        <OrderItemsList items={order.items} />

        {/* Customer Details */}
        <CustomerInfo order={order} />
      </div>

      {/* Sidebar - Fulfillment Widget */}
      <aside className="order-sidebar">
        {/* CRITICAL: Pass complete order data to FulfillmentWidget */}
        <FulfillmentWidget
          order={order}
          onFulfillmentSuccess={(tracking) => {
            // Refresh page or update state
            window.location.reload();
          }}
        />
      </aside>
    </div>
  );
}
```

**Key Points:**
- ✅ Fetch order with `include: { items: { include: { product: true } } }`
- ✅ Pass complete order object to FulfillmentWidget
- ✅ Order contains all shipping fields from checkout
- ✅ Widget has access to customer's selected courier

---

### 2. FulfillmentWidget Component (Complete Implementation)

**File:** `src/components/admin/FulfillmentWidget.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Order } from '@prisma/client';
import { getNextBusinessDay } from '@/lib/shipping/date-utils';
import { MALAYSIAN_STATES } from '@/lib/shipping/constants';

interface FulfillmentWidgetProps {
  order: Order & {
    items: Array<{
      product: { name: string; weight: number };
      quantity: number;
    }>;
  };
  onFulfillmentSuccess?: (trackingNumber: string) => void;
}

interface CourierOption {
  serviceId: string;
  courierName: string;
  serviceType: string;
  cost: number;
  estimatedDays: string;
  recommended?: boolean;
}

export default function FulfillmentWidget({
  order,
  onFulfillmentSuccess
}: FulfillmentWidgetProps) {
  // State management
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'fulfilling' | 'fulfilled' | 'error';
    courierOptions: CourierOption[];
    selectedCourier: CourierOption | null;
    pickupDate: string;
    error: string | null;
  }>({
    status: 'idle',
    courierOptions: [],
    selectedCourier: null,
    pickupDate: getNextBusinessDay().toISOString().split('T')[0],
    error: null
  });

  // Load order's shipping data and courier options on mount
  useEffect(() => {
    loadShippingData();
  }, [order.id]);

  const loadShippingData = async () => {
    setState(prev => ({ ...prev, status: 'loading' }));

    try {
      // CRITICAL: Fetch alternative couriers for this order
      const response = await fetch(`/api/admin/orders/${order.id}/shipping-options`);
      const data = await response.json();

      if (data.success) {
        // Set customer's original selection
        const customerSelection = data.options.find(
          opt => opt.serviceId === order.selectedCourierServiceId
        ) || data.options[0];

        setState(prev => ({
          ...prev,
          status: 'idle',
          courierOptions: data.options,
          selectedCourier: customerSelection
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: data.message || 'Failed to load courier options'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'Network error: Unable to load courier options'
      }));
    }
  };

  const handleFulfill = async () => {
    if (!state.selectedCourier) {
      setState(prev => ({ ...prev, error: 'Please select a courier' }));
      return;
    }

    setState(prev => ({ ...prev, status: 'fulfilling', error: null }));

    try {
      // CRITICAL: Create shipment with EasyParcel
      const response = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: state.selectedCourier.serviceId,
          pickupDate: state.pickupDate,
          overriddenByAdmin: state.selectedCourier.serviceId !== order.selectedCourierServiceId,
          overrideReason: state.selectedCourier.serviceId !== order.selectedCourierServiceId
            ? `Admin selected ${state.selectedCourier.courierName} instead of ${order.courierName}`
            : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, status: 'fulfilled' }));

        // Callback to parent
        if (onFulfillmentSuccess) {
          onFulfillmentSuccess(data.shipment.trackingNumber);
        }
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: data.message || 'Fulfillment failed'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'Network error: Unable to create shipment'
      }));
    }
  };

  // Calculate destination summary
  const getDestinationSummary = () => {
    const address = order.shippingAddress as any;
    const stateName = MALAYSIAN_STATES[address.state] || address.state;
    return `${stateName}, ${address.postalCode}`;
  };

  // Render different states
  if (order.status === 'READY_TO_SHIP' || order.status === 'IN_TRANSIT' || order.status === 'DELIVERED') {
    return <FulfilledState order={order} />;
  }

  if (order.status !== 'PAID') {
    return (
      <div className="fulfillment-widget">
        <p>Order must be PAID before fulfillment</p>
      </div>
    );
  }

  return (
    <div className="fulfillment-widget">
      <h3>📦 Shipping & Fulfillment</h3>

      {state.status === 'loading' ? (
        <LoadingState />
      ) : state.status === 'fulfilling' ? (
        <FulfillingState />
      ) : state.status === 'error' ? (
        <ErrorState error={state.error} onRetry={loadShippingData} />
      ) : (
        <>
          {/* Customer's Selection */}
          <div className="customer-selection">
            <label>Customer Selected:</label>
            <p>
              <strong>{order.courierName || 'Not selected'}</strong> - RM {order.shippingCost}
            </p>
          </div>

          <hr />

          {/* Admin Courier Override */}
          <div className="courier-override">
            <label>Change Courier (Optional):</label>
            <select
              value={state.selectedCourier?.serviceId || ''}
              onChange={(e) => {
                const courier = state.courierOptions.find(
                  opt => opt.serviceId === e.target.value
                );
                setState(prev => ({ ...prev, selectedCourier: courier || null }));
              }}
            >
              {state.courierOptions.map(option => (
                <option key={option.serviceId} value={option.serviceId}>
                  {option.courierName} - RM {option.cost}
                  {option.recommended && ' (Recommended)'}
                </option>
              ))}
            </select>

            <p className="help-text">
              ℹ️ You can select a different courier if customer's choice is unavailable
            </p>
          </div>

          <hr />

          {/* Pickup Date */}
          <div className="pickup-date">
            <label>Pickup Date: *</label>
            <input
              type="date"
              value={state.pickupDate}
              onChange={(e) => setState(prev => ({ ...prev, pickupDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="help-text">ℹ️ Default: Next business day</p>
          </div>

          <hr />

          {/* Shipment Summary */}
          <div className="shipment-summary">
            <h4>Shipment Summary:</h4>
            <ul>
              <li>Destination: {getDestinationSummary()}</li>
              <li>Weight: {order.shippingWeight} kg</li>
              <li>Estimated Delivery: {state.selectedCourier?.estimatedDays || 'N/A'}</li>
            </ul>
          </div>

          {/* Fulfill Button */}
          <button
            className="btn-primary btn-fulfill"
            onClick={handleFulfill}
            disabled={!state.selectedCourier}
          >
            Book Shipment with EasyParcel
          </button>
        </>
      )}
    </div>
  );
}

// Sub-components for different states
function FulfilledState({ order }: { order: Order }) {
  return (
    <div className="fulfillment-widget fulfilled">
      <h3>✅ Shipment Booked Successfully</h3>

      <hr />

      <div className="tracking-info">
        <p><strong>Courier:</strong> {order.courierName}</p>
        <p><strong>Service:</strong> {order.courierServiceType}</p>

        <div className="tracking-number">
          <label>Tracking Number:</label>
          <div className="copy-field">
            <code>{order.trackingNumber}</code>
            <button onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}>
              📋 Copy
            </button>
          </div>
        </div>

        <div className="awb-number">
          <label>AWB Number:</label>
          <code>{order.awbNumber}</code>
        </div>
      </div>

      <hr />

      <div className="pickup-details">
        <p><strong>Pickup Date:</strong> {order.scheduledPickupDate?.toLocaleDateString()}</p>
        <p><strong>Status:</strong> Scheduled</p>
      </div>

      <hr />

      <div className="quick-actions">
        <a href={order.labelUrl!} target="_blank" className="btn">
          Download AWB
        </a>
        <button className="btn">View Tracking</button>
        <button onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}>
          Copy URL
        </button>
      </div>

      <hr />

      <div className="customer-notification">
        <p>✓ Order confirmation sent</p>
        <p>✓ Tracking information sent</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="loading">⏳ Loading shipping options...</div>;
}

function FulfillingState() {
  return (
    <div className="fulfilling">
      <p>⏳ Booking Shipment...</p>
      <div className="progress-bar">
        <div className="progress"></div>
      </div>
      <ul className="steps">
        <li>✓ Validating details...</li>
        <li>⏳ Creating shipment...</li>
        <li>⋯ Generating AWB...</li>
        <li>⋯ Downloading label...</li>
      </ul>
      <p className="warning">Please wait, do not close this page.</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="error-state">
      <p>❌ {error || 'An error occurred'}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
```

---

### 3. Fetching Alternative Couriers API

**File:** `src/app/api/admin/orders/[id]/shipping-options/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { easyParcelClient } from '@/lib/shipping/easyparcel';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ MANDATORY: Authentication & Authorization Check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      }, { status: 403 });
    }

    // ✅ Validate orderId format (basic check)
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Valid order ID is required'
      }, { status: 400 });
    }

    // Fetch order with shipping data
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        shippingAddress: true,
        shippingWeight: true,
        subtotal: true,
        selectedCourierServiceId: true,
        courierName: true,
        status: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Order must be PAID to fetch courier options'
      }, { status: 400 });
    }

    // Fetch fresh courier options from EasyParcel
    const courierOptions = await easyParcelClient.getRates({
      destination: order.shippingAddress,
      weight: order.shippingWeight,
      orderValue: order.subtotal
    });

    // Mark cheaper alternatives as recommended
    const customerCost = courierOptions.find(
      opt => opt.serviceId === order.selectedCourierServiceId
    )?.cost || 0;

    const optionsWithRecommendations = courierOptions.map(opt => ({
      ...opt,
      recommended: opt.cost < customerCost && opt.serviceId !== order.selectedCourierServiceId
    }));

    return NextResponse.json({
      success: true,
      options: optionsWithRecommendations,
      customerSelection: {
        serviceId: order.selectedCourierServiceId,
        courierName: order.courierName
      }
    });

  } catch (error) {
    console.error('[ShippingOptions] Error:', {
      orderId: params.id,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch courier options'
    }, { status: 500 });
  }
}
```

---

### 4. Fulfillment API (Creating AWB)

**File:** `src/app/api/admin/orders/[id]/fulfill/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { easyParcelClient } from '@/lib/shipping/easyparcel';
import { sendTrackingEmail } from '@/lib/email';

// ✅ MANDATORY: Zod validation schema
const FulfillRequestSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required").max(100),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pickup date must be YYYY-MM-DD format"),
  overriddenByAdmin: z.boolean().default(false),
  overrideReason: z.string().max(500).optional()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ MANDATORY: Authentication & Authorization Check
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      }, { status: 403 });
    }

    // ✅ LAYER 2: API Validation with Zod
    const body = await request.json();
    const validation = FulfillRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { serviceId, pickupDate, overriddenByAdmin, overrideReason } = validation.data;

    // ✅ Validate orderId format
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Valid order ID is required'
      }, { status: 400 });
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { product: true }
        },
        user: true // For email notification
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Validation: Check if already fulfilled
    if (order.trackingNumber) {
      return NextResponse.json({
        success: false,
        error: 'ALREADY_FULFILLED',
        message: 'Order already has tracking number'
      }, { status: 400 });
    }

    // Validation: Order must be PAID
    if (order.status !== 'PAID') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Order must be PAID to fulfill'
      }, { status: 400 });
    }

    // Get pickup address from SystemConfig
    const pickupAddress = await getPickupAddress();

    // CRITICAL: Create shipment with EasyParcel (external API call)
    const shipmentResponse = await easyParcelClient.createShipment({
      serviceId,
      pickupDate,
      order,
      sender: pickupAddress,
      receiver: order.shippingAddress
    });

    // CRITICAL: Update order with tracking info
    // Note: If this fails after shipment creation, we have orphaned shipment
    // Consider implementing compensation logic or manual reconciliation process
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'READY_TO_SHIP',
        trackingNumber: shipmentResponse.trackingNumber,
        awbNumber: shipmentResponse.awbNumber,
        labelUrl: shipmentResponse.labelUrl,
        courierName: shipmentResponse.courierName,
        courierServiceType: shipmentResponse.serviceType,
        fulfilledAt: new Date(),
        scheduledPickupDate: new Date(pickupDate),
        overriddenByAdmin,
        adminOverrideReason: overrideReason,
        failedBookingAttempts: 0, // Reset on success
        lastBookingError: null // Clear error
      }
    });

    // Send tracking email to customer (fire and forget - don't block response)
    sendTrackingEmail(updatedOrder).catch(err => {
      console.error('[Fulfillment] Failed to send tracking email:', {
        orderId: order.id,
        error: err
      });
    });

    console.log('[Fulfillment] Success:', {
      orderId: order.id,
      trackingNumber: shipmentResponse.trackingNumber,
      courier: shipmentResponse.courierName,
      admin: session.user.email
    });

    return NextResponse.json({
      success: true,
      shipment: {
        trackingNumber: shipmentResponse.trackingNumber,
        awbNumber: shipmentResponse.awbNumber,
        courierName: shipmentResponse.courierName,
        serviceType: shipmentResponse.serviceType,
        labelUrl: shipmentResponse.labelUrl,
        estimatedDelivery: shipmentResponse.estimatedDays
      }
    });

  } catch (error) {
    console.error('[Fulfillment] Error:', {
      orderId: params.id,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Update failed attempt counter
    try {
      await prisma.order.update({
        where: { id: params.id },
        data: {
          failedBookingAttempts: { increment: 1 },
          lastBookingError: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } catch (dbError) {
      console.error('[Fulfillment] Failed to update error counter:', dbError);
    }

    // User-friendly error response
    return NextResponse.json({
      success: false,
      error: 'FULFILLMENT_FAILED',
      message: 'Failed to create shipment. Please try again or contact support.'
    }, { status: 500 });
  }
}

async function getPickupAddress() {
  const settings = await prisma.systemConfig.findUnique({
    where: { key: 'easyparcel_settings' }
  });

  if (!settings) {
    throw new Error('EasyParcel settings not configured');
  }

  const config = JSON.parse(settings.value);

  if (!config.pickupAddress) {
    throw new Error('Pickup address not configured');
  }

  return config.pickupAddress;
}
```

---

### 5. Complete Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CHECKOUT: Customer selects courier                      │
│    → Order created with selectedCourierServiceId            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ORDER DETAIL PAGE: Admin opens order                    │
│    → Fetch order from database (includes shipping fields)  │
│    → Pass order to FulfillmentWidget component             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FULFILLMENT WIDGET: Display shipping data               │
│    → Show customer's selected courier from order record    │
│    → Fetch alternative couriers via API                    │
│    → Display courier override dropdown                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ADMIN ACTION: Click "Book Shipment"                     │
│    → POST /api/admin/orders/{id}/fulfill                   │
│    → Send serviceId, pickupDate to API                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. FULFILLMENT API: Create shipment with EasyParcel        │
│    → Call EasyParcel API with order details                │
│    → Receive trackingNumber, awbNumber, labelUrl           │
│    → Update order record with tracking info                │
│    → Change status to READY_TO_SHIP                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. WIDGET UPDATE: Display fulfillment success              │
│    → Show tracking number                                  │
│    → Show AWB number                                       │
│    → Provide label download link                           │
│    → Display pickup date                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Key Integration Points Checklist

- [ ] **Order Detail Page**
  - [ ] Fetch order with `include: { items: { include: { product: true } } }`
  - [ ] Pass complete order object to FulfillmentWidget
  - [ ] Handle fulfillment success callback

- [ ] **FulfillmentWidget Component**
  - [ ] Display customer's selected courier from `order.courierName`
  - [ ] Display shipping cost from `order.shippingCost`
  - [ ] Fetch alternative couriers on mount
  - [ ] Handle courier selection changes
  - [ ] Handle pickup date selection
  - [ ] Handle fulfillment button click
  - [ ] Display AWB/tracking after fulfillment

- [ ] **API Endpoints**
  - [ ] GET `/api/admin/orders/{id}/shipping-options` - Fetch alternatives
  - [ ] POST `/api/admin/orders/{id}/fulfill` - Create shipment
  - [ ] Both endpoints validate order status = PAID
  - [ ] Both endpoints check if already fulfilled

- [ ] **Database Updates**
  - [ ] Order status: PAID → READY_TO_SHIP
  - [ ] Store trackingNumber, awbNumber, labelUrl
  - [ ] Store scheduledPickupDate
  - [ ] Store overriddenByAdmin flag if courier changed
  - [ ] Set fulfilledAt timestamp

- [ ] **Email Notifications**
  - [ ] Send tracking email after fulfillment
  - [ ] Include tracking number and courier info
  - [ ] Include estimated delivery time

---
