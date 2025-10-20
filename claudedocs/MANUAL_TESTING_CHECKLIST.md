# Manual Testing Checklist - Customer & Membership Simplification
**Branch**: `feature/simplify-customer-membership-admin`
**Date**: 2025-10-20
**Tester**: _____________

---

## 🚀 Server Status

**Dev Server**: http://localhost:3000
**Admin Dashboard**: http://localhost:3000/admin/dashboard

---

## ✅ Quick Smoke Tests (5 minutes)

### Test 1: Admin Dashboard Loads
- [ ] Navigate to http://localhost:3000/admin/dashboard
- [ ] Page loads without errors
- [ ] No console errors (F12 → Console)
- [ ] Dashboard displays stats correctly

### Test 2: Navigation Tabs Updated
**Customers Page:**
- [ ] Navigate to http://localhost:3000/admin/customers
- [ ] Verify tabs show: **[Customers | Membership]** (only 2 tabs)
- [ ] ❌ Should NOT show "Referrals" tab
- [ ] Click "Membership" tab → redirects to `/admin/membership`

**Membership Page:**
- [ ] Navigate to http://localhost:3000/admin/membership
- [ ] Verify tabs show: **[Customers | Membership]** (only 2 tabs)
- [ ] ❌ Should NOT show "Referrals" tab
- [ ] Click "Customers" tab → redirects to `/admin/customers`

### Test 3: Deleted Pages Return 404
- [ ] Navigate to http://localhost:3000/admin/membership/analytics
- [ ] ✅ Should show 404 Not Found
- [ ] Navigate to http://localhost:3000/admin/member-promotions
- [ ] ✅ Should show 404 Not Found

---

## 📋 Detailed Navigation Tests (10 minutes)

### Test 4: Breadcrumb Navigation
**Customer Detail Page:**
- [ ] Go to http://localhost:3000/admin/customers
- [ ] Click any customer
- [ ] Verify breadcrumb: `Home > Customers > [Customer Name]`
- [ ] ❌ Should NOT show "Membership Analytics"

**Membership Config Page:**
- [ ] Go to http://localhost:3000/admin/membership/config
- [ ] Verify breadcrumb: `Home > Membership > Configuration`
- [ ] No errors in breadcrumb display

### Test 5: Dashboard Links
- [ ] Go to http://localhost:3000/admin/dashboard
- [ ] Find "Membership" section card
- [ ] Verify link text: "View Membership" (NOT "View Analytics")
- [ ] Click link → redirects to `/admin/membership`
- [ ] Page loads successfully

---

## 🔧 Configuration Page Tests (10 minutes)

### Test 6: Simplified Configuration Display
- [ ] Navigate to http://localhost:3000/admin/membership/config
- [ ] Verify page title: "Membership Qualification Rules"
- [ ] Verify ONLY 3 settings displayed:
  - [ ] Minimum Qualifying Amount (RM) - input field
  - [ ] Exclude Promotional Items - toggle switch
  - [ ] Require Qualifying Products - toggle switch
- [ ] ❌ Should NOT show:
  - ❌ "Membership Benefits Text" textarea
  - ❌ "Membership Terms Text" textarea
  - ❌ "Content & Messaging" card

### Test 7: Update Threshold Setting
- [ ] Change threshold to `100`
- [ ] Click "Save"
- [ ] ✅ Success message appears
- [ ] Refresh page (F5)
- [ ] Verify threshold still shows `100`

### Test 8: Toggle Switches Work
- [ ] Toggle "Exclude Promotional Items" ON
- [ ] Toggle "Require Qualifying Products" ON
- [ ] Click "Save"
- [ ] ✅ Success message appears
- [ ] Refresh page
- [ ] Verify both toggles are still ON

### Test 9: Reset Button Works
- [ ] Change threshold to `150`
- [ ] Click "Reset" button
- [ ] Verify threshold returns to previous saved value
- [ ] No save happened (refresh to confirm)

---

## 🚨 CRITICAL: Payment-to-Membership Flow (30 minutes)

### Test 10: Payment Success → Membership Activation

**Setup:**
1. [ ] Set membership threshold to RM 80 (`/admin/membership/config`)
2. [ ] Ensure "Exclude Promotional Items" is ON
3. [ ] Ensure "Require Qualifying Products" is ON
4. [ ] Create test user (non-member) OR use existing customer

**Test Steps:**
1. [ ] Login as test customer (or create order as guest)
2. [ ] Add qualifying products totaling > RM 80 to cart
   - Products must have: `isQualifyingForMembership: true`
   - Products must have: `isPromotional: false`
3. [ ] Proceed to checkout
4. [ ] Complete payment via ToyyibPay (use sandbox/test mode)
5. [ ] Wait for payment confirmation

**Expected Results:**
- [ ] Order status: PAID
- [ ] Payment status: PAID
- [ ] User `isMember`: true
- [ ] User `memberSince`: today's date
- [ ] Check in Admin → Customers → [User] shows "VIP Member" badge

**Where to Verify:**
- Admin: `/admin/customers/[customerId]`
- Database: Check `users` table for `isMember` and `memberSince`

### Test 11: Payment Failed → No Membership

**Test Steps:**
1. [ ] Login as different test customer
2. [ ] Add qualifying products (> RM 80)
3. [ ] Proceed to checkout
4. [ ] **Cancel/fail payment** at ToyyibPay

**Expected Results:**
- [ ] Order status: PENDING or CANCELLED
- [ ] Payment status: FAILED or PENDING
- [ ] User `isMember`: false (still not a member)
- [ ] No membership activation

### Test 12: Promotional Products Excluded

**Setup:**
1. [ ] Ensure "Exclude Promotional Items" is ON
2. [ ] Create product with `isPromotional: true`, price RM 100

**Test Steps:**
1. [ ] Login as test customer
2. [ ] Add ONLY promotional product to cart (RM 100)
3. [ ] Complete payment successfully

**Expected Results:**
- [ ] Order status: PAID
- [ ] Payment status: PAID
- [ ] User `isMember`: **false** (promotional items excluded)
- [ ] Order `wasEligibleForMembership`: false

---

## 🔍 Console Error Check (Throughout Testing)

**Browser Console (F12):**
- [ ] No errors during navigation
- [ ] No 404 errors for missing pages
- [ ] No broken image links
- [ ] No TypeScript errors
- [ ] No API failures (check Network tab)

**Common Issues to Watch For:**
- ❌ "Cannot GET /admin/membership/analytics" - Expected (deleted)
- ❌ "Cannot GET /admin/member-promotions" - Expected (deleted)
- ✅ All other pages should load successfully

---

## 📊 Database Verification (Optional)

### SystemConfig Table Check
```sql
-- Run in Prisma Studio or database client
SELECT key, value, type
FROM "SystemConfig"
WHERE key IN (
  'membership_threshold',
  'enable_promotional_exclusion',
  'require_qualifying_categories'
);
```

**Expected Results:**
- [ ] All 3 keys exist
- [ ] Values match configuration page
- [ ] Types are correct (number, boolean, boolean)

---

## ✅ Test Summary

**Total Tests**: 12
**Passed**: _____
**Failed**: _____
**Blocked**: _____

**Critical Issues Found:**
1. _________________________________
2. _________________________________

**Non-Critical Issues:**
1. _________________________________
2. _________________________________

---

## 🎯 Sign-Off

- [ ] All smoke tests passed
- [ ] All navigation tests passed
- [ ] Configuration page works correctly
- [ ] **CRITICAL**: Payment-to-membership flow verified
- [ ] No console errors
- [ ] Ready to merge

**Tester Signature**: _____________
**Date Completed**: _____________

---

## 📝 Notes & Observations

_Add any additional notes, observations, or edge cases discovered during testing:_

_______________________________________________
_______________________________________________
_______________________________________________
