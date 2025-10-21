# CSRF Frontend Migration Plan

## Status: Infrastructure Complete ✅

**Completed**:
- ✅ CSRF token API endpoint (`/api/csrf-token`)
- ✅ Frontend CSRF hook (`useCsrfToken`)
- ✅ APIClient auto-injection (automatic for APIClient users)
- ✅ Utility wrappers (`fetchWithCSRF`, `fetchJSON`, `fetchFormData`)

## Critical Files Requiring Immediate Migration

**Total files with manual fetch()**: 97 files
**CSRF-protected backend routes**: 32 routes (currently failing)

### Priority 1: CRITICAL (Must fix first - 20 files)

These files make requests to CSRF-protected routes and are currently failing:

#### Admin Product Operations (4 files)
1. `/src/app/admin/products/create/page.tsx` - Product creation
2. `/src/app/admin/products/[id]/edit/page.tsx` - Product updates
3. `/src/app/admin/products/page.tsx` - Product deletion
4. `/src/components/admin/ProductForm.tsx` - Shared product form

#### Admin Order Operations (2 files)
5. `/src/app/admin/orders/[orderId]/page.tsx` - Order updates/cancellation
6. `/src/components/admin/orders/OrderTable.tsx` - Bulk order updates

#### Admin Customer Operations (2 files)
7. `/src/app/admin/customers/[customerId]/page.tsx` - Customer deletion
8. `/src/app/admin/customers/[customerId]/edit/page.tsx` - Customer updates

#### Admin Discount Codes (2 files)
9. `/src/app/admin/discount-codes/create/page.tsx` - Discount creation
10. `/src/app/admin/discount-codes/page.tsx` - Discount deletion

#### Admin Settings (1 file)
11. `/src/app/admin/settings/business-profile/page.tsx` - Business profile updates

#### User Settings (4 files)
12. `/src/app/settings/account/page.tsx` - Account updates
13. `/src/app/settings/preferences/page.tsx` - Preference updates
14. `/src/app/settings/account/addresses/page.tsx` - Address management
15. `/src/app/settings/privacy/page.tsx` - Privacy settings

#### Auth Pages (3 files)
16. `/src/app/auth/signup/page.tsx` - User registration
17. `/src/app/auth/forgot-password/page.tsx` - Password reset request
18. `/src/app/auth/reset-password/[token]/page.tsx` - Password reset completion

#### SuperAdmin Pages (2 files)
19. `/src/app/superadmin/page.tsx` - SuperAdmin operations
20. `/src/app/superadmin/settings/admins/page.tsx` - Admin user management

---

### Priority 2: HIGH (Important but not CSRF-protected - 15 files)

Files that should use `fetchWithCSRF` for consistency but aren't blocking:

21. `/src/app/admin/categories/page.tsx`
22. `/src/app/admin/chat-config/page.tsx`
23. `/src/app/admin/membership/config/page.tsx`
24. `/src/app/admin/payments/toyyibpay/page.tsx`
25. `/src/app/admin/settings/preferences/page.tsx`
26. `/src/app/admin/settings/site-customization/page.tsx`
27. `/src/app/admin/settings/tax-configuration/page.tsx`
28. `/src/app/admin/shipping-settings/page.tsx`
29. `/src/app/checkout/page.tsx`
30. `/src/app/member/notifications/page.tsx`
31. `/src/app/member/profile/page.tsx`
32. `/src/app/member/addresses/page.tsx`
33. `/src/app/member/wishlist/page.tsx`
34. `/src/app/member/referrals/page.tsx`
35. `/src/components/admin/telegram/SimpleTelegramConfig.tsx`

---

### Priority 3: MEDIUM (Components - 20 files)

Shared components used across multiple pages:

36-55. Various shared components in `/src/components/`

---

### Priority 4: LOW (Test/Dev pages - 42 files)

Test pages, development utilities, and non-production code

---

## Migration Pattern

### Before:
```typescript
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### After:
```typescript
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

const response = await fetchWithCSRF('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Alternative (Type-safe):
```typescript
import { fetchJSON } from '@/lib/utils/fetch-with-csrf';

const data = await fetchJSON<Product>('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify(productData)
});
```

---

## Automated Migration Strategy

Given 97 files, manual migration is impractical. Options:

### Option A: Morphllm Bulk Migration
- Use morphllm MCP server for pattern-based replacement
- Search: `fetch\(`
- Replace: `fetchWithCSRF(`
- Add import at top of file
- Process in batches of 10-20 files

### Option B: Gradual Migration
- Fix Priority 1 (20 files) immediately - manual migration
- Provide fetchWithCSRF wrapper for gradual team adoption
- Schedule Priority 2-4 for future sprints

### Option C: Hybrid Approach
- Manually migrate Priority 1 (critical CSRF-protected routes)
- Use morphllm for Priority 2-4 (lower risk)

---

## Testing Plan

After each migration batch:

1. **Build check**: `npm run build`
2. **Type check**: `npx tsc --noEmit`
3. **Functional test**: Test the specific user flow
4. **CSRF validation**: Verify token is sent in request headers

---

## Rollback Strategy

If migration causes issues:

1. Git revert: `git revert <commit-hash>`
2. Rollback to infrastructure only (keep token endpoint + hook)
3. Fix specific files with issues
4. Re-deploy

---

## Recommendation

**Start with Priority 1** (20 critical files) using manual migration:
- Highest impact (fixes all actively failing CSRF-protected routes)
- Lower risk (manual review of each change)
- Immediate value (unblocks all admin/user operations)
- ~2-3 hours of work

Then evaluate automated migration for Priority 2-4.

---

**Status**: Ready for migration execution
**Next Step**: Migrate Priority 1 files (20 files)
