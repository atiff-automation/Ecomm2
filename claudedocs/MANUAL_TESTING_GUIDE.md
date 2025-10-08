# Manual Testing Guide - Shipping Integration

**Date:** 2025-10-07
**Status:** Ready for Phase 1 Testing
**Server:** http://localhost:3000
**Admin Login:** admin@jrm.com

---

## ✅ Pre-Flight Checks Complete

### Environment Status
```
✅ Database: PostgreSQL 15.10 connected
✅ Admin Account: admin@jrm.com exists
✅ Products: 36 products with valid weights (avg 0.49kg)
✅ Test Order: ORD-20250928-KQVI (PAID status available)
✅ Dev Server: Running at http://localhost:3000
✅ Shipping Settings Page: Accessible at /admin/shipping-settings
✅ Orders Page: Accessible at /admin/orders
⚠️ Shipping Config: NOT YET CONFIGURED (you'll do this in Phase 1)
```

---

## Phase 1: Admin Configuration Testing

### 🎯 Goal
Configure EasyParcel shipping integration and verify all settings save correctly.

---

### Step 1: Access Admin Panel

1. **Open Browser:**
   ```
   http://localhost:3000/admin
   ```

2. **Login as Admin:**
   - Email: `admin@jrm.com`
   - Password: [your admin password]

3. **Verify Dashboard Loads:**
   - ✅ Admin navigation visible
   - ✅ No console errors (F12 Developer Tools)

---

### Step 2: Navigate to Shipping Settings

1. **Go to Shipping Settings:**
   ```
   http://localhost:3000/admin/shipping-settings
   ```

2. **Expected: Settings Form Should Display:**
   - API Configuration section
   - Pickup Address section
   - Courier Selection section
   - Free Shipping section
   - Account Balance section

3. **Check Initial State:**
   - [ ] All fields empty (first time)
   - [ ] Save button disabled or shows "Configure Shipping"
   - [ ] No error messages

---

### Step 3: Configure EasyParcel API

**Test Data (Use EasyParcel Sandbox):**

```
API Key: [Your EasyParcel Sandbox API Key]
Environment: Sandbox ⚠️ (NOT Production for testing)
```

**Steps:**
1. Enter your EasyParcel API key
2. Select "Sandbox" environment
3. Click "Test Connection" button

**Expected Results:**
- ✅ Green success message: "Connection successful"
- ✅ API key validates
- OR
- ❌ Red error message: "Invalid API key" (if key is wrong)

**Verification:**
- [ ] Connection test works
- [ ] Error handling displays properly
- [ ] No JavaScript console errors

---

### Step 4: Configure Pickup Address

**Test Data (Malaysian Address):**

```
Business Name: JRM Ecommerce Test
Phone: +60123456789
Address Line 1: 123 Jalan Test
Address Line 2: Unit 4-5 (optional)
City: Kuala Lumpur
State: Wilayah Persekutuan Kuala Lumpur
Postal Code: 50000
Country: MY (Malaysia) - should be pre-selected
```

**Steps:**
1. Fill in all required fields
2. Select state from dropdown (should show 16 Malaysian states)
3. Enter postal code (5 digits)

**Expected Results:**
- ✅ State dropdown shows Malaysian states in Bahasa Malaysia
- ✅ Phone validation accepts +60 format
- ✅ Postal code accepts 5 digits only

**Verification:**
- [ ] All fields accept valid input
- [ ] Validation prevents invalid data (try entering 4-digit postal code - should fail)
- [ ] State dropdown populates correctly

---

### Step 5: Configure Courier Selection

**Test Strategy: "Show All Couriers"**

**Steps:**
1. Find "Courier Selection Mode" dropdown
2. Select "Show All Couriers"

**Expected Results:**
- ✅ Selected courier list disappears (not needed for "Show All")
- ✅ Form validates without courier selection

**Alternative Test (if you want):**
1. Select "Selected Couriers Only"
2. Checkbox list should appear with couriers:
   - DHL eCommerce
   - J&T Express
   - Ninja Van
   - Poslaju
   - GDex
   - etc.

**Verification:**
- [ ] Mode dropdown works
- [ ] UI updates based on selection
- [ ] Form validation adjusts accordingly

---

### Step 6: Configure Free Shipping

**Test Data:**

```
Enable Free Shipping: ✓ (checked)
Threshold: 150
(This means: Orders ≥ RM 150.00 get free shipping)
```

**Steps:**
1. Check "Enable Free Shipping"
2. Enter threshold amount: 150
3. Verify input accepts numbers only

**Expected Results:**
- ✅ Threshold field appears when enabled
- ✅ Accepts numeric input
- ✅ Validation prevents negative numbers

**Verification:**
- [ ] Toggle works
- [ ] Threshold validates properly
- [ ] UI responds to enable/disable

---

### Step 7: Save Settings

**Critical Test:**

1. Click "Save Settings" button

**Expected Results:**
- ✅ Loading indicator shows during save
- ✅ Success message: "Shipping settings saved successfully"
- ✅ Form remains populated (doesn't clear)
- ✅ Button changes from "Save" to "Update Settings"

**Verification:**
- [ ] Save operation completes
- [ ] Success feedback displays
- [ ] No console errors
- [ ] Settings persist

---

### Step 8: Verify Settings Persistence

**Critical Test:**

1. Refresh the page (F5 or Ctrl+R)
2. Check if all settings reload correctly

**Expected Results:**
- ✅ API key masked (shows: "sk_***************xyz")
- ✅ Pickup address populates from database
- ✅ Courier strategy selected correctly
- ✅ Free shipping threshold shows correct value

**Verification:**
- [ ] All fields reload with saved data
- [ ] No data loss on refresh
- [ ] Masked sensitive data (API key)

---

### Step 9: Test Account Balance

**Optional Feature Test:**

1. Find "Account Balance" section
2. Click "Refresh Balance" button

**Expected Results:**
- ✅ Shows loading spinner
- ✅ Displays balance: "RM XX.XX"
- ✅ If balance < RM 50: Shows warning message
- OR
- ❌ Error: "Unable to fetch balance" (if API issue)

**Verification:**
- [ ] Balance fetches from EasyParcel
- [ ] Low balance warning works
- [ ] Error handling displays properly

---

### Step 10: Database Verification

**Backend Validation:**

Run this command in terminal to verify settings saved:

```bash
psql -d jrm_ecommerce_dev -c "SELECT key, type, \"createdAt\" FROM system_config WHERE key = 'shipping_settings';"
```

**Expected Output:**
```
      key          | type |         createdAt
-------------------+------+----------------------------
 shipping_settings | json | 2025-10-07 13:00:00.123
```

**Verification:**
- [ ] Record exists in database
- [ ] Type is `json`
- [ ] Created timestamp is recent

---

## Phase 1 Success Criteria

**All of the following must pass:**

- [ ] ✅ Shipping settings page loads without errors
- [ ] ✅ API connection test works
- [ ] ✅ All form fields validate correctly
- [ ] ✅ Settings save successfully
- [ ] ✅ Settings persist after page refresh
- [ ] ✅ Database contains shipping_settings record
- [ ] ✅ No console errors throughout testing
- [ ] ✅ All validation rules enforced (phone, postal code, etc.)

---

## Common Issues & Solutions

### Issue 1: "Connection Failed" when testing API
**Possible Causes:**
- Wrong API key
- Selected "Production" instead of "Sandbox"
- Network connectivity issue

**Solution:**
- Verify API key from EasyParcel dashboard
- Ensure "Sandbox" environment selected
- Check internet connection

---

### Issue 2: Form Won't Save
**Possible Causes:**
- Missing required fields
- Validation errors not displayed
- Database connection issue

**Solution:**
- Check browser console for errors (F12)
- Ensure all required fields filled
- Verify database is running: `psql -d jrm_ecommerce_dev -c "SELECT 1;"`

---

### Issue 3: Page Loads But Form Empty After Refresh
**Possible Causes:**
- Settings not saved to database
- Database query failing
- JSON parsing error

**Solution:**
- Check database for record (see Step 10)
- Check server logs for errors
- Verify JSON structure in database

---

### Issue 4: State Dropdown Not Populating
**Possible Causes:**
- JavaScript error
- Constants not loaded
- Frontend compilation issue

**Solution:**
- Check browser console for errors
- Hard refresh page (Ctrl+Shift+R)
- Restart dev server if needed

---

## Phase 2 Preview: Customer Checkout

**Once Phase 1 is complete**, you'll proceed to:

1. Add products to cart
2. Proceed to checkout
3. Enter shipping address
4. See real-time courier options with prices
5. Select courier
6. Complete order

**But first: Complete Phase 1 successfully!**

---

## Need Help?

**Common Commands:**

```bash
# Check dev server status
curl -I http://localhost:3000

# View database shipping settings
psql -d jrm_ecommerce_dev -c "SELECT key, type FROM system_config WHERE key = 'shipping_settings';"

# Check for admin account
psql -d jrm_ecommerce_dev -c "SELECT email, role FROM users WHERE role = 'ADMIN';"

# Restart dev server if needed
# (Kill existing process first, then)
npm run dev
```

**Check Server Logs:**
Server logs are visible in the terminal where `npm run dev` is running.
Look for any errors or warnings during testing.

---

## Testing Checklist Summary

### Phase 1: Admin Configuration
- [ ] Access admin panel successfully
- [ ] Navigate to shipping settings
- [ ] Configure EasyParcel API
- [ ] Set up pickup address
- [ ] Choose courier strategy
- [ ] Enable free shipping
- [ ] Save settings successfully
- [ ] Verify settings persist
- [ ] Check account balance (optional)
- [ ] Validate database record

**Estimated Time:** 15-20 minutes

---

## Next Steps After Phase 1

Once Phase 1 passes all tests:

1. **Report Results:**
   - Share any errors encountered
   - Confirm all checks passed
   - Provide screenshots if needed

2. **Proceed to Phase 2:**
   - Customer checkout flow testing
   - Real-time shipping calculation
   - Courier selection UI

3. **Then Phase 3:**
   - Admin order fulfillment
   - Shipment booking
   - AWB label generation

---

**Ready to Start?**

1. Open http://localhost:3000/admin
2. Login with admin@jrm.com
3. Follow steps above
4. Report any issues immediately

**Good luck with testing! 🚀**
