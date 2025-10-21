# CSRF Protection Fix - Complete Developer Guide

**Status**: Product routes fixed ✅ | Remaining routes: ~70+ files need migration

**Last Updated**: January 2025

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [What We Fixed](#what-we-fixed)
3. [Remaining Work](#remaining-work)
4. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)
7. [Completion Checklist](#completion-checklist)

---

## Problem Summary

### The Root Cause (FIXED ✅)

**Issue #1**: CSRF middleware was consuming request body
- **File**: `/src/lib/security/csrf-protection.ts:164-173`
- **Problem**: Middleware called `request.json()` to extract CSRF token from body
- **Impact**: Body stream consumed, route handlers couldn't read request data
- **Result**: `500 Internal Server Error` on ALL protected endpoints

**Issue #2**: Frontend missing CSRF token headers
- **Files**: 77+ components with manual `fetch()` calls
- **Problem**: Components weren't sending CSRF tokens in headers
- **Impact**: Requests rejected with `403 Forbidden`

### The Fix Applied

1. ✅ **Backend Fix** (CRITICAL - Already Done)
   - Removed body token extraction from CSRF middleware
   - Token now extracted ONLY from header
   - File: `/src/lib/security/csrf-protection.ts:160-163`

2. ✅ **Frontend Infrastructure** (Already Done)
   - Created CSRF token endpoint: `/api/csrf-token`
   - Created hook: `/src/hooks/use-csrf-token.ts`
   - Created fetch wrapper: `/src/lib/utils/fetch-with-csrf.ts`
   - Updated APIClient with auto-injection

3. 🔄 **Frontend Migration** (PARTIAL - Product routes done)
   - Migrated: Product create, edit, delete (3 files)
   - **Remaining**: ~70+ files with mutation requests

---

## What We Fixed

### Files Successfully Migrated ✅

#### 1. Product Edit Page
**File**: `/src/app/admin/products/[id]/edit/page.tsx`

**Before**:
```typescript
import { toast } from 'sonner';

const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(processedFormData),
});
```

**After**:
```typescript
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

const response = await fetchWithCSRF(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(processedFormData),
});
```

**Changes**:
- ✅ Added import: `import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';`
- ✅ Replaced `fetch()` with `fetchWithCSRF()` for PUT request (line 182)
- ✅ Replaced `fetch()` with `fetchWithCSRF()` for DELETE request (line 197)

#### 2. Product Create Page
**File**: `/src/app/admin/products/create/page.tsx`

**Changes**:
- ✅ Added import: `import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';`
- ✅ Replaced `fetch()` with `fetchWithCSRF()` for POST request (line 94)

#### 3. Product Form Component
**File**: `/src/components/admin/ProductForm.tsx`

**Changes**:
- ✅ Added import: `import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';`
- ✅ Replaced `fetch()` with `fetchWithCSRF()` for POST/PUT request (line 376)

### Result
- ✅ Product creation works
- ✅ Product updates work
- ✅ Product deletion works
- ✅ No 403 or 500 errors
- ✅ CSRF protection active and validated

---

## Remaining Work

### Files Requiring Migration

Based on grep search, **73+ files** still need migration:

#### Priority 1: Admin Routes (18 files)
**Impact**: Core admin functionality broken

1. `/src/app/admin/customers/[customerId]/page.tsx` - Customer delete
2. `/src/app/admin/customers/[customerId]/edit/page.tsx` - Customer update
3. `/src/app/admin/customers/page.tsx` - Customer operations
4. `/src/app/admin/orders/[orderId]/page.tsx` - Order update/cancel
5. `/src/app/admin/orders/page.tsx` - Order operations
6. `/src/app/admin/discount-codes/create/page.tsx` - Discount creation
7. `/src/app/admin/discount-codes/page.tsx` - Discount operations
8. `/src/app/admin/categories/page.tsx` - Category CRUD
9. `/src/app/admin/settings/business-profile/page.tsx` - Business profile update
10. `/src/app/admin/settings/site-customization/page.tsx` - Site settings
11. `/src/app/admin/settings/tax-configuration/page.tsx` - Tax settings
12. `/src/app/admin/settings/preferences/page.tsx` - Admin preferences
13. `/src/app/admin/chat-config/page.tsx` - Chat configuration
14. `/src/app/admin/membership/config/page.tsx` - Membership config
15. `/src/app/admin/payments/toyyibpay/page.tsx` - Payment config
16. `/src/app/admin/shipping-settings/page.tsx` - Shipping config
17. `/src/app/admin/agent-applications/[id]/page.tsx` - Application actions
18. `/src/components/admin/orders/OrderTable.tsx` - Bulk order updates

#### Priority 2: User Settings (7 files)
**Impact**: Customer settings broken

1. `/src/app/settings/account/page.tsx` - Account updates
2. `/src/app/settings/preferences/page.tsx` - User preferences
3. `/src/app/settings/account/addresses/page.tsx` - Address management
4. `/src/app/settings/privacy/page.tsx` - Privacy settings
5. `/src/app/member/profile/page.tsx` - Member profile
6. `/src/app/member/addresses/page.tsx` - Member addresses
7. `/src/app/member/notifications/page.tsx` - Notification settings

#### Priority 3: Auth Routes (3 files)
**Impact**: Registration and password reset broken

1. `/src/app/auth/signup/page.tsx` - User registration
2. `/src/app/auth/forgot-password/page.tsx` - Password reset request ✅ Already protected
3. `/src/app/auth/reset-password/[token]/page.tsx` - Password reset ✅ Already protected

#### Priority 4: SuperAdmin Routes (2 files)
**Impact**: SuperAdmin operations broken

1. `/src/app/superadmin/page.tsx` - SuperAdmin dashboard actions
2. `/src/app/superadmin/settings/admins/page.tsx` - Admin user management

#### Priority 5: Components (30+ files)
**Impact**: Shared components used across pages

1. `/src/components/admin/telegram/SimpleTelegramConfig.tsx`
2. `/src/components/admin/agent-applications/StatusUpdateDialog.tsx`
3. `/src/components/admin/agent-applications/ApplicationDetail.tsx`
4. `/src/components/admin/SlideManager.tsx`
5. `/src/components/admin/HeroSliderSection.tsx`
6. `/src/components/admin/FulfillmentWidget.tsx`
7. `/src/components/admin/ManualPaymentConfirmation.tsx`
8. `/src/components/settings/receipt-templates/*.tsx` (6 files)
9. `/src/components/forms/agent-application/AgentApplicationForm.tsx`
10. `/src/components/checkout/ShippingSelector.tsx`
11. `/src/components/wishlist/WishlistButton.tsx`
12. `/src/components/membership/MembershipCheckoutBanner.tsx`
13. `/src/components/membership/MembershipRegistrationModal.tsx`
14. `/src/components/discounts/DiscountCodeInput.tsx`
15. + 15 more component files

#### Priority 6: Lower Priority (15+ files)
**Impact**: Non-critical or development pages

- `/src/app/checkout/page.tsx`
- `/src/app/member/orders/[orderId]/page.tsx`
- `/src/app/member/wishlist/page.tsx`
- `/src/app/member/referrals/page.tsx`
- `/src/app/compare/page.tsx`
- `/src/app/wishlist/page.tsx`
- + Development/test pages

---

## Step-by-Step Migration Guide

### Prerequisites

1. Ensure dev server is running: `npm run dev`
2. Have browser DevTools open (Network tab)
3. Have access to the admin panel for testing

### Migration Process (Per File)

#### Step 1: Identify Mutation Requests

**Search for mutation fetch calls in the file:**

```bash
# Find all fetch calls with mutation methods
grep -n "method.*POST\|method.*PUT\|method.*DELETE\|method.*PATCH" <file-path>
```

**Example output:**
```
93:      method: 'POST',
181:      method: 'PUT',
```

#### Step 2: Add Import Statement

**At the top of the file**, add the import (after existing imports):

```typescript
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
```

**Placement**:
- After React imports
- After Next.js imports
- Before component-specific imports
- Group with other utility imports

**Example**:
```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf'; // ← Add here

import { ProductForm } from '@/components/admin/ProductForm';
```

#### Step 3: Replace fetch() Calls

**For each mutation request**, replace `fetch()` with `fetchWithCSRF()`:

**Pattern to find**:
```typescript
const response = await fetch('/api/some/endpoint', {
  method: 'POST',  // or PUT, DELETE, PATCH
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

**Replace with**:
```typescript
const response = await fetchWithCSRF('/api/some/endpoint', {
  method: 'POST',  // or PUT, DELETE, PATCH
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

**IMPORTANT**:
- ✅ Replace ONLY mutation requests (POST, PUT, DELETE, PATCH)
- ❌ DO NOT replace GET requests
- ✅ Keep all other parameters unchanged
- ✅ Keep headers, body, and other options as-is

#### Step 4: Handle Multiple Mutations

If a file has multiple mutation requests, replace ALL of them:

```typescript
// Example: File with create AND delete
const handleCreate = async () => {
  const response = await fetchWithCSRF('/api/admin/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

const handleDelete = async (id: string) => {
  const response = await fetchWithCSRF(`/api/admin/items/${id}`, {
    method: 'DELETE',
  });
};
```

#### Step 5: Verify Syntax

**Check for common mistakes**:

1. ✅ Import added at top
2. ✅ All mutation `fetch()` replaced with `fetchWithCSRF()`
3. ✅ GET requests still use regular `fetch()` (or leave as-is)
4. ✅ No syntax errors (missing commas, brackets, etc.)

**Run TypeScript check**:
```bash
npx tsc --noEmit | grep "<filename>"
```

#### Step 6: Test the Changes

1. **Reload the page** in browser (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
2. **Perform the action** (create, update, or delete)
3. **Check Network tab**:
   - Request should have header: `x-csrf-token: <token>`
   - Response should be `200 OK` (not 403 or 500)
4. **Verify functionality**: Ensure the action completes successfully

**Expected Network Request Headers**:
```
x-csrf-token: a1b2c3d4e5f6...
Content-Type: application/json
```

---

## Systematic Migration Workflow

### Approach A: Priority-Based (Recommended)

Migrate files in priority order to restore critical functionality first.

**Week 1**: Priority 1 (Admin Routes - 18 files)
- Day 1: Customer management (3 files)
- Day 2: Order management (2 files)
- Day 3: Settings pages (6 files)
- Day 4: Other admin pages (7 files)
- Day 5: Testing and fixes

**Week 2**: Priority 2 & 3 (User Settings + Auth - 10 files)
- Day 1-2: User settings (7 files)
- Day 3: Auth routes (3 files)
- Day 4-5: Testing

**Week 3**: Priority 4 & 5 (SuperAdmin + Components - 32+ files)
- Use bulk migration tools if comfortable

### Approach B: Bulk Migration with morphllm MCP

For experienced developers comfortable with bulk operations:

```bash
# Use morphllm MCP server to replace fetch with fetchWithCSRF
# Pattern: Replace 'fetch(' with 'fetchWithCSRF(' in mutation requests
# Then manually add imports to each file
```

**Warning**: Bulk operations require careful review. Test thoroughly.

---

## Verification & Testing

### File-Level Verification

**After migrating each file**, verify:

1. **TypeScript compiles**:
   ```bash
   npx tsc --noEmit | grep "<filename>"
   ```
   - Should show zero errors related to your changes

2. **Import exists**:
   ```bash
   grep "fetchWithCSRF" <file-path>
   ```
   - Should show: Import statement + usage

3. **All mutations replaced**:
   ```bash
   grep -n "fetch(" <file-path> | grep -E "POST|PUT|DELETE|PATCH"
   ```
   - Should show zero results (all replaced)

### Route-Level Testing

**For each migrated route**, perform end-to-end test:

1. **Navigate to the page** in browser
2. **Open DevTools** → Network tab
3. **Perform mutation action** (create/update/delete)
4. **Verify in Network tab**:
   - Request has `x-csrf-token` header
   - Response is 200 OK
   - Data saved correctly
5. **Verify in UI**:
   - Success toast shown
   - Data refreshed
   - No error messages

### Database Verification

For critical operations, verify data persistence:

```bash
# Example: Verify product was updated
npx prisma studio
# Navigate to Product table
# Confirm changes are saved
```

---

## Common Issues & Solutions

### Issue 1: "CSRF validation failed" (403 Error)

**Symptoms**:
- Request returns 403 Forbidden
- Error message: "CSRF validation failed"

**Causes**:
1. Forgot to replace `fetch()` with `fetchWithCSRF()`
2. Import statement missing
3. Token expired (rare - auto-refreshes)

**Solution**:
```typescript
// ✅ Ensure you have:
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

// ✅ And using it:
const response = await fetchWithCSRF('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### Issue 2: "Body is unusable" (500 Error)

**Symptoms**:
- Request returns 500 Internal Server Error
- Error: "Body has already been read"

**Cause**: This was the original bug, already fixed in CSRF middleware

**Solution**: Should not occur after the backend fix. If it does:
1. Verify `/src/lib/security/csrf-protection.ts:160-163` has the fix
2. Restart dev server
3. Clear browser cache

### Issue 3: TypeScript Error "Cannot find module"

**Symptoms**:
```
Cannot find module '@/lib/utils/fetch-with-csrf'
```

**Solution**:
1. Verify file exists: `/src/lib/utils/fetch-with-csrf.ts`
2. Check import path is correct: `@/lib/utils/fetch-with-csrf`
3. Restart TypeScript server in VSCode (Cmd+Shift+P → "Restart TS Server")

### Issue 4: GET Requests Also Replaced

**Symptoms**:
- Unnecessary CSRF tokens sent with GET requests
- Performance overhead

**Solution**:
```typescript
// ❌ Don't replace GET requests:
const response = await fetch('/api/products'); // Keep as-is

// ✅ Only replace mutations:
const response = await fetchWithCSRF('/api/products', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### Issue 5: Token Not Found in Headers

**Symptoms**:
- Network tab shows no `x-csrf-token` header
- Getting 403 errors

**Causes**:
1. Dev server not restarted after infrastructure changes
2. Browser cached old code

**Solution**:
1. Restart dev server: `npm run dev`
2. Hard refresh browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
3. Clear browser cache
4. Check `/api/csrf-token` endpoint responds

---

## Testing Checklist

### Pre-Migration Testing

- [ ] Dev server running: `npm run dev`
- [ ] Can access admin panel
- [ ] Can view product pages
- [ ] Note current behavior (403 or 500 errors expected on unmigrated routes)

### Post-Migration Testing (Per File)

- [ ] File syntax correct (no red underlines in IDE)
- [ ] TypeScript compiles: `npx tsc --noEmit | grep "<filename>"`
- [ ] Import statement added
- [ ] All mutation `fetch()` calls replaced
- [ ] GET requests NOT replaced
- [ ] Page loads without errors
- [ ] Can perform create operation (if applicable)
- [ ] Can perform update operation (if applicable)
- [ ] Can perform delete operation (if applicable)
- [ ] Network tab shows `x-csrf-token` header
- [ ] Response is 200 OK (not 403 or 500)
- [ ] Data persists correctly in database
- [ ] Success toast/message shown
- [ ] UI updates correctly

### Integration Testing

After migrating a full section (e.g., all product routes):

- [ ] Test full CRUD workflow
- [ ] Test with different user roles (if applicable)
- [ ] Test error scenarios (invalid data, etc.)
- [ ] Test concurrent operations
- [ ] Verify no console errors
- [ ] Verify no network errors

---

## Completion Checklist

### Infrastructure (Already Complete ✅)

- [x] CSRF middleware fixed (body consumption removed)
- [x] CSRF token endpoint created (`/api/csrf-token`)
- [x] CSRF hook created (`use-csrf-token.ts`)
- [x] CSRF fetch wrapper created (`fetch-with-csrf.ts`)
- [x] APIClient auto-injection implemented

### Frontend Migration Progress

#### Admin Routes
- [x] Products - Create ✅
- [x] Products - Edit ✅
- [x] Products - Delete ✅
- [ ] Customers - Create
- [ ] Customers - Edit
- [ ] Customers - Delete
- [ ] Orders - Update
- [ ] Orders - Cancel
- [ ] Orders - Bulk Update
- [ ] Discount Codes - Create
- [ ] Discount Codes - Update
- [ ] Discount Codes - Delete
- [ ] Categories - CRUD
- [ ] Business Profile - Update
- [ ] Site Customization - Update
- [ ] Tax Configuration - Update
- [ ] Admin Preferences - Update
- [ ] Chat Config - Update
- [ ] Membership Config - Update
- [ ] Payment Config - Update
- [ ] Shipping Config - Update
- [ ] Agent Applications - Actions

#### User Settings Routes
- [ ] Account - Update
- [ ] Preferences - Update
- [ ] Addresses - Create/Update/Delete
- [ ] Privacy - Update
- [ ] Member Profile - Update
- [ ] Member Addresses - Create/Update/Delete
- [ ] Notifications - Update

#### Auth Routes
- [x] Forgot Password ✅
- [x] Reset Password ✅
- [ ] Signup/Registration

#### SuperAdmin Routes
- [ ] Dashboard Actions
- [ ] Admin User Management

#### Components
- [ ] Telegram Config
- [ ] Order Table
- [ ] Agent Application Forms
- [ ] Receipt Templates
- [ ] Checkout Components
- [ ] Wishlist Components
- [ ] Membership Components
- [ ] Discount Components
- [ ] Other shared components

### Final Verification

- [ ] All Priority 1 routes migrated and tested
- [ ] All Priority 2 routes migrated and tested
- [ ] All Priority 3 routes migrated and tested
- [ ] All Priority 4 routes migrated and tested
- [ ] All components migrated and tested
- [ ] Full regression testing completed
- [ ] No 403 errors on protected routes
- [ ] No 500 errors on protected routes
- [ ] All CRUD operations working
- [ ] Database persistence verified
- [ ] Documentation updated

---

## Quick Reference

### The Migration Pattern

```typescript
// 1. Add import at top
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

// 2. Replace fetch() with fetchWithCSRF() for mutations
// BEFORE:
await fetch('/api/endpoint', { method: 'POST', ... })

// AFTER:
await fetchWithCSRF('/api/endpoint', { method: 'POST', ... })
```

### Search Commands

```bash
# Find files with mutation fetch calls
grep -r "method.*POST\|method.*PUT\|method.*DELETE" src/app src/components

# Find files that import fetchWithCSRF (already migrated)
grep -r "fetchWithCSRF" src/app src/components

# Check specific file for mutations
grep -n "fetch(" <file-path> | grep -E "POST|PUT|DELETE|PATCH"
```

### Testing Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build check
npm run build

# Type check specific file
npx tsc --noEmit | grep "<filename>"
```

---

## Progress Tracking

Use this section to track migration progress:

**Date Started**: _______________

**Current Status**:
- [ ] Priority 1: Admin Routes (0/18 complete)
- [ ] Priority 2: User Settings (0/7 complete)
- [ ] Priority 3: Auth Routes (2/3 complete) ✅ Forgot/Reset done
- [ ] Priority 4: SuperAdmin Routes (0/2 complete)
- [ ] Priority 5: Components (3/30+ complete) ✅ ProductForm done
- [ ] Priority 6: Lower Priority (0/15+ complete)

**Total Progress**: 5/77+ files (6.5%)

**Estimated Time Remaining**: ~40-60 hours (at 30-45 min per file)

---

## Support & Questions

If you encounter issues not covered in this guide:

1. Check `/claudedocs/CSRF-MIGRATION-PLAN.md` for detailed analysis
2. Review `/src/lib/security/csrf-protection.ts` for middleware logic
3. Review `/src/lib/utils/fetch-with-csrf.ts` for wrapper implementation
4. Test with product routes (known working examples)
5. Check browser Network tab for actual request/response
6. Verify dev server restarted after infrastructure changes

---

**Last Updated**: January 2025
**Guide Version**: 1.0
**Status**: Ready for systematic migration
