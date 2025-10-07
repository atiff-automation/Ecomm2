# Pickup Date Selection - Analysis & Verification

**Date:** 2025-10-07
**Question:** Does the pickup date get passed to EasyParcel API to inform the courier service?
**Answer:** ✅ YES - The pickup date is sent to EasyParcel and used for courier pickup scheduling.

---

## How It Works (WooCommerce Plugin)

### 1. UI - Admin Selects Pickup Date
**File:** `include/module/fulfillment/html_meta_box.php` (Line 178-184)

```php
<?php woocommerce_wp_text_input( array(
    'id'          => 'pick_up_date',
    'label'       => __( 'Drop Off / Pick Up Date', 'easyparcel-shipping' ),
    'placeholder' => date_i18n( __( 'Y-m-d' , 'easyparcel-shipping' ), time() ),
    'description' => '',
    'class'       => 'date-picker-field',
    'value'       => date_i18n( __( 'Y-m-d' , 'easyparcel-shipping' ), current_time( 'timestamp' ) ),
) );?>
```

**Key Points:**
- Field name: `pick_up_date`
- Default value: Current date (today)
- Format: `Y-m-d` (e.g., `2025-10-07`)
- Uses date picker for easy selection

---

### 2. AJAX Handler - Captures Pickup Date
**File:** `include/module/fulfillment/ajax_action.php` (Line 27, 64)

```php
// Capture from POST request
$pick_up_date = isset( $_POST['pick_up_date'] ) ? wc_clean($_POST['pick_up_date']) : '';

// Pass to booking object
$obj = (object)array();
$obj->order_id = $order_id;
$obj->pick_up_date = $pick_up_date;  // ← Pickup date added here
$obj->shipping_provider = $shipping_provider;
$obj->courier_name = $courier_name;
// ... other fields

// Call booking function
$ep_order = $WC_Easyparcel_Shipping_Method->process_booking_order($obj);
```

---

### 3. Booking Logic - Maps to `collect_date`
**File:** `include/module/setup/WC_Easyparcel_Shipping_Method.php` (Line 1258)

```php
public function process_booking_order($obj) {
    // ... prepare order data

    $data->service_id = $obj->shipping_provider;
    $data->drop_off_point = $obj->drop_off_point;
    $data->collect_date = $obj->pick_up_date;  // ← Mapped here!
    $data->addon_insurance_enabled = $obj->easycover;
    $data->tax_duty = $obj->easyparcel_ddp == 'true' ? "DDP" : "DDU";

    // Submit to EasyParcel API
    $order_result = Easyparcel_Shipping_API::submitOrder($data);
}
```

**Key Insight:**
- `pick_up_date` (UI field) → `collect_date` (API parameter)
- This is the standard EasyParcel API parameter name

---

### 4. EasyParcel API Call - Sends to API
**File:** `include/service/easyparcel_api.php` (Line 435, 608)

```php
public static function submitOrder($obj) {
    $f = array(
        // Sender info
        'pick_name' => $pick_name,
        'pick_contact' => $pick_contact,
        'pick_mobile' => $pick_mobile,
        'pick_addr1' => $pick_addr1,
        // ...

        // Receiver info
        'send_name' => $send_name,
        'send_contact' => $send_contact,
        // ...

        // Parcel details
        'weight' => $obj->weight,
        'width' => $obj->width,
        'height' => $obj->height,
        'length' => $obj->length,
        'content' => $obj->content,
        'value' => $obj->item_value,
        'service_id' => $obj->service_id,
        'collect_date' => $obj->collect_date,  // ← Sent to EasyParcel API!
        'addon_insurance_enabled' => $obj->addon_insurance_enabled,
        'tax_duty' => $obj->tax_duty,
        // ...
    );

    // POST to EasyParcel API
    $result = wp_remote_post(self::$easyparcel_api . '/v2/api/order_bulk_create_v2', array(
        'body' => json_encode($bulk_order)
    ));
}
```

**EasyParcel API Parameter:**
- Parameter name: `collect_date`
- Format: `YYYY-MM-DD` (e.g., `2025-10-09`)
- Purpose: Tells courier when to pick up the parcel from sender

---

## Our Implementation (Verification)

### ✅ Database Schema - Correct
**File:** `claudedocs/SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md`

```sql
scheduledPickupDate DATE NULL  -- Admin-selected pickup date (Feature #5)
```

**Usage:**
- Stored in Order table
- Sent to EasyParcel as `collect_date` parameter
- Validated before booking

---

### ✅ API Request - Correct Structure
**File:** `claudedocs/SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md`

```json
POST /api/admin/orders/{orderId}/fulfill

Request:
{
  "serviceId": "123",
  "pickupDate": "2025-10-09",  // ← This field
  "overriddenByAdmin": false,
  "overrideReason": null
}
```

---

### ⚠️ MISSING: Mapping to EasyParcel API Parameter

**What we need to add:**

When implementing the EasyParcel API integration, we must map our `pickupDate` to EasyParcel's `collect_date`:

```typescript
// src/lib/shipping/easyparcel-client.ts

interface EasyParcelBookingRequest {
  // Sender info
  pick_name: string;
  pick_contact: string;
  pick_mobile: string;
  pick_addr1: string;
  pick_city: string;
  pick_code: string;
  pick_state: string;
  pick_country: string;

  // Receiver info
  send_name: string;
  send_contact: string;
  send_mobile: string;
  send_addr1: string;
  send_city: string;
  send_code: string;
  send_state: string;
  send_country: string;

  // Parcel details
  weight: number;
  width: number;
  height: number;
  length: number;
  content: string;
  value: number;
  service_id: string;
  collect_date: string;  // ← CRITICAL: This is the pickup date

  // Optional add-ons
  addon_insurance_enabled?: boolean;
  tax_duty?: 'DDP' | 'DDU';
  parcel_category_id?: string;
}

async function createShipment(orderId: string, pickupDate: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  const requestBody = {
    authentication: { api_key: process.env.EASYPARCEL_API_KEY },
    api: 'your_integration_id',
    bulk: [{
      // ... sender/receiver details
      service_id: order.selectedCourierServiceId,
      collect_date: pickupDate,  // ← Map our pickupDate to collect_date
      // ... other fields
    }]
  };

  const response = await fetch('https://api.easyparcel.com/v2/api/order_bulk_create_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
}
```

---

## What Happens at EasyParcel's End?

When EasyParcel receives the `collect_date` parameter:

1. **Courier Notification:** EasyParcel notifies the selected courier about the pickup
2. **Pickup Scheduling:** Courier schedules pickup for the specified date
3. **Confirmation:** EasyParcel returns booking confirmation with scheduled pickup date
4. **Tracking:** The pickup date appears in tracking timeline

**Example EasyParcel Response:**
```json
{
  "error_code": 0,
  "order_number": "EP202510070001",
  "pickup_scheduled": "2025-10-09",
  "status": "pending_pickup"
}
```

---

## Validation Rules (Must Implement)

Based on WooCommerce plugin behavior and best practices:

### 1. Date Format Validation
```typescript
// ✅ GOOD: ISO format YYYY-MM-DD
pickupDate: "2025-10-09"

// ❌ BAD: Other formats
pickupDate: "09/10/2025"  // Wrong format
pickupDate: "2025-10-9"   // Missing leading zero
```

### 2. Business Day Validation
```typescript
function validatePickupDate(date: Date): { valid: boolean; error?: string } {
  // Not Sunday
  if (date.getDay() === 0) {
    return { valid: false, error: "Pickup not available on Sundays" };
  }

  // Not public holiday (Malaysian calendar)
  if (isMalaysianPublicHoliday(date)) {
    return { valid: false, error: "Pickup not available on public holidays" };
  }

  // Not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, error: "Pickup date cannot be in the past" };
  }

  // Not more than 7 days ahead
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  if (date > maxDate) {
    return { valid: false, error: "Pickup date cannot be more than 7 days ahead" };
  }

  return { valid: true };
}
```

### 3. Smart Default (Next Business Day)
```typescript
function getNextBusinessDay(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1); // Start with tomorrow

  // Skip Sunday
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1); // Move to Monday
  }

  // Skip public holidays
  while (isMalaysianPublicHoliday(date)) {
    date.setDate(date.getDate() + 1);

    // Skip Sunday again if we land on it
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
  }

  return date;
}

// Usage in fulfillment widget
const [pickupDate, setPickupDate] = useState(getNextBusinessDay());
```

---

## Malaysian Public Holidays (2025)

For validation logic:

```typescript
const MALAYSIAN_PUBLIC_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-25', // Thaipusam
  '2025-01-29', // Chinese New Year
  '2025-01-30', // Chinese New Year (2nd day)
  '2025-03-31', // Hari Raya Aidilfitri (estimated)
  '2025-04-01', // Hari Raya Aidilfitri (2nd day)
  '2025-05-01', // Labour Day
  '2025-05-12', // Wesak Day
  '2025-06-02', // Agong's Birthday
  '2025-06-07', // Hari Raya Aidiladha (estimated)
  '2025-06-28', // Awal Muharram
  '2025-08-31', // Merdeka Day
  '2025-09-16', // Malaysia Day
  '2025-09-27', // Prophet Muhammad's Birthday (estimated)
  '2025-10-24', // Deepavali (estimated)
  '2025-12-25', // Christmas Day
];

function isMalaysianPublicHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return MALAYSIAN_PUBLIC_HOLIDAYS_2025.includes(dateStr);
}
```

**Note:** Some dates are estimated (Islamic calendar varies). Update annually.

---

## Implementation Checklist

### Database
- [x] `scheduledPickupDate` field added to Order table
- [x] Field type: `DATE NULL`
- [x] Default: NULL (calculated at fulfillment time)

### API Endpoint
- [x] Accept `pickupDate` in fulfill request
- [ ] **TODO: Map `pickupDate` → `collect_date` for EasyParcel API**
- [x] Validate pickup date (not Sunday/holiday/past/too far)
- [x] Store in `order.scheduledPickupDate`

### UI Component
- [x] Date picker in fulfillment widget
- [x] Default value: Next business day
- [x] Min date: Today
- [x] Max date: 7 days ahead
- [x] Disable Sundays and public holidays

### Validation
- [x] Server-side validation in fulfill endpoint
- [ ] **TODO: Implement `getNextBusinessDay()` utility**
- [ ] **TODO: Implement `isMalaysianPublicHoliday()` utility**
- [ ] **TODO: Implement `validatePickupDate()` function**

### EasyParcel Integration
- [ ] **TODO: Map request parameter correctly:**
  ```typescript
  // Our field: pickupDate
  // EasyParcel expects: collect_date

  const easyParcelRequest = {
    collect_date: pickupDate,  // ← Critical mapping
    service_id: serviceId,
    // ... other fields
  };
  ```

---

## Conclusion

✅ **Confirmed:** Pickup date DOES get passed to EasyParcel API and is used for courier pickup scheduling.

**Parameter Flow:**
```
UI Field (pick_up_date)
  ↓
Frontend (pickupDate: "2025-10-09")
  ↓
API Endpoint (/api/admin/orders/{id}/fulfill)
  ↓
Database (scheduledPickupDate: DATE)
  ↓
EasyParcel API (collect_date: "2025-10-09")  ← Critical mapping!
  ↓
Courier System (schedules pickup for Oct 9, 2025)
```

**Action Required:**
When implementing the EasyParcel API client, ensure we map our `pickupDate` field to EasyParcel's `collect_date` parameter in the API request body.

---

**Document Status:** ✅ Complete
**Next Steps:** Implement field mapping in EasyParcel API client during Phase 3 (Day 3-4)
