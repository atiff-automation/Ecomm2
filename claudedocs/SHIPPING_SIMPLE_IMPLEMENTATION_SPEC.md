# Simple Shipping System - Complete Implementation Specification
**Project:** EcomJRM E-commerce Platform
**Date:** 2025-10-07
**Approach:** KISS (Keep It Simple, Stupid) - WooCommerce-inspired
**Status:** Pre-launch (No production orders)

---

## Executive Summary

This document defines the complete specification for a simple, practical, and efficient EasyParcel shipping integration. The design follows WooCommerce plugin principles: minimal configuration, automatic operation, clear user experience.

**Core Philosophy:**
- Simple over sophisticated
- Practical over perfect
- Efficient over exhaustive
- Customer experience first
- Admin effort minimized

**Key Innovation:**
Strategy-based courier selection (inspired by WooCommerce EasyParcel plugin) solves the "need destination to get couriers" problem by letting admin choose HOW to select couriers, not which specific couriers.

**Key Metrics:**
- Estimated code: ~1,200 lines (vs 12,000+ in old system)
- Configuration time: 5 minutes
- Customer checkout: 1-2 clicks (depends on strategy)
- Admin fulfillment: 1-2 clicks (with optional courier override)
- Tracking: Automatic with manual retry option

**Courier Selection Strategies:**
1. **Cheapest Courier** (Default) - Auto-select lowest cost, 1-click checkout
2. **Show All Couriers** - Customer chooses, maximum flexibility
3. **Selected Couriers** - Admin limits options, quality control

**Critical Features (WooCommerce-Inspired):**
- Admin courier override at fulfillment (flexibility when customer's choice unavailable)
- Pickup date scheduling (weekend/holiday handling)
- Credit balance monitoring (prevent fulfillment failures)
- Retry mechanism for failed bookings (API resilience)
- Auto-update toggle (admin control over automation)
- Detailed fulfillment UI (sidebar widget with clear states)

---

## Table of Contents

**🔴 [MANDATORY CODING STANDARDS](./CODING_STANDARDS.md)** ← Read This First! (Separate Document)

1. [System Requirements](#system-requirements)
2. [User Flows](#user-flows)
3. [Order Status Lifecycle](#order-status-lifecycle)
4. [Admin Configuration](#admin-configuration)
5. [Customer Checkout Experience](#customer-checkout-experience)
6. [Admin Fulfillment Process](#admin-fulfillment-process)
7. [Tracking System](#tracking-system)
8. [Technical Architecture](#technical-architecture)
9. [Checkout Integration & Order Creation](#checkout-integration--order-creation)
10. [Order Management Page Integration](#order-management-page-integration)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [Email Notifications](#email-notifications)
14. [Error Handling](#error-handling)
15. [Edge Cases](#edge-cases)
16. [Pending Decisions](#pending-decisions)
17. [Code Quality & Best Practices](#code-quality--best-practices)
18. [Implementation Timeline](#implementation-timeline)

---

## 🔴 MANDATORY CODING STANDARDS

**⚠️ CRITICAL:** All implementation work MUST follow the coding standards defined in:

## **📋 [CODING_STANDARDS.md](./CODING_STANDARDS.md) ← READ THIS FIRST!**

**This document contains:**
- ✅ SOLID + DRY + KISS principles with examples
- ✅ Three-layer validation principle (Frontend → API → Database)
- ✅ TypeScript strict typing requirements
- ✅ Security standards (authentication, authorization, input validation)
- ✅ Error handling patterns
- ✅ React component standards
- ✅ Database best practices
- ✅ 15-item code review checklist
- ✅ 7 forbidden anti-patterns
- ✅ Testing requirements

**⚠️ NON-NEGOTIABLE:** Failure to adhere to these standards will result in code rejection.

**Quick Reference:**
```typescript
// Example: Three-Layer Validation Pattern
// Layer 1: Frontend (HTML5 validation)
<input type="number" min="0.01" max="1000" required />

// Layer 2: API (Zod validation)
const Schema = z.object({
  weight: z.number().positive().min(0.01).max(1000)
});

// Layer 3: Database (Prisma constraints)
model Product {
  weight Decimal @db.Decimal(8, 2)
  @@check([weight > 0])
}
```

---

## System Requirements

### Functional Requirements

**Must Have:**
1. Customer sees shipping cost at checkout before payment
2. Admin can fulfill orders with one click (with optional courier override)
3. Tracking information visible to customer and admin
4. Free shipping threshold support
   - Applied to cart **subtotal** (before shipping, before tax)
   - If subtotal >= threshold: Show RM 0.00 shipping cost
   - If multiple free couriers available, select **cheapest** option
   - Customer sees: "FREE SHIPPING (You saved RM X.XX)"
5. No courier available = block checkout
6. Duplicate fulfillment prevention
7. Email notifications (order confirmation + tracking)
8. **Admin courier override at fulfillment** (can change customer's selected courier)
9. **Pickup date selection** (schedule pickup for next business day or future date)
10. **Credit balance display** (show EasyParcel account balance in settings)
11. **Retry failed bookings** (manual retry button for API failures)
12. **Auto-update toggle** (admin control over automatic order status updates)

**Should Have:**
1. Manual tracking refresh for admin (✅ covered by retry mechanism)
2. Automatic tracking updates every 4 hours
3. Detailed fulfillment UI with clear visual states
4. Low balance warnings when credit < RM 50

**Won't Have (for v1):**
1. CSV export fallback
2. Bulk fulfillment operations
3. Complex courier scoring algorithms
4. Operating hours configuration
5. Insurance/COD/Signature options at checkout
6. Advanced analytics and reporting
7. Webhook integration for tracking

### Non-Functional Requirements

**Performance:**
- Shipping rate calculation: < 3 seconds
- Order fulfillment API call: < 5 seconds
- Page load with shipping: < 2 seconds

**Reliability:**
- Handle EasyParcel API failures gracefully
- Retry mechanism for transient errors
- Clear error messages to users

**Usability:**
- Admin setup: < 5 minutes
- Customer checkout: No confusion
- Admin fulfillment: 1-click operation

**Maintainability:**
- Total code: < 1,000 lines
- Single service file (no layers)
- Clear separation of concerns
- Well-documented functions

---

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

## Order Status Lifecycle

### Status Definitions

```
PENDING
├─ Description: Order created, payment not completed
├─ Trigger: Customer submits order
└─ Next: PAID or CANCELLED

PAID
├─ Description: Payment successful, ready for fulfillment
├─ Trigger: Payment gateway confirms payment
├─ Admin Action Required: Yes (click "Fulfill Order")
└─ Next: READY_TO_SHIP or CANCELLED

READY_TO_SHIP
├─ Description: AWB received, label downloaded, ready for courier
├─ Trigger: Successful EasyParcel booking API call
├─ Admin Action Required: No (automated tracking updates)
├─ Display Name: "Ready to Ship"
└─ Next: IN_TRANSIT

IN_TRANSIT
├─ Description: Courier has picked up parcel
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Next: OUT_FOR_DELIVERY

OUT_FOR_DELIVERY
├─ Description: Parcel out for final delivery
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Next: DELIVERED

DELIVERED
├─ Description: Customer received parcel
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Final State: Yes

CANCELLED
├─ Description: Order cancelled (any reason)
├─ Trigger: Admin or customer cancellation
├─ Admin Action Required: Depends on timing
└─ Final State: Yes
```

### Status Transition Rules

**Allowed Transitions:**
```
PENDING → PAID
PENDING → CANCELLED

PAID → READY_TO_SHIP (via fulfillment)
PAID → CANCELLED (admin decision)

READY_TO_SHIP → IN_TRANSIT (auto-update)
READY_TO_SHIP → CANCELLED (before pickup only)

IN_TRANSIT → OUT_FOR_DELIVERY (auto-update)
IN_TRANSIT → DELIVERED (auto-update if no OUT_FOR_DELIVERY)

OUT_FOR_DELIVERY → DELIVERED (auto-update)
```

**Forbidden Transitions:**
```
❌ DELIVERED → Any other status (final state)
❌ READY_TO_SHIP → PAID (no backwards)
❌ IN_TRANSIT → PAID (no backwards)
```

---

## Admin Configuration

### Shipping Management Screen

**Location:** Admin → Shipping

**Navigation:** Top-level sidebar link (not under Settings)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ EasyParcel Shipping Settings                        │
└─────────────────────────────────────────────────────┘

━━━ 1. API Configuration ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Key *
[_________________________________________________]
Get your API key from EasyParcel dashboard

Environment *
○ Sandbox (Testing)
● Production (Live)

━━━ 2. Pickup Address (Sender Information) ━━━━━━━━━

Business Name *
[_________________________________________________]

Phone Number *
[_________________________________________________]
Format: +60XXXXXXXXX

Address Line 1 *
[_________________________________________________]

Address Line 2
[_________________________________________________]

City *
[_________________________________________________]

State *
[Kuala Lumpur ▼                                    ]

Postal Code *
[_____]
5-digit Malaysian postal code

Country *
[Malaysia (MY)]
ℹ️ v1: Malaysia only. v2: Add Singapore support.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPLEMENTATION NOTE (GAP #3 RESOLVED):

State field MUST use dropdown (not free text) to prevent typos.
Populate dropdown from MALAYSIAN_STATES constant defined in
src/lib/shipping/constants.ts

Example implementation:
```tsx
<select name="state" value={formData.state} onChange={handleChange}>
  <option value="">Select State</option>
  {Object.entries(MALAYSIAN_STATES).map(([code, name]) => (
    <option key={code} value={code}>{name}</option>
  ))}
</select>
```

Valid state codes: jhr, kdh, ktn, mlk, nsn, phg, prk, pls,
png, sgr, trg, kul, pjy, srw, sbh, lbn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 3. Courier Selection Strategy ━━━━━━━━━━━━━━━━━

How should customers see shipping options?

Courier Selection Mode *
[Cheapest Courier (Recommended) ▼                  ]

Options:
• Cheapest Courier - Auto-select lowest price (simplest)
• Show All Couriers - Customer chooses from all available
• Selected Couriers - Limit to specific couriers you choose

[Only shown if "Selected Couriers" is chosen above]
┌────────────────────────────────────────────────┐
│ Select Allowed Couriers:                       │
│ ☑ City-Link Express                            │
│ ☑ Skynet                                       │
│ ☐ J&T Express                                  │
│ ☐ Ninja Van                                    │
│ ☐ Poslaju                                      │
│ ☐ DHL eCommerce                                │
│                                                │
│ [Refresh Courier List]                         │
└────────────────────────────────────────────────┘

━━━ 4. Shipping Preferences ━━━━━━━━━━━━━━━━━━━━━━━

Free Shipping
☑ Enable free shipping threshold
Minimum order amount: RM [150___]

When enabled, orders above this amount get free shipping.

━━━ 5. Automation Settings ━━━━━━━━━━━━━━━━━━━━━━━━━

Order Status Auto-Update
☑ Automatically update order status based on tracking
  When enabled, order status will change based on courier tracking
  updates (e.g., IN_TRANSIT → DELIVERED).
  Uncheck if you prefer manual status control.

━━━ 6. Account Information ━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────────────────────┐
│ Current Balance: RM 250.50                     │
│ [Refresh Balance] [Top Up Account]            │
│                                                │
│ ⚠️ Your balance is running low. Top up to     │
│    avoid fulfillment failures.                 │
│    (This warning appears when balance < RM 50) │
└────────────────────────────────────────────────┘

Last updated: 5 minutes ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Test Connection]  [Save Settings]
```

### Field Validations

**API Key:**
- Required
- Minimum 20 characters
- Alphanumeric + special characters
- Test connection before saving

**Phone Number:**
- Required
- Format: `+60XXXXXXXXX` (Malaysian format)
- Regex: `^\\+60[0-9]{8,10}$`

**Postal Code:**
- Required
- Exactly 5 digits
- Regex: `^\\d{5}$`

**Country:**
- Required
- v1: Only 'MY' (Malaysia) accepted
- v2: Add 'SG' (Singapore) support

**State:**
- Required
- Must be valid lowercase 3-letter Malaysian state code
- See state code constant for valid values

**Courier Selection Mode:**
- Required
- Default: "Cheapest Courier"
- If "Selected Couriers": At least 1 courier must be selected

**Free Shipping Amount:**
- Optional (if enabled)
- Minimum: RM 1
- Maximum: RM 10,000
- Decimal allowed (e.g., RM 150.50)

### Test Connection Feature

When admin clicks "Test Connection":
```
1. Validate all required fields
2. Call EasyParcel API health check
3. Show result:
   ✅ "Connection successful! API is working."
   OR
   ❌ "Connection failed: [error message]"
```

---

## Customer Checkout Experience

### Shipping Address Form

**Fields (standard):**
- Full Name *
- Phone Number *
- Address Line 1 *
- Address Line 2
- City *
- State * (dropdown)
- Postal Code *
- Country (default: Malaysia, hidden)

### Shipping Rate Display

Display varies based on admin's configured **Courier Selection Strategy**:

#### Strategy A: "Cheapest Courier" (Default)

**Scenario 1: Couriers Available, No Free Shipping**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ 📦 Standard Shipping                            │
│                                                 │
│ Via: City-Link Express (Pick-up)                │
│ Delivery: 2-3 working days                      │
│ Cost: RM 5.50                                   │
│                                                 │
│ (Cheapest option automatically selected)        │
└─────────────────────────────────────────────────┘
```

**Customer sees:** One shipping option (no choice needed)

#### Strategy B: "Show All Couriers"

**Scenario 1: Multiple Couriers Available**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method (Choose one)                    │
├─────────────────────────────────────────────────┤
│ ◉ City-Link Express         RM 5.50             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ J&T Express               RM 5.80             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ Skynet                    RM 6.00             │
│   Delivery: 1-2 working days                    │
│                                                 │
│ ○ Poslaju                   RM 7.00             │
│   Delivery: 1-2 working days                    │
└─────────────────────────────────────────────────┘
```

**Customer sees:** All available couriers, selects preferred one

#### Strategy C: "Selected Couriers"

**Scenario 1: Admin Selected Only 2 Couriers (City-Link + Skynet)**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method (Choose one)                    │
├─────────────────────────────────────────────────┤
│ ◉ City-Link Express         RM 5.50             │
│   Delivery: 2-3 working days                    │
│                                                 │
│ ○ Skynet                    RM 6.00             │
│   Delivery: 1-2 working days                    │
└─────────────────────────────────────────────────┘
```

**Customer sees:** Only admin-approved couriers

**Note:** If admin selected 3+ couriers but only 1 is available for this destination, customer sees that 1 option only (no choice needed).

---

**Scenario 2: Free Shipping Threshold Met**

**Logic:** Cart subtotal >= threshold (before shipping, before tax) → Select cheapest courier, show RM 0.00

```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ 🎉 FREE SHIPPING                                │
│                                                 │
│ Via: J&T Express (Pick-up)                      │
│ Delivery: 2-3 working days                      │
│ Cost: RM 0.00                                   │
│                                                 │
│ ✓ You saved RM 10.00 on shipping!              │
└─────────────────────────────────────────────────┘
```

**Note:** If multiple couriers available, system automatically selects cheapest option for free shipping.

**Scenario 3: Calculating (Loading State)**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ⏳ Calculating shipping cost...                 │
│                                                 │
│ Please wait while we check available couriers   │
│ for your address.                               │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

**Scenario 4: No Couriers Available**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ❌ Shipping Not Available                       │
│                                                 │
│ Sorry, we cannot ship to this address.          │
│                                                 │
│ Please try:                                     │
│ • A different delivery address                  │
│ • Contact us for assistance                     │
│                                                 │
│ 📧 Email: support@ecomjrm.com                   │
│ 📱 WhatsApp: +60123456789                       │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

**Scenario 5: API Error**
```
┌─────────────────────────────────────────────────┐
│ Shipping Method                                 │
├─────────────────────────────────────────────────┤
│ ⚠️ Unable to Calculate Shipping                 │
│                                                 │
│ We're having trouble connecting to our          │
│ shipping service. Please try again.             │
│                                                 │
│ [Retry Calculation]                             │
└─────────────────────────────────────────────────┘

[Proceed to Payment] button disabled
```

### Checkout Behavior

**When address is complete:**
1. Auto-trigger shipping calculation (500ms debounce)
2. Show loading state
3. Call `/api/shipping/calculate`
4. Display result (rate or error)
5. Enable/disable payment button accordingly

**Payment button logic:**
```javascript
Enabled when:
✅ Address valid
✅ Shipping rate available
✅ Payment method selected

Disabled when:
❌ Address incomplete
❌ No shipping available
❌ Calculating shipping
❌ Shipping API error
```

---

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

## Tracking System

### Tracking Updates - Two Methods

#### Method 1: Manual Refresh (Immediate)

**Admin Order Detail Page:**
```
[Refresh Tracking] button

When clicked:
1. Call EasyParcel tracking API
2. Fetch latest tracking events
3. Update order status if changed
4. Display updated tracking history
5. Show success message
```

#### Method 2: Automatic Updates (Every 4 hours)

**Railway Cron Job:**
```
Schedule: 0 */4 * * * (Every 4 hours, on the hour)
Timezone: UTC

Process:
1. Query all orders with status:
   - READY_TO_SHIP
   - IN_TRANSIT
   - OUT_FOR_DELIVERY

2. For each order:
   - Call EasyParcel tracking API
   - Get latest status
   - Update order.status if changed
   - Log tracking event
   - No email notifications (only on first tracking)

3. Mark orders as DELIVERED when confirmed

4. Log completion statistics
```

**Railway Configuration:**
```yaml
# railway.json or service settings
{
  "cron": {
    "schedule": "0 */4 * * *",
    "command": "npm run cron:update-tracking"
  }
}
```

**Script:** `scripts/update-tracking.ts`
```
Expected behavior:
- Runs every 4 hours
- Completes in < 5 minutes
- Exits cleanly when done
- Logs success/failure
- No resource leaks
```

### Tracking History Display

**Admin view:**
```
━━━ Tracking History ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: IN_TRANSIT

📦 2025-10-07 14:30 - Shipment created
✓  2025-10-07 14:30 - Label generated
📧 2025-10-07 14:31 - Customer notified
📦 2025-10-07 16:00 - Picked up by courier
🚚 2025-10-08 09:00 - In transit to Kuala Lumpur
📍 2025-10-08 14:00 - Arrived at KL hub

Last updated: 2025-10-08 14:05

[Refresh Tracking]
```

**Customer view (Track Order page):**
```
┌─────────────────────────────────────────────────┐
│ Order #1234                                     │
│ Status: In Transit 🚚                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Tracking: EP123456789MY                         │
│ Courier: City-Link Express                      │
│ Estimated Delivery: 2-3 working days            │
│                                                 │
│ ━━━ Tracking Updates ━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ 📦 Oct 7, 2:30 PM - Shipment created            │
│ 📦 Oct 7, 4:00 PM - Picked up by courier        │
│ 🚚 Oct 8, 9:00 AM - In transit to Kuala Lumpur  │
│ 📍 Oct 8, 2:00 PM - Arrived at KL hub           │
│                                                 │
│ Last updated: Oct 8, 2:05 PM                    │
│                                                 │
│ [New Search]                                    │
└─────────────────────────────────────────────────┘
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Customer Pages           Admin Pages               │
│  ├─ Checkout             ├─ Settings                │
│  ├─ Track Order          ├─ Orders List             │
│  └─ Order Confirmation   └─ Order Detail            │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API Calls
                   ↓
┌─────────────────────────────────────────────────────┐
│              API Routes (Next.js)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  /api/shipping/calculate         (POST)            │
│  /api/admin/shipping/settings    (GET/POST)        │
│  /api/admin/shipping/fulfill     (POST)            │
│  /api/shipping/track/:id         (GET)             │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Uses
                   ↓
┌─────────────────────────────────────────────────────┐
│              Service Layer                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  src/lib/shipping/                                  │
│  ├─ easyparcel.ts         (EasyParcel API client)  │
│  ├─ shipping-settings.ts  (Settings management)    │
│  └─ types.ts              (TypeScript types)       │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Calls External API
                   ↓
┌─────────────────────────────────────────────────────┐
│              EasyParcel API                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  GET  /rates            (Get shipping rates)        │
│  POST /shipments        (Create shipment)           │
│  GET  /tracking/:id     (Get tracking info)         │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Background Jobs (Railway Cron)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  scripts/update-tracking.ts                         │
│  ├─ Runs every 4 hours                              │
│  ├─ Updates order statuses                          │
│  └─ Logs tracking events                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── shipping/
│   │   │   ├── calculate/route.ts         (~150 lines)
│   │   │   └── track/[id]/route.ts        (~100 lines)
│   │   └── admin/
│   │       └── shipping/
│   │           ├── settings/route.ts      (~100 lines)
│   │           └── fulfill/route.ts       (~150 lines)
│   │
│   ├── checkout/
│   │   └── page.tsx                       (uses ShippingSelector)
│   │
│   ├── admin/
│   │   ├── shipping/
│   │   │   └── page.tsx                   (~200 lines)
│   │   └── orders/
│   │       └── [id]/page.tsx              (shows fulfill button)
│   │
│   └── track-order/
│       └── page.tsx                       (existing, simplify)
│
├── components/
│   ├── checkout/
│   │   └── ShippingSelector.tsx           (~150 lines)
│   │
│   └── admin/
│       ├── ShippingSettings.tsx           (~150 lines)
│       └── FulfillOrderButton.tsx         (~100 lines)
│
├── lib/
│   └── shipping/
│       ├── easyparcel.ts                  (~200 lines)
│       ├── shipping-settings.ts           (~100 lines)
│       └── types.ts                       (~50 lines)
│
└── scripts/
    └── update-tracking.ts                 (~150 lines)

Total estimated: ~1,500 lines (conservative)
```

---

## Checkout Integration & Order Creation

**CRITICAL:** This section documents how shipping data flows from checkout to order creation. This integration is essential for the fulfillment widget to display customer's selected courier.

---

### Overview: Data Flow

```
1. Customer enters shipping address at checkout
   ↓
2. ShippingSelector calls /api/shipping/calculate
   ↓
3. ShippingSelector displays options (based on strategy)
   ↓
4. Customer selects courier (or auto-selected if "cheapest")
   ↓
5. ShippingSelector stores selection in checkout state
   ↓
6. Customer completes payment
   ↓
7. Payment webhook/success handler creates order
   ↓
8. Order creation includes shipping data from checkout state
   ↓
9. Order record now has selectedCourierServiceId populated
   ↓
10. Admin fulfillment widget reads this field to show "Customer Selected"
```

---

### 1. ShippingSelector Component State Management

**File:** `src/components/checkout/ShippingSelector.tsx`

**Component State:**
```typescript
interface ShippingState {
  loading: boolean;
  error: string | null;
  options: ShippingOption[];
  selected: ShippingOption | null;
  strategy: 'cheapest' | 'all' | 'selected';
}

interface ShippingOption {
  serviceId: string;              // EasyParcel service_id (e.g., "123")
  courierName: string;             // e.g., "City-Link Express"
  serviceType: string;             // e.g., "Pick-up", "Drop-off"
  cost: number;                    // e.g., 5.50
  originalCost: number;            // Original cost before free shipping
  freeShipping: boolean;           // true if free shipping applied
  estimatedDays: string;           // e.g., "2-3 working days"
  savedAmount?: number;            // Amount saved if free shipping
}
```

**Key Implementation Points:**

```typescript
export default function ShippingSelector({
  deliveryAddress,
  items,
  orderValue,
  onShippingSelected
}: ShippingSelectorProps) {
  const [state, setState] = useState<ShippingState>({
    loading: false,
    error: null,
    options: [],
    selected: null,
    strategy: 'cheapest'
  });

  // Auto-calculate when address changes
  useEffect(() => {
    if (isAddressComplete(deliveryAddress)) {
      calculateShipping();
    }
  }, [deliveryAddress]);

  const calculateShipping = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
          items,
          orderValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          options: data.shipping.options,
          strategy: data.shipping.strategy,
          // Auto-select if only one option or "cheapest" strategy
          selected: data.shipping.options.length === 1 || data.shipping.strategy === 'cheapest'
            ? data.shipping.options[0]
            : null
        }));

        // CRITICAL: Notify parent component of selection
        if (data.shipping.options.length === 1 || data.shipping.strategy === 'cheapest') {
          onShippingSelected(data.shipping.options[0]);
        }
      } else {
        setState(prev => ({ ...prev, loading: false, error: data.error }));
        onShippingSelected(null); // Clear selection on error
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to calculate shipping' }));
      onShippingSelected(null);
    }
  };

  const handleCourierSelect = (option: ShippingOption) => {
    setState(prev => ({ ...prev, selected: option }));

    // CRITICAL: Notify parent of selection change
    onShippingSelected(option);
  };

  // Render UI based on strategy and options
  // ... (UI implementation)
}
```

**Parent Integration (Checkout Page):**

```typescript
// src/app/checkout/page.tsx

export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState({
    // ... other checkout fields
    shippingAddress: {},
    selectedShipping: null as ShippingOption | null,
    calculatedWeight: 0
  });

  const handleShippingSelected = (option: ShippingOption | null) => {
    setCheckoutData(prev => ({
      ...prev,
      selectedShipping: option
    }));
  };

  const isCheckoutValid = () => {
    return (
      checkoutData.shippingAddress.complete &&
      checkoutData.selectedShipping !== null &&
      checkoutData.paymentMethod !== null
    );
  };

  return (
    <div>
      {/* Address Form */}
      <AddressForm
        onChange={(address) => setCheckoutData(prev => ({ ...prev, shippingAddress: address }))}
      />

      {/* CRITICAL: ShippingSelector with callback */}
      <ShippingSelector
        deliveryAddress={checkoutData.shippingAddress}
        items={cartItems}
        orderValue={cartSubtotal}
        onShippingSelected={handleShippingSelected}
      />

      {/* Payment Button */}
      <button
        disabled={!isCheckoutValid()}
        onClick={() => handlePayment(checkoutData)}
      >
        Proceed to Payment
      </button>
    </div>
  );
}
```

---

### 2. Order Creation Payload Modification

**CRITICAL:** When creating an order (after payment success), include all shipping fields from checkout state.

#### Scenario A: Existing Order Creation API Route

**File:** `src/app/api/orders/create/route.ts` (or similar)

**Before (Missing Shipping Data):**
```typescript
// ❌ BAD: Missing shipping fields
export async function POST(request: Request) {
  const { userId, items, shippingAddress, total, subtotal } = await request.json();

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      total,
      subtotal,
      shippingCost: 0, // ❌ Missing
      shippingAddress,
      // ❌ Missing: selectedCourierServiceId, courierName, etc.
    }
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
```

**After (Complete Shipping Data):**
```typescript
// ✅ GOOD: Include all shipping fields
export async function POST(request: Request) {
  const {
    userId,
    items,
    shippingAddress,
    total,
    subtotal,
    // CRITICAL: Add these fields
    selectedShipping,
    calculatedWeight
  } = await request.json();

  // Validate shipping data exists
  if (!selectedShipping || !selectedShipping.serviceId) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_SHIPPING_DATA',
      message: 'Shipping information is required'
    }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      total,
      subtotal,

      // ✅ CRITICAL: Include shipping fields
      shippingCost: selectedShipping.cost,
      selectedCourierServiceId: selectedShipping.serviceId,
      courierName: selectedShipping.courierName,
      courierServiceType: selectedShipping.serviceType,
      estimatedDelivery: selectedShipping.estimatedDays,
      shippingWeight: calculatedWeight,
      shippingAddress,

      // Items relation
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
```

---

#### Scenario B: Payment Webhook (e.g., Stripe, Toyyibpay)

**File:** `src/app/api/webhooks/payment/route.ts`

**Payment Flow:**
```
1. Customer clicks "Pay Now"
2. Frontend calls payment provider API
3. Payment provider processes payment
4. Payment provider calls our webhook
5. Webhook creates order with payment confirmed
```

**Webhook Implementation:**
```typescript
export async function POST(request: Request) {
  const signature = request.headers.get('webhook-signature');
  const body = await request.text();

  // Verify webhook authenticity
  const event = verifyWebhookSignature(body, signature);

  if (event.type === 'payment.success') {
    const paymentData = event.data;

    // CRITICAL: Payment metadata must include shipping data
    // This is set when creating payment intent in frontend
    const {
      userId,
      items,
      shippingAddress,
      total,
      subtotal,
      selectedShipping,
      calculatedWeight
    } = paymentData.metadata;

    // Create order with PAID status
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PAID', // Payment already confirmed
        paymentStatus: 'COMPLETED',
        total,
        subtotal,

        // ✅ CRITICAL: Include shipping data from payment metadata
        shippingCost: parseFloat(selectedShipping.cost),
        selectedCourierServiceId: selectedShipping.serviceId,
        courierName: selectedShipping.courierName,
        courierServiceType: selectedShipping.serviceType,
        estimatedDelivery: selectedShipping.estimatedDays,
        shippingWeight: parseFloat(calculatedWeight),
        shippingAddress: JSON.parse(shippingAddress),

        items: {
          create: JSON.parse(items).map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // Send order confirmation email
    await sendOrderConfirmationEmail(order);

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
```

**Frontend: Setting Payment Metadata:**
```typescript
// src/app/checkout/page.tsx

const handlePayment = async (checkoutData: CheckoutData) => {
  // Create payment intent with metadata
  const response = await fetch('/api/payment/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: checkoutData.total,
      currency: 'MYR',

      // ✅ CRITICAL: Include shipping data in payment metadata
      metadata: {
        userId: user?.id,
        items: JSON.stringify(cartItems),
        shippingAddress: JSON.stringify(checkoutData.shippingAddress),
        total: checkoutData.total,
        subtotal: checkoutData.subtotal,

        // CRITICAL: Shipping data
        selectedShipping: JSON.stringify(checkoutData.selectedShipping),
        calculatedWeight: calculateTotalWeight(cartItems)
      }
    })
  });

  const { clientSecret } = await response.json();

  // Redirect to payment provider with client secret
  // ...
};
```

---

### 3. Weight Calculation Integration

**File:** `src/lib/shipping/utils/weight-utils.ts`

```typescript
/**
 * Calculate total order weight from cart items
 * Called during checkout to get accurate weight for shipping calculation
 */
export function calculateTotalWeight(
  items: Array<{ product: { weight: number | string }; quantity: number }>
): number {
  return items.reduce((total, item) => {
    const itemWeight = Number(item.product.weight);
    return total + (itemWeight * item.quantity);
  }, 0);
}
```

**Usage in Checkout:**
```typescript
// Calculate weight before calling shipping API
const totalWeight = calculateTotalWeight(cartItems);

// Store in checkout state for later use
setCheckoutData(prev => ({
  ...prev,
  calculatedWeight: totalWeight
}));

// Pass to shipping calculator
const shippingOptions = await fetchShippingRates({
  address: deliveryAddress,
  weight: totalWeight,
  orderValue: cartSubtotal
});
```

---

### 4. Validation Before Order Creation

**CRITICAL:** Always validate shipping data exists before creating order.

```typescript
function validateShippingData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.selectedShipping) {
    errors.push('Shipping option not selected');
  } else {
    if (!data.selectedShipping.serviceId) {
      errors.push('Shipping service ID missing');
    }
    if (!data.selectedShipping.courierName) {
      errors.push('Courier name missing');
    }
    if (typeof data.selectedShipping.cost !== 'number') {
      errors.push('Shipping cost invalid');
    }
  }

  if (!data.calculatedWeight || data.calculatedWeight <= 0) {
    errors.push('Order weight not calculated');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Use in order creation
const validation = validateShippingData(checkoutData);
if (!validation.valid) {
  return NextResponse.json({
    success: false,
    errors: validation.errors
  }, { status: 400 });
}
```

---

### 5. Complete Integration Checklist

**Day 2 Implementation Tasks:**

- [ ] **ShippingSelector Component**
  - [ ] State management with ShippingOption interface
  - [ ] `onShippingSelected` callback to parent
  - [ ] Auto-selection for "cheapest" strategy
  - [ ] Manual selection for "all"/"selected" strategies
  - [ ] Loading and error states

- [ ] **Checkout Page Integration**
  - [ ] Add `selectedShipping` to checkout state
  - [ ] Add `calculatedWeight` to checkout state
  - [ ] Connect ShippingSelector callback
  - [ ] Update payment button validation
  - [ ] Calculate weight before shipping API call

- [ ] **Order Creation Modification**
  - [ ] Add shipping fields to order creation payload
  - [ ] Validate shipping data exists
  - [ ] Store `selectedCourierServiceId` in database
  - [ ] Store `courierName`, `courierServiceType`, `estimatedDelivery`
  - [ ] Store `shippingWeight` and `shippingCost`

- [ ] **Payment Integration**
  - [ ] Include shipping data in payment metadata
  - [ ] Webhook extracts shipping from metadata
  - [ ] Webhook creates order with shipping fields populated
  - [ ] Handle payment metadata size limits (JSON stringify)

- [ ] **Testing**
  - [ ] Test "cheapest" strategy (auto-selection)
  - [ ] Test "all" strategy (manual selection)
  - [ ] Test "selected" strategy
  - [ ] Test free shipping flow
  - [ ] Verify order record has `selectedCourierServiceId` populated
  - [ ] Verify fulfillment widget shows "Customer Selected: [courier]"

---

### 6. Common Integration Issues & Solutions

**Issue 1: selectedCourierServiceId is null in database**

**Cause:** Checkout didn't pass shipping data to order creation

**Solution:**
- Verify `onShippingSelected` callback is working
- Check browser console for shipping state
- Verify payment metadata includes `selectedShipping`
- Add logging in order creation to see received payload

---

**Issue 2: Fulfillment widget shows "Customer Selected: undefined"**

**Cause:** `courierName` not stored in order record

**Solution:**
- Verify order creation includes `courierName` field
- Check database schema has `courierName` column
- Verify ShippingOption interface includes `courierName`

---

**Issue 3: Payment button remains disabled**

**Cause:** `selectedShipping` is null in checkout state

**Solution:**
- Check if ShippingSelector renders
- Verify shipping calculation API returns options
- Check if auto-selection logic triggers for "cheapest"
- Add console.log in `handleShippingSelected`

---

**Issue 4: Weight is 0.00 in order**

**Cause:** `calculatedWeight` not passed to order creation

**Solution:**
- Call `calculateTotalWeight()` before payment
- Store result in checkout state
- Pass to order creation payload
- Verify all products have weight > 0

---

### 7. Database Migration for New Fields

**Run this Prisma migration before implementation:**

```prisma
// prisma/schema.prisma

model Order {
  // ... existing fields

  // Add these new fields:
  selectedCourierServiceId String?   @db.VarChar(100)
  courierName              String?   @db.VarChar(100)
  courierServiceType       String?   @db.VarChar(50)
  trackingNumber           String?   @db.VarChar(100)
  awbNumber                String?   @db.VarChar(100)
  estimatedDelivery        String?   @db.VarChar(50)
  shippingWeight           Decimal?  @db.Decimal(10, 2)
  labelUrl                 String?   @db.Text
  fulfilledAt              DateTime?

  // WooCommerce-inspired fields
  scheduledPickupDate      DateTime? @db.Date
  overriddenByAdmin        Boolean   @default(false)
  adminOverrideReason      String?   @db.Text
  failedBookingAttempts    Int       @default(0)
  lastBookingError         String?   @db.Text
  autoStatusUpdate         Boolean   @default(true)
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_shipping_fields
```

---

### 8. End-to-End Flow Example

**Complete flow from checkout to fulfillment:**

```
1. Customer adds products to cart
   → Total weight: 2.5 kg (calculated from product weights)

2. Customer goes to checkout
   → Enters shipping address: Selangor, 50000

3. ShippingSelector auto-triggers calculation
   → POST /api/shipping/calculate
   → Returns: City-Link RM 5.50, J&T RM 5.30, Poslaju RM 7.00

4. Strategy = "cheapest" → Auto-select J&T RM 5.30
   → onShippingSelected({ serviceId: "123", courierName: "J&T Express", cost: 5.30, ... })
   → Checkout state updated: selectedShipping = { serviceId: "123", ... }

5. Customer clicks "Pay Now"
   → Create payment with metadata including selectedShipping
   → Redirect to payment gateway

6. Customer completes payment
   → Payment webhook triggered
   → Extract metadata.selectedShipping
   → Create order with:
     - selectedCourierServiceId: "123"
     - courierName: "J&T Express"
     - courierServiceType: "Pick-up"
     - shippingCost: 5.30
     - shippingWeight: 2.5
     - status: "PAID"

7. Admin views order in admin panel
   → Fulfillment widget shows: "Customer Selected: J&T Express - RM 5.30"
   → Admin can override to different courier if needed
   → Click "Book Shipment" → Uses order.selectedCourierServiceId

✅ Complete integration successful
```

---

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

## Email Notifications

### Email #1: Order Confirmation

**Trigger:** Order status changes to PAID (payment successful)

**To:** Customer email (user.email or guestEmail)

**Subject:** Order Confirmation - Order #1234

**Content:**
```
Hi John Doe,

Thank you for your order!

Order Number: #1234
Order Date: October 7, 2025

━━━ Order Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product A x2               RM 100.00
Product B x1               RM 80.00
                           ──────────
Subtotal:                  RM 180.00
Shipping (City-Link):      RM 8.00
Total Paid:                RM 188.00

━━━ Shipping Address ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

John Doe
No. 123, Jalan Example
Taman Example
Kuala Lumpur, Selangor 50000
Malaysia

Phone: +60123456789

━━━ What's Next? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your order is being prepared for shipment.
You'll receive a tracking number once it ships.

Estimated Delivery: 2-3 working days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Track Your Order]

Need help? Reply to this email or contact:
Email: support@ecomjrm.com
WhatsApp: +60123456789

Thank you for shopping with us!
EcomJRM Team
```

### Email #2: Shipment Tracking

**Trigger:** Order status changes to READY_TO_SHIP (after fulfillment)

**To:** Customer email

**Subject:** Your Order Has Shipped - Order #1234

**Content:**
```
Hi John Doe,

Great news! Your order is on the way! 📦

Order Number: #1234
Tracking Number: EP123456789MY

━━━ Shipping Details ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Courier: City-Link Express (Pick-up)
Service: Standard
Estimated Delivery: 2-3 working days

━━━ Track Your Shipment ━━━━━━━━━━━━━━━━━━━━━━━━━━

You can track your order anytime:

[Track Order: EP123456789MY]

Or visit: https://ecomjrm.com/track-order
Enter Order #1234 and your email

━━━ Delivery Address ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

John Doe
No. 123, Jalan Example
Taman Example
Kuala Lumpur, Selangor 50000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions about your delivery?
Email: support@ecomjrm.com
WhatsApp: +60123456789

Thank you for shopping with us!
EcomJRM Team
```

---

## Error Handling

### Error Categories

**1. Validation Errors (400)**
- Incomplete address
- Invalid phone number format
- Invalid postal code
- Missing required fields

**2. Not Found Errors (404)**
- Order not found
- Settings not configured
- Tracking number not found

**3. Business Logic Errors (422)**
- Order already fulfilled
- No couriers available for address
- Free shipping threshold not met (internal only)
- Order not in PAID status

**4. External API Errors (502/503)**
- EasyParcel API timeout
- EasyParcel API down
- Invalid API credentials
- Rate limit exceeded

**5. Server Errors (500)**
- Database connection failed
- Unexpected exception
- Configuration missing

### Error Response Format

**Standard error response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": "Additional context (optional)",
  "retryable": true/false,
  "retryAfter": 300 // seconds (optional)
}
```

### Error Handling Strategy

**Customer-Facing Errors:**
- Show friendly messages
- Provide clear next steps
- Offer alternative actions
- Hide technical details

**Admin-Facing Errors:**
- Show technical details
- Provide retry mechanisms
- Log full error context
- Suggest solutions

**Example - No Couriers Available:**
```
Customer sees:
"Sorry, we cannot ship to this address.
Please try a different address or contact us."

Admin logs:
"EasyParcel API returned 0 couriers for Sabah,
postal code 88000. Possible reasons: Remote area,
courier service limitations."
```

---

## Edge Cases

### 1. EasyParcel API Down During Checkout

**Scenario:** Customer tries to checkout but EasyParcel API is down.

**Behavior:**
- Show error message
- Disable checkout button
- Provide retry button
- Show support contact info
- Don't allow order creation without shipping

**Alternative (future):**
- Allow order creation
- Flag for manual shipping arrangement
- Admin contacts customer later

### 2. Courier Selection Changes Before Fulfillment

**Scenario:** Courier available at checkout but not available at fulfillment.

**Behavior:**
- Admin clicks "Fulfill Order"
- System detects courier no longer available
- Show error with alternative couriers
- Admin selects different courier
- Adjust shipping cost if needed (admin absorbs difference)

### 3. Customer Changes Address After Payment

**Scenario:** Customer requests address change after order is PAID.

**Current Behavior:**
- Not supported in v1
- Admin manually cancels and recreates order
- Customer gets refund and repays

**Future Enhancement:**
- Admin can edit address before fulfillment
- System recalculates shipping
- Adjust payment if needed

### 4. Free Shipping Threshold Met But Couriers Charge Different Rates

**Scenario:** Order qualifies for free shipping, but different couriers have different rates.

**Behavior:**
- Always apply free shipping (cost = RM 0.00)
- Select cheapest courier (to minimize business cost)
- Customer sees "FREE" regardless of original courier rate

### 5. Tracking Updates Stop Coming

**Scenario:** EasyParcel stops sending tracking updates.

**Behavior:**
- Cron job continues trying every 4 hours
- If no update for 7 days, flag order for review
- Admin can manually check with courier
- Customer can contact support

### 6. Duplicate Fulfillment Attempt

**Scenario:** Admin clicks "Fulfill Order" twice quickly.

**Prevention:**
1. Disable button immediately on first click
2. Check for existing tracking number before API call
3. If tracking exists, show error and prevent duplicate
4. Log attempt for debugging

### 7. Partial Fulfillment (Future)

**Scenario:** Order has multiple items but only some are ready to ship.

**Current:** Not supported (ship all items together)

**Future:** Allow partial fulfillment with multiple tracking numbers

### 8. International Shipping

**Scenario:** Customer enters non-Malaysia address.

**Current Behavior:**
- Not supported in v1
- Block checkout with message: "We only ship within Malaysia"
- Validate country = "MY" in address form

**Future:** Add international shipping if needed

### 9. Very Heavy Orders (>70kg)

**Scenario:** Order exceeds EasyParcel weight limit.

**Behavior:**
- EasyParcel API returns error during rate calculation
- Show message: "Order too heavy for standard shipping. Please contact us."
- Block checkout
- Admin arranges freight shipping manually

### 10. API Credentials Changed

**Scenario:** Admin updates EasyParcel API key.

**Behavior:**
- Test connection immediately on save
- If invalid, show error and don't save
- Keep old credentials until new ones verified
- Prevent breaking existing fulfillment process

---

## Pending Decisions

### ✅ RESOLVED: Courier Selection Strategy

**Original Problem:**
- EasyParcel API requires delivery address to return available couriers
- Admin can't pre-select specific courier without knowing destination

**Solution Adopted (Based on WooCommerce Plugin Study):**

Implement **strategy-based courier selection** with three modes:

1. **"Cheapest Courier" (Default/Recommended)**
   - System auto-selects lowest cost option
   - Customer sees one rate, no choice needed
   - Simplest checkout experience

2. **"Show All Couriers"**
   - Customer chooses from all available couriers
   - Maximum customer flexibility
   - May have different prices

3. **"Selected Couriers"**
   - Admin chooses which courier IDs to allow (via `getCourierList()` API)
   - System filters checkout options to only show admin-selected couriers
   - Balances control with flexibility

**Key Insight from WooCommerce:**
- Don't try to select specific couriers without address
- Instead, select a **selection strategy**
- Apply strategy at checkout when destination is known

**Implementation Status:** Documented in spec, ready for development

---

### 🔄 OPEN DECISIONS

**None currently** - All major decisions resolved for v1

---

## Code Quality & Best Practices

This section ensures our implementation follows software engineering best practices, maintainability standards, and produces clean, scalable code.

---

### TypeScript Best Practices

**1. Type Safety**

```typescript
// ✅ GOOD: Strict typing with interfaces
interface ShippingRate {
  serviceId: string;
  courierName: string;
  cost: number;
  estimatedDays: string;
}

async function calculateShipping(address: DeliveryAddress): Promise<ShippingRate[]> {
  // Implementation
}

// ❌ BAD: Using 'any' or loose typing
async function calculateShipping(address: any): Promise<any> {
  // Implementation
}
```

**2. Null Safety**

```typescript
// ✅ GOOD: Proper null handling
interface Order {
  trackingNumber: string | null;
  awbNumber: string | null;
}

function getTrackingUrl(order: Order): string | null {
  return order.trackingNumber
    ? `https://track.easyparcel.com/${order.trackingNumber}`
    : null;
}

// ❌ BAD: Assuming values exist
function getTrackingUrl(order: Order): string {
  return `https://track.easyparcel.com/${order.trackingNumber}`; // Crash if null!
}
```

**3. Enum Usage for Constants**

```typescript
// ✅ GOOD: Type-safe enums
enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  READY_TO_SHIP = 'READY_TO_SHIP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED'
}

// Usage
if (order.status === OrderStatus.PAID) {
  // Safe, autocomplete works
}

// ❌ BAD: String literals everywhere
if (order.status === 'paid') { // Typo-prone, no autocomplete
  // Implementation
}
```

---

### React Component Best Practices

**1. Component Structure**

```typescript
// ✅ GOOD: Clear component structure with proper typing
interface FulfillmentWidgetProps {
  orderId: string;
  orderStatus: OrderStatus;
  onSuccess?: (tracking: string) => void;
}

export default function FulfillmentWidget({
  orderId,
  orderStatus,
  onSuccess
}: FulfillmentWidgetProps) {
  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Load initial data
  }, [orderId]);

  // Event handlers
  const handleFulfill = async () => {
    // Implementation
  };

  // Render
  return (
    // JSX
  );
}
```

**2. State Management**

```typescript
// ✅ GOOD: Consolidated state with proper types
interface FulfillmentState {
  status: 'idle' | 'loading' | 'success' | 'error';
  selectedCourier?: CourierOption;
  pickupDate: Date;
  error?: FulfillmentError;
}

const [state, setState] = useState<FulfillmentState>({
  status: 'idle',
  pickupDate: getNextBusinessDay()
});

// Update state immutably
setState(prev => ({ ...prev, status: 'loading' }));

// ❌ BAD: Multiple useState for related data
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState(false); // Can't be all true/false!
```

**3. Error Boundaries**

```typescript
// ✅ GOOD: Wrap critical components in error boundaries
<ErrorBoundary fallback={<FulfillmentErrorFallback />}>
  <FulfillmentWidget orderId={order.id} />
</ErrorBoundary>
```

**4. Loading States**

```typescript
// ✅ GOOD: Clear loading indicators
{loading ? (
  <LoadingSpinner message="Booking shipment..." />
) : (
  <button onClick={handleFulfill}>Book Shipment</button>
)}

// ❌ BAD: No loading feedback
<button onClick={handleFulfill}>Book Shipment</button>
```

---

### API Integration Best Practices

**1. Centralized API Client**

```typescript
// ✅ GOOD: Single source of truth for API calls
// src/lib/shipping/easyparcel-client.ts

class EasyParcelClient {
  private baseUrl: string;
  private apiKey: string;

  async getShippingRates(params: RateParams): Promise<ShippingRate[]> {
    const response = await fetch(`${this.baseUrl}/rates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new EasyParcelError(await response.json());
    }

    return response.json();
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
}

export const easyParcel = new EasyParcelClient();

// ❌ BAD: Scattered fetch calls throughout codebase
// Multiple places with different error handling, headers, etc.
```

**2. Error Handling Pattern**

```typescript
// ✅ GOOD: Custom error class with structured data
class EasyParcelError extends Error {
  constructor(
    public code: string,
    public details: unknown,
    public retryable: boolean = false
  ) {
    super(`EasyParcel Error: ${code}`);
    this.name = 'EasyParcelError';
  }
}

// Usage in API route
try {
  const result = await easyParcel.createShipment(data);
  return NextResponse.json({ success: true, result });
} catch (error) {
  if (error instanceof EasyParcelError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable
      }
    }, { status: 502 });
  }

  // Unknown error
  return NextResponse.json({
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
  }, { status: 500 });
}
```

**3. Response Validation**

```typescript
// ✅ GOOD: Validate API responses with Zod
import { z } from 'zod';

const ShippingRateSchema = z.object({
  service_id: z.string(),
  courier_name: z.string(),
  cost: z.number().positive(),
  estimated_days: z.string()
});

const response = await easyParcel.getShippingRates(params);
const validated = ShippingRateSchema.array().parse(response);

// ❌ BAD: Trust API responses blindly
const response = await easyParcel.getShippingRates(params);
// What if courier_name is missing? Code crashes later!
```

**4. Product Weight Validation (GAP #2 RESOLVED)**

```typescript
// ✅ GOOD: Validate product weight on creation/update
import { z } from 'zod';

// Product creation/update schema
const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be greater than 0"),
  weight: z.number()
    .positive("Weight must be greater than 0")
    .min(0.01, "Weight must be at least 0.01 kg")
    .max(1000, "Weight cannot exceed 1000 kg"),
  // ... other fields
});

// API Route: src/app/api/admin/products/create/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Validate with Zod
  const validation = ProductSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      errors: validation.error.flatten().fieldErrors
    }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: validation.data
  });

  return NextResponse.json({ success: true, product });
}

// ❌ BAD: No weight validation
const product = await prisma.product.create({
  data: {
    weight: 0 // This will cause shipping calculation failures!
  }
});
```

**Frontend Validation (Product Form):**
```typescript
// src/app/admin/products/create/page.tsx

const [formData, setFormData] = useState({
  name: '',
  price: 0,
  weight: 0.1, // Default to 0.1 kg (not 0)
  // ... other fields
});

const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name) {
    newErrors.name = 'Product name is required';
  }

  if (formData.price <= 0) {
    newErrors.price = 'Price must be greater than RM 0';
  }

  // CRITICAL: Validate weight > 0
  if (formData.weight <= 0) {
    newErrors.weight = 'Weight must be greater than 0 kg';
  } else if (formData.weight < 0.01) {
    newErrors.weight = 'Weight must be at least 0.01 kg (10 grams)';
  } else if (formData.weight > 1000) {
    newErrors.weight = 'Weight cannot exceed 1000 kg';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return; // Show errors to user
  }

  // Proceed with API call
  const response = await fetch('/api/admin/products/create', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  // ... handle response
};

return (
  <form>
    <label>Weight (kg) *</label>
    <input
      type="number"
      step="0.01"
      min="0.01"
      max="1000"
      value={formData.weight}
      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
    />
    {errors.weight && <span className="error">{errors.weight}</span>}

    <p className="help-text">
      Enter product weight in kilograms (e.g., 0.5 for 500g, 2.5 for 2.5kg)
    </p>
  </form>
);
```

**Database Constraint (Additional Safety):**
```prisma
// prisma/schema.prisma

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Decimal  @db.Decimal(10, 2)
  weight      Decimal  @db.Decimal(8, 2)  // NOT nullable - required

  // ... other fields

  @@check([weight > 0], name: "product_weight_positive")
}
```

**Migration:**
```bash
# Add database-level constraint
npx prisma migrate dev --name add_product_weight_constraint
```

**Why This Matters:**
- ❌ Without validation: Products with weight = 0 → Shipping calculation fails → Checkout broken
- ✅ With validation: All products guaranteed to have valid weight → Shipping always calculates correctly

---

### Database Best Practices

**1. Prisma Transaction Usage**

```typescript
// ✅ GOOD: Use transactions for multi-step database operations
await prisma.$transaction(async (tx) => {
  // Update order
  const order = await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'READY_TO_SHIP',
      trackingNumber,
      awbNumber,
      fulfilledAt: new Date()
    }
  });

  // Create tracking event
  await tx.trackingEvent.create({
    data: {
      orderId,
      eventName: 'Shipment created',
      timestamp: new Date()
    }
  });

  return order;
});

// ❌ BAD: Separate operations (can fail halfway)
await prisma.order.update({ ... });
await prisma.trackingEvent.create({ ... }); // What if this fails?
```

**2. Indexing**

```sql
-- ✅ GOOD: Index frequently queried fields
CREATE INDEX idx_order_status ON Order(status);
CREATE INDEX idx_order_tracking ON Order(trackingNumber);
CREATE INDEX idx_order_created ON Order(createdAt DESC);

-- Performance for:
-- SELECT * FROM Order WHERE status = 'PAID';
-- SELECT * FROM Order WHERE trackingNumber = 'EPX123';
```

**3. Query Optimization**

```typescript
// ✅ GOOD: Select only needed fields
const orders = await prisma.order.findMany({
  where: { status: 'PAID' },
  select: {
    id: true,
    orderNumber: true,
    shippingAddress: true,
    selectedCourierServiceId: true
  }
});

// ❌ BAD: Select all fields when not needed
const orders = await prisma.order.findMany({
  where: { status: 'PAID' }
  // Returns 30+ fields, slows down query
});
```

---

### Error Handling Standards

**1. Graceful Degradation**

```typescript
// ✅ GOOD: Provide fallback when EasyParcel API fails
async function getAvailableCouriers(orderId: string) {
  try {
    const couriers = await easyParcel.getCouriers(orderId);
    return couriers;
  } catch (error) {
    console.error('Failed to fetch couriers:', error);

    // Fallback: Return customer's original selection
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { selectedCourierServiceId: true, courierName: true }
    });

    return [{
      serviceId: order.selectedCourierServiceId,
      courierName: order.courierName,
      note: 'Original customer selection (alternatives unavailable)'
    }];
  }
}
```

**2. User-Friendly Error Messages**

```typescript
// ✅ GOOD: Translate technical errors to user-friendly messages
function getUserFriendlyError(error: EasyParcelError): string {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      return 'Your EasyParcel balance is too low. Please top up your account.';
    case 'INVALID_ADDRESS':
      return 'The shipping address could not be validated. Please check for errors.';
    case 'API_TIMEOUT':
      return 'Connection timeout. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please contact support.';
  }
}

// ❌ BAD: Show technical errors to users
alert(error.message); // "ERR_CONN_REFUSED" - What does this mean?
```

---

### Testing Strategy

**1. Unit Tests (Business Logic)**

```typescript
// ✅ GOOD: Test pure functions and business logic
describe('getNextBusinessDay', () => {
  it('should skip Sunday', () => {
    const saturday = new Date('2025-10-11'); // Saturday
    const result = getNextBusinessDay(saturday);
    expect(result).toEqual(new Date('2025-10-13')); // Monday
  });

  it('should skip public holidays', () => {
    const beforeMerdeka = new Date('2025-08-30');
    const result = getNextBusinessDay(beforeMerdeka);
    expect(result).toEqual(new Date('2025-09-01')); // After Merdeka Day
  });
});
```

**2. Integration Tests (API Routes)**

```typescript
// ✅ GOOD: Test API endpoints with mocked external services
describe('POST /api/admin/orders/[id]/fulfill', () => {
  beforeEach(() => {
    mockEasyParcelAPI.mockReset();
  });

  it('should create shipment successfully', async () => {
    mockEasyParcelAPI.createShipment.mockResolvedValue({
      tracking_number: 'EPX123',
      awb_number: 'CL456'
    });

    const response = await POST(request, { params: { id: 'ord_123' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.shipment.trackingNumber).toBe('EPX123');
  });

  it('should handle insufficient balance error', async () => {
    mockEasyParcelAPI.createShipment.mockRejectedValue(
      new EasyParcelError('INSUFFICIENT_BALANCE', { balance: 5 }, true)
    );

    const response = await POST(request, { params: { id: 'ord_123' } });
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(data.error.retryable).toBe(true);
  });
});
```

**3. E2E Tests (Critical Flows)**

```typescript
// ✅ GOOD: Test complete user journeys
test('Admin can fulfill order with courier override', async ({ page }) => {
  // Login as admin
  await page.goto('/admin/orders/ord_123');

  // Wait for fulfillment widget
  await page.waitForSelector('[data-testid="fulfillment-widget"]');

  // Change courier
  await page.selectOption('[data-testid="courier-dropdown"]', { label: 'J&T Express' });

  // Select pickup date
  await page.fill('[data-testid="pickup-date"]', '2025-10-09');

  // Click fulfill
  await page.click('[data-testid="fulfill-button"]');

  // Wait for success
  await page.waitForSelector('[data-testid="success-message"]');

  // Verify tracking number displayed
  const tracking = await page.textContent('[data-testid="tracking-number"]');
  expect(tracking).toMatch(/EPX\d+/);
});
```

---

### Performance Optimization

**1. Debouncing User Input**

```typescript
// ✅ GOOD: Debounce address input before calculating shipping
import { useDebouncedCallback } from 'use-debounce';

const debouncedCalculate = useDebouncedCallback(
  async (address: DeliveryAddress) => {
    const rates = await calculateShipping(address);
    setShippingRates(rates);
  },
  500 // Wait 500ms after user stops typing
);

// ❌ BAD: Call API on every keystroke
onChange={(e) => {
  setAddress(e.target.value);
  calculateShipping(e.target.value); // API call spam!
}}
```

**2. Caching Strategy**

```typescript
// ✅ GOOD: Cache balance for 5 minutes
const BALANCE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCreditBalance(): Promise<number> {
  const cached = await redis.get('easyparcel:balance');

  if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL) {
    return cached.amount;
  }

  const balance = await easyParcel.getBalance();
  await redis.set('easyparcel:balance', {
    amount: balance,
    timestamp: Date.now()
  });

  return balance;
}
```

**3. Lazy Loading**

```typescript
// ✅ GOOD: Load tracking history only when requested
const [showTracking, setShowTracking] = useState(false);

{showTracking && (
  <Suspense fallback={<LoadingSpinner />}>
    <TrackingHistory orderId={orderId} />
  </Suspense>
)}
```

---

### Security Best Practices

**1. Input Validation**

```typescript
// ✅ GOOD: Validate and sanitize all inputs
import { z } from 'zod';

const FulfillRequestSchema = z.object({
  serviceId: z.string().min(1).max(100),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overriddenByAdmin: z.boolean(),
  overrideReason: z.string().max(500).optional()
});

// API route
const body = await request.json();
const validated = FulfillRequestSchema.parse(body);
// Now safe to use validated.serviceId, etc.
```

**2. Authorization Checks**

```typescript
// ✅ GOOD: Verify admin role before fulfillment
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Proceed with fulfillment
}
```

**3. Prevent SQL Injection**

```typescript
// ✅ GOOD: Use Prisma parameterized queries (safe by default)
const order = await prisma.order.findUnique({
  where: { id: orderId } // Automatically parameterized
});

// ❌ BAD: Raw SQL with string concatenation
const result = await prisma.$queryRaw(
  `SELECT * FROM Order WHERE id = '${orderId}'` // SQL injection risk!
);
```

---

### Code Organization Standards

**1. File Structure**

```
src/lib/shipping/
├── client/
│   ├── easyparcel-client.ts      # API client
│   └── easyparcel-client.test.ts # Unit tests
├── services/
│   ├── shipping-calculator.ts    # Business logic
│   ├── balance-service.ts        # Balance management
│   └── tracking-service.ts       # Tracking logic
├── utils/
│   ├── date-utils.ts             # Date helpers (getNextBusinessDay, validatePickupDate)
│   ├── date-utils.test.ts        # Date utilities tests
│   ├── validation.ts             # Input validation
│   └── error-mapping.ts          # Error translation
├── types/
│   ├── easyparcel.ts             # EasyParcel API types
│   └── shipping.ts               # Internal types
└── index.ts                      # Public API exports
```

---

### Critical Implementation: Weight Calculation Utility

**MUST IMPLEMENT:** This utility is required for shipping rate calculation

#### File: `src/lib/shipping/utils/weight-utils.ts`

```typescript
/**
 * Calculate total order weight from cart items
 *
 * IMPORTANT: Product.weight is a REQUIRED field in Prisma schema (line 154)
 * No default fallback needed - all products MUST have weight at creation
 *
 * @param items - Array of cart items with product details
 * @returns Total weight in kilograms (kg)
 *
 * @example
 * const items = [
 *   { product: { weight: 0.5 }, quantity: 2 },  // 1.0 kg total
 *   { product: { weight: 1.5 }, quantity: 1 }   // 1.5 kg total
 * ];
 * const totalWeight = calculateTotalWeight(items); // Returns: 2.5 kg
 */
export function calculateTotalWeight(items: Array<{ product: { weight: number | string }; quantity: number }>): number {
  return items.reduce((total, item) => {
    const itemWeight = Number(item.product.weight);
    return total + (itemWeight * item.quantity);
  }, 0);
}
```

**Usage in API Route:**

```typescript
// src/app/api/shipping/calculate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateTotalWeight } from '@/lib/shipping/utils/weight-utils';
import { easyParcelClient } from '@/lib/shipping/easyparcel';
import { getSystemConfig } from '@/lib/system-config';
import { MALAYSIAN_STATES } from '@/lib/shipping/constants';

// ✅ MANDATORY: Zod validation schema (Layer 2: API Validation)
const ShippingCalculateSchema = z.object({
  deliveryAddress: z.object({
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().regex(/^\+60[0-9]{8,10}$/, "Invalid Malaysian phone number"),
    addressLine1: z.string().min(1, "Address is required").max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1, "City is required").max(100),
    state: z.enum(MALAYSIAN_STATES, { errorMap: () => ({ message: "Invalid state code" }) }),
    postalCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"),
    country: z.literal('MY').default('MY')
  }),
  items: z.array(z.object({
    productId: z.string().cuid(),
    name: z.string().min(1),
    quantity: z.number().int().positive().max(999),
    weight: z.number().positive().min(0.01).max(1000),
    price: z.number().positive()
  })).min(1, "At least one item is required"),
  orderValue: z.number().positive("Order value must be positive")
});

export async function POST(request: Request) {
  try {
    // ✅ LAYER 2: API Validation with Zod
    const body = await request.json();
    const validation = ShippingCalculateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { items, deliveryAddress, orderValue } = validation.data;

    // Calculate total weight from cart items
    const totalWeight = calculateTotalWeight(items);

    // Validation: Check if weight is reasonable
    if (totalWeight <= 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_WEIGHT',
        message: 'Total weight must be greater than 0'
      }, { status: 400 });
    }

    // Get settings for free shipping threshold
    const settings = await getSystemConfig('easyparcel_settings');
    const freeShippingThreshold = settings.freeShipping?.threshold || null;

    // Call EasyParcel API with calculated weight
    const rates = await easyParcelClient.getRates({
      destination: deliveryAddress,
      weight: totalWeight,
      orderValue
    });

    // Apply free shipping logic
    // IMPORTANT: Applied to orderValue (cart subtotal before shipping, before tax)
    if (freeShippingThreshold && orderValue >= freeShippingThreshold) {
      // If multiple couriers available, select cheapest for free shipping
      const cheapestRate = rates.reduce((min, rate) =>
        rate.cost < min.cost ? rate : min
      );

      return NextResponse.json({
        success: true,
        shipping: {
          available: true,
          serviceId: cheapestRate.serviceId,
          courierName: cheapestRate.courierName,
          serviceType: cheapestRate.serviceType,
          cost: 0.00,  // Free shipping
          originalCost: cheapestRate.cost,
          freeShipping: true,
          savedAmount: cheapestRate.cost,
          estimatedDays: cheapestRate.estimatedDays,
          totalWeight
        }
      });
    }

    return NextResponse.json({
      success: true,
      shipping: {
        available: rates.length > 0,
        options: rates,
        totalWeight
      }
    });

  } catch (error) {
    console.error('[ShippingCalculate] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'CALCULATION_FAILED',
      message: 'Failed to calculate shipping rates'
    }, { status: 500 });
  }
}
```

**Key Points:**
- ✅ Simple reduce operation - no complex logic needed
- ✅ Product.weight is REQUIRED (Prisma schema enforces this)
- ✅ No default/fallback needed
- ✅ Converts to number to handle Decimal type from database
- ✅ Returns weight in kilograms for EasyParcel API

**Free Shipping Logic:**
- ✅ Applied to `orderValue` (cart subtotal before shipping, before tax)
- ✅ If subtotal >= threshold, select cheapest courier and set cost to RM 0.00
- ✅ Original cost shown in `savedAmount` field
- ✅ Returns single option (cheapest) when free shipping applies

---

### Critical Implementation: Pickup Date Utilities

**MUST IMPLEMENT:** These utilities are required for Feature #5 (Pickup Date Selection)

#### File: `src/lib/shipping/utils/date-utils.ts`

```typescript
/**
 * Malaysian public holidays for 2025
 * Update this list annually (especially Islamic calendar dates)
 */
const MALAYSIAN_PUBLIC_HOLIDAYS_2025: string[] = [
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

/**
 * Check if a date is a Malaysian public holiday
 */
export function isMalaysianPublicHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return MALAYSIAN_PUBLIC_HOLIDAYS_2025.includes(dateStr);
}

/**
 * Get the next business day (skip Sundays and public holidays)
 *
 * Used as default value for pickup date selector in fulfillment widget
 */
export function getNextBusinessDay(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1); // Start with tomorrow

  // Skip Sunday
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1); // Move to Monday
  }

  // Skip public holidays
  while (isMalaysianPublicHoliday(date)) {
    date.setDate(date.getDate() + 1);

    // Skip Sunday again if we land on it after holiday
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
  }

  return date;
}

/**
 * Validate pickup date meets EasyParcel requirements
 */
export function validatePickupDate(date: Date): {
  valid: boolean;
  error?: string;
  errorCode?: string;
} {
  // Not Sunday
  if (date.getDay() === 0) {
    return {
      valid: false,
      error: 'Pickup not available on Sundays. Please select a weekday.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not public holiday
  if (isMalaysianPublicHoliday(date)) {
    return {
      valid: false,
      error: 'Pickup not available on public holidays. Please select another date.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(date);
  pickupDate.setHours(0, 0, 0, 0);

  if (pickupDate < today) {
    return {
      valid: false,
      error: 'Pickup date cannot be in the past.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  // Not more than 7 days ahead
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(0, 0, 0, 0);

  if (pickupDate > maxDate) {
    return {
      valid: false,
      error: 'Pickup date cannot be more than 7 days ahead.',
      errorCode: 'INVALID_PICKUP_DATE'
    };
  }

  return { valid: true };
}

/**
 * Format date to EasyParcel API format (YYYY-MM-DD)
 *
 * CRITICAL: EasyParcel API expects 'collect_date' in this format
 */
export function formatPickupDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

#### File: `src/lib/shipping/utils/date-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getNextBusinessDay,
  validatePickupDate,
  isMalaysianPublicHoliday,
  formatPickupDate,
} from './date-utils';

describe('getNextBusinessDay', () => {
  it('should return next day if it is a weekday', () => {
    const monday = new Date('2025-10-06'); // Monday
    const result = getNextBusinessDay(monday);
    expect(result.getDate()).toBe(7); // Tuesday
  });

  it('should skip Sunday and return Monday', () => {
    const saturday = new Date('2025-10-11'); // Saturday
    const result = getNextBusinessDay(saturday);
    expect(result.getDate()).toBe(13); // Monday
    expect(result.getDay()).not.toBe(0); // Not Sunday
  });

  it('should skip public holidays', () => {
    const beforeMerdeka = new Date('2025-08-30');
    const result = getNextBusinessDay(beforeMerdeka);
    // Should skip Aug 31 (Merdeka Day)
    expect(result.getDate()).toBe(1); // Sept 1
    expect(result.getMonth()).toBe(8); // September (0-indexed)
  });
});

describe('validatePickupDate', () => {
  it('should reject Sundays', () => {
    const sunday = new Date('2025-10-12'); // Sunday
    const result = validatePickupDate(sunday);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_PICKUP_DATE');
    expect(result.error).toContain('Sunday');
  });

  it('should reject public holidays', () => {
    const merdeka = new Date('2025-08-31'); // Merdeka Day
    const result = validatePickupDate(merdeka);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('public holiday');
  });

  it('should reject past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = validatePickupDate(yesterday);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('past');
  });

  it('should reject dates more than 7 days ahead', () => {
    const tooFar = new Date();
    tooFar.setDate(tooFar.getDate() + 8);
    const result = validatePickupDate(tooFar);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('7 days');
  });

  it('should accept valid business day within 7 days', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);

    // Skip test if it's Sunday or holiday
    if (nextWeek.getDay() === 0 || isMalaysianPublicHoliday(nextWeek)) {
      return;
    }

    const result = validatePickupDate(nextWeek);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('formatPickupDate', () => {
  it('should format date as YYYY-MM-DD for EasyParcel API', () => {
    const date = new Date('2025-10-09T14:30:00Z');
    const result = formatPickupDate(date);
    expect(result).toBe('2025-10-09');
  });

  it('should handle dates with single-digit months/days', () => {
    const date = new Date('2025-01-05T00:00:00Z');
    const result = formatPickupDate(date);
    expect(result).toBe('2025-01-05');
  });
});
```

---

**2. Naming Conventions**

```typescript
// ✅ GOOD: Descriptive, consistent names
// Files: kebab-case
shipping-calculator.ts
easyparcel-client.ts

// Classes: PascalCase
class EasyParcelClient {}
class FulfillmentWidget {}

// Functions: camelCase
function calculateShippingCost() {}
async function getAvailableCouriers() {}

// Constants: UPPER_SNAKE_CASE
const MAX_PICKUP_DAYS_AHEAD = 7;
const DEFAULT_BALANCE_THRESHOLD = 50;

// Malaysian State Codes (EasyParcel API Requirement - Appendix III)
// IMPORTANT: Must be lowercase 3-letter codes as per official documentation
const MALAYSIAN_STATES = {
  'jhr': 'Johor',
  'kdh': 'Kedah',
  'ktn': 'Kelantan',
  'mlk': 'Melaka',
  'nsn': 'Negeri Sembilan',
  'phg': 'Pahang',
  'prk': 'Perak',
  'pls': 'Perlis',
  'png': 'Pulau Pinang',
  'sgr': 'Selangor',
  'trg': 'Terengganu',
  'kul': 'Kuala Lumpur',
  'pjy': 'Putrajaya',
  'srw': 'Sarawak',
  'sbh': 'Sabah',
  'lbn': 'Labuan'
} as const;

// Helper: Validate Malaysian state code
function isValidMalaysianState(code: string): boolean {
  return code in MALAYSIAN_STATES;
}

// Type for state codes (GAP #3 RESOLVED)
type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;

// Helper: Get state name from code
function getStateName(code: MalaysianStateCode): string {
  return MALAYSIAN_STATES[code];
}

// Types/Interfaces: PascalCase
interface ShippingRate {}
type OrderStatus = 'PAID' | 'READY_TO_SHIP';
```

**3. Documentation**

```typescript
/**
 * Calculate shipping rates for a given delivery address
 *
 * @param address - Customer's delivery address
 * @param weight - Total order weight in kg
 * @param orderValue - Total order value for free shipping check
 * @returns Array of available courier options with rates
 * @throws {EasyParcelError} When API fails or no couriers available
 *
 * @example
 * const rates = await calculateShippingRates({
 *   state: 'sgr',  // Lowercase 3-letter state code
 *   postcode: '50000'
 * }, 2.5, 150);
 */
async function calculateShippingRates(
  address: DeliveryAddress,
  weight: number,
  orderValue: number
): Promise<ShippingRate[]> {
  // Implementation
}
```

---

### UI Components Best Practices (GAP #3 RESOLVED)

**1. State Dropdown Component**

```typescript
// src/components/admin/StateDropdown.tsx

import { MALAYSIAN_STATES, type MalaysianStateCode } from '@/lib/shipping/constants';

interface StateDropdownProps {
  value: string;
  onChange: (stateCode: MalaysianStateCode) => void;
  error?: string;
  required?: boolean;
}

export default function StateDropdown({
  value,
  onChange,
  error,
  required = true
}: StateDropdownProps) {
  return (
    <div className="form-field">
      <label htmlFor="state">
        State {required && <span className="required">*</span>}
      </label>

      <select
        id="state"
        name="state"
        value={value}
        onChange={(e) => onChange(e.target.value as MalaysianStateCode)}
        className={error ? 'error' : ''}
        required={required}
      >
        <option value="">Select State</option>
        {Object.entries(MALAYSIAN_STATES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>

      {error && <span className="error-message">{error}</span>}

      <p className="help-text">
        Select the Malaysian state for pickup/delivery
      </p>
    </div>
  );
}
```

**Usage in Admin Settings:**
```typescript
// src/app/admin/shipping/page.tsx

import StateDropdown from '@/components/admin/StateDropdown';

export default function ShippingSettingsPage() {
  const [formData, setFormData] = useState({
    pickupAddress: {
      businessName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '', // Will be MalaysianStateCode
      postalCode: '',
      country: 'MY'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStateChange = (stateCode: MalaysianStateCode) => {
    setFormData(prev => ({
      ...prev,
      pickupAddress: {
        ...prev.pickupAddress,
        state: stateCode
      }
    }));

    // Clear error when user selects a state
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: '' }));
    }
  };

  return (
    <form>
      {/* Other fields */}

      <StateDropdown
        value={formData.pickupAddress.state}
        onChange={handleStateChange}
        error={errors.state}
        required
      />

      {/* Other fields */}
    </form>
  );
}
```

**Why Dropdown Over Free Text:**
- ✅ Prevents typos (e.g., "KL" instead of "kul")
- ✅ Enforces valid state codes
- ✅ Better UX (users see state names, system stores codes)
- ✅ Type-safe with TypeScript
- ✅ Consistent with EasyParcel API requirements

**Customer Checkout State Selector:**
```typescript
// src/components/checkout/AddressForm.tsx

import StateDropdown from '@/components/shared/StateDropdown';

export default function AddressForm({ onChange }) {
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const handleStateChange = (stateCode: MalaysianStateCode) => {
    const updatedAddress = { ...address, state: stateCode };
    setAddress(updatedAddress);

    // Notify parent (triggers shipping calculation)
    onChange(updatedAddress);
  };

  return (
    <div>
      {/* Other address fields */}

      <StateDropdown
        value={address.state}
        onChange={handleStateChange}
        required
      />

      {/* Other address fields */}
    </div>
  );
}
```

**Alternative: Searchable Dropdown (Better UX for Mobile):**
```typescript
// Using react-select or similar library

import Select from 'react-select';
import { MALAYSIAN_STATES } from '@/lib/shipping/constants';

const stateOptions = Object.entries(MALAYSIAN_STATES).map(([code, name]) => ({
  value: code,
  label: name
}));

<Select
  options={stateOptions}
  value={stateOptions.find(opt => opt.value === formData.state)}
  onChange={(option) => handleStateChange(option?.value || '')}
  placeholder="Select State"
  isSearchable
  isClearable={false}
/>
```

**Constants File Location:**
```typescript
// src/lib/shipping/constants.ts

export const MALAYSIAN_STATES = {
  'jhr': 'Johor',
  'kdh': 'Kedah',
  'ktn': 'Kelantan',
  'mlk': 'Melaka',
  'nsn': 'Negeri Sembilan',
  'phg': 'Pahang',
  'prk': 'Perak',
  'pls': 'Perlis',
  'png': 'Pulau Pinang',
  'sgr': 'Selangor',
  'trg': 'Terengganu',
  'kul': 'Kuala Lumpur',
  'pjy': 'Putrajaya',
  'srw': 'Sarawak',
  'sbh': 'Sabah',
  'lbn': 'Labuan'
} as const;

export type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;

export function isValidMalaysianState(code: string): boolean {
  return code in MALAYSIAN_STATES;
}

export function getStateName(code: MalaysianStateCode): string {
  return MALAYSIAN_STATES[code];
}

// Export for use in both frontend and backend
export default {
  MALAYSIAN_STATES,
  isValidMalaysianState,
  getStateName
};
```

---

### Monitoring & Logging

**1. Structured Logging**

```typescript
// ✅ GOOD: Structured logs for easy parsing
logger.info('Fulfillment started', {
  orderId,
  serviceId,
  pickupDate,
  overriddenByAdmin
});

logger.error('Fulfillment failed', {
  orderId,
  errorCode: error.code,
  errorMessage: error.message,
  retryable: error.retryable,
  timestamp: new Date().toISOString()
});

// ❌ BAD: Unstructured string logs
console.log('Fulfilling order ' + orderId);
console.log('Error: ' + error.message); // Hard to parse
```

**2. Performance Tracking**

```typescript
// ✅ GOOD: Track API response times
const start = Date.now();
try {
  const result = await easyParcel.createShipment(data);
  const duration = Date.now() - start;

  metrics.recordAPILatency('easyparcel.createShipment', duration);

  if (duration > 5000) {
    logger.warn('Slow API response', { duration, endpoint: 'createShipment' });
  }

  return result;
} catch (error) {
  metrics.incrementCounter('easyparcel.errors', { code: error.code });
  throw error;
}
```

---

### Summary Checklist

**Before merging code, verify:**

- ✅ All functions have proper TypeScript types (no `any`)
- ✅ Error handling in place for all async operations
- ✅ Input validation for all API endpoints
- ✅ User-friendly error messages (no technical jargon)
- ✅ Loading states for all async UI operations
- ✅ Database operations use transactions where needed
- ✅ API calls are debounced/cached appropriately
- ✅ Authorization checks on admin endpoints
- ✅ Unit tests for business logic
- ✅ Integration tests for API routes
- ✅ Consistent naming conventions
- ✅ Structured logging with context
- ✅ No hardcoded secrets (use env variables)
- ✅ Code follows DRY principle
- ✅ Documentation for complex functions

---

## Implementation Timeline

**Revised Estimate:** 7-8 days (includes 6 WooCommerce-inspired critical features)

---

### Phase 1: Core Setup (Day 1)

**Morning:**
- [ ] Execute removal plan (delete old system)
- [ ] Create new file structure
- [ ] Set up TypeScript types (including new fields)
- [ ] Create EasyParcel service base
- [ ] Update database schema with new fields:
  - [ ] `scheduledPickupDate`, `overriddenByAdmin`, `adminOverrideReason`
  - [ ] `failedBookingAttempts`, `lastBookingError`, `autoStatusUpdate`

**Afternoon:**
- [ ] Implement admin shipping management page (with courier strategy dropdown)
- [ ] Implement `/api/admin/shipping/couriers` endpoint (get courier list)
- [ ] Implement settings GET/POST endpoints
- [ ] **NEW: Add automation settings section (Feature #4)**
- [ ] **NEW: Add credit balance display (Feature #6)**
- [ ] Test connection to EasyParcel API
- [ ] Validate settings storage (including `courierStrategy`, `automation`, `creditBalance`)

**End of Day 1:** Admin can configure API credentials, pickup address, courier selection strategy, automation toggle, and view balance.

---

### Phase 2: Checkout Integration (Day 2)

**Morning:**
- [ ] Implement shipping calculator service
- [ ] Create `/api/shipping/calculate` endpoint
- [ ] Implement strategy application logic:
  - [ ] "Cheapest" - return only lowest cost option
  - [ ] "All" - return all available couriers
  - [ ] "Selected" - filter by admin's selected courier IDs
- [ ] Handle rate calculation logic
- [ ] Implement free shipping threshold

**Afternoon:**
- [ ] Build ShippingSelector component
  - [ ] Single option display (cheapest strategy)
  - [ ] Multiple options display (all/selected strategies)
- [ ] Store selected `serviceId` in order
- [ ] Integrate with checkout page
- [ ] Handle loading/error states
- [ ] Test no couriers scenario

**End of Day 2:** Customers see shipping rates based on admin strategy, select courier if needed, proceed to payment.

---

### Phase 3: Admin Fulfillment Widget (Day 3-4)

**Day 3 Morning:**
- [ ] **NEW: Implement `/api/admin/orders/{id}/shipping-options` (Feature #1)**
  - [ ] Fetch customer's selected courier
  - [ ] Fetch alternative couriers for same destination
  - [ ] Mark cheaper alternatives as "recommended"
- [ ] **NEW: Implement balance validation before fulfillment (Feature #6)**
  - [ ] Check balance API
  - [ ] Show low balance warning if < threshold

**Day 3 Afternoon:**
- [ ] Build FulfillmentWidget component (sidebar widget)
  - [ ] **NEW: Courier override dropdown (Feature #1)**
  - [ ] **NEW: Pickup date selector with smart defaults (Feature #5)**
  - [ ] Shipment summary display
  - [ ] Pre-fulfillment state UI
- [ ] Implement business day calculation utility
  - [ ] Skip Sundays
  - [ ] Skip Malaysian public holidays
  - [ ] Max 7 days ahead validation

**Day 4 Morning:**
- [ ] Enhance `/api/admin/orders/{id}/fulfill` endpoint
  - [ ] Accept `serviceId`, `pickupDate`, `overriddenByAdmin`, `overrideReason`
  - [ ] Validate pickup date (not Sunday/holiday/past/too far)
  - [ ] **NEW: Track failed attempts (Feature #3)**
  - [ ] **NEW: Store error details for retry**
- [ ] Implement processing state UI (loading indicator)
- [ ] Implement post-fulfillment success state UI

**Day 4 Afternoon:**
- [ ] **NEW: Implement retry mechanism (Feature #3)**
  - [ ] Failed state UI with specific error messages
  - [ ] Retry button functionality
  - [ ] Actionable error suggestions (top-up link, change courier, etc.)
- [ ] **NEW: Implement `/api/admin/orders/{id}/retry-awb` endpoint**
- [ ] **NEW: Partial success state UI (AWB retry)**
- [ ] Implement duplicate prevention
- [ ] Add error boundary for widget
- [ ] Test all fulfillment states

**End of Day 4:** Admin has complete fulfillment widget with courier override, pickup scheduling, balance checking, and retry capability.

---

### Phase 4: Tracking & Notifications (Day 5)

**Morning:**
- [ ] Implement `/api/shipping/track/:trackingNumber` endpoint
- [ ] Create tracking display in admin
- [ ] Simplify track-order page for customers
- [ ] Add manual refresh button (Feature #3 - manual retry pattern)
- [ ] Test tracking data flow

**Afternoon:**
- [ ] Set up email templates
- [ ] Implement Email #1 (order confirmation)
- [ ] Implement Email #2 (tracking notification)
- [ ] Test email delivery
- [ ] Ensure emails sent even with automation toggle off

**End of Day 5:** Tracking works, customers receive emails, manual refresh available.

---

### Phase 5: Automation & Cron Job (Day 6)

**Morning:**
- [ ] Create `update-tracking.ts` script
- [ ] **NEW: Implement auto-update toggle respect (Feature #4)**
  - [ ] Check global `automation.autoStatusUpdate` setting
  - [ ] Check per-order `autoStatusUpdate` field
  - [ ] Skip orders where automation is disabled
- [ ] Query only orders with tracking and auto-update enabled
- [ ] Update order statuses based on tracking events

**Afternoon:**
- [ ] Configure Railway cron job (4-hour interval)
- [ ] Test automatic status updates
- [ ] Verify cron job execution
- [ ] Test manual toggle override
- [ ] Create admin UI to toggle auto-update per-order (if needed)

**End of Day 6:** Automatic tracking updates work, respecting automation preferences.

---

### Phase 6: Testing & Quality Assurance (Day 7)

**Morning:**
- [ ] **Unit tests for business logic**
  - [ ] `getNextBusinessDay()` utility
  - [ ] Pickup date validation
  - [ ] Balance threshold checking
  - [ ] Error message mapping
- [ ] **Integration tests for API routes**
  - [ ] Fulfill endpoint (success/failure/retry scenarios)
  - [ ] Shipping options endpoint
  - [ ] Balance endpoint
  - [ ] Retry AWB endpoint

**Afternoon:**
- [ ] **E2E tests for critical flows**
  - [ ] Admin fulfillment with courier override
  - [ ] Retry failed booking after top-up
  - [ ] Pickup date selection validation
  - [ ] Partial success AWB retry
- [ ] **Manual testing checklist**
  - [ ] All 6 critical features working
  - [ ] Error states display correctly
  - [ ] Loading states smooth
  - [ ] Mobile responsiveness

**End of Day 7:** All features tested, bugs fixed, ready for final polish.

---

### Phase 7: Final Polish & Documentation (Day 8)

**Morning:**
- [ ] Code review with best practices checklist
- [ ] Verify TypeScript strict mode compliance
- [ ] Check error handling coverage
- [ ] Optimize queries (add indexes if needed)
- [ ] Add JSDoc comments to complex functions

**Afternoon:**
- [ ] Create admin user guide (with screenshots)
  - [ ] How to configure settings
  - [ ] How to fulfill orders
  - [ ] How to handle failed bookings
  - [ ] How to override couriers
- [ ] Update project README
- [ ] Final end-to-end flow test
- [ ] Deploy to staging for UAT

**End of Day 8:** Production-ready system with all 6 critical features implemented and documented.

---

### Phase 8 (Optional): Post-Launch Monitoring (Week 2+)

**Monitor:**
- [ ] Tracking update success rate (cron job logs)
- [ ] EasyParcel API reliability (error rates)
- [ ] Failed booking patterns (which errors are common?)
- [ ] Courier override frequency (analytics)
- [ ] Balance low warnings (how often?)

**Iterate:**
- [ ] Gather real-world courier reliability data
- [ ] Analyze if courier strategy should be adjusted
- [ ] Consider bulk operations if order volume > 50/day
- [ ] Add dashboard metrics if useful

---

### Feature Implementation Status

**✅ Core Features (MVP Baseline):**
1. Shipping rate calculation at checkout
2. Strategy-based courier selection (cheapest/all/selected)
3. Free shipping threshold
4. One-click order fulfillment
5. Automatic tracking updates (cron job)
6. Email notifications
7. Customer tracking page

**✅ Critical Features (WooCommerce-Inspired):**
1. **Admin courier override at fulfillment** (Day 3-4)
2. **Pickup date selection** (Day 3-4)
3. **Retry failed bookings** (Day 4)
4. **Auto-update toggle** (Day 6)
5. **Detailed fulfillment UI** (Day 3-4)
6. **Credit balance display** (Day 1)

**Timeline Summary:**
- **Original estimate:** 5 days
- **Revised estimate:** 7-8 days (+2-3 days for critical features)
- **Impact:** Acceptable delay for significantly better product (75% → 95% readiness)

---

### Post-Launch (Week 2+)

**Monitor:**
- [ ] Tracking update success rate
- [ ] EasyParcel API reliability
- [ ] Customer shipping complaints
- [ ] Courier delivery times

**Iterate:**
- [ ] Gather courier reliability data
- [ ] Decide on courier selection strategy (pending decision)
- [ ] Add improvements based on real usage
- [ ] Consider bulk operations if order volume increases

---

## Success Criteria

### Customer Experience
- ✅ Shipping cost visible before payment
- ✅ Clear messaging if shipping unavailable
- ✅ Tracking information accessible
- ✅ Email notifications received
- ✅ Smooth checkout process (< 3 clicks)

### Admin Experience
- ✅ Settings configuration < 5 minutes
- ✅ Order fulfillment < 1 minute per order
- ✅ Clear error messages with retry options
- ✅ Tracking updates visible in admin panel
- ✅ No manual intervention needed for tracking

### Technical
- ✅ Total code < 1,500 lines
- ✅ API response time < 3 seconds
- ✅ Railway cron job runs reliably
- ✅ No duplicate shipments created
- ✅ Proper error handling throughout

### Business
- ✅ 100% of eligible orders can be fulfilled
- ✅ Free shipping threshold working correctly
- ✅ Shipping costs accurate (no losses)
- ✅ Customer satisfaction with delivery times
- ✅ System scales to 100+ orders/day

---

## Appendix

### A. Malaysian State Codes

```
JOH = Johor
KDH = Kedah
KTN = Kelantan
MLK = Melaka
NSN = Negeri Sembilan
PHG = Pahang
PRK = Perak
PLS = Perlis
PNG = Pulau Pinang
SEL = Selangor
TRG = Terengganu
SBH = Sabah
SWK = Sarawak
KUL = Kuala Lumpur
LBN = Labuan
PJY = Putrajaya
```

### B. Phone Number Validation

**Format:** `+60XXXXXXXXX`

**Regex:** `^\\+60[0-9]{8,10}$`

**Examples:**
- ✅ +60123456789 (mobile)
- ✅ +60323456789 (landline)
- ❌ 0123456789 (missing +60)
- ❌ +60-12-345-6789 (has dashes)

### C. Postal Code Validation

**Format:** 5 digits

**Regex:** `^\\d{5}$`

**Examples:**
- ✅ 50000
- ✅ 88000
- ❌ 5000 (only 4 digits)
- ❌ 50000-123 (extra characters)

### D. EasyParcel API Reference

**Base URLs:**
- Sandbox: `https://sandbox.easyparcel.com/api/v1`
- Production: `https://api.easyparcel.com/v1`

**Authentication:**
- Header: `Authorization: Bearer {API_KEY}`

**Key Endpoints:**
- `POST /rates` - Get shipping rates
- `POST /shipments` - Create shipment
- `GET /tracking/{number}` - Get tracking info

**Reference:** Old documentation archived in `claudedocs/archive/old-shipping-docs/`

---

## Document Control

**Version:** 1.0
**Created:** 2025-10-07
**Last Updated:** 2025-10-07
**Status:** Final - Ready for Implementation
**Approved By:** Product Owner

**Related Documents:**
- `SHIPPING_REMOVAL_PLAN.md` - Systematic removal of old system
- `claudedocs/archive/old-shipping-docs/` - Reference documentation

**Pending:**
- Courier selection strategy research and decision

**Next Steps:**
1. Review and approve this specification
2. Execute removal plan from SHIPPING_REMOVAL_PLAN.md
3. Begin implementation following Day 1-5 timeline
4. Research courier selection strategy during development
5. Launch and monitor real-world usage
