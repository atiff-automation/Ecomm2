# WooCommerce EasyParcel Plugin - Courier Selection Solution

**Analysis Date:** 2025-10-07
**Source:** WooCommerce EasyParcel Plugin Code Study
**Purpose:** Solve the courier selection problem for our simple shipping implementation

---

## The Problem We Had

**Original concern:** How can admin pre-configure courier selection in settings when EasyParcel API requires destination address to return available couriers?

**The dilemma:**
- Admin settings page has no customer address yet
- EasyParcel API needs destination to return available couriers
- Can't pre-select specific courier without knowing which couriers will be available

---

## WooCommerce's Brilliant Solution

### Two-Phase Approach

**Phase 1: Admin Configuration (No destination address needed)**
- Admin configures **courier selection strategy** per zone
- NOT selecting actual couriers, but selecting HOW to choose couriers
- Three strategies available:
  1. "All Couriers" - Show all available options to customer
  2. "Cheapest Courier" - Auto-select cheapest option
  3. "Selected Couriers" - Choose which courier IDs to allow

**Phase 2: Checkout Time (Has destination address)**
- Customer enters shipping address
- System calls EasyParcel API with destination → gets actual available couriers
- System applies admin's **strategy** to filter/present couriers
- Customer sees one or more options based on strategy

---

## How It Works (Code Analysis)

### 1. Admin Configuration Setup

**File:** `html_shipping_zone_setup.php` (lines 11-18, 95-105)

```php
// Admin selects courier list WITHOUT needing destination address
$couriers_list = Easyparcel_Shipping_API::getCourierList();

// Three configuration modes:
'setting_type' => [
    'all' => 'Show All Couriers',           // Strategy 1
    'cheapest' => 'Show Only Cheapest',     // Strategy 2
    'couriers' => 'Show Selected Courier'   // Strategy 3
]
```

**Key insight:** `getCourierList()` returns ALL possible couriers for the country (line 719 in `easyparcel_api.php`), not filtered by destination. This gives admin a list to choose from.

### 2. Checkout Calculation

**File:** `WC_Easyparcel_Shipping_Method.php` (lines 508-561)

```php
public function calculate_shipping($package = array()) {
    $destination = $package["destination"];

    // Step 1: Get ACTUAL available couriers for this specific destination
    $rates = $this->get_easyparcel_rate($destination, $package["contents"]);

    // Step 2: Get admin's configured strategy for this zone
    $zone_setting = $this->get_shipping_zone_setting($destination);

    // Step 3: Apply strategy
    if ($zone_setting['setting_type'] == 'all') {
        // Show all available couriers
        foreach($rates as $rate) {
            $this->add_rate(...);
        }
    }
    elseif ($zone_setting['setting_type'] == 'cheapest') {
        // Find cheapest, show only that one
        $cheapest = null;
        foreach($rates as $rate) {
            if ($cheapest == null || $cheapest['cost'] > $rate->price) {
                $cheapest = $rate;
            }
        }
        $this->add_rate($cheapest);
    }
    elseif ($zone_setting['setting_type'] == 'couriers') {
        // Filter: only show couriers admin selected
        foreach($zone_setting['settings'] as $admin_selected) {
            foreach($rates as $rate) {
                if ($rate->courier_id == $admin_selected['courier_id']) {
                    $this->add_rate(...);
                }
            }
        }
    }
}
```

### 3. The Magic API Call

**File:** `easyparcel_api.php` (lines 210-341)

```php
public static function getShippingRate($destination, $items) {
    $f = array(
        'api' => self::$integration_id,
        'pick_country' => self::$sender_country,
        'pick_code' => self::$sender_postcode,
        'pick_state' => self::$sender_state,

        // CUSTOMER DESTINATION (this is the key!)
        'send_country' => $destination['country'],
        'send_state' => $destination['state'],
        'send_code' => $destination['postcode'],

        'weight' => $weight,
        'width' => $width,
        'height' => $height,
        'length' => $length,
    );

    // API returns only couriers available for this specific route
    $response = self::curlPost('EPRateCheckingBulk', $f);
    return $response->result[0]->rates; // Array of available couriers
}
```

---

## Zone-Based Configuration

### How Zones Work

**WooCommerce Zone System:**
1. Admin creates zones (e.g., "Malaysia", "Singapore", "International")
2. Each zone has location rules (postcodes, states, countries)
3. Each zone has shipping methods with different settings

**EasyParcel Integration:**
- Each zone can have different courier strategy
- Example:
  - "West Malaysia" zone → "All Couriers" strategy
  - "East Malaysia" zone → "Cheapest Courier" strategy
  - "Singapore" zone → "Selected Couriers" strategy (only DHL, FedEx)

**Code reference:** `get_shipping_zone_setting($destination)` (line 512)
- Matches destination address to zone
- Returns configured strategy for that zone

---

## The Three Strategies Explained

### Strategy 1: "All Couriers"

**Admin configuration:**
- Select "Show All Couriers" dropdown option
- No courier selection needed

**Checkout behavior:**
- API returns 8 couriers for destination
- Customer sees all 8 options
- Customer chooses their preferred courier

**Use case:** Give customers maximum flexibility

---

### Strategy 2: "Cheapest Courier"

**Admin configuration:**
- Select "Show Only Cheapest Courier" dropdown option
- No courier selection needed

**Checkout behavior:**
- API returns 8 couriers for destination
- System finds cheapest: RM 5.50
- Customer sees ONE option: "Shipping - RM 5.50"
- No courier choice needed (auto-selected)

**Use case:** Simplest customer experience, admin controls cost

**Code:** Lines 523-536 in `WC_Easyparcel_Shipping_Method.php`

```php
elseif ($zone_setting['setting_type'] == 'cheapest') {
    $shipping_rate = null;
    foreach($rates as $rate) {
        if ($shipping_rate == null) {
            $shipping_rate = $rate;
        } elseif ($shipping_rate['cost'] > $rate->price) {
            $shipping_rate = $rate;  // Found cheaper option
        }
    }
    $this->add_rate($shipping_rate);  // Add only cheapest
}
```

---

### Strategy 3: "Selected Couriers"

**Admin configuration:**
- Select "Show Selected Courier" dropdown option
- Choose which couriers to allow:
  - ✅ City-Link Express
  - ✅ Skynet
  - ❌ J&T (unchecked)
  - ❌ Ninja Van (unchecked)

**Checkout behavior:**
- API returns 8 couriers for destination
- System filters to only admin-selected couriers
- Customer sees 2 options: City-Link (RM 6.00), Skynet (RM 6.50)
- Customer chooses between these two

**Use case:** Control which couriers to offer (based on service quality, contracts, etc.)

**Code:** Lines 539-561 in `WC_Easyparcel_Shipping_Method.php`

```php
elseif ($zone_setting['setting_type'] == 'couriers') {
    $duplicate_check = array();
    foreach($zone_setting['settings'] as $setting_details) {
        foreach($rates as $rate) {
            // Only include if admin selected this courier_id
            if ($rate->courier_id != $setting_details['courier_id']) {
                continue;
            }
            if (in_array($rate->courier_id, $duplicate_check)) {
                continue;
            }
            $this->add_rate(...);
            array_push($duplicate_check, $courier_id);
        }
    }
}
```

---

## Admin Fulfillment Flow

### How Admin Books Shipment After Order

**File:** `get_order_shipping_price_list($order_id)` (lines 564-630)

```php
public function get_order_shipping_price_list($order_id) {
    $order = wc_get_order($order_id);

    // Get destination from order
    $destination = array(
        'country' => $order->get_shipping_country(),
        'state' => $order->get_shipping_state(),
        'postcode' => $order->get_shipping_postcode()
    );

    // Call API with actual destination
    $rates = $this->get_easyparcel_rate($destination, $order->get_items());

    // Apply zone strategy (same logic as checkout)
    // Return list of courier options for admin to choose from
}
```

**Admin sees:**
- If "All Couriers" strategy: All 8 available couriers
- If "Cheapest" strategy: The cheapest courier (pre-selected)
- If "Selected Couriers": Only the 2 couriers admin configured

**Admin clicks:** "Book Shipment" → API books with selected courier

---

## Key Technical Components

### 1. Courier List vs Rate Checking

**Two different API endpoints:**

**`getCourierList()` - Admin configuration phase**
- Endpoint: `?ac=EPCourierList`
- Input: API key only
- Returns: ALL possible couriers for country (generic list)
- Used: To populate admin dropdown options
- File: `easyparcel_api.php` lines 719-738

**`getShippingRate()` - Checkout phase**
- Endpoint: `?ac=EPRateCheckingBulk`
- Input: Sender + destination + parcel details
- Returns: ONLY couriers available for this specific route + actual prices
- Used: To show customer real options
- File: `easyparcel_api.php` lines 210-341

### 2. Zone Matching

**Function:** `get_shipping_zone_setting($destination)`

**Logic:**
1. Get customer's destination (country, state, postcode)
2. Match against WooCommerce zone locations
3. Find which zone this destination belongs to
4. Return that zone's configured strategy

**Example:**
- Destination: Selangor, 40000
- Matches: "West Malaysia" zone
- Returns: `['setting_type' => 'cheapest', 'settings' => [...]]`

### 3. Data Storage

**Zone settings stored in:**
- Custom database table: `wp_easyparcel_shipping_zone`
- Structure:
  ```php
  [
      'zone_id' => 1,                    // WooCommerce zone ID
      'setting_type' => 'cheapest',      // Strategy
      'settings' => [                    // Additional config
          'courier_id' => 123,
          'charges_type' => 'member_rate',
          'label' => 'Standard Shipping',
          // etc.
      ]
  ]
  ```

---

## Solution for Our System

### Recommended Implementation

**Adopt WooCommerce's strategy-based approach:**

### Option 1: Admin-Controlled Simple (RECOMMENDED)

**Admin configuration:**
- Single global setting (not zone-based initially)
- Dropdown: "Show All Couriers" | "Cheapest Courier" | "Selected Couriers"
- If "Selected Couriers": Checkbox list from `getCourierList()`

**Database schema:**
```sql
CREATE TABLE SystemConfig (
  key VARCHAR(255) PRIMARY KEY,
  value JSON
);

-- Example stored value
{
  "key": "shipping_strategy",
  "value": {
    "strategy_type": "cheapest",  // or "all" or "selected"
    "selected_courier_ids": [123, 456],  // only if strategy_type = "selected"
    "fallback_to_cheapest": true  // if selected couriers not available
  }
}
```

**Checkout API endpoint:**
```typescript
// POST /api/shipping/calculate
{
  destination: {
    country: "MY",
    state: "Selangor",
    postcode: "40000"
  },
  items: [...],
  weight: 2.5
}

// Response
{
  shippingOptions: [
    {
      id: "ep_service_123",
      name: "City-Link Express",
      price: 5.50,
      service_id: "123"
    }
  ]
  // Or single option if "cheapest" strategy
}
```

**Customer checkout flow:**
1. Enter address → system calculates shipping
2. If "All": sees 3-8 courier options → chooses one
3. If "Cheapest": sees "Shipping - RM 5.50" → no choice needed
4. If "Selected": sees 2-3 admin-approved couriers → chooses one
5. Pays
6. Order created with selected courier's `service_id`

**Admin fulfillment flow:**
1. Open order
2. See selected courier: "City-Link Express - RM 5.50"
3. Click "Book Shipment" button
4. System calls EasyParcel `submitOrder` with stored `service_id`
5. Done

---

### Option 2: Zone-Based (Future Enhancement)

**Later, add zone support:**
- Different strategies for different regions
- Example:
  - West Malaysia: "All Couriers" (competitive area)
  - East Malaysia: "Cheapest Courier" (cost-sensitive)
  - Singapore: "Selected Couriers" (only DHL, FedEx)

**Implementation:**
- Add `ShippingZone` table
- Link to Order via destination matching
- Each zone has its own strategy configuration

**Not needed for MVP** - Single global strategy is sufficient for launch.

---

## Updated Implementation Spec

### Admin Shipping Configuration Page

**Location:** `/admin/settings/shipping`

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ Shipping Configuration                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ EasyParcel Settings                                 │
│ ─────────────────                                   │
│                                                     │
│ Courier Selection Strategy:                         │
│ [ Dropdown: Cheapest Courier ▼ ]                   │
│   Options:                                          │
│   - Show All Couriers                               │
│   - Cheapest Courier (recommended)                  │
│   - Selected Couriers                               │
│                                                     │
│ [Show only if "Selected Couriers" chosen above]     │
│ ┌─────────────────────────────────────┐            │
│ │ Available Couriers:                  │            │
│ │ ☑ City-Link Express                  │            │
│ │ ☑ Skynet                             │            │
│ │ ☐ J&T Express                        │            │
│ │ ☐ Ninja Van                          │            │
│ │ ☐ DHL                                │            │
│ │ ☑ Poslaju                            │            │
│ └─────────────────────────────────────┘            │
│                                                     │
│ Sender Details                                      │
│ ─────────────────                                   │
│ Business Name: [Pustaka Suluh Sdn Bhd          ]   │
│ Contact:       [+60123456789                   ]   │
│ Address:       [123 Jalan Example              ]   │
│ City:          [Kuala Lumpur                   ]   │
│ Postcode:      [50000                          ]   │
│ State:         [Selangor ▼                     ]   │
│                                                     │
│ [Save Configuration]                                │
└─────────────────────────────────────────────────────┘
```

### Checkout Page Changes

**No complex UI needed:**

**If "All Couriers" strategy:**
```
┌─────────────────────────────────────────┐
│ Shipping Method                         │
├─────────────────────────────────────────┤
│ ◉ City-Link Express      RM 5.50       │
│ ○ Skynet                 RM 6.00       │
│ ○ J&T Express            RM 5.80       │
│ ○ Poslaju                RM 7.00       │
└─────────────────────────────────────────┘
```

**If "Cheapest Courier" strategy:**
```
┌─────────────────────────────────────────┐
│ Shipping Method                         │
├─────────────────────────────────────────┤
│ ◉ Shipping                RM 5.50      │
│   (City-Link Express)                   │
└─────────────────────────────────────────┘
```

**If "Selected Couriers" strategy:**
```
┌─────────────────────────────────────────┐
│ Shipping Method                         │
├─────────────────────────────────────────┤
│ ◉ City-Link Express      RM 5.50       │
│ ○ Skynet                 RM 6.00       │
│ ○ Poslaju                RM 7.00       │
└─────────────────────────────────────────┘
```

### Admin Order Fulfillment

**No change needed** - Order already has `service_id` from checkout selection.

**Fulfillment button:**
```
┌──────────────────────────────────────┐
│ Selected Courier: City-Link Express  │
│ Shipping Cost: RM 5.50               │
│ [Book Shipment with EasyParcel]      │
└──────────────────────────────────────┘
```

Clicks button → System books shipment with stored `service_id`.

---

## API Endpoints Needed

### 1. Get Available Couriers (Admin Setup)

**Endpoint:** `GET /api/admin/shipping/couriers`

**Purpose:** Populate admin dropdown/checkbox list

**Request:** None (uses system credentials)

**Response:**
```json
{
  "success": true,
  "couriers": [
    {
      "courier_id": "123",
      "name": "City-Link Express",
      "short_name": "CityLink",
      "logo_url": "https://..."
    },
    {
      "courier_id": "456",
      "name": "Skynet",
      "short_name": "Skynet",
      "logo_url": "https://..."
    }
    // ... more couriers
  ]
}
```

**Implementation:**
```typescript
// Calls EasyParcel getCourierList() API
// ?ac=EPCourierList with integration_id
```

### 2. Calculate Shipping (Checkout)

**Endpoint:** `POST /api/shipping/calculate`

**Purpose:** Get available shipping options for customer

**Request:**
```json
{
  "destination": {
    "country": "MY",
    "state": "Selangor",
    "postcode": "40000"
  },
  "items": [
    {
      "product_id": "abc123",
      "quantity": 2,
      "weight": 0.5,
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 10
      }
    }
  ]
}
```

**Response (if "All" or "Selected" strategy):**
```json
{
  "success": true,
  "options": [
    {
      "id": "ep_123",
      "service_id": "123",
      "courier_name": "City-Link Express",
      "service_name": "City-Link Express",
      "price": 5.50,
      "estimated_delivery": "2-3 days",
      "logo_url": "https://..."
    },
    {
      "id": "ep_456",
      "service_id": "456",
      "courier_name": "Skynet",
      "service_name": "Skynet Standard",
      "price": 6.00,
      "estimated_delivery": "1-2 days",
      "logo_url": "https://..."
    }
  ]
}
```

**Response (if "Cheapest" strategy):**
```json
{
  "success": true,
  "options": [
    {
      "id": "ep_123",
      "service_id": "123",
      "courier_name": "City-Link Express",
      "service_name": "City-Link Express",
      "price": 5.50,
      "estimated_delivery": "2-3 days",
      "logo_url": "https://..."
    }
  ]
}
```

**Implementation:**
```typescript
async function calculateShipping(destination, items) {
  // 1. Get shipping strategy from SystemConfig
  const strategy = await getShippingStrategy();

  // 2. Call EasyParcel getShippingRate API
  const rates = await easyparcelAPI.getShippingRate({
    pick_country: businessConfig.country,
    pick_code: businessConfig.postcode,
    pick_state: businessConfig.state,
    send_country: destination.country,
    send_code: destination.postcode,
    send_state: destination.state,
    weight: calculateTotalWeight(items),
    // ... dimensions
  });

  // 3. Apply strategy
  if (strategy.type === 'all') {
    return rates; // Return all
  } else if (strategy.type === 'cheapest') {
    return [findCheapest(rates)]; // Return only cheapest
  } else if (strategy.type === 'selected') {
    return rates.filter(r =>
      strategy.selected_courier_ids.includes(r.courier_id)
    );
  }
}
```

### 3. Save Shipping Configuration (Admin)

**Endpoint:** `POST /api/admin/shipping/config`

**Request:**
```json
{
  "strategy_type": "cheapest",
  "selected_courier_ids": null,
  "business_address": {
    "name": "Pustaka Suluh Sdn Bhd",
    "phone": "+60123456789",
    "address_line1": "123 Jalan Example",
    "city": "Kuala Lumpur",
    "state": "Selangor",
    "postcode": "50000",
    "country": "MY"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping configuration saved successfully"
}
```

---

## Database Schema Updates

### SystemConfig Table

**New entries:**
```sql
INSERT INTO SystemConfig (key, value) VALUES
('shipping_strategy', '{
  "strategy_type": "cheapest",
  "selected_courier_ids": null,
  "fallback_to_cheapest": true
}'),
('business_address', '{
  "name": "Pustaka Suluh Sdn Bhd",
  "phone": "+60123456789",
  "address_line1": "123 Jalan Example",
  "address_line2": "",
  "city": "Kuala Lumpur",
  "state": "Selangor",
  "postcode": "50000",
  "country": "MY"
}');
```

### Order Table

**Add fields:**
```sql
ALTER TABLE Order ADD COLUMN selectedCourierServiceId VARCHAR(100);
ALTER TABLE Order ADD COLUMN selectedCourierName VARCHAR(255);
ALTER TABLE Order ADD COLUMN selectedServiceName VARCHAR(255);
```

**Populated at checkout:**
- Customer selects courier option
- System stores `service_id`, `courier_name`, `service_name`
- Used later for admin fulfillment

---

## Implementation Checklist

### Phase 1: Admin Configuration
- [ ] Create `/api/admin/shipping/couriers` endpoint (call `getCourierList`)
- [ ] Create `/api/admin/shipping/config` GET/POST endpoints
- [ ] Build admin settings page UI
- [ ] Test strategy selection and saving

### Phase 2: Checkout Integration
- [ ] Create `/api/shipping/calculate` endpoint
- [ ] Implement strategy application logic (all/cheapest/selected)
- [ ] Update checkout page to call API
- [ ] Display shipping options based on strategy
- [ ] Store selected courier in Order table

### Phase 3: Admin Fulfillment
- [ ] Create "Book Shipment" button in order details
- [ ] Create `/api/admin/orders/[id]/book-shipment` endpoint
- [ ] Call EasyParcel `submitOrder` API with stored `service_id`
- [ ] Update order status to `READY_TO_SHIP`
- [ ] Store tracking number

### Phase 4: Testing
- [ ] Test "All Couriers" strategy
- [ ] Test "Cheapest Courier" strategy
- [ ] Test "Selected Couriers" strategy
- [ ] Test with different destinations (West MY, East MY, SG)
- [ ] Test edge case: no couriers available

---

## Key Takeaways

### The Genius of WooCommerce's Approach

**Problem:** Can't select specific couriers without destination
**Solution:** Don't select couriers, select a **selection strategy**

**Benefits:**
1. **No destination needed:** Admin chooses strategy, not specific couriers
2. **Works for all destinations:** Strategy applies dynamically at checkout
3. **Simple admin UX:** Three clear options instead of complex rules
4. **Flexible:** Can show all, auto-select cheapest, or limit to preferred couriers
5. **Future-proof:** Can add zones later without changing core logic

### Why This Solves Our Problem

**Our original concern:**
> "For EasyParcel to return available couriers during our courier selection in admin shipping config, it needs receiver address."

**WooCommerce's insight:**
> "Don't try to select couriers without address. Select HOW to choose couriers when you DO have the address."

**The shift:**
- ❌ Admin selects: "Use City-Link Express" (requires knowing City-Link is available)
- ✅ Admin selects: "Use cheapest courier" (works regardless of which couriers are available)

---

## Recommendation

**For our MVP implementation:**

1. **Start with "Cheapest Courier" as default strategy**
   - Simplest for customers (no choice needed)
   - Lowest shipping cost
   - One-click admin fulfillment

2. **Allow admin to switch to "All Couriers" if desired**
   - Gives customers choice
   - Still simple to implement

3. **Add "Selected Couriers" in Phase 2**
   - After launch and feedback
   - If admin wants to control courier quality

4. **Skip zone-based configuration for now**
   - Single global strategy is sufficient
   - Can add zones later if needed

**Estimated implementation time:** 2-3 days (much faster than old system)

---

**Document Version:** 1.0
**Status:** Solution documented, ready for implementation
**Next Step:** Update `SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md` with strategy-based approach
