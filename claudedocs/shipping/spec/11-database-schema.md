## Database Schema

### Existing Order Table

**Fields to use (already exist):**
```sql
-- Core order fields
id                  VARCHAR(191) PRIMARY KEY
orderNumber         VARCHAR(191) UNIQUE
status              VARCHAR(50)        -- Our status enum
paymentStatus       VARCHAR(50)
total               DECIMAL(10,2)
subtotal            DECIMAL(10,2)
userId              VARCHAR(191) NULL  -- Linked to User
guestEmail          VARCHAR(255) NULL
guestPhone          VARCHAR(50) NULL

-- Shipping fields
shippingCost        DECIMAL(10,2)
shippingAddress     JSON               -- Customer delivery address
deliveryInstructions TEXT NULL

-- Timestamps
createdAt           DATETIME
updatedAt           DATETIME
```

### New Fields to Add

**Add to Order table:**
```sql
-- Shipping/fulfillment fields
selectedCourierServiceId VARCHAR(100) NULL -- EasyParcel service_id (stored at checkout)
courierName         VARCHAR(100) NULL      -- e.g., "City-Link Express"
courierServiceType  VARCHAR(50) NULL       -- e.g., "Pick-up", "Drop-off"
trackingNumber      VARCHAR(100) NULL      -- EasyParcel tracking number
awbNumber           VARCHAR(100) NULL      -- Air Waybill number
estimatedDelivery   VARCHAR(50) NULL       -- e.g., "2-3 working days"
shippingWeight      DECIMAL(10,2) NULL     -- Total weight in kg
labelUrl            TEXT NULL              -- URL to shipping label PDF
fulfilledAt         DATETIME NULL          -- When shipment was created

-- New fields for critical features (WooCommerce-inspired)
scheduledPickupDate DATE NULL              -- Admin-selected pickup date (Feature #5)
overriddenByAdmin   BOOLEAN DEFAULT false  -- Track if admin changed customer's courier (Feature #1)
adminOverrideReason TEXT NULL              -- Optional reason for courier override
failedBookingAttempts INT DEFAULT 0        -- Count of failed fulfillment attempts (Feature #3)
lastBookingError    TEXT NULL              -- Last error message for support (Feature #3)
autoStatusUpdate    BOOLEAN DEFAULT true   -- Per-order auto-update toggle (Feature #4)
```

**Field Usage Guidelines:**

1. **scheduledPickupDate**
   - Default: Next business day (auto-calculated)
   - Admin can override in fulfillment widget
   - Validates: Not Sunday, not public holiday, max 7 days ahead
   - Sent to EasyParcel in booking request

2. **overriddenByAdmin**
   - Set to `true` if admin changes courier at fulfillment
   - Used for analytics and audit trail
   - Helps identify frequent override patterns

3. **adminOverrideReason**
   - Optional text field for admin notes
   - Examples: "Customer's choice unavailable", "Cheaper option found"
   - Useful for operations review

4. **failedBookingAttempts**
   - Increments on each fulfillment API failure
   - Triggers escalation after 3 attempts
   - Resets to 0 on successful booking

5. **lastBookingError**
   - Stores full error response from EasyParcel API
   - Helps support team debug issues
   - Cleared on successful booking

6. **autoStatusUpdate**
   - Inherits from global setting by default
   - Can be toggled per-order if needed
   - Controls whether cron job updates this specific order

### SystemConfig Table

**Shipping settings storage:**
```sql
-- Existing table structure
CREATE TABLE SystemConfig (
  id          VARCHAR(191) PRIMARY KEY,
  key         VARCHAR(191) UNIQUE,
  value       TEXT,
  type        VARCHAR(50),
  createdAt   DATETIME,
  updatedAt   DATETIME
);

-- Shipping settings entry
INSERT INTO SystemConfig (key, value, type) VALUES
('easyparcel_settings', '{...JSON...}', 'JSON');
```

**Settings JSON structure:**
```json
{
  "apiKey": "xxx",
  "environment": "production",
  "courierStrategy": {
    "type": "cheapest",
    "selectedCourierIds": null
  },
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
  },
  "automation": {
    "autoStatusUpdate": true,
    "updateInterval": 14400
  },
  "creditBalance": {
    "amount": 250.50,
    "currency": "MYR",
    "lastFetched": "2025-10-07T14:30:00Z",
    "lowBalanceThreshold": 50.00,
    "alertEnabled": true
  },
  "lastUpdated": "2025-10-07T10:30:00Z",
  "updatedBy": "admin@ecomjrm.com"
}
```

**New Settings Sections (Features #4 and #6):**

1. **automation**
   - `autoStatusUpdate`: Global toggle for automatic order status updates
   - `updateInterval`: Cron job interval in seconds (14400 = 4 hours)

2. **creditBalance**
   - `amount`: Current EasyParcel account balance
   - `currency`: Always "MYR" for Malaysia
   - `lastFetched`: Timestamp of last balance check
   - `lowBalanceThreshold`: Amount below which warning appears (default: RM 50)
   - `alertEnabled`: Whether to show low balance warning in admin

**Courier Strategy Types:**
- `"cheapest"` - Auto-select lowest cost courier
- `"all"` - Show all available couriers to customer
- `"selected"` - Show only admin-selected couriers (requires `selectedCourierIds` array)

**Country & State Code Validation:**

IMPORTANT: The `pickupAddress.country` and `pickupAddress.state` fields must follow EasyParcel API requirements.

**Country Field (v1: Malaysia only, v2: Add Singapore):**
```typescript
// v1: Only Malaysia supported
const VALID_COUNTRIES_V1 = ['MY'];

// v2: Future expansion (Singapore)
const VALID_COUNTRIES_V2 = ['MY', 'SG'];
```

**State Codes (Malaysian - Appendix III):**
```typescript
const VALID_STATE_CODES = [
  'jhr', 'kdh', 'ktn', 'mlk', 'nsn', 'phg', 'prk', 'pls',
  'png', 'sgr', 'trg', 'kul', 'pjy', 'srw', 'sbh', 'lbn'
];
```

**Validation Function:**
```typescript
function validatePickupAddress(address: PickupAddress): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!address.businessName) errors.push('Business name is required');
  if (!address.phone) errors.push('Phone number is required');
  if (!address.addressLine1) errors.push('Address line 1 is required');
  if (!address.city) errors.push('City is required');
  if (!address.postalCode) errors.push('Postal code is required');

  // Country validation (v1: Malaysia only)
  if (!address.country) {
    errors.push('Country is required');
  } else if (address.country !== 'MY') {
    errors.push(`Invalid country: '${address.country}'. v1 only supports Malaysia ('MY'). Singapore support coming in v2.`);
  }

  // State code validation (Malaysia only for v1)
  if (!address.state) {
    errors.push('State code is required');
  } else if (address.country === 'MY' && !isValidMalaysianState(address.state)) {
    errors.push(`Invalid state code: '${address.state}'. Must be one of: ${Object.keys(MALAYSIAN_STATES).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### TrackingEvent Table (Optional - for history)

**If detailed tracking history needed:**
```sql
CREATE TABLE TrackingEvent (
  id              VARCHAR(191) PRIMARY KEY,
  orderId         VARCHAR(191) NOT NULL,
  eventName       VARCHAR(100),  -- e.g., "Picked up", "In transit"
  eventStatus     VARCHAR(50),   -- e.g., "IN_TRANSIT"
  description     TEXT,
  location        VARCHAR(100),
  timestamp       DATETIME,
  createdAt       DATETIME,

  FOREIGN KEY (orderId) REFERENCES Order(id) ON DELETE CASCADE
);
```

**Alternative:** Store tracking events in Order.trackingHistory JSON field (simpler).

---
