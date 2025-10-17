# API Optimization Testing Guide

Complete testing checklist to validate all 4 phases of optimization are working correctly.

---

## Pre-Testing Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser DevTools
- **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### 3. Navigate to Network Tab
- Click on **Network** tab in DevTools
- Enable **"Preserve log"** checkbox (important!)
- Filter by **"Fetch/XHR"** to see only API calls

### 4. Open Console Tab (in second tab)
- Keep Console tab open to see optimization logs
- Look for messages like:
  - `[Optimization] API config changed, refreshing balance...`
  - `[Optimization] API config unchanged, skipping balance refresh`

---

## Phase 1 Testing: Conditional Balance Refetch

### ✅ Test 1.1: Balance Refreshes on Page Load (CRITICAL)
**Goal:** Verify balance always fetches when page loads

**Steps:**
1. Navigate to: `http://localhost:3000/admin/shipping-settings`
2. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/init` → Status 200
3. **Watch Console:**
   - No optimization messages (this is initial load)
4. **Verify UI:**
   - Balance displays correctly
   - Connection status shows "Connected to API"

**Expected:** ✅ Balance loads on page load

---

### ✅ Test 1.2: Save WITHOUT API Changes → Balance NOT Refetched
**Goal:** Verify balance doesn't refetch when only non-API settings change

**Steps:**
1. On shipping-settings page, make these changes:
   - Change **courier mode** (e.g., from "Cheapest" to "Show All")
   - OR change **free shipping threshold** (e.g., from 150 to 200)
2. Click **"Save Settings"**
3. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/settings` (POST) → Status 200
   - Should NOT see: `/api/admin/shipping/balance` call after save
4. **Watch Console:**
   - Should see: `[Optimization] API config unchanged, skipping balance refresh`

**Expected:** ✅ No balance API call after save

---

### ✅ Test 1.3: Save WITH API Key Change → Balance IS Refetched
**Goal:** Verify balance refetches when API credentials change

**Steps:**
1. On shipping-settings page, change:
   - **API Key** (add/remove characters)
2. Click **"Save Settings"**
3. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/settings` (POST) → Status 200
   - Should see: `/api/admin/shipping/balance` (GET) → Status 200 (after save)
4. **Watch Console:**
   - Should see: `[Optimization] API config changed, refreshing balance...`

**Expected:** ✅ Balance API called after save

---

### ✅ Test 1.4: Save WITH Environment Change → Balance IS Refetched
**Goal:** Verify balance refetches when environment changes

**Steps:**
1. On shipping-settings page, change:
   - **Environment** (Sandbox ↔ Production)
2. Click **"Save Settings"**
3. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/settings` (POST) → Status 200
   - Should see: `/api/admin/shipping/balance` (GET) → Status 200
4. **Watch Console:**
   - Should see: `[Optimization] API config changed, refreshing balance...`

**Expected:** ✅ Balance API called after save

---

### ✅ Test 1.5: Manual Refresh Button Works
**Goal:** Verify manual refresh bypasses optimization

**Steps:**
1. Click **"Refresh Balance"** button
2. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/balance` (GET) → Status 200
3. **Verify UI:**
   - Balance updates
   - Timestamp updates ("Just now")

**Expected:** ✅ Manual refresh always works

---

## Phase 2 Testing: Parallel Data Fetching

### ✅ Test 2.1: Parallel Loading on Page Load
**Goal:** Verify init endpoint loads all data in one call

**Steps:**
1. Clear browser cache: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
2. Hard refresh page: `Ctrl+Shift+R` or `Cmd+Shift+R`
3. **Watch Network Tab (Timeline View):**
   - Click on **"Waterfall"** column header to see timing
   - Should see: `/api/admin/shipping/init` as **SINGLE call**
   - Should NOT see: separate `/api/admin/shipping/settings` and `/api/admin/shipping/pickup-address` calls

**Expected:** ✅ Single init call instead of 3 separate calls

---

### ✅ Test 2.2: Faster Page Load Time
**Goal:** Verify page loads faster with optimization

**Steps:**
1. In Network tab, look at **"Finish"** time at bottom
2. Refresh page multiple times
3. **Compare timing:**
   - **Before optimization:** ~900ms total
   - **After optimization:** ~400-600ms total

**Expected:** ✅ ~50% faster page load

---

### ✅ Test 2.3: Error Isolation Works
**Goal:** Verify partial data loads if one source fails

**Steps:**
1. Test with **invalid API key** (temporarily break it)
2. Reload page
3. **Verify UI:**
   - Settings still load
   - Pickup address still loads
   - Balance shows "disconnected" (expected)

**Expected:** ✅ Page doesn't crash, other data loads

---

## Phase 3 Testing: React Query Caching

### ✅ Test 3.1: Cache Hit on Quick Reload
**Goal:** Verify React Query serves cached data

**Steps:**
1. Load shipping-settings page fresh
2. Wait 5 seconds
3. Navigate away (e.g., to `/admin/dashboard`)
4. Navigate back to `/admin/shipping-settings` within 30 seconds
5. **Watch Network Tab:**
   - Should see: No `/api/admin/shipping/init` call (or very quick 304)
6. **Watch Console (React Query DevTools if available):**
   - Look for cache hit indicators

**Expected:** ✅ Data loads instantly from cache

---

### ✅ Test 3.2: Stale Data Refetch on Focus
**Goal:** Verify fresh data after 30+ seconds

**Steps:**
1. Load shipping-settings page
2. Switch to different browser tab/app for 35+ seconds
3. Switch back to shipping-settings tab
4. **Watch Network Tab:**
   - Should see: `/api/admin/shipping/init` called automatically

**Expected:** ✅ Auto-refetch after stale time

---

### ✅ Test 3.3: Cache Invalidation on Save
**Goal:** Verify cache updates after saving

**Steps:**
1. Make a change and save
2. Navigate away and back
3. **Verify UI:**
   - Shows updated data (not stale cached data)

**Expected:** ✅ Saved changes reflected immediately

---

## Phase 4 Testing: Combined Init Endpoint

### ✅ Test 4.1: Single API Call on Load
**Goal:** Verify 3 calls reduced to 1

**Steps:**
1. Clear Network tab (click 🚫 icon)
2. Refresh page
3. **Count API calls in Network tab:**
   - Filter by: `admin/shipping`
   - Should see: **ONLY** `/api/admin/shipping/init`
   - Should NOT see:
     - `/api/admin/shipping/settings`
     - `/api/admin/shipping/pickup-address`
     - `/api/admin/shipping/balance` (separate call)

**Expected:** ✅ Only 1 init call on page load

---

### ✅ Test 4.2: All Data Loads Correctly
**Goal:** Verify combined endpoint returns everything

**Steps:**
1. Load page
2. **Verify UI shows all data:**
   - ✅ API Key field populated
   - ✅ Environment dropdown shows correct value
   - ✅ Courier mode selected
   - ✅ Balance displays (e.g., "RM 150.00")
   - ✅ Pickup address shows all fields
   - ✅ Validation status shows (green checkmark or red errors)

**Expected:** ✅ All data displays correctly

---

### ✅ Test 4.3: Response Payload Structure
**Goal:** Verify API returns correct structure

**Steps:**
1. In Network tab, click on `/api/admin/shipping/init` request
2. Click **"Response"** tab
3. **Verify JSON structure:**
```json
{
  "success": true,
  "data": {
    "settings": { ... },
    "configured": true/false,
    "pickupAddress": { ... },
    "pickupValidation": {
      "isValid": true/false,
      "errors": [...],
      "warnings": [...]
    },
    "balance": {
      "amount": 123.45,
      "currency": "MYR",
      "formatted": "RM 123.45",
      "lowBalance": false,
      "threshold": 50
    },
    "balanceTimestamp": "2025-10-17T..."
  }
}
```

**Expected:** ✅ Correct JSON structure

---

## Performance Benchmarking

### 📊 Measure API Call Reduction

**Before Optimization:**
```
Page Load:
- /api/admin/shipping/settings → 300ms
- /api/admin/shipping/pickup-address → 300ms (parallel)
- /api/admin/shipping/balance → 300ms (sequential)
Total: ~900ms

Save Settings:
- POST /api/admin/shipping/settings → 200ms
- GET /api/admin/shipping/balance → 300ms (always)
Total: ~500ms
```

**After Optimization:**
```
Page Load:
- /api/admin/shipping/init → 400ms (all data)
Total: ~400ms ✅ 55% faster

Save Settings (no API change):
- POST /api/admin/shipping/settings → 200ms
Total: ~200ms ✅ 60% faster

Save Settings (with API change):
- POST /api/admin/shipping/settings → 200ms
- GET /api/admin/shipping/balance → 300ms (conditional)
Total: ~500ms (same as before, but only when needed)
```

---

## Regression Testing: Ensure Nothing Broke

### ✅ Test R1: Courier Selection Works
**Steps:**
1. Select **"Selected Couriers"** mode
2. Wait for courier list to load
3. Select 3 couriers
4. Save
5. Reload page
6. **Verify:** Selected couriers persist

**Expected:** ✅ Courier selection works

---

### ✅ Test R2: Free Shipping Configuration
**Steps:**
1. Enable free shipping
2. Set threshold to 200
3. Save
4. Reload page
5. **Verify:** Free shipping settings persist

**Expected:** ✅ Free shipping config works

---

### ✅ Test R3: Pickup Address Validation
**Steps:**
1. Navigate to Business Profile settings
2. Clear shipping address (temporarily)
3. Go back to shipping-settings
4. **Verify:** Red error alert shows
5. **Verify:** Save button disabled

**Expected:** ✅ Validation works

---

### ✅ Test R4: Test Connection Button
**Steps:**
1. Click **"Test Connection"** button
2. **Verify:** Toast notification appears
3. **Verify:** Shows success or error based on API key validity

**Expected:** ✅ Test connection works

---

### ✅ Test R5: Delete Settings
**Steps:**
1. Click **"Clear Configuration"** button
2. Confirm deletion
3. **Watch Network Tab:**
   - Should see: DELETE `/api/admin/shipping/settings`
   - Should see: GET `/api/admin/shipping/init` (reload)
4. **Verify UI:**
   - Form resets to empty
   - Balance cleared
   - Status shows "not-configured"

**Expected:** ✅ Delete and reload works

---

## Console Log Verification

### Expected Console Messages

**On Page Load:**
```
(No optimization messages - this is expected)
```

**On Save WITHOUT API Changes:**
```javascript
[Optimization] API config unchanged, skipping balance refresh
```

**On Save WITH API Changes:**
```javascript
[Optimization] API config changed, refreshing balance...
```

**On Init Error (if balance fails):**
```javascript
[Init] Balance error: <error message>
```

---

## Chrome DevTools Performance Tab (Optional Advanced Testing)

### Record Page Load Performance

**Steps:**
1. Open **Performance** tab in DevTools
2. Click **Record** button (●)
3. Refresh page
4. Click **Stop** after page loads
5. **Analyze:**
   - Network requests timeline
   - Look for parallel vs sequential calls
   - Verify init call duration

**Expected:** Single init call visible in timeline

---

## React Query DevTools (Optional)

### Enable React Query DevTools

**If available in your app:**
1. Look for floating React Query icon (bottom-left corner)
2. Click to open DevTools
3. **Check:**
   - Query: `['shipping', 'init']`
   - Status: `success` / `stale` / `fresh`
   - Last Updated timestamp

**Expected:** Query shows in DevTools with correct status

---

## Common Issues & Troubleshooting

### ❌ Issue: "Balance not loading on page load"
**Fix:**
1. Check console for errors
2. Verify `/api/admin/shipping/init` returns `configured: true`
3. Verify API key is valid

### ❌ Issue: "Balance still refetches after save (wrong)"
**Fix:**
1. Check console - should say "skipping balance refresh"
2. If not, verify Phase 1 code is correct
3. Clear browser cache and hard refresh

### ❌ Issue: "Page shows 3 API calls instead of 1"
**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Verify `/api/admin/shipping/init` endpoint exists
3. Check if old code is still calling separate endpoints

### ❌ Issue: "Data not loading from cache"
**Fix:**
1. Verify React Query is set up in app layout
2. Check staleTime configuration in hooks
3. Try clearing React Query cache (refresh page)

---

## Success Criteria Checklist

### ✅ Phase 1 Success
- [ ] Balance loads on page load
- [ ] Balance NOT refetched when changing courier mode
- [ ] Balance NOT refetched when changing threshold
- [ ] Balance IS refetched when changing API key
- [ ] Balance IS refetched when changing environment
- [ ] Manual refresh works

### ✅ Phase 2 Success
- [ ] Page load uses 1 API call (not 3)
- [ ] Page loads in ~400-600ms (not 900ms)
- [ ] Parallel loading visible in Network tab waterfall

### ✅ Phase 3 Success
- [ ] Quick navigation uses cache (no new API call)
- [ ] Stale data refetches after 30s
- [ ] Cache invalidates on save

### ✅ Phase 4 Success
- [ ] `/api/admin/shipping/init` endpoint exists
- [ ] Returns all data (settings, pickup, balance)
- [ ] Single call on page load
- [ ] Response structure correct

### ✅ Regression Success
- [ ] All form fields work
- [ ] Courier selection works
- [ ] Save/Delete works
- [ ] Validation works
- [ ] No console errors

---

## Final Validation

**If ALL checkboxes above are ✅, optimization is successful!**

**Performance Improvement Summary:**
- Page Load: 900ms → 400ms (55% faster) ✅
- API Calls on Load: 3 → 1 (66% reduction) ✅
- API Calls on Save: 2 → 1-2 (conditional, up to 50% reduction) ✅
- Cache Hit Rate: 0% → 60-80% ✅

---

## Report Issues

If any tests fail, check:
1. Console errors
2. Network tab for failed requests
3. Response payloads for incorrect data
4. Browser cache (try hard refresh)

**Document any failures with:**
- Test number that failed
- Expected vs actual behavior
- Screenshots of Network tab
- Console error messages
