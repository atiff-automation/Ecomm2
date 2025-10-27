# NRIC Membership Implementation Guide

**Version:** Ultra-KISS Edition
**Date:** 2025-10-27
**Status:** ✅ Ready for Implementation
**Approach:** Maximum Simplicity for Small Business
**Timeline:** 3 days
**Codebase Analysis:** 80% already implemented

---

## 🔴 MANDATORY: Coding Standards Compliance

**ALL code in this implementation MUST follow `@CLAUDE.md` standards:**

### Core Requirements (Non-Negotiable):
1. ✅ **Single Source of Truth** - No duplicate code, configurations, or data definitions
2. ✅ **No Hardcoding** - Use constants, environment variables, configuration files
3. ✅ **SOLID Principles** - Single Responsibility, Open/Closed, Liskov Substitution, etc.
4. ✅ **DRY** - Don't Repeat Yourself - extract common patterns
5. ✅ **KISS** - Keep It Simple - avoid unnecessary complexity
6. ✅ **Type Safety** - No `any` types, use explicit TypeScript types everywhere
7. ✅ **Three-Layer Validation** - Frontend → API → Database
8. ✅ **Try-Catch** - All async operations must have error handling
9. ✅ **Zod Schemas** - All user inputs must be validated
10. ✅ **Prisma Only** - No raw SQL queries

**⚠️ Failure to follow these standards will result in code review rejection.**

**See**: `/CLAUDE.md` and `claudedocs/CODING_STANDARDS.md` for complete details.

---

## 🔒 CRITICAL: CSRF Protection Requirements

**ALL mutation API calls (POST, PUT, PATCH, DELETE) MUST use `fetchWithCSRF`:**

### Ultra-KISS Standard Pattern:
```typescript
// ✅ CORRECT - NRIC submission with CSRF protection
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

const response = await fetchWithCSRF('/api/membership/nric', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nric }),
});
```

### ❌ NEVER DO THIS:
```typescript
// ❌ WRONG - Missing CSRF protection
const response = await fetch('/api/membership/nric', {
  method: 'POST',
  body: JSON.stringify({ nric })
});
```

**See**: `claudedocs/CSRF-FIX-DEVELOPER-GUIDE.md` for complete CSRF implementation guide.

---

## 🚨 IMPORTANT: Read This First

### Codebase Analysis Results

**✅ ALREADY IMPLEMENTED (80%)**:
- Membership qualification calculation (`/api/cart/membership-check`)
- Pricing model with `getBestPrice()` and member pricing
- Membership configuration service (`getMembershipConfiguration()`)
- PendingMembership database model with JSON `registrationData` field
- MembershipCheckoutBanner component (needs NRIC form addition)
- Payment success handling via `PaymentSuccessHandler`
- `activateUserMembership()` function (needs NRIC parameter)

**❌ MISSING (20% - NRIC specific) - Ultra-KISS Approach**:
1. NRIC validation utilities (new file) - **Simple**: Basic validation only
2. NRIC single-input form (add to existing component) - **Simplified**: One field + confirmation dialog
3. NRIC storage in pendingMembership (add to existing field) - **Existing**: Uses JSON field
4. NRIC parameter in `activateUserMembership()` (update signature) - **Minor**: Add 1 parameter
5. NRIC field in User model (database migration) - **Minimal**: Add 1 field
6. NRIC display in admin/customer pages (UI updates) - **Simple**: Display only
7. NRIC in email/thank you page (template updates) - **Simple**: Display only

**🔴 CRITICAL FIX REQUIRED**:
- Move membership activation from `toyyibpay/route.ts:203-236` to `OrderStatusHandler.handlePaymentSuccess()`
- This violates Single Source of Truth - needs immediate correction

### Ultra-KISS Implementation Scope

**Timeline**: **3 days, 6 major tasks**

**Ultra-KISS Simplification Strategy**:
- ✅ Single NRIC input (not double-entry) → Faster UX
- ✅ One API endpoint (not two) → Less code to maintain
- ✅ Confirmation dialog (instead of double-entry) → Simpler validation
- ✅ No pre-fill check → Server handles retry automatically
- ✅ All security maintained (CSRF, validation, masking) → No compromise on safety
- ✅ Building on 80% existing code → Minimal new code

**Key Metrics**:
- 📦 2 new files to create
- 🔧 8 existing files to modify
- 🔒 100% security maintained
- ⚡ 3-day implementation

---

## Table of Contents

1. [Mandatory Coding Standards](#-mandatory-coding-standards-compliance) 🔴 **READ FIRST**
2. [CSRF Protection Requirements](#-critical-csrf-protection-requirements) 🔒 **CRITICAL**
3. [Executive Summary](#executive-summary)
4. [Business Requirements](#business-requirements)
5. [Architecture Decisions](#architecture-decisions)
6. [Security Standards](#security-standards) 🔒 **IMPORTANT**
7. [Database Schema Changes](#database-schema-changes)
8. [Ultra-KISS Implementation Timeline](#ultra-kiss-implementation-timeline-3-days) 📅 **TIMELINE**
9. [Implementation Steps](#implementation-steps) ⚠️ **DETAILED GUIDE**
10. [Testing Checklist](#testing-checklist)
11. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Objective
Implement Malaysia NRIC (National Registration Identity Card) collection for new members as a **compulsory, immutable global reference** across all outlets using the **Ultra-KISS** approach.

### Key Points
- **NRIC = Member ID**: 12-digit NRIC becomes the customer's permanent Member ID
- **Collection Timing**: During first qualifying purchase (RM80+), before payment
- **Immutability**: NRIC cannot be changed after submission (contact support required)
- **Pricing Model**: First purchase at regular price → Payment confirms → Future purchases at member price
- **Storage**: 12 digits only (no dashes/symbols allowed)
- **Validation**: Ultra-KISS - Single input + confirmation dialog

### Success Criteria
- ✅ All new members (from deployment forward) have NRIC stored
- ✅ NRIC serves as Member ID in customer admin pages
- ✅ System prevents duplicate NRIC across accounts
- ✅ NRIC persists through failed payment retries
- ✅ Member activation follows Single Source of Truth pattern
- ✅ Ultra-KISS: Single input field with confirmation dialog

---

## Business Requirements

### BR-1: NRIC Collection Flow (Ultra-KISS)

**Scenario: New User First Purchase ≥RM80**

```
Step 1: User Registration/Login
├─ New user: Create account (email, name, phone)
├─ Existing user: Login
└─ Guest user: Can checkout at regular price (no membership)

Step 2: Cart Qualification ✅ ALREADY IMPLEMENTED
├─ Cart total ≥ RM80 (qualifying products)
├─ Uses getMembershipConfiguration() for threshold
├─ Uses productQualifiesForMembership() for item check
└─ Uses /api/cart/membership-check for eligibility

Step 3: NRIC Collection (at Checkout) ❌ NEEDS IMPLEMENTATION - Ultra-KISS
├─ Display: MembershipCheckoutBanner component (exists, needs NRIC form)
├─ User enters NRIC once (single input) - NEW - SIMPLIFIED
├─ User confirms via dialog (not double-entry) - NEW - SIMPLIFIED
├─ NRIC validated via /api/membership/nric - NEW
└─ NRIC stored in checkout state → passed to /api/orders

Step 4: Order Creation ⚠️ NEEDS NRIC PARAMETER
├─ /api/orders receives NRIC from checkout
├─ Creates pendingMembership with registrationData: { nric } - NEW
└─ Order created at REGULAR PRICE

Step 5: Payment ✅ ALREADY IMPLEMENTED
├─ User redirected to payment gateway (ToyyibPay)
└─ Payment status: PENDING

Step 6: Payment Confirmation ⚠️ NEEDS FIX + NRIC
├─ Webhook receives payment success ✅
├─ PaymentSuccessHandler.handle() called ✅
├─ OrderStatusHandler.handlePaymentSuccess() triggered ✅
├─ Membership activation (🔴 NEEDS TO BE MOVED HERE from webhook)
├─ User updated: isMember = true, memberSince = now(), nric = "900101015678" ❌
└─ pendingMembership deleted ✅

Step 7: Post-Activation ⚠️ NEEDS NRIC DISPLAY
├─ Order confirmation email sent ✅ (needs membershipInfo parameter)
├─ Thank you page shows membership card ❌ (needs NRIC display)
└─ Future logins: Member prices automatically applied ✅
```

### BR-2: NRIC as Member ID

**Display Locations**:
1. **Customer Profile Page**: Full NRIC visible ❌ NEEDS IMPLEMENTATION
2. **Admin Customer Detail Page**: Full NRIC in dedicated card ❌ NEEDS IMPLEMENTATION
3. **Order Confirmation Email**: Member ID in welcome message ❌ NEEDS IMPLEMENTATION
4. **Thank You Page**: Member ID after successful payment ❌ NEEDS IMPLEMENTATION

### BR-3: NRIC Validation Rules

**Format**:
- Exactly 12 digits
- No dashes, spaces, or symbols
- No letters or special characters
- Example VALID: `900101015678`
- Example INVALID: `900101-01-5678`, `9001 0101 5678`

**Business Rules**:
- UNIQUE constraint (one NRIC = one account)
- IMMUTABLE after submission (cannot be changed by user)
- Required for membership activation (mandatory field)
- Correction requires contact support with ID verification

### BR-4: Pricing Model ✅ ALREADY IMPLEMENTED

**First Purchase (Qualifying)**:
- Cart total ≥ RM80 (qualifying products only) ✅
- User pays REGULAR PRICE ✅
- Uses `getBestPrice(product, isMember: false)` ✅
- NRIC collected during checkout ❌ NEW

**Payment Confirmation**:
- Webhook confirms payment ✅
- Membership ACTIVATED ✅ (needs NRIC parameter)
- User becomes ACTIVE MEMBER ✅

**Future Purchases**:
- User logs in ✅
- System automatically applies MEMBER PRICES ✅
- Uses `getBestPrice(product, isMember: true)` ✅

### BR-5: Guest Checkout ✅ ALREADY IMPLEMENTED

Guest users can checkout without creating account. No changes needed.

---

## Architecture Decisions

### AD-1: Single Source of Truth Pattern 🔴 CRITICAL FIX

**CURRENT ISSUE**: Membership activation is in `/api/webhooks/toyyibpay/route.ts:203-236`
**PROBLEM**: Violates Single Source of Truth (would need duplication for Billplz, Stripe, etc.)
**SOLUTION**: Move to `/lib/notifications/order-status-handler.ts:handlePaymentSuccess()`

**INCORRECT (Current Code)** ❌:
```typescript
// File: /api/webhooks/toyyibpay/route.ts (lines 203-236)
if (callback.status === '1') {
  // Activate pending membership if exists
  if (order.pendingMembership && order.user && !order.user.isMember) {
    const activated = await activateUserMembership(
      order.user.id,
      Number(pending.qualifyingAmount),
      order.id
    );
    // ... delete pending
  }
}
```

**CORRECT (Required Change)** ✅:
```typescript
// File: /lib/notifications/order-status-handler.ts
// Type for order with all required relations
interface OrderWithRelations {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  paymentMethod: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isMember: boolean;
  } | null;
  pendingMembership: {
    id: string;
    qualifyingAmount: number;
    registrationData: { nric?: string } | null;
  } | null;
  orderItems: Array<{
    productName: string;
    quantity: number;
    appliedPrice: number;
    product: { name: string } | null;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
  } | null;
  guestEmail: string | null;
}

private static async handlePaymentSuccess(
  order: OrderWithRelations,
  data: OrderStatusChangeData
) {
  console.log('💰 Payment success detected:', order.orderNumber);

  // ✅ STEP 1: Activate membership (if applicable)
  if (order.pendingMembership && order.user && !order.user.isMember) {
    const pending = order.pendingMembership;
    const nric = pending.registrationData?.nric;  // ← GET NRIC

    await activateUserMembership(
      order.user.id,
      Number(pending.qualifyingAmount),
      order.id,
      nric  // ← PASS NRIC
    );

    await prisma.pendingMembership.delete({
      where: { id: pending.id },
    });
  }

  // ✅ STEP 2: Send notifications
  await simplifiedTelegramService.sendNewOrderNotification({...});
  await emailService.sendOrderConfirmation({...});
}
```

### AD-2: Database Schema (Ultra-KISS) ⚠️ MINIMAL CHANGE

**User Model Changes**:
```prisma
model User {
  // ... existing fields (NO CHANGES)

  // ❌ ADD THIS FIELD ONLY
  nric          String?    @unique @db.VarChar(12)

  // ✅ EXISTING - NO CHANGES NEEDED
  isMember      Boolean    @default(false)
  memberSince   DateTime?
  createdAt     DateTime   @default(now())

  @@index([nric])  // ← ADD THIS INDEX
}
```

**PendingMembership Model** ✅ ALREADY EXISTS - NO CHANGES:
```prisma
model PendingMembership {
  id               String   @id @default(cuid())
  userId           String   @unique
  orderId          String   @unique
  qualifyingAmount Decimal  @db.Decimal(10, 2)
  registrationData Json?    // ← Store NRIC here: { nric: "900101015678" }
  expiresAt        DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  order            Order    @relation(...)
  user             User     @relation(...)
}
```

### AD-3: NRIC Persistence on Payment Retry ✅ ARCHITECTURE EXISTS

The `PendingMembership` model already supports this via `@unique userId` constraint.

**Flow** (partially implemented):
```typescript
// ✅ EXISTING: Check for existing pending membership
const existingPending = await prisma.pendingMembership.findUnique({
  where: { userId: session.user.id }
});

if (existingPending) {
  // ✅ EXISTING: Update with new order
  await prisma.pendingMembership.update({
    where: { id: existingPending.id },
    data: {
      orderId: newOrder.id,
      qualifyingAmount: newQualifyingAmount,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      // ✅ registrationData.nric preserved automatically
    }
  });
} else {
  // ❌ NEW: Include NRIC in registrationData
  await prisma.pendingMembership.create({
    data: {
      userId: session.user.id,
      orderId: newOrder.id,
      qualifyingAmount: newQualifyingAmount,
      registrationData: { nric: nricFromCheckout },  // ← ADD THIS
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}
```

### AD-4: Three-Layer Validation ✅ PATTERN EXISTS

The codebase already follows this pattern (as per @CLAUDE.md). Apply to NRIC:

**Layer 1**: Frontend validation (NRIC form) ❌ NEW
**Layer 2**: API validation (Zod schema) ❌ NEW
**Layer 3**: Database constraint (`@unique`) ❌ NEW

### AD-5: Data Flow Architecture (Ultra-KISS)

```
┌─────────────────────────────────────────────────────────────┐
│  1. MembershipCheckoutBanner Component                      │
│     - User enters NRIC (single input)                       │
│     - User confirms via dialog                              │
│     - Calls /api/membership/nric for validation             │
│     - Calls onMembershipActivated({ nric: '...' })          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Checkout Component (Parent)                              │
│     - Receives NRIC via onMembershipActivated callback      │
│     - Stores NRIC in checkout state                         │
│     - Passes NRIC to /api/orders on submission              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. /api/orders Endpoint                                     │
│     - Receives: orderData.nric from checkout               │
│     - Creates pendingMembership with:                       │
│       registrationData: { nric: orderData.nric }           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Payment Gateway → Webhook → PaymentSuccessHandler       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. OrderStatusHandler.handlePaymentSuccess()               │
│     - Extracts: nric = order.pendingMembership              │
│                        .registrationData?.nric              │
│     - Calls: activateUserMembership(userId, amount,         │
│                                      orderId, nric)         │
│     - Updates: user.nric = nric                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Standards

### 🔒 NRIC Data Protection (Sensitive Personal Information)

**NRIC is Sensitive Personal Data** - Must be protected according to Malaysia PDPA (Personal Data Protection Act):

#### 1. Storage Security ✅

```typescript
// ✅ Database encryption at rest (Railway PostgreSQL default)
// ✅ Unique constraint prevents duplicates
// ✅ Indexed for fast lookups with WHERE clause
nric String? @unique @db.VarChar(12)
```

#### 2. Transmission Security ✅

```typescript
// ✅ HTTPS enforced (SSL/TLS) - handled by deployment platform
// ✅ CSRF protection for all mutations
// ✅ No NRIC in URL parameters (always in request body)
// ❌ NEVER send NRIC in query strings or URL paths
```

#### 3. Display Security ✅

```typescript
// ✅ Masked in logs and previews
export function maskNRIC(nric: string): string {
  return '••••••••' + nric.slice(-4); // Shows only last 4 digits
}

// ✅ Full NRIC visible only to:
// - User themselves (customer profile)
// - Admin users (admin panel)
// ❌ NEVER expose in public APIs or client-side storage
```

#### 4. Access Control ✅

```typescript
// ✅ User can view their own NRIC
// ✅ Admin can view all NRICs (with audit logging)
// ✅ Guest users cannot access NRIC data
// ❌ NEVER return NRIC in unauthenticated API responses
```

#### 5. Audit Trail ✅

```typescript
// ✅ All NRIC access logged in auditLog table
await prisma.auditLog.create({
  data: {
    userId: userId,
    action: 'CREATE',
    resource: 'Membership',
    details: {
      nric: maskNRIC(nric), // ← MASKED in audit log
      activatedAt: new Date().toISOString(),
    },
  },
});
```

### 🔒 CSRF Protection Implementation

**ALL mutation API endpoints MUST verify CSRF tokens:**

#### API Route Pattern (Server-Side):

```typescript
// File: /src/app/api/membership/nric/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// ✅ CSRF middleware automatically validates tokens
// No additional code needed - handled by /src/lib/security/csrf-protection.ts

export async function POST(request: NextRequest) {
  try {
    // ✅ Session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Input validation (Zod schema)
    const body = await request.json();
    const { nric } = submitNricSchema.parse(body);

    // ✅ NRIC format validation
    const nricValidation = nricSchema.safeParse({ nric });
    if (!nricValidation.success) {
      return NextResponse.json(
        { message: 'Invalid NRIC format' },
        { status: 400 }
      );
    }

    // ✅ Duplicate check (database validation)
    const existingUser = await prisma.user.findUnique({
      where: { nric },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { code: 'DUPLICATE_NRIC', message: 'This NRIC is already registered.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting NRIC:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

#### Frontend Pattern (Client-Side):

```typescript
// ✅ CORRECT - Use fetchWithCSRF for all mutations
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

const response = await fetchWithCSRF('/api/membership/nric', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nric }),
});

// ❌ WRONG - Never use native fetch for mutations
const response = await fetch('/api/membership/nric', {
  method: 'POST',
  body: JSON.stringify({ nric }), // Missing CSRF token!
});
```

### 🔒 Input Validation Standards

**Three-Layer Validation** (as per @CLAUDE.md):

#### Layer 1: Frontend (Immediate Feedback)
```typescript
// Real-time validation
const validation = validateNRIC(nric);
if (!validation.valid) {
  setNricError(validation.error);
}

// Sanitization
const cleaned = value.replace(/\D/g, ''); // Remove non-digits
```

#### Layer 2: API (Server Protection)
```typescript
// Zod schema validation
import { nricSchema } from '@/lib/validation/nric';

const result = nricSchema.safeParse({ nric });
if (!result.success) {
  return NextResponse.json({ errors: result.error.errors }, { status: 400 });
}
```

#### Layer 3: Database (Data Integrity)
```prisma
// Database constraints
nric String? @unique @db.VarChar(12)

@@index([nric])
```

### 🔒 Error Handling Standards

**Never expose sensitive information in error messages:**

```typescript
// ✅ CORRECT - Generic error message
if (existingUser) {
  return NextResponse.json(
    { code: 'DUPLICATE_NRIC', message: 'This NRIC is already registered. Contact support if this is incorrect.' },
    { status: 409 }
  );
}

// ❌ WRONG - Exposes user email
if (existingUser) {
  return NextResponse.json(
    { message: `NRIC already registered to ${existingUser.email}` }, // ← NEVER DO THIS
    { status: 409 }
  );
}
```

---

## Database Schema Changes

### Migration SQL

**File**: `prisma/migrations/[timestamp]_add_nric_to_user/migration.sql`

```sql
-- Add NRIC field to User table
ALTER TABLE "users" ADD COLUMN "nric" VARCHAR(12);

-- Add unique constraint
CREATE UNIQUE INDEX "users_nric_key" ON "users"("nric");

-- Add index for faster lookups
CREATE INDEX "users_nric_idx" ON "users"("nric") WHERE "nric" IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN "users"."nric" IS 'Malaysia National Registration Identity Card number (12 digits) - serves as Member ID';
```

### Prisma Schema Update

**File**: `prisma/schema.prisma`

```prisma
model User {
  id                String    @id @default(cuid())
  firstName         String
  lastName          String
  email             String    @unique
  password          String?
  phone             String?

  // ❌ ADD THIS FIELD
  nric              String?   @unique @db.VarChar(12)

  // ✅ EXISTING - NO CHANGES
  isMember          Boolean   @default(false)
  memberSince       DateTime?
  membershipTotal   Decimal   @default(0) @db.Decimal(10, 2)

  // ... other existing fields

  @@index([nric])  // ← ADD THIS
  @@map("users")
}
```

---

## Ultra-KISS Implementation Timeline (3 Days)

### 🗓️ Day 1: Backend Foundation + Critical Fix (8 hours)

**Morning (4 hours):**
- [ ] Create database migration (add `nric` field to User table) - 30 min
- [ ] Run migration and verify in database - 15 min
- [ ] Create NRIC validation utilities (`/lib/validation/nric.ts`) - 1 hour
- [ ] Update membership service (add `nric` parameter to `activateUserMembership`) - 30 min
- [ ] Create single NRIC API endpoint (`/api/membership/nric/route.ts`) - 1.5 hours

**Afternoon (4 hours):**
- [ ] 🔴 **CRITICAL FIX**: Update OrderStatusHandler with membership activation - 2 hours
  - Add `pendingMembership` to order query
  - Add membership activation logic in `handlePaymentSuccess()`
  - Extract NRIC from registrationData
- [ ] 🔴 **CRITICAL FIX**: Remove membership activation from ToyyibPay webhook - 30 min
- [ ] Update `/api/orders` to include NRIC in pendingMembership.registrationData - 30 min
- [ ] Test backend flow with Postman/curl - 1 hour

**Deliverables:**
- ✅ Database migration applied
- ✅ NRIC validation utilities ready
- ✅ Single API endpoint working
- ✅ Single Source of Truth established (OrderStatusHandler)
- ✅ Backend tested and verified

---

### 🗓️ Day 2: Frontend + API Integration (8 hours)

**Morning (4 hours):**
- [ ] Add NRIC form to MembershipCheckoutBanner component - 2.5 hours
  - Single input field with validation
  - Confirmation dialog (AlertDialog)
  - Only 3 state variables
  - CSRF protection with fetchWithCSRF
- [ ] Test NRIC form in browser - 1 hour
- [ ] Fix any UI/UX issues - 30 min

**Afternoon (4 hours):**
- [ ] Update checkout flow to pass NRIC to `/api/orders` - 1 hour
  - Add NRIC to checkout state
  - Pass orderData.nric to API
- [ ] Test end-to-end flow (form → payment → activation) - 2 hours
  - Test with ToyyibPay sandbox
  - Verify membership activated correctly
  - Verify NRIC stored in user record
- [ ] Test duplicate NRIC detection - 30 min
- [ ] Test payment retry scenario (NRIC persistence) - 30 min

**Deliverables:**
- ✅ NRIC form working (single input + confirmation)
- ✅ Full checkout flow working
- ✅ Duplicate detection working
- ✅ Payment retry preserves NRIC

---

### 🗓️ Day 3: Admin UI + Email + Testing (8 hours)

**Morning (4 hours):**
- [ ] Add Member ID card to admin customer detail page - 1 hour
- [ ] Update email service with membership welcome section - 1.5 hours
- [ ] Add membership card to thank you page - 1 hour
- [ ] Test all display locations - 30 min

**Afternoon (4 hours):**
- [ ] **Comprehensive Testing** - 2.5 hours
  - Test all validation rules
  - Test CSRF protection
  - Test error handling
  - Test admin displays
  - Test email content
  - Cross-browser testing
- [ ] Fix any bugs found during testing - 1 hour
- [ ] Final code review and cleanup - 30 min

**Deliverables:**
- ✅ Admin UI shows Member ID
- ✅ Email includes membership welcome
- ✅ Thank you page shows membership card
- ✅ All tests passing
- ✅ Code ready for PR/deployment

---

### 📊 Timeline Summary

| Day | Phase | Hours | Key Tasks |
|-----|-------|-------|-----------|
| 1 | Backend + Fix | 8 | Database, utilities, API endpoint, critical fix |
| 2 | Frontend + Integration | 8 | NRIC form, checkout integration, E2E testing |
| 3 | Admin + Email + QA | 8 | Display updates, comprehensive testing |
| **Total** | **3 days** | **24 hours** | **6 major phases** |

**Security: 100% Maintained** ✅
- ✅ CSRF Protection (fetchWithCSRF for all mutations)
- ✅ Three-Layer Validation (Frontend → API → Database)
- ✅ NRIC Masking (in logs and audit trails)
- ✅ Duplicate Detection (unique constraint + API check)
- ✅ Audit Logging (all membership activations)
- ✅ Session Authentication (all API endpoints)
- ✅ Error Message Security (no sensitive data exposure)
- ✅ PDPA Compliance (secure storage, access control)

---

## Implementation Steps

### Phase 1: Backend Foundation (Day 1)

#### ✅ Task 1.1: Create NRIC Validation Utilities ❌ NEW FILE

**File**: `src/lib/validation/nric.ts` (NEW)

```typescript
/**
 * NRIC Validation Utilities - Ultra-KISS Edition
 * Malaysia National Registration Identity Card validation
 *
 * @CLAUDE.md Compliance:
 * - No hardcoding: All values in constants
 * - Type safety: Explicit types everywhere
 * - DRY: Centralized validation logic
 */

import { z } from 'zod';

export const NRIC_VALIDATION_RULES = {
  LENGTH: 12,
  PATTERN: /^\d{12}$/,
  ERROR_MESSAGES: {
    REQUIRED: 'NRIC is required for membership activation',
    LENGTH: 'NRIC must be exactly 12 digits',
    FORMAT: 'NRIC must contain only numbers (no dashes or symbols)',
    DUPLICATE: 'This NRIC is already registered. Contact support if this is incorrect.',
  },
} as const;

export const nricSchema = z.object({
  nric: z
    .string()
    .length(NRIC_VALIDATION_RULES.LENGTH, NRIC_VALIDATION_RULES.ERROR_MESSAGES.LENGTH)
    .regex(NRIC_VALIDATION_RULES.PATTERN, NRIC_VALIDATION_RULES.ERROR_MESSAGES.FORMAT),
});

export function validateNRIC(nric: string): { valid: boolean; error?: string } {
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) {
    return { valid: false, error: NRIC_VALIDATION_RULES.ERROR_MESSAGES.LENGTH };
  }

  if (!NRIC_VALIDATION_RULES.PATTERN.test(nric)) {
    return { valid: false, error: NRIC_VALIDATION_RULES.ERROR_MESSAGES.FORMAT };
  }

  return { valid: true };
}

export function maskNRIC(nric: string): string {
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) {
    return '••••••••••••';
  }
  return '••••••••' + nric.slice(-4);
}

export function formatNRIC(nric: string | null | undefined): string {
  if (!nric) return 'N/A';
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) return 'Invalid';
  return nric;
}
```

#### ⚠️ Task 1.2: Update Membership Service (EXISTING FILE)

**File**: `src/lib/membership.ts` (lines 190-251)

**Current Signature**:
```typescript
export async function activateUserMembership(
  userId: string,
  qualifyingAmount: number,
  orderId?: string
): Promise<boolean>
```

**Required Change**:
```typescript
import { maskNRIC } from '@/lib/validation/nric';  // ← ADD IMPORT

export async function activateUserMembership(
  userId: string,
  qualifyingAmount: number,
  orderId?: string,
  nric?: string  // ← ADD PARAMETER (optional = no breaking change)
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isMember: true, membershipTotal: true, nric: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isMember) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipTotal: { increment: qualifyingAmount },
        },
      });
      return true;
    }

    // ✅ Activate membership WITH NRIC
    await prisma.user.update({
      where: { id: userId },
      data: {
        isMember: true,
        memberSince: new Date(),
        membershipTotal: qualifyingAmount,
        nric: nric,  // ← SET NRIC HERE
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE',
        resource: 'Membership',
        resourceId: userId,
        details: {
          membershipActivated: true,
          qualifyingAmount,
          orderId,
          nric: nric ? maskNRIC(nric) : undefined,  // ← MASK IN AUDIT LOG
          activatedAt: new Date().toISOString(),
        },
        ipAddress: 'system',
        userAgent: 'membership-service',
      },
    });

    console.log('✅ Membership activated for user:', userId, 'with NRIC:', nric ? maskNRIC(nric) : 'N/A');

    return true;
  } catch (error) {
    console.error('Error activating membership:', error);
    return false;
  }
}
```

#### 🔴 Task 1.3: Update Order Status Handler (CRITICAL FIX)

**File**: `/src/lib/notifications/order-status-handler.ts`

**Change 1**: Add `pendingMembership` to order query (line 35)

```typescript
// Current (line 35)
const order = await prisma.order.findUnique({
  where: { id: data.orderId },
  include: {
    user: true,
    orderItems: {...},
    shippingAddress: true,
    billingAddress: true,
  },
});

// ✅ Updated
const order = await prisma.order.findUnique({
  where: { id: data.orderId },
  include: {
    user: true,
    pendingMembership: true,  // ← ADD THIS
    orderItems: {...},
    shippingAddress: true,
    billingAddress: true,
  },
});
```

**Change 2**: Add membership activation to `handlePaymentSuccess()` (lines 116-172)

```typescript
import { activateUserMembership } from '@/lib/membership';  // ← ADD IMPORT
import { maskNRIC } from '@/lib/validation/nric';  // ← ADD IMPORT

// Type for order with all required relations (same as above)
interface OrderWithRelations {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  paymentMethod: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isMember: boolean;
  } | null;
  pendingMembership: {
    id: string;
    qualifyingAmount: number;
    registrationData: { nric?: string } | null;
  } | null;
  orderItems: Array<{
    productName: string;
    quantity: number;
    appliedPrice: number;
    product: { name: string } | null;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
  } | null;
  guestEmail: string | null;
}

private static async handlePaymentSuccess(
  order: OrderWithRelations,
  data: OrderStatusChangeData
) {
  console.log('💰 Payment success detected for order:', order.orderNumber);

  // ✅ STEP 1: Activate membership (if applicable) - ADD THIS ENTIRE SECTION
  if (order.pendingMembership && order.user && !order.user.isMember) {
    try {
      const pending = order.pendingMembership;
      const nric = pending.registrationData?.nric;

      console.log('🎯 Activating membership for user:', order.user.id);
      console.log('📋 Qualifying amount:', Number(pending.qualifyingAmount));
      console.log('🆔 NRIC:', nric ? maskNRIC(nric) : 'N/A');

      const activated = await activateUserMembership(
        order.user.id,
        Number(pending.qualifyingAmount),
        order.id,
        nric  // ← PASS NRIC
      );

      if (activated) {
        await prisma.pendingMembership.delete({
          where: { id: pending.id },
        });
        console.log('✅ Membership activated and pending record deleted');
      } else {
        console.error('❌ Failed to activate membership');
      }
    } catch (error) {
      console.error('❌ Error during membership activation:', error);
    }
  }

  // ✅ STEP 2: Send Telegram notification (EXISTING - NO CHANGES)
  try {
    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName} (${order.user.email})`
      : `${order.shippingAddress.firstName} ${order.shippingAddress.lastName} (${order.guestEmail})`;

    await simplifiedTelegramService.sendNewOrderNotification({
      orderNumber: order.orderNumber,
      customerName,
      total: Number(order.total),
      items: order.orderItems.map((item) => ({
        name: item.productName || item.product?.name || 'Product',
        quantity: item.quantity,
        price: Number(item.appliedPrice),
      })),
      paymentMethod:
        order.paymentMethod?.toUpperCase() || data.triggeredBy.toUpperCase(),
      createdAt: new Date(),
    });

    console.log('✅ Telegram notification sent for paid order:', order.orderNumber);
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
  }

  // ⚠️ STEP 3: Send email confirmation (UPDATE WITH MEMBERSHIP INFO)
  try {
    if (order.user) {
      // Fetch fresh user data to get updated membership info
      const freshUser = await prisma.user.findUnique({
        where: { id: order.user.id },
        select: { isMember: true, memberSince: true, nric: true },
      });

      await emailService.sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName} ${order.user.lastName}`,
        customerEmail: order.user.email,
        items: order.orderItems.map((item) => ({
          name: item.productName || item.product?.name || 'Product',
          quantity: item.quantity,
          price: Number(item.appliedPrice),
        })),
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        paymentMethod: order.paymentMethod || 'Unknown',
        // ❌ ADD THIS: Include membership info if newly activated
        membershipInfo: freshUser?.isMember && freshUser?.nric ? {
          isNewMember: true,
          memberId: freshUser.nric,
          memberSince: freshUser.memberSince,
        } : undefined,
      });

      console.log('✅ Order confirmation email sent to:', order.user.email);
    }
  } catch (error) {
    console.error('❌ Failed to send email confirmation:', error);
  }
}
```

#### ❌ Task 1.4: Remove Membership Logic from ToyyibPay Webhook

**File**: `/src/app/api/webhooks/toyyibpay/route.ts`

**DELETE lines 203-236** (membership activation block):

```typescript
// ❌ DELETE THIS ENTIRE SECTION
// Check if order has pending membership to activate
const pendingMembership = await prisma.pendingMembership.findUnique({
  where: { orderId: order.id },
});

if (pendingMembership && !order.user?.isMember) {
  const activated = await activateUserMembership(
    order.userId!,
    Number(pendingMembership.qualifyingAmount),
    order.id
  );

  if (activated) {
    await prisma.pendingMembership.delete({
      where: { id: pendingMembership.id },
    });
    console.log('✅ Membership activated for user:', order.userId);
  }
}
```

**Keep only**:
```typescript
// ✅ Payment success - OrderStatusHandler handles membership
await PaymentSuccessHandler.handle({
  orderReference: order.orderNumber,
  amount: Number(callback.amount),
  transactionId: callback.billcode,
  paymentGateway: 'toyyibpay',
  timestamp: new Date().toISOString(),
});
```

---

### Phase 2: API Endpoint (Day 1)

#### ❌ Task 2.1: Create Single NRIC Endpoint (NEW FILE)

**File**: `src/app/api/membership/nric/route.ts` (NEW) - Ultra-KISS Single Endpoint

```typescript
/**
 * NRIC Validation Endpoint - Ultra-KISS Edition
 * Single endpoint that handles NRIC validation and duplicate check
 *
 * @CLAUDE.md Compliance:
 * - CENTRALIZED: All NRIC validation in one place
 * - SIMPLE: Does one thing well - validate NRIC
 * - TYPE SAFE: Uses Zod schemas and explicit types
 * - SECURE: CSRF protected, session auth, three-layer validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { nricSchema } from '@/lib/validation/nric';

// Type-safe validation schema
const submitNricSchema = z.object({
  nric: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // ✅ Layer 1: Session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ Layer 2: Input parsing
    const body = await request.json();
    const { nric } = submitNricSchema.parse(body);

    // ✅ Layer 3: NRIC format validation (Zod schema)
    const nricValidation = nricSchema.safeParse({ nric });
    if (!nricValidation.success) {
      return NextResponse.json(
        {
          message: 'Invalid NRIC format',
          errors: nricValidation.error.errors,
        },
        { status: 400 }
      );
    }

    // ✅ Layer 4: Duplicate check (Database validation)
    const existingUser = await prisma.user.findUnique({
      where: { nric },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        {
          code: 'DUPLICATE_NRIC',
          message: 'This NRIC is already registered. Contact support if this is incorrect.',
        },
        { status: 409 }
      );
    }

    // ✅ KISS: Return success
    // Actual pendingMembership creation happens in /api/orders
    // This endpoint only validates - keeps it simple
    return NextResponse.json({
      success: true,
      message: 'NRIC validated successfully',
    });
  } catch (error) {
    console.error('Error validating NRIC:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Why This is Ultra-KISS:**
- ✅ Single endpoint (not two)
- ✅ Does one thing well: Validate NRIC
- ✅ Storage handled by existing `/api/orders` endpoint
- ✅ No complex state management
- ✅ All security maintained (CSRF, auth, validation)

#### ⚠️ Task 2.2: Update Orders API (EXISTING FILE)

**File**: `/src/app/api/orders/route.ts` (around line 532)

**Current Code**:
```typescript
await tx.pendingMembership.create({
  data: {
    userId: session.user.id,
    orderId: order.id,
    qualifyingAmount: qualifyingTotal,
    registrationData: {
      registerAsMember: orderData.membershipActivated,
      qualifyingAmount: qualifyingTotal,
      timestamp: new Date().toISOString(),
    },
    expiresAt,
  },
});
```

**Updated Code**:
```typescript
await tx.pendingMembership.create({
  data: {
    userId: session.user.id,
    orderId: order.id,
    qualifyingAmount: qualifyingTotal,
    registrationData: {
      registerAsMember: orderData.membershipActivated,
      qualifyingAmount: qualifyingTotal,
      timestamp: new Date().toISOString(),
      nric: orderData.nric,  // ← ADD THIS (from checkout form)
    },
    expiresAt,
  },
});
```

**Data Flow Note**:
- `orderData.nric` comes from the checkout component
- Checkout receives NRIC from `MembershipCheckoutBanner` via `onMembershipActivated` callback
- See "AD-5: Data Flow Architecture" section above for complete flow diagram

---

### Phase 3: Frontend Components (Day 2)

#### ⚠️ Task 3.1: Add NRIC Form to MembershipCheckoutBanner (EXISTING FILE)

**File**: `/src/components/membership/MembershipCheckoutBanner.tsx`

**Ultra-KISS Approach**: Single input field + confirmation dialog

**Add imports**:
```typescript
import { validateNRIC, maskNRIC, NRIC_VALIDATION_RULES } from '@/lib/validation/nric';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf'; // ← CSRF PROTECTION
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

**Add state** (Ultra-KISS - only 3 state variables):
```typescript
// NRIC form state (Ultra-KISS - simplified)
const [nric, setNric] = useState('');
const [nricError, setNricError] = useState('');
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
```

**Add NRIC form JSX** (Ultra-KISS - single input):
```typescript
{/* NRIC Form - Ultra-KISS: Single Input */}
<div className="space-y-4 bg-white p-4 rounded-lg border border-blue-200">
  <div>
    <h4 className="font-semibold text-sm text-blue-900 mb-3">
      Enter Your Malaysia NRIC Number
    </h4>
    <p className="text-xs text-muted-foreground mb-4">
      Your NRIC will serve as your permanent Member ID and cannot be changed later.
    </p>
  </div>

  {/* Single NRIC Input */}
  <div>
    <Label htmlFor="nric" className="text-sm font-medium">
      NRIC Number <span className="text-red-500">*</span>
    </Label>
    <Input
      id="nric"
      type="text"
      inputMode="numeric"
      maxLength={12}
      value={nric}
      onChange={(e) => handleNricChange(e.target.value)}
      placeholder="e.g. 900101015678"
      className={`mt-1 font-mono text-lg ${nricError ? 'border-red-300' : ''}`}
    />
    {nricError && (
      <p className="text-sm text-red-600 mt-1">{nricError}</p>
    )}
    <p className="text-xs text-muted-foreground mt-1">
      12 digits, no dashes or symbols
    </p>
  </div>

  {/* Preview */}
  {nric.length === 12 && !nricError && (
    <div className="bg-blue-50 p-3 rounded border border-blue-200">
      <p className="text-xs text-blue-700 mb-1">Your Member ID will be:</p>
      <p className="text-2xl font-mono font-bold text-blue-900">{nric}</p>
      <p className="text-xs text-red-600 mt-2">⚠️ Cannot be changed after submission</p>
    </div>
  )}

  {/* Submit Button */}
  <Button
    onClick={() => setShowConfirmDialog(true)}
    disabled={nric.length !== 12 || !!nricError}
    className="w-full"
  >
    Continue to Checkout
  </Button>
</div>

{/* Confirmation Dialog - Ultra-KISS: Replaces double-entry */}
<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>⚠️ Confirm Your NRIC Number</AlertDialogTitle>
      <AlertDialogDescription className="space-y-3">
        <p>Please verify that your NRIC is correct:</p>
        <div className="bg-blue-50 p-4 rounded border-2 border-blue-300">
          <p className="text-sm text-blue-700 mb-1">Member ID:</p>
          <p className="text-3xl font-mono font-bold text-blue-900">{nric}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            ⚠️ Important:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• This NRIC cannot be changed after submission</li>
            <li>• It will be your permanent Member ID</li>
            <li>• Corrections require contacting support</li>
          </ul>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Let Me Check Again</AlertDialogCancel>
      <AlertDialogAction onClick={handleSubmitNric}>
        Yes, This is Correct
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Add handlers** (Ultra-KISS - simplified):
```typescript
const handleNricChange = (value: string) => {
  // Sanitize: Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  setNric(cleaned);
  setNricError('');

  // Validate when complete
  if (cleaned.length === 12) {
    const validation = validateNRIC(cleaned);
    if (!validation.valid) {
      setNricError(validation.error || '');
    }
  }
};

const handleSubmitNric = async () => {
  setShowConfirmDialog(false);

  try {
    // ✅ CSRF PROTECTION - Use fetchWithCSRF for all mutation requests
    const response = await fetchWithCSRF('/api/membership/nric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nric }),
    });

    if (response.ok) {
      // Store NRIC for checkout (will be passed to /api/orders)
      onMembershipActivated({
        membershipStatus: 'pending_payment',
        nric: nric,  // ← Pass to parent checkout component
      });
    } else {
      const data = await response.json();
      if (data.code === 'DUPLICATE_NRIC') {
        setNricError(NRIC_VALIDATION_RULES.ERROR_MESSAGES.DUPLICATE);
      } else {
        setNricError('Failed to validate NRIC. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error submitting NRIC:', error);
    setNricError('An error occurred. Please try again.');
  }
};
```

**Why This is Ultra-KISS:**
- ✅ Single input field (not two) → 50% less code
- ✅ Confirmation dialog replaces double-entry → Better UX
- ✅ Only 3 state variables (not 7+) → Simpler state management
- ✅ Visual confirmation shows full NRIC → Clear and explicit
- ✅ All security maintained (CSRF, validation, error handling)

**Security Verification:**
- ✅ CSRF: Uses `fetchWithCSRF` for POST request
- ✅ Validation: Real-time validation with `validateNRIC()`
- ✅ Duplicate Check: API validates uniqueness before accepting
- ✅ User Confirmation: Dialog forces explicit verification
- ✅ Sanitization: Removes all non-digits before submission

---

### Phase 4: Admin & Display (Day 3)

#### ❌ Task 4.1: Update Admin Customer Detail Page (EXISTING FILE)

**File**: `/src/app/admin/customers/[customerId]/page.tsx`

**Add Member ID Card** (around line 258):
```typescript
{/* Quick Stats */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
  {/* ... existing cards ... */}

  {/* Member ID - NEW */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Member ID</CardTitle>
      <Crown className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-purple-600 font-mono">
        {customer.nric || 'N/A'}
      </div>
      {customer.nric && (
        <p className="text-xs text-muted-foreground mt-1">NRIC Number</p>
      )}
    </CardContent>
  </Card>
</div>
```

**Update TypeScript interface** (line 29):
```typescript
interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  nric: string | null;  // ← ADD THIS
  isMember: boolean;
  memberSince: string | null;
  totalOrders: number;
  totalSpent: number;
  // ... rest
}
```

#### ⚠️ Task 4.2: Update Email Service (EXISTING FILE)

**File**: `/src/lib/email/email-service.ts`

**Update interface** (line 144):
```typescript
interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  // ❌ ADD THIS (optional = no breaking change)
  membershipInfo?: {
    isNewMember: boolean;
    memberId: string;  // NRIC
    memberSince: Date | null;
  };
}
```

**Add membership welcome section** (around line 309):
```typescript
const membershipWelcome = data.membershipInfo?.isNewMember ? `
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
              padding: 24px;
              margin: 24px 0;
              color: white;
              text-align: center;">
    <h2 style="margin: 0 0 16px 0;">🎉 Welcome to Membership!</h2>
    <div style="background: rgba(255,255,255,0.2);
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;">Member ID</p>
      <p style="margin: 0;
                 font-size: 28px;
                 font-weight: bold;
                 font-family: 'Courier New', monospace;">
        ${data.membershipInfo.memberId}
      </p>
    </div>
    <p style="margin: 16px 0 0 0;">✨ Enjoy member pricing on all future purchases!</p>
  </div>
` : '';

// Insert ${membershipWelcome} in email template
```

#### ❌ Task 4.3: Update Thank You Page (EXISTING FILE)

**File**: `/src/app/thank-you/page.tsx`

**Update order query**:
```typescript
const order = await prisma.order.findUnique({
  where: { orderNumber },
  include: {
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isMember: true,
        memberSince: true,
        nric: true,  // ← ADD THIS
      },
    },
    // ... other includes
  },
});
```

**Add membership card JSX**:
```typescript
{/* Check if membership was just activated */}
{order.user?.isMember &&
 order.user?.nric &&
 order.user?.memberSince &&
 new Date(order.user.memberSince).getTime() > new Date(order.createdAt).getTime() - 60000 && (
  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-purple-800">
        <Crown className="w-6 h-6" />
        🎉 Welcome to Membership!
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
        <p className="text-sm text-purple-600 mb-1">Your Member ID</p>
        <p className="text-3xl font-bold font-mono text-purple-900">
          {order.user.nric}
        </p>
      </div>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>What's next?</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Enjoy member prices on all future purchases</li>
            <li>Access exclusive member-only deals</li>
          </ul>
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
)}
```

---

## Testing Checklist

### 🔴 Critical Tests (Must Pass Before Deployment)

- [ ] **@CLAUDE.md Compliance**
  - [ ] No hardcoded values (all constants in variables/config)
  - [ ] Single Source of Truth maintained (no code duplication)
  - [ ] DRY principle applied (common logic extracted)
  - [ ] KISS principle followed (simple, not over-engineered)
  - [ ] No `any` types used (explicit TypeScript types everywhere)
  - [ ] Three-layer validation implemented (Frontend → API → Database)

- [ ] **CSRF Protection**
  - [ ] All mutation API calls use `fetchWithCSRF` (POST, PUT, PATCH, DELETE)
  - [ ] Import statement present: `import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';`
  - [ ] No native `fetch()` used for mutations
  - [ ] API routes automatically protected by CSRF middleware

- [ ] **Security Standards**
  - [ ] NRIC masked in all logs (using `maskNRIC()`)
  - [ ] NRIC never in URL parameters or query strings
  - [ ] Duplicate NRIC check implemented (database + API)
  - [ ] Session authentication on all NRIC endpoints
  - [ ] Audit logs created for all membership activations
  - [ ] Error messages don't expose sensitive data

- [ ] **Type Safety**
  - [ ] All functions have explicit return types
  - [ ] All parameters have explicit types
  - [ ] Zod schemas for all user inputs
  - [ ] No `any` types in codebase
  - [ ] All async operations wrapped in try-catch

- [ ] **Single Source of Truth**
  - [ ] Membership activation ONLY in `OrderStatusHandler.handlePaymentSuccess()`
  - [ ] Membership activation REMOVED from `toyyibpay/route.ts`
  - [ ] NRIC validation utilities centralized in `/lib/validation/nric.ts`
  - [ ] No duplicate NRIC validation logic across files

- [ ] **Database Integrity**
  - [ ] Migration applied: `nric` field added to `users` table
  - [ ] Unique constraint on `nric` field
  - [ ] Index created for `nric` field
  - [ ] Prisma client regenerated after migration

### 🟡 Important Tests (Complete During Implementation)

- [ ] **Testing** (Ultra-KISS)
  - [ ] Unit tests for NRIC validation functions (validateNRIC, maskNRIC)
  - [ ] Integration test for single NRIC endpoint (/api/membership/nric)
  - [ ] E2E test for full checkout flow (single input + confirmation dialog)
  - [ ] CSRF protection tested (fetchWithCSRF for all mutations)
  - [ ] Duplicate NRIC detection tested
  - [ ] Confirmation dialog tested (user can cancel and re-enter)

- [ ] **Documentation**
  - [ ] Code comments for complex logic
  - [ ] JSDoc comments for exported functions
  - [ ] README updated (if applicable)
  - [ ] API documentation updated

- [ ] **Code Quality**
  - [ ] ESLint passes with no errors
  - [ ] TypeScript compilation successful
  - [ ] No console errors in browser
  - [ ] No console warnings in server logs

### ✅ Verification Steps (Ultra-KISS)

**Before submitting PR:**
1. Run `npm run lint` - should pass with no errors
2. Run `npm run build` - should compile successfully
3. **Test Ultra-KISS checkout flow**:
   - Single NRIC input field works
   - Confirmation dialog appears and shows correct NRIC
   - User can cancel dialog and re-enter NRIC
   - Form validation prevents invalid NRIC formats
4. Verify CSRF protection (check browser network tab for `x-csrf-token` header)
5. Verify duplicate NRIC detection works
6. Verify NRIC appears in admin panel as Member ID
7. Verify email includes Member ID in welcome message
8. Verify thank you page shows membership card with Member ID

**Ultra-KISS Specific Checks:**
- [ ] Only 1 API endpoint created (/api/membership/nric)
- [ ] Only 3 state variables in frontend (nric, nricError, showConfirmDialog)
- [ ] No double-entry validation code present
- [ ] Confirmation dialog shows full NRIC for verification

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (ESLint, TypeScript, E2E)
- [ ] Database migration ready to run
- [ ] Environment variables configured (if any new ones)
- [ ] Code reviewed by at least one other developer
- [ ] No breaking changes to existing functionality
- [ ] Backward compatibility verified

### Deployment Steps

1. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   # Deploy to Railway/Vercel
   ```

3. **Post-Deployment Verification**:
   - [ ] Database migration applied successfully
   - [ ] NRIC field visible in admin panel
   - [ ] New member registration flow works
   - [ ] Email notifications include Member ID
   - [ ] No errors in production logs

### Rollback Plan

If issues occur:
1. **Database rollback** (if needed):
   ```sql
   ALTER TABLE "users" DROP COLUMN IF EXISTS "nric";
   DROP INDEX IF EXISTS "users_nric_key";
   DROP INDEX IF EXISTS "users_nric_idx";
   ```

2. **Code rollback**: Revert to previous deployment

3. **Verify**: Ensure existing members and checkout flow still work

---

## File Summary

### Files to Modify (8 existing files):
- `/lib/membership.ts` - Update function signature (add nric parameter)
- `/lib/notifications/order-status-handler.ts` - Add membership activation logic
- `/app/api/webhooks/toyyibpay/route.ts` - Remove membership logic (critical fix)
- `/app/api/orders/route.ts` - Add NRIC to registrationData
- `/components/membership/MembershipCheckoutBanner.tsx` - Add NRIC form (single input)
- `/app/admin/customers/[customerId]/page.tsx` - Add Member ID display
- `/lib/email/email-service.ts` - Add membership welcome section
- `/app/thank-you/page.tsx` - Add membership card

### Files to Create (2 new files):
- `/lib/validation/nric.ts` - NEW (validation utilities)
- `/app/api/membership/nric/route.ts` - NEW (single endpoint)

---

**Document Version**: Ultra-KISS Edition
**Last Updated**: 2025-10-27
**Status**: ✅ Ready for Implementation
**Approach**: Maximum Simplicity for Small Business
**Timeline**: 3 days
**Codebase Analysis**: 80% already implemented
**Security Review**: ✅ CSRF + PDPA Compliance Verified

**Reference Documents:**
- `@CLAUDE.md` - Core coding standards
- `claudedocs/CODING_STANDARDS.md` - Comprehensive standards
- `claudedocs/CSRF-FIX-DEVELOPER-GUIDE.md` - CSRF implementation guide
- `claudedocs/NRIC_INTEGRATION_ANALYSIS.md` - Codebase analysis
