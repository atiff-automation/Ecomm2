# CSRF Protection Testing Guide

## Quick Manual Testing (Browser DevTools)

### 1. Test Valid Requests (Should Work)

**Test Form Submission:**
1. Open browser DevTools (F12) → Network tab
2. Visit any published click page with a form
3. Fill out and submit the form
4. Check Network tab:
   - Request should have `x-csrf-token` header
   - Response should be 200 OK
   - Form should show success message

**Test Admin Operations:**
1. Login to admin panel
2. Go to `/admin/click-pages`
3. Try these operations:
   - Create new click page
   - Edit existing click page
   - Delete a click page
   - Delete a form submission
4. All should work normally with success toasts

### 2. Test CSRF Protection (Should Fail)

**Test Without CSRF Token:**
Open browser console and run:

```javascript
// Test 1: Try to delete click page without CSRF token
fetch('/api/admin/click-pages/YOUR_CLICK_PAGE_ID', {
  method: 'DELETE',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
// Expected: { error: 'CSRF token missing or invalid' }, status 403

// Test 2: Try to submit form without CSRF token
fetch('/api/public/click-pages/YOUR_SLUG/forms/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blockId: 'test-block',
    data: { name: 'Test' }
  }),
  credentials: 'include'
}).then(r => r.json()).then(console.log)
// Expected: { error: 'CSRF token missing or invalid' }, status 403

// Test 3: Try to delete submissions without CSRF token
fetch('/api/admin/click-pages/YOUR_CLICK_PAGE_ID/submissions', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionIds: ['test-id'] }),
  credentials: 'include'
}).then(r => r.json()).then(console.log)
// Expected: { error: 'CSRF token missing or invalid' }, status 403
```

## Automated Testing Script

Run this test script to verify all protected endpoints:

```bash
# Save this as test-csrf.sh and run: bash test-csrf.sh
```

## What to Verify

### ✅ Protection Working:
- [ ] Requests without CSRF token return 403 Forbidden
- [ ] Error message: "CSRF token missing or invalid"
- [ ] No data is modified when CSRF token is missing

### ✅ Valid Requests Working:
- [ ] Create click page works
- [ ] Update click page works
- [ ] Delete click page works
- [ ] Form submissions work on public pages
- [ ] Click tracking works
- [ ] Conversion tracking works
- [ ] Delete submissions works
- [ ] All operations show success messages

### ✅ CSRF Token Present:
- [ ] Check Network tab → Headers → `x-csrf-token` is present
- [ ] Token changes between requests
- [ ] Token is included automatically via `fetchWithCSRF()`

## Testing Each Protected Route

### Admin Routes:
1. **POST /api/admin/click-pages** - Create click page
   - Go to `/admin/click-pages/create`
   - Fill form and save
   - Check: Success + redirects to list

2. **PUT /api/admin/click-pages/[id]** - Update click page
   - Go to `/admin/click-pages/[id]/edit`
   - Make changes and save
   - Check: Success message + changes saved

3. **DELETE /api/admin/click-pages/[id]** - Delete click page
   - Go to `/admin/click-pages`
   - Click "Delete" on any page
   - Check: Confirmation + deletion + success toast

4. **DELETE /api/admin/click-pages/[id]/submissions** - Delete submission
   - Go to `/admin/click-pages/[id]/submissions`
   - Click delete on any submission
   - Check: Confirmation + deletion + refresh

### Public Routes:
5. **POST /api/public/click-pages/[slug]/forms/submit** - Form submission
   - Visit `/click/[slug]` with a form
   - Fill and submit form
   - Check: Success message + redirect (if configured)

6. **POST /api/public/click-pages/[slug]/track/click** - Click tracking
   - Visit `/click/[slug]` with CTA buttons
   - Click any CTA button
   - Check: Click count increments

7. **POST /api/public/click-pages/[slug]/track/conversion** - Conversion tracking
   - Complete a purchase after visiting click page
   - Check: Conversion count increments

## Common Issues & Solutions

### Issue: "CSRF token missing or invalid" on valid requests
**Solution:** Check that `fetchWithCSRF` is used instead of `fetch()`

### Issue: CSRF token not in headers
**Solution:** Verify import: `import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf'`

### Issue: 403 on all requests
**Solution:** Check session is valid, try logout/login

### Issue: Tests pass but forms still don't work
**Solution:** Clear cookies, restart dev server, hard refresh browser (Cmd+Shift+R)

## Quick Verification Checklist

```bash
# 1. Start dev server
npm run dev

# 2. Login to admin
open http://localhost:3000/admin/login

# 3. Test create (should work)
# Go to /admin/click-pages/create → Fill form → Save

# 4. Test delete (should work)
# Go to /admin/click-pages → Click delete on any page

# 5. Test form submission (should work)
# Visit any published click page → Submit form

# 6. Test without CSRF token (should FAIL)
# Open console → Run fetch without fetchWithCSRF → Should get 403
```

## Expected Behavior Summary

| Endpoint | Method | With CSRF Token | Without CSRF Token |
|----------|--------|----------------|-------------------|
| `/api/admin/click-pages` | POST | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/admin/click-pages/[id]` | PUT | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/admin/click-pages/[id]` | DELETE | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/admin/click-pages/[id]/submissions` | DELETE | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/public/click-pages/[slug]/forms/submit` | POST | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/public/click-pages/[slug]/track/click` | POST | ✅ 200 OK | ❌ 403 Forbidden |
| `/api/public/click-pages/[slug]/track/conversion` | POST | ✅ 200 OK | ❌ 403 Forbidden |
