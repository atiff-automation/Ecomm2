# Integration Testing Checklist - Shipping System
**Project:** EcomJRM E-commerce Platform
**Date:** 2025-10-07
**Spec Reference:** SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md
**Status:** Ready for Testing

---

## Testing Environment Setup

### Prerequisites
- [ ] Development environment running on `http://localhost:3000`
- [ ] Database seeded with test products (with valid weights)
- [ ] EasyParcel API credentials configured in `.env`
- [ ] EasyParcel account has sufficient balance (>RM 50)
- [ ] Email service (Resend) configured or in mock mode
- [ ] Test user accounts created (customer + admin)
- [ ] Browser DevTools open for monitoring network requests

### Environment Variables Checklist
```bash
# Required for shipping system
DATABASE_URL="postgresql://..."
EASYPARCEL_API_KEY="ep_live_xxx" # or ep_sandbox_xxx
EASYPARCEL_BASE_URL="https://api.easyparcel.com/v2"
RESEND_API_KEY="re_xxx" # or leave empty for mock mode
CRON_SECRET="your-secret-key" # for tracking updates
```

---

## Phase 1: Admin Configuration (Day 1 Features)

### 1.1 Shipping Settings Page Access
**Location:** Admin → Shipping Settings
**File:** `src/app/admin/shipping/page.tsx`

- [ ] **Test:** Navigate to admin shipping settings page
  - **Expected:** Page loads without errors
  - **Expected:** Form displays all configuration sections
  - **Expected:** No console errors in browser DevTools

### 1.2 API Configuration Section
- [ ] **Test:** Enter valid EasyParcel API key
  - **Input:** `ep_sandbox_xxx` or `ep_live_xxx`
  - **Expected:** Input accepts alphanumeric + special characters
  - **Expected:** No frontend validation errors

- [ ] **Test:** Select environment (Sandbox/Production)
  - **Expected:** Radio button selection works
  - **Expected:** Selection persists on form

- [ ] **Test:** Click "Test Connection" button
  - **Expected:** Loading indicator appears
  - **Expected:** Success message: "✅ Connection successful!"
  - **Expected:** OR Error message with details if invalid

### 1.3 Pickup Address Configuration
- [ ] **Test:** Fill in business information
  - **Input:** Business Name: "Test Shop Malaysia"
  - **Input:** Phone: "+60123456789"
  - **Input:** Address Line 1: "123 Jalan Test"
  - **Input:** Address Line 2: "Unit 456" (optional)
  - **Input:** City: "Kuala Lumpur"
  - **Input:** Postal Code: "50000"
  - **Expected:** All fields accept valid input

- [ ] **Test:** State dropdown selection
  - **Expected:** Dropdown populated with Malaysian states
  - **Expected:** States display full names (e.g., "Kuala Lumpur", "Selangor")
  - **Expected:** Values are 3-letter codes (e.g., "kul", "sgr")
  - **Verify:** No typos allowed (dropdown prevents free text)

- [ ] **Test:** Phone number validation
  - **Input:** "123456" (invalid format)
  - **Expected:** Validation error: "Must start with +60"
  - **Input:** "+60123456789" (valid)
  - **Expected:** No validation error

- [ ] **Test:** Postal code validation
  - **Input:** "123" (too short)
  - **Expected:** Validation error
  - **Input:** "50000" (valid)
  - **Expected:** No validation error

### 1.4 Courier Selection Strategy
- [ ] **Test:** Strategy selection dropdown
  - **Expected:** Three options available:
    1. Cheapest Courier (Recommended)
    2. Show All Couriers
    3. Selected Couriers
  - **Expected:** Default selection: "Cheapest Courier"

- [ ] **Test:** "Selected Couriers" mode
  - **Action:** Select "Selected Couriers" from dropdown
  - **Expected:** Courier checkbox list appears
  - **Expected:** At least 5 couriers listed (City-Link, J&T, Skynet, Poslaju, etc.)
  - **Action:** Select 2 couriers (e.g., City-Link + J&T)
  - **Expected:** Checkboxes toggle correctly

### 1.5 Free Shipping Configuration
- [ ] **Test:** Enable free shipping threshold
  - **Action:** Check "Enable free shipping threshold"
  - **Expected:** Amount input field appears
  - **Input:** "150"
  - **Expected:** Accepts decimal values (e.g., "150.50")

### 1.6 Account Balance Display
- [ ] **Test:** View account balance
  - **Action:** Click "Refresh Balance" button
  - **Expected:** Balance displays (e.g., "Current Balance: RM 250.50")
  - **Expected:** Low balance warning if < RM 50
  - **Warning Text:** "⚠️ Your balance is running low. Top up to avoid fulfillment failures."

### 1.7 Save Settings
- [ ] **Test:** Save configuration
  - **Action:** Click "Save Settings" button
  - **Expected:** Loading indicator during save
  - **Expected:** Success message: "Settings saved successfully"
  - **Expected:** No console errors
  - **Verify:** Refresh page and settings persist

---

## Phase 2: Customer Checkout Flow (Day 2 Features)

### 2.1 Checkout Page - Shipping Address Entry
**Location:** Customer → Checkout
**File:** `src/app/checkout/page.tsx`

- [ ] **Test:** Navigate to checkout page with items in cart
  - **Prerequisites:** Cart has 2-3 products with valid weights
  - **Expected:** Checkout page loads
  - **Expected:** Shipping section is visible

- [ ] **Test:** Enter complete shipping address
  - **Input:** Full Name: "John Doe"
  - **Input:** Phone: "+60123456789"
  - **Input:** Address Line 1: "789 Jalan Customer"
  - **Input:** City: "Kuala Lumpur"
  - **Input:** State: "Kuala Lumpur" (from dropdown)
  - **Input:** Postal Code: "50000"
  - **Expected:** All fields accept input without errors

### 2.2 Automatic Shipping Calculation
- [ ] **Test:** Auto-trigger shipping calculation
  - **Trigger:** Complete address entry (all required fields filled)
  - **Expected:** After 500ms debounce, loading state appears
  - **Expected:** Loading message: "⏳ Calculating shipping cost..."
  - **Expected:** "Proceed to Payment" button is disabled during calculation
  - **Monitor:** Network tab shows POST to `/api/shipping/calculate`

### 2.3 Shipping Display - Strategy A (Cheapest Courier)
**Prerequisites:** Admin configured "Cheapest Courier" strategy

- [ ] **Test:** View cheapest courier result
  - **Expected:** Single shipping option displayed
  - **Expected:** Display format:
    ```
    📦 Standard Shipping
    Via: City-Link Express (Pick-up)
    Delivery: 2-3 working days
    Cost: RM 5.50
    (Cheapest option automatically selected)
    ```
  - **Expected:** No radio buttons (auto-selected)
  - **Expected:** "Proceed to Payment" button enabled

### 2.4 Shipping Display - Strategy B (Show All Couriers)
**Prerequisites:** Admin configured "Show All Couriers" strategy

- [ ] **Test:** View all courier options
  - **Expected:** Multiple courier options displayed as radio buttons
  - **Expected:** Cheapest option pre-selected
  - **Expected:** Each option shows:
    - Courier name
    - Cost (RM X.XX)
    - Estimated delivery time
  - **Action:** Select a different courier
  - **Expected:** Selection updates
  - **Expected:** Total amount updates to reflect shipping cost

### 2.5 Shipping Display - Strategy C (Selected Couriers)
**Prerequisites:** Admin configured "Selected Couriers" (2 couriers only)

- [ ] **Test:** View limited courier options
  - **Expected:** Only admin-approved couriers displayed
  - **Expected:** If only 1 courier available for this destination, auto-selected
  - **Expected:** If 2+ couriers available, customer must choose

### 2.6 Free Shipping Threshold
**Prerequisites:** Admin enabled free shipping at RM 150 minimum

- [ ] **Test:** Cart subtotal below threshold
  - **Cart Subtotal:** RM 100
  - **Expected:** Normal shipping cost displayed (e.g., RM 5.50)

- [ ] **Test:** Cart subtotal meets threshold
  - **Cart Subtotal:** RM 150 or more
  - **Expected:** Shipping cost: RM 0.00
  - **Expected:** Display message: "🎉 FREE SHIPPING"
  - **Expected:** Display message: "✓ You saved RM X.XX on shipping!"
  - **Expected:** Cheapest courier auto-selected for free shipping

### 2.7 Error Scenarios - No Couriers Available
- [ ] **Test:** Remote area with no courier coverage
  - **Input:** Postal Code: "99999" (hypothetical unreachable area)
  - **Expected:** Error message displayed:
    ```
    ❌ Shipping Not Available
    Sorry, we cannot ship to this address.
    Please try:
    • A different delivery address
    • Contact us for assistance
    ```
  - **Expected:** "Proceed to Payment" button remains disabled
  - **Expected:** No shipping cost displayed

### 2.8 Error Scenarios - API Failure
- [ ] **Test:** Simulate EasyParcel API down
  - **Action:** Temporarily set invalid API key in admin settings
  - **Expected:** Error message:
    ```
    ⚠️ Unable to Calculate Shipping
    We're having trouble connecting to our shipping service.
    [Retry Calculation] button
    ```
  - **Expected:** "Proceed to Payment" button disabled
  - **Action:** Click "Retry Calculation"
  - **Expected:** Retries shipping calculation

### 2.9 Order Creation with Shipping Data
- [ ] **Test:** Complete payment and create order
  - **Action:** Select payment method and click "Proceed to Payment"
  - **Action:** Complete mock payment (or use test payment)
  - **Expected:** Order created successfully
  - **Expected:** Order status: PAID
  - **Verify:** Check database order record has:
    - `selectedCourierServiceId` populated
    - `courierName` populated
    - `courierServiceType` populated
    - `shippingCost` matches selected courier cost
    - `shippingWeight` calculated correctly
    - `estimatedDelivery` populated

**Database Verification Query:**
```sql
SELECT
  orderNumber,
  status,
  selectedCourierServiceId,
  courierName,
  courierServiceType,
  shippingCost,
  shippingWeight,
  estimatedDelivery
FROM "Order"
ORDER BY createdAt DESC
LIMIT 1;
```

---

## Phase 3: Admin Fulfillment (Day 3 Features)

### 3.1 Order Detail Page - Fulfillment Widget
**Location:** Admin → Orders → [Order Detail]
**File:** `src/app/admin/orders/[id]/page.tsx`

- [ ] **Test:** View order detail page for PAID order
  - **Prerequisites:** Order from Phase 2 exists with status PAID
  - **Expected:** Order detail page loads
  - **Expected:** FulfillmentWidget visible in sidebar
  - **Expected:** Widget shows "📦 Shipping & Fulfillment" heading

### 3.2 Pre-Fulfillment State Display
- [ ] **Test:** View customer's selected courier
  - **Expected:** Display section: "Customer Selected:"
  - **Expected:** Shows courier name and cost (e.g., "City-Link Express - RM 5.50")
  - **Expected:** Matches what customer selected at checkout

- [ ] **Test:** View courier override dropdown
  - **Expected:** Dropdown labeled "Change Courier (Optional)"
  - **Expected:** Customer's courier pre-selected
  - **Expected:** Dropdown populated with alternative couriers
  - **Expected:** Each option shows courier name and cost
  - **Expected:** Helper text explaining admin override purpose

- [ ] **Test:** View pickup date selector
  - **Expected:** Date input field labeled "Pickup Date:"
  - **Expected:** Default value: Next business day
  - **Verify:** If today is Friday, default is Monday
  - **Verify:** If today is Saturday, default is Monday
  - **Verify:** Sundays cannot be selected
  - **Action:** Try selecting a Sunday
  - **Expected:** Date picker skips Sunday

- [ ] **Test:** View shipment summary
  - **Expected:** Display shows:
    - Destination: [State, Postal Code]
    - Weight: [X.X kg]
    - Estimated Delivery: [X-X days]

### 3.3 Book Shipment - Success Flow
- [ ] **Test:** Click "Book Shipment with EasyParcel"
  - **Action:** Click button (using customer's selected courier)
  - **Expected:** Button disabled during processing
  - **Expected:** Loading indicator appears
  - **Expected:** Progress messages:
    - "⏳ Booking Shipment..."
    - "Creating shipment with EasyParcel..."
  - **Monitor:** Network tab shows POST to `/api/admin/orders/[orderId]/fulfill`
  - **Expected:** Success within 5 seconds

- [ ] **Test:** Verify post-fulfillment state
  - **Expected:** Widget updates to success state
  - **Expected:** Display: "✅ Shipment Booked Successfully"
  - **Expected:** Shows:
    - Courier name
    - Service type
    - Tracking number (with copy button)
    - AWB number
  - **Expected:** Order status updates to READY_TO_SHIP
  - **Expected:** Quick action buttons appear:
    - [Download AWB]
    - [View Tracking]
    - [Copy URL]

- [ ] **Test:** Download AWB label
  - **Action:** Click "Download AWB" button
  - **Expected:** PDF label downloads automatically
  - **Expected:** File name format: `awb_ord_[orderNumber].pdf`

- [ ] **Test:** Email #2 sent to customer
  - **Check:** Email service logs or inbox
  - **Expected:** Email sent with subject: "Shipment Tracking - Order #XXX"
  - **Expected:** Email contains:
    - Order number
    - Tracking number
    - Estimated delivery
    - Order summary
  - **Verify:** Only 1 email sent (not multiple)

### 3.4 Admin Courier Override
- [ ] **Test:** Change courier before fulfillment
  - **Action:** Select different courier from dropdown (e.g., J&T instead of City-Link)
  - **Action:** Click "Book Shipment with EasyParcel"
  - **Expected:** Shipment created with new courier
  - **Expected:** Order record shows overridden courier in `courierName`
  - **Expected:** `adminNotes` field contains override message:
    ```
    Admin overrode courier selection.
    Original: City-Link Express
    New: J&T Express
    ```

### 3.5 Error Handling - Insufficient Balance
- [ ] **Test:** Simulate low balance error
  - **Prerequisites:** EasyParcel account balance < shipping cost
  - **Action:** Attempt to book shipment
  - **Expected:** Error state displayed:
    ```
    ❌ Booking Failed
    Error: Insufficient EasyParcel credit balance
    Current Balance: RM 3.50
    Required: RM 5.50
    ```
  - **Expected:** Action buttons shown:
    - [Go to Top Up Page]
    - [Retry Booking]
  - **Expected:** Order status remains PAID (not changed)

- [ ] **Test:** Retry after top-up
  - **Action:** Click "Retry Booking"
  - **Expected:** Attempts booking again
  - **Expected:** If balance sufficient, succeeds

### 3.6 Error Handling - Invalid Address
- [ ] **Test:** Book shipment with problematic address
  - **Scenario:** Order has incomplete or invalid shipping address
  - **Expected:** Error message: "Invalid shipping address"
  - **Expected:** Suggested action: "Review shipping address"
  - **Expected:** Order remains PAID

### 3.7 Duplicate Prevention
- [ ] **Test:** Attempt to fulfill already-fulfilled order
  - **Prerequisites:** Order already has tracking number
  - **Action:** Refresh page or navigate to order detail
  - **Expected:** "Book Shipment" button disabled (greyed out)
  - **Expected:** Tooltip: "Order already fulfilled"
  - **Expected:** Display: "✓ This order has already been fulfilled. Tracking: [number]"

---

## Phase 4: Tracking System (Day 4 Features)

### 4.1 Manual Tracking Refresh (Admin)
**Location:** Admin → Order Detail
**File:** `src/app/api/shipping/track/[trackingNumber]/route.ts`

- [ ] **Test:** View tracking history section
  - **Prerequisites:** Order fulfilled (status READY_TO_SHIP or later)
  - **Expected:** Tracking history section visible
  - **Expected:** Shows tracking events with timestamps
  - **Expected:** Latest status at top

- [ ] **Test:** Click "Refresh Tracking" button
  - **Action:** Click button
  - **Expected:** Loading indicator appears
  - **Monitor:** Network shows GET to `/api/shipping/track/[trackingNumber]`
  - **Expected:** Tracking history updates
  - **Expected:** "Last updated: [timestamp]" updates

- [ ] **Test:** Status change detection
  - **Scenario:** Courier picks up parcel (status changes to IN_TRANSIT)
  - **Action:** Click "Refresh Tracking"
  - **Expected:** Order status updates from READY_TO_SHIP to IN_TRANSIT
  - **Expected:** New tracking event appears
  - **Verify:** Database order status updated

### 4.2 Automatic Tracking Updates (Cron Job)
**File:** `src/app/api/cron/update-tracking/route.ts`
**Schedule:** Every 4 hours

- [ ] **Test:** Manual cron trigger
  - **Method:** Call cron endpoint directly
  - **Request:**
    ```bash
    curl -X GET "http://localhost:3000/api/cron/update-tracking?secret=YOUR_CRON_SECRET"
    ```
  - **Expected:** HTTP 200 response
  - **Expected:** Response JSON:
    ```json
    {
      "success": true,
      "message": "Tracking update completed. Updated X of Y orders.",
      "stats": {
        "processed": 5,
        "updated": 2,
        "failed": 0,
        "skipped": 0,
        "duration": 1234
      }
    }
    ```
  - **Verify:** Check server logs for "[Cron]" messages

- [ ] **Test:** Cron job updates order statuses
  - **Prerequisites:** Multiple orders in READY_TO_SHIP, IN_TRANSIT, OUT_FOR_DELIVERY states
  - **Action:** Trigger cron job
  - **Expected:** Orders with status changes are updated
  - **Expected:** Orders with no changes remain unchanged
  - **Verify:** Database query shows updated `status` and `updatedAt` fields

- [ ] **Test:** Cron job marks orders as DELIVERED
  - **Scenario:** EasyParcel tracking shows "delivered" status
  - **Action:** Trigger cron job
  - **Expected:** Order status updates to DELIVERED
  - **Expected:** `deliveredAt` timestamp populated
  - **Verify:** NO email sent (spec line 1245: "No email notifications")

- [ ] **Test:** Cron job error handling
  - **Scenario:** Invalid tracking number in database
  - **Expected:** Cron continues processing other orders
  - **Expected:** Error logged but not thrown
  - **Expected:** Statistics show failed count

### 4.3 Email Notification Policy Verification
**CRITICAL:** Verify 2-email-only policy (spec line 1245)

- [ ] **Test:** Email #1 - Order Confirmation
  - **Trigger:** Order created with status PAID
  - **Expected:** 1 email sent with subject: "Order Confirmation - #XXX"
  - **Expected:** Email contains order details, payment confirmation

- [ ] **Test:** Email #2 - Shipment Tracking
  - **Trigger:** Admin fulfills order (status changes to READY_TO_SHIP)
  - **Expected:** 1 email sent with subject: "Shipment Tracking - Order #XXX"
  - **Expected:** Email contains tracking number, AWB, estimated delivery

- [ ] **Test:** NO Email #3 for DELIVERED
  - **Trigger:** Order status changes to DELIVERED (via cron job or manual update)
  - **Expected:** NO email sent
  - **Verify:** Check email service logs - no "Order Delivered" email
  - **Verify:** Cron job code has no `sendEmail` calls
  - **Verify:** Email service has no `sendOrderDeliveredNotification` method

---

## Phase 5: End-to-End Integration

### 5.1 Complete Customer Journey
- [ ] **Test:** Full flow from browse to delivery
  1. Customer browses products
  2. Adds items to cart (total weight > 0)
  3. Proceeds to checkout
  4. Enters shipping address
  5. Sees shipping cost calculated automatically
  6. Selects courier (or auto-selected if "cheapest")
  7. Completes payment
  8. Receives Email #1 (Order Confirmation)
  9. Admin views order (status PAID)
  10. Admin clicks "Book Shipment"
  11. Shipment booked successfully
  12. Customer receives Email #2 (Tracking Number)
  13. Cron job runs (4 hours later)
  14. Order status updates to IN_TRANSIT
  15. NO email sent for status change
  16. Cron job runs again
  17. Order status updates to DELIVERED
  18. NO email sent for delivery
  - **Expected:** All steps complete without errors
  - **Expected:** Only 2 emails sent (confirmation + tracking)

### 5.2 Free Shipping Journey
- [ ] **Test:** Cart meets free shipping threshold
  1. Customer adds items totaling RM 150+
  2. Proceeds to checkout
  3. Enters shipping address
  4. **Expected:** Shipping cost: RM 0.00
  5. **Expected:** "FREE SHIPPING" message displayed
  6. **Expected:** Savings message: "You saved RM X.XX"
  7. Completes payment
  8. Order created with `shippingCost: 0`
  9. Admin fulfills order normally
  10. **Expected:** EasyParcel charged (balance deducted)
  11. **Verify:** Customer got free shipping, admin paid actual cost

### 5.3 Admin Courier Override Journey
- [ ] **Test:** Admin changes customer's courier selection
  1. Customer selects City-Link (RM 5.50) at checkout
  2. Order created with `selectedCourierServiceId` = City-Link
  3. Admin views order, sees "Customer Selected: City-Link"
  4. Admin changes to J&T (RM 5.30) via dropdown
  5. Admin books shipment
  6. **Expected:** Shipment created with J&T
  7. **Expected:** `courierName` = J&T Express
  8. **Expected:** `adminNotes` contains override message
  9. Customer receives tracking email (shows J&T, not City-Link)

---

## Phase 6: Error Recovery & Edge Cases

### 6.1 Network Failures
- [ ] **Test:** Checkout during EasyParcel API timeout
  - **Simulate:** Temporarily disconnect internet or block API domain
  - **Expected:** Timeout error message
  - **Expected:** "Retry Calculation" button appears
  - **Expected:** Checkout blocked until shipping calculated

- [ ] **Test:** Fulfillment during API timeout
  - **Simulate:** API timeout during booking
  - **Expected:** Error message: "Failed to create shipment"
  - **Expected:** Order status remains PAID
  - **Expected:** "Retry" button available
  - **Expected:** No partial data saved

### 6.2 Data Validation Failures
- [ ] **Test:** Product with zero weight
  - **Scenario:** Product in cart has weight = 0
  - **Expected:** Checkout blocked or error displayed
  - **Expected:** Message: "Cannot calculate shipping - invalid product weight"

- [ ] **Test:** Missing shipping address fields
  - **Scenario:** Postal code missing
  - **Expected:** Shipping calculation not triggered
  - **Expected:** "Complete address to calculate shipping" message

### 6.3 Payment & Order Creation Edge Cases
- [ ] **Test:** Payment fails after shipping calculated
  - **Action:** Select shipping, proceed to payment, payment fails
  - **Expected:** Order not created
  - **Expected:** Can retry payment with same shipping selection

- [ ] **Test:** Payment succeeds but order creation fails
  - **Scenario:** Database error during order creation
  - **Expected:** Payment recorded but order not created
  - **Expected:** Admin notified of orphaned payment
  - **Note:** This is a critical edge case - needs manual intervention

### 6.4 Fulfillment Edge Cases
- [ ] **Test:** AWB generation fails but shipment created
  - **Scenario:** EasyParcel creates shipment but label PDF unavailable
  - **Expected:** Partial success state displayed
  - **Expected:** Message: "⚠️ Shipment Created (AWB Pending)"
  - **Expected:** "Retry AWB Download" button available
  - **Expected:** Order status: READY_TO_SHIP (shipment exists)
  - **Action:** Click "Retry AWB Download"
  - **Expected:** Label downloads successfully

- [ ] **Test:** Courier unavailable at fulfillment
  - **Scenario:** Customer selected City-Link, but at fulfillment time it's unavailable
  - **Expected:** Error message suggesting courier override
  - **Expected:** Admin can select alternative courier
  - **Expected:** Override recorded in `adminNotes`

---

## Phase 7: Performance & Load Testing

### 7.1 Checkout Performance
- [ ] **Test:** Shipping calculation response time
  - **Action:** Complete address, trigger calculation
  - **Measure:** Time from API request to response
  - **Expected:** < 3 seconds (per spec)
  - **Monitor:** Network tab waterfall

- [ ] **Test:** Multiple concurrent checkouts
  - **Simulate:** 5 customers calculating shipping simultaneously
  - **Expected:** All requests complete successfully
  - **Expected:** No rate limit errors from EasyParcel

### 7.2 Fulfillment Performance
- [ ] **Test:** Shipment booking response time
  - **Action:** Click "Book Shipment"
  - **Measure:** Time to completion
  - **Expected:** < 5 seconds (per spec)

### 7.3 Cron Job Performance
- [ ] **Test:** Cron job with 50+ active orders
  - **Prerequisites:** Database has 50+ orders in active states
  - **Action:** Trigger cron job
  - **Measure:** Completion time
  - **Expected:** < 5 minutes (per spec)
  - **Verify:** No database connection timeouts
  - **Verify:** Clean exit (no resource leaks)

---

## Phase 8: Security Testing

### 8.1 Authentication Checks
- [ ] **Test:** Access admin endpoints without login
  - **Request:** GET /api/admin/shipping/settings (not logged in)
  - **Expected:** HTTP 401 Unauthorized
  - **Request:** POST /api/admin/orders/[id]/fulfill (not logged in)
  - **Expected:** HTTP 401 Unauthorized

- [ ] **Test:** Access admin endpoints as customer
  - **Login:** Customer account (non-admin)
  - **Request:** POST /api/admin/orders/[id]/fulfill
  - **Expected:** HTTP 403 Forbidden

### 8.2 Input Validation
- [ ] **Test:** SQL injection in shipping address
  - **Input:** Address Line 1: `"; DROP TABLE Order; --`
  - **Expected:** Input sanitized, no SQL execution
  - **Verify:** Zod validation rejects or sanitizes

- [ ] **Test:** XSS in customer name
  - **Input:** Name: `<script>alert('XSS')</script>`
  - **Expected:** Escaped in database and email
  - **Expected:** No script execution when displayed

### 8.3 Authorization Checks
- [ ] **Test:** Customer cannot access other customer's orders
  - **Login:** Customer A
  - **Request:** GET /api/orders/[customer_B_order_id]
  - **Expected:** HTTP 403 Forbidden or 404 Not Found

- [ ] **Test:** Admin can access all orders
  - **Login:** Admin
  - **Request:** GET /api/admin/orders/[any_order_id]
  - **Expected:** HTTP 200 OK with order data

### 8.4 Secrets Management
- [ ] **Test:** API keys not exposed to client
  - **Action:** View page source and network responses
  - **Expected:** No `EASYPARCEL_API_KEY` in HTML or JSON
  - **Expected:** No `RESEND_API_KEY` visible

---

## Phase 9: Database Integrity

### 9.1 Order Status Consistency
- [ ] **Test:** Status transitions follow rules
  - **Query:** Check for invalid transitions (e.g., DELIVERED → PAID)
  ```sql
  -- This should return 0 rows
  SELECT * FROM "Order"
  WHERE status = 'PAID' AND deliveredAt IS NOT NULL;
  ```

### 9.2 Shipping Data Completeness
- [ ] **Test:** PAID orders have shipping data
  ```sql
  -- Check orders missing shipping fields
  SELECT orderNumber, status, selectedCourierServiceId, shippingWeight
  FROM "Order"
  WHERE status != 'PENDING'
    AND (selectedCourierServiceId IS NULL OR shippingWeight IS NULL);
  -- Should return 0 rows for PAID/READY_TO_SHIP orders
  ```

### 9.3 Tracking Number Uniqueness
- [ ] **Test:** No duplicate tracking numbers
  ```sql
  SELECT trackingNumber, COUNT(*)
  FROM "Order"
  WHERE trackingNumber IS NOT NULL
  GROUP BY trackingNumber
  HAVING COUNT(*) > 1;
  -- Should return 0 rows
  ```

---

## Phase 10: Code Quality Verification

### 10.1 TypeScript Compilation
- [ ] **Test:** No TypeScript errors
  ```bash
  npm run typecheck
  # or
  npx tsc --noEmit
  ```
  - **Expected:** Exit code 0, no errors

### 10.2 ESLint Pass
- [ ] **Test:** No linting errors
  ```bash
  npm run lint
  ```
  - **Expected:** Exit code 0, no errors
  - **Expected:** No `any` types in shipping code

### 10.3 Coding Standards Compliance
- [ ] **Review:** All shipping files follow CODING_STANDARDS.md
  - [ ] No `any` types used
  - [ ] All functions have explicit types
  - [ ] Three-layer validation present
  - [ ] Error handling in all async operations
  - [ ] Authorization checks on admin routes
  - [ ] Secrets in environment variables only
  - [ ] No code duplication (DRY principle)

---

## Phase 11: Spec Compliance Verification

### 11.1 Must-Have Features (from spec)
- [x] ✅ Customer sees shipping cost at checkout before payment
- [x] ✅ Admin can fulfill orders with one click
- [x] ✅ Tracking information visible to customer and admin
- [x] ✅ Free shipping threshold support
- [x] ✅ No courier available = block checkout
- [x] ✅ Duplicate fulfillment prevention
- [x] ✅ Email notifications (2 only: confirmation + tracking)
- [x] ✅ Admin courier override at fulfillment
- [x] ✅ Pickup date selection
- [x] ✅ Credit balance display
- [x] ✅ Retry failed bookings
- [x] ✅ Auto-update toggle (admin control)

### 11.2 Should-Have Features
- [x] ✅ Manual tracking refresh for admin
- [x] ✅ Automatic tracking updates every 4 hours
- [x] ✅ Detailed fulfillment UI with clear visual states
- [x] ✅ Low balance warnings (< RM 50)

### 11.3 Won't-Have Features (verify NOT implemented)
- [ ] ✅ NO CSV export fallback
- [ ] ✅ NO bulk fulfillment operations
- [ ] ✅ NO complex courier scoring algorithms
- [ ] ✅ NO operating hours configuration
- [ ] ✅ NO insurance/COD/signature options at checkout
- [ ] ✅ NO advanced analytics and reporting
- [ ] ✅ NO webhook integration for tracking

### 11.4 Email Policy Compliance
- [x] ✅ Only 2 emails sent per order (Spec line 1245)
  - Email #1: Order Confirmation (PAID status)
  - Email #2: Shipment Tracking (READY_TO_SHIP status)
  - NO Email #3 for DELIVERED status
- [x] ✅ `sendOrderDeliveredNotification` method removed from email service
- [x] ✅ Cron job has NO email sending code
- [x] ✅ Fulfillment API only sends Email #2

---

## Phase 12: Documentation Review

### 12.1 Inline Code Comments
- [ ] **Review:** Complex logic has "why" comments
- [ ] **Review:** Date utilities explain business day logic
- [ ] **Review:** Weight calculations explain rounding rules
- [ ] **Review:** Status mapping functions explain transitions

### 12.2 API Documentation
- [ ] **Review:** All API routes have JSDoc comments
- [ ] **Review:** Request/response schemas documented
- [ ] **Review:** Error codes documented

---

## Testing Summary

### Coverage Report
- [ ] **Day 1 (Admin Config):** ___% tested
- [ ] **Day 2 (Checkout):** ___% tested
- [ ] **Day 3 (Fulfillment):** ___% tested
- [ ] **Day 4 (Tracking):** ___% tested

### Critical Issues Found
_List any blocking issues discovered during testing:_
1.
2.
3.

### Non-Critical Issues
_List minor issues that don't block release:_
1.
2.
3.

### Test Results
- **Total Test Cases:** 150+
- **Passed:** ___
- **Failed:** ___
- **Skipped:** ___
- **Pass Rate:** ___%

---

## Sign-Off

**Tested By:** _______________________
**Date:** _______________________
**Status:** [ ] PASSED [ ] FAILED [ ] NEEDS REVIEW
**Ready for Production:** [ ] YES [ ] NO

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
