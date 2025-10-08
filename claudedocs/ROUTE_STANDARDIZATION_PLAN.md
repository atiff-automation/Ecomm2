# Route Standardization Plan

**Issue:** Inconsistent dynamic route parameter naming across codebase
**Impact:** Code confusion, maintenance issues, violates DRY principle
**Decision:** Standardize on `[orderId]` everywhere for order-related routes

---

## Current State Analysis

### Inconsistencies Found:

1. **Frontend Routes:**
   - `src/app/admin/orders/[id]/page.tsx` ❌ Uses `[id]`
   - `src/app/member/orders/[orderId]/page.tsx` ✅ Uses `[orderId]`

2. **API Routes:**
   - `src/app/api/admin/orders/[orderId]/*` ✅ Uses `[orderId]` (after fix)
   - `src/app/api/orders/[orderId]/*` ✅ Uses `[orderId]`
   - `src/app/api/member/orders/[orderId]/*` ✅ Uses `[orderId]`
   - `src/app/api/customer/orders/[id]/*` ❌ Uses `[id]`

### Why `[orderId]` is the Correct Choice:

1. **Spec Compliance:** SHIPPING_SIMPLE_IMPLEMENTATION_SPEC.md uses "orderId" consistently
2. **Explicit Naming:** More descriptive than generic `[id]`
3. **Type Safety:** Makes it clear this is an order ID, not product/user/category ID
4. **Already Majority:** Most routes already use `[orderId]`
5. **Shipping Implementation:** Our new fulfillment routes use `[orderId]`

---

## Changes Required

### Phase 1: Frontend Routes

#### Change 1: Admin Order Detail Page
**From:** `src/app/admin/orders/[id]/page.tsx`
**To:** `src/app/admin/orders/[orderId]/page.tsx`

**Impact:**
- URLs change from `/admin/orders/123` to `/admin/orders/123` (same URL structure)
- Parameter name changes from `params.id` to `params.orderId`
- Need to update all references in the file

**Files to Update:**
1. Rename folder: `src/app/admin/orders/[id]` → `src/app/admin/orders/[orderId]`
2. Update `page.tsx`: Change `params.id` to `params.orderId`
3. Search codebase for links to this route

---

### Phase 2: API Routes

#### Change 2: Customer Orders API
**From:** `src/app/api/customer/orders/[id]/*`
**To:** `src/app/api/customer/orders/[orderId]/*`

**Impact:**
- API endpoint URLs remain same structure
- Parameter access changes from `params.id` to `params.orderId`

**Files to Check:**
- `src/app/api/customer/orders/[id]/route.ts`

---

### Phase 3: Code References

#### Search and Update:
1. **API calls:** Search for `/api/admin/orders/${id}` or `/orders/${id}`
2. **Router usage:** Search for `router.push('/admin/orders/' + id)`
3. **Link components:** Search for `href={/admin/orders/${id}}`
4. **Parameter destructuring:** Search for `{ params }: { params: { id: string } }`

---

## Implementation Steps

### Step 1: Analyze Impact
```bash
# Find all order-related routes
find src/app -path "*orders/[id]*" -o -path "*orders/[orderId]*"

# Search for API calls referencing order IDs
grep -r "api.*orders.*{.*id" src/ --include="*.tsx" --include="*.ts"

# Search for router.push with order IDs
grep -r "router.push.*orders" src/ --include="*.tsx" --include="*.ts"
```

### Step 2: Rename Folders
```bash
# Admin frontend
mv src/app/admin/orders/[id] src/app/admin/orders/[orderId]

# Customer API
mv src/app/api/customer/orders/[id] src/app/api/customer/orders/[orderId]
```

### Step 3: Update Parameter References
- Update `params.id` → `params.orderId` in all affected files
- Update TypeScript types: `{ params: { id: string } }` → `{ params: { orderId: string } }`

### Step 4: Update API Calls
- Search and replace API endpoint references
- Verify no hardcoded `/orders/[id]` patterns

### Step 5: Test
- Verify dev server starts without route conflicts
- Test admin order detail page loads
- Test API endpoints respond correctly
- Check console for 404 errors

---

## Files to Modify (Detailed)

### 1. src/app/admin/orders/[id]/page.tsx → [orderId]/page.tsx

**Changes Required:**
```typescript
// BEFORE
export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
  });
}

// AFTER
export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });
}
```

### 2. Components Using Order Links

**Pattern to Find:**
```typescript
<Link href={`/admin/orders/${orderId}`}>
<Link href={`/member/orders/${orderId}`}>
router.push(`/admin/orders/${orderId}`)
```

**Action:** Verify these use `orderId` variable name consistently

---

## Verification Checklist

- [ ] All order route folders use `[orderId]`
- [ ] No route conflicts (dev server starts)
- [ ] Admin order detail page accessible
- [ ] Member order detail page accessible
- [ ] API endpoints respond with correct data
- [ ] FulfillmentWidget displays correctly
- [ ] No 404 errors in browser console
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

---

## Rollback Plan

If issues occur:
```bash
# Restore original structure
git checkout src/app/admin/orders/[id]
git checkout src/app/api/customer/orders/[id]

# Restart dev server
npm run dev
```

---

## Benefits of Standardization

1. ✅ **Clarity:** Everyone knows `orderId` means order identifier
2. ✅ **Maintainability:** Easier to search and refactor
3. ✅ **Type Safety:** More explicit TypeScript types
4. ✅ **Consistency:** Follows spec and shipping implementation
5. ✅ **Best Practice:** Explicit naming over generic naming

---

**Status:** READY TO IMPLEMENT
**Estimated Time:** 30-45 minutes
**Risk Level:** LOW (mostly renaming)
**Testing Required:** HIGH (verify all order flows)
