## API Endpoints

### 1. Calculate Shipping Rate

**Endpoint:** `POST /api/shipping/calculate`

**Request:**
```json
{
  "deliveryAddress": {
    "name": "John Doe",
    "phone": "+60123456789",
    "addressLine1": "No. 123, Jalan Example",
    "addressLine2": "Taman Example",
    "city": "Kuala Lumpur",
    "state": "sgr",
    "postalCode": "50000"
  },
  "items": [
    {
      "productId": "prod_123",
      "name": "Product A",
      "quantity": 2,
      "weight": 0.5,
      "price": 50.00
    }
  ],
  "orderValue": 130.00
}
```

**Response (Success - "Cheapest Courier" strategy):**
```json
{
  "success": true,
  "shipping": {
    "available": true,
    "options": [
      {
        "serviceId": "123",
        "courierName": "City-Link Express",
        "serviceType": "Pick-up",
        "cost": 5.50,
        "originalCost": 5.50,
        "freeShipping": false,
        "estimatedDays": "2-3 working days"
      }
    ],
    "totalWeight": 1.0,
    "strategyApplied": "cheapest"
  }
}
```

**Response (Success - "Show All Couriers" strategy):**
```json
{
  "success": true,
  "shipping": {
    "available": true,
    "options": [
      {
        "serviceId": "123",
        "courierName": "City-Link Express",
        "serviceType": "Pick-up",
        "cost": 5.50,
        "estimatedDays": "2-3 working days"
      },
      {
        "serviceId": "456",
        "courierName": "J&T Express",
        "serviceType": "Pick-up",
        "cost": 5.80,
        "estimatedDays": "2-3 working days"
      },
      {
        "serviceId": "789",
        "courierName": "Skynet",
        "serviceType": "Pick-up",
        "cost": 6.00,
        "estimatedDays": "1-2 working days"
      }
    ],
    "totalWeight": 1.0,
    "strategyApplied": "all"
  }
}
```

**Response (Success - "Selected Couriers" strategy, only 2 available):**
```json
{
  "success": true,
  "shipping": {
    "available": true,
    "options": [
      {
        "serviceId": "123",
        "courierName": "City-Link Express",
        "serviceType": "Pick-up",
        "cost": 5.50,
        "estimatedDays": "2-3 working days"
      },
      {
        "serviceId": "789",
        "courierName": "Skynet",
        "serviceType": "Pick-up",
        "cost": 6.00,
        "estimatedDays": "1-2 working days"
      }
    ],
    "totalWeight": 1.0,
    "strategyApplied": "selected"
  }
}
```

**Response (Free Shipping):**
```json
{
  "success": true,
  "shipping": {
    "available": true,
    "courierName": "J&T Express",
    "serviceType": "Pick-up",
    "cost": 0.00,
    "originalCost": 10.00,
    "freeShipping": true,
    "savedAmount": 10.00,
    "estimatedDays": "2-3 working days",
    "totalWeight": 1.0
  }
}
```

**Response (No Couriers):**
```json
{
  "success": false,
  "error": "NO_COURIERS_AVAILABLE",
  "message": "Sorry, we cannot ship to this address.",
  "shipping": {
    "available": false
  }
}
```

### 2. Get Available Couriers (Admin Setup)

**Endpoint:** `GET /api/admin/shipping/couriers`

**Headers:** `Authorization: Bearer {admin_token}`

**Purpose:** Populate admin's courier selection checkbox list

**Response:**
```json
{
  "success": true,
  "couriers": [
    {
      "courierId": "123",
      "name": "City-Link Express",
      "shortName": "CityLink",
      "logoUrl": "https://..."
    },
    {
      "courierId": "456",
      "name": "J&T Express",
      "shortName": "J&T",
      "logoUrl": "https://..."
    },
    {
      "courierId": "789",
      "name": "Skynet",
      "shortName": "Skynet",
      "logoUrl": "https://..."
    }
  ]
}
```

**Implementation:** Calls EasyParcel `getCourierList()` API

---

### 3. Get EasyParcel Credit Balance (Feature #6)

**Endpoint:** `GET /api/admin/shipping/balance`

**Headers:** `Authorization: Bearer {admin_token}`

**Purpose:** Fetch current EasyParcel account balance

**Response:**
```json
{
  "success": true,
  "balance": {
    "amount": 250.50,
    "currency": "MYR",
    "formatted": "RM 250.50",
    "lowBalance": false,
    "threshold": 50.00
  },
  "timestamp": "2025-10-07T14:30:00Z"
}
```

**Response (Low Balance Warning):**
```json
{
  "success": true,
  "balance": {
    "amount": 35.20,
    "currency": "MYR",
    "formatted": "RM 35.20",
    "lowBalance": true,
    "threshold": 50.00,
    "warning": "Your balance is running low. Top up to avoid fulfillment failures."
  },
  "timestamp": "2025-10-07T14:30:00Z"
}
```

**Caching:** Cache balance for 5 minutes to reduce API calls

**Best Practices:**
- Call on admin shipping page load
- Call before fulfillment (validate sufficient balance)
- Refresh on manual "Refresh Balance" button click
- Store in SystemConfig after fetch

---

### 4. Get Available Couriers for Order (Feature #1 - Admin Override)

**Endpoint:** `GET /api/admin/orders/{orderId}/shipping-options`

**Headers:** `Authorization: Bearer {admin_token}`

**Purpose:** Get fresh courier rates for admin override dropdown

**Response:**
```json
{
  "success": true,
  "orderId": "ord_123",
  "customerSelected": {
    "serviceId": "123",
    "courierName": "City-Link Express",
    "cost": 5.50,
    "estimatedDays": "2-3 working days",
    "selectedAtCheckout": true
  },
  "alternatives": [
    {
      "serviceId": "456",
      "courierName": "J&T Express",
      "cost": 5.30,
      "estimatedDays": "2-3 working days",
      "recommended": true,
      "reason": "Cheaper option available"
    },
    {
      "serviceId": "789",
      "courierName": "Skynet",
      "cost": 6.00,
      "estimatedDays": "1-2 working days"
    },
    {
      "serviceId": "101",
      "courierName": "Poslaju",
      "cost": 7.00,
      "estimatedDays": "1-2 working days"
    }
  ],
  "destination": {
    "state": "sgr",
    "postcode": "50000",
    "city": "Kuala Lumpur"
  },
  "weight": 2.5
}
```

**When to call:**
- When admin opens order detail page (if order status = PAID)
- When fulfillment widget loads
- On courier dropdown focus

**Error Handling:**
- If EasyParcel API fails, show customer's original selection only
- Display warning: "Unable to fetch alternative couriers, using customer's selection"

---

### 5. Get Shipping Settings

**Endpoint:** `GET /api/admin/shipping/settings`

**Headers:** `Authorization: Bearer {admin_token}`

**Response:**
```json
{
  "success": true,
  "settings": {
    "apiKey": "xxx***xxx",
    "environment": "production",
    "pickupAddress": {
      "businessName": "EcomJRM Store",
      "phone": "+60123456789",
      "addressLine1": "No. 123, Jalan Example",
      "addressLine2": "Level 5",
      "city": "Kuala Lumpur",
      "state": "kul",
      "postalCode": "50000"
    },
    "freeShipping": {
      "enabled": true,
      "threshold": 150.00
    }
  }
}
```

### 3. Update Shipping Settings

**Endpoint:** `POST /api/admin/shipping/settings`

**Headers:** `Authorization: Bearer {admin_token}`

**Request:**
```json
{
  "apiKey": "xxx",
  "environment": "production",
  "pickupAddress": {
    "businessName": "EcomJRM Store",
    "phone": "+60123456789",
    "addressLine1": "No. 123, Jalan Example",
    "addressLine2": "Level 5",
    "city": "Kuala Lumpur",
    "state": "kul",
    "postalCode": "50000",
    "country": "MY"
  },
  "freeShipping": {
    "enabled": true,
    "threshold": 150.00
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings saved successfully",
  "tested": true
}
```

### 6. Fulfill Order (Enhanced with Features #1, #3, #5)

**Endpoint:** `POST /api/admin/orders/{orderId}/fulfill`

**Headers:** `Authorization: Bearer {admin_token}`

**Request:**
```json
{
  "serviceId": "123",
  "pickupDate": "2025-10-09",
  "overriddenByAdmin": false,
  "overrideReason": null
}
```

**Request Fields:**
- `serviceId`: EasyParcel service_id (can be different from customer's selection)
- `pickupDate`: Scheduled pickup date (ISO format: YYYY-MM-DD)
- `overriddenByAdmin`: Boolean - true if admin changed customer's courier
- `overrideReason`: Optional text explaining why courier was changed

**Response (Success):**
```json
{
  "success": true,
  "shipment": {
    "trackingNumber": "EP123456789MY",
    "awbNumber": "CL987654321",
    "courierName": "City-Link Express",
    "serviceType": "Pick-up",
    "labelUrl": "https://easyparcel.com/labels/xxx.pdf",
    "estimatedDelivery": "2-3 working days"
  },
  "order": {
    "status": "READY_TO_SHIP",
    "fulfilledAt": "2025-10-07T14:30:00Z"
  },
  "notification": {
    "emailSent": true,
    "recipient": "customer@example.com"
  }
}
```

**Response (Error with Retry - Feature #3):**
```json
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
      },
      {
        "type": "CHANGE_COURIER",
        "label": "Try Cheaper Courier"
      }
    ]
  },
  "order": {
    "status": "PAID",
    "failedBookingAttempts": 1,
    "lastBookingError": "INSUFFICIENT_BALANCE"
  }
}
```

**Error Codes:**
- `INSUFFICIENT_BALANCE` - Not enough EasyParcel credit
- `INVALID_ADDRESS` - Shipping address validation failed
- `COURIER_UNAVAILABLE` - Selected courier no longer available
- `API_TIMEOUT` - EasyParcel API timeout
- `SERVICE_UNAVAILABLE` - EasyParcel service temporarily down
- `INVALID_PICKUP_DATE` - Pickup date is Sunday/public holiday/past date
- `ALREADY_FULFILLED` - Order already has tracking number

**Validation Logic:**
```typescript
// Before calling EasyParcel API
1. Check order.status === 'PAID'
2. Check !order.trackingNumber (no existing tracking)
3. Validate pickupDate:
   - Not Sunday
   - Not public holiday (Malaysian calendar)
   - Not in the past
   - Not more than 7 days ahead
4. Check balance >= required amount (call balance API first)
5. Increment order.failedBookingAttempts if error
6. Store error in order.lastBookingError
```

**CRITICAL: EasyParcel API Parameter Mapping:**
```typescript
// When calling EasyParcel API, map our field names to EasyParcel's expected parameters

// Our request:
{
  serviceId: "123",
  pickupDate: "2025-10-09",  // Our field name
  ...
}

// EasyParcel API expects:
{
  authentication: { api_key: "..." },
  api: "integration_id",
  bulk: [{
    service_id: "123",        // serviceId → service_id
    collect_date: "2025-10-09",  // pickupDate → collect_date (CRITICAL!)
    // ... sender/receiver details
  }]
}

// Implementation example:
async function createShipmentWithEasyParcel(order: Order, pickupDate: string) {
  // Get pickup address from SystemConfig
  const settings = await getSystemConfig('easyparcel_settings');
  const pickupAddress = settings.pickupAddress;

  const easyParcelRequest = {
    authentication: { api_key: process.env.EASYPARCEL_API_KEY },
    api: process.env.EASYPARCEL_INTEGRATION_ID,
    bulk: [{
      // Sender info (from SystemConfig.pickupAddress)
      pick_name: pickupAddress.businessName,
      pick_contact: pickupAddress.phone,
      pick_mobile: pickupAddress.phone,
      pick_addr1: pickupAddress.addressLine1,
      pick_addr2: pickupAddress.addressLine2 || '',
      pick_city: pickupAddress.city,
      pick_code: pickupAddress.postalCode,
      pick_state: pickupAddress.state,  // Must be lowercase 3-letter code (e.g., 'kul', 'sgr')
      pick_country: pickupAddress.country,  // v1: 'MY' only, v2: Add 'SG' support

      // Receiver info (customer delivery address)
      send_name: order.shippingAddress.name,
      send_contact: order.shippingAddress.name,
      send_mobile: order.shippingAddress.phone,
      send_addr1: order.shippingAddress.addressLine1,
      send_city: order.shippingAddress.city,
      send_code: order.shippingAddress.postalCode,
      send_state: order.shippingAddress.state,  // Must be lowercase 3-letter code (e.g., 'kul', 'sgr')
      send_country: 'MY',  // v1: Hardcoded 'MY' - we only serve Malaysian customers

      // Parcel details
      // Note: order.shippingWeight is calculated from cart items
      // Product.weight is REQUIRED (Prisma schema line 154), no defaults needed
      weight: order.shippingWeight,
      // Note: width, height, length are OPTIONAL for EasyParcel API (weight is sufficient)
      // If product has custom dimensions, include them; otherwise omit
      content: getOrderItemsSummary(order),
      value: order.subtotal,

      // CRITICAL: Map our fields to EasyParcel parameters
      service_id: order.selectedCourierServiceId,
      collect_date: pickupDate,  // ← This tells courier when to pick up!

      // Optional add-ons
      addon_insurance_enabled: false,
      tax_duty: 'DDU',
      parcel_category_id: '1',
    }]
  };

  const response = await fetch('https://api.easyparcel.com/v2/api/order_bulk_create_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(easyParcelRequest)
  });

  return response.json();
}
```

**What `collect_date` Does:**
- Informs courier when to pick up the parcel from sender (your business address)
- Courier schedules pickup route for that date
- Must be a valid business day (not Sunday/holiday)
- Cannot be more than 7 days in the future
- Format: `YYYY-MM-DD` (ISO date string)

---

### 7. Retry AWB Download (Feature #3 - Partial Success Recovery)

**Endpoint:** `POST /api/admin/orders/{orderId}/retry-awb`

**Headers:** `Authorization: Bearer {admin_token}`

**Purpose:** Retry AWB label download for orders where shipment was created but label download failed

**Request:** No body needed

**Response (Success):**
```json
{
  "success": true,
  "labelUrl": "/downloads/awb_ord_123.pdf",
  "message": "AWB downloaded successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "AWB_NOT_READY",
    "message": "AWB label not yet generated by EasyParcel",
    "retryable": true,
    "retryAfter": 60
  }
}
```

**When to use:**
- Shipment created (order.trackingNumber exists)
- But label download failed (order.labelUrl is null)
- Don't re-create shipment, just fetch label

---

### 8. Track Shipment

**Endpoint:** `GET /api/shipping/track/:trackingNumber`

**Response:**
```json
{
  "success": true,
  "tracking": {
    "trackingNumber": "EP123456789MY",
    "status": "IN_TRANSIT",
    "courierName": "City-Link Express",
    "estimatedDelivery": "2-3 working days",
    "events": [
      {
        "name": "Shipment created",
        "timestamp": "2025-10-07T14:30:00Z",
        "location": null
      },
      {
        "name": "Picked up by courier",
        "timestamp": "2025-10-07T16:00:00Z",
        "location": "Kuala Lumpur Hub"
      },
      {
        "name": "In transit",
        "timestamp": "2025-10-08T09:00:00Z",
        "location": "KL Distribution Center"
      }
    ],
    "lastUpdated": "2025-10-08T09:05:00Z"
  }
}
```

---
