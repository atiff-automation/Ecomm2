# Manual Testing Checklist - Product Admin Cleanup
**Date**: 2025-10-19
**Tester**: _______________
**Environment**: Development (localhost:3000)
**Build Status**: ✅ Compiled successfully

---

## 🎯 Testing Scope
This checklist verifies all changes made during the Product Admin cleanup:
- Dialog component replacements (confirm → Dialog)
- TypeScript type safety improvements (any → explicit types)
- Constants usage (hardcoded → PRODUCT_CONSTANTS)

---

## ✅ Pre-Test Setup

### Environment Check
- [ ] Dev server running on `http://localhost:3000`
- [ ] Database accessible
- [ ] Logged in as admin user
- [ ] Browser console open (F12)

### Access Test URLs
- [ ] http://localhost:3000/admin/products
- [ ] http://localhost:3000/admin/categories
- [ ] http://localhost:3000/admin/products/create

**If any URL returns error, STOP and fix before continuing**

---

## 📝 Test Suite 1: Product Delete Dialog (Critical)

**File Modified**: `src/app/admin/products/page.tsx`
**Change**: Replaced `confirm()` with Dialog component

### Test 1.1: Dialog Opens Correctly
1. Navigate to: http://localhost:3000/admin/products
2. Locate any product in the list
3. Click the **trash icon** (delete button)

**Expected Result:**
- [ ] Dialog modal appears
- [ ] Dialog has title "Delete Product"
- [ ] Dialog shows message: "Are you sure you want to delete this product? This action cannot be undone."
- [ ] Dialog has two buttons: "Cancel" and "Delete"
- [ ] Background is dimmed/disabled
- [ ] **NOT** a browser confirm popup

**Actual Result:** _______________________________________________

---

### Test 1.2: Cancel Button Works
1. With dialog open from Test 1.1
2. Click the **"Cancel"** button

**Expected Result:**
- [ ] Dialog closes immediately
- [ ] Product is **NOT** deleted (still visible in list)
- [ ] No toast notification appears
- [ ] No error in console

**Actual Result:** _______________________________________________

---

### Test 1.3: Delete Confirmation Works
1. Click delete icon again on same product
2. Click the **"Delete"** button in dialog

**Expected Result:**
- [ ] Dialog closes
- [ ] Toast notification appears: "Product deleted successfully"
- [ ] Product removed from list
- [ ] No error in console
- [ ] Metrics updated (total products count decreased)

**Actual Result:** _______________________________________________

---

### Test 1.4: Delete Error Handling
1. **Stop database** or **disconnect network**
2. Click delete on a product
3. Click "Delete" button

**Expected Result:**
- [ ] Toast error appears: "Failed to delete product"
- [ ] Product remains in list
- [ ] Dialog closes
- [ ] No browser alert appears

**Actual Result:** _______________________________________________

**Restore**: Reconnect database/network before continuing

---

## 📝 Test Suite 2: Category Delete Dialog (Critical)

**File Modified**: `src/app/admin/categories/page.tsx`
**Change**: Replaced `confirm()` with Dialog component

### Test 2.1: Category Dialog Opens
1. Navigate to: http://localhost:3000/admin/categories
2. Click the **three dots** menu on any category
3. Click **"Delete"**

**Expected Result:**
- [ ] Dialog modal appears
- [ ] Dialog has title "Delete Category"
- [ ] Dialog shows: "Are you sure you want to delete this category? This action cannot be undone."
- [ ] Two buttons: "Cancel" and "Delete"
- [ ] **NOT** a browser confirm popup

**Actual Result:** _______________________________________________

---

### Test 2.2: Category Cancel Works
1. With dialog open from Test 2.1
2. Click **"Cancel"**

**Expected Result:**
- [ ] Dialog closes
- [ ] Category **NOT** deleted
- [ ] No toast notification

**Actual Result:** _______________________________________________

---

### Test 2.3: Category Delete Works
1. Open delete dialog again
2. Click **"Delete"** button

**Expected Result:**
- [ ] Dialog closes
- [ ] Toast: "Category deleted successfully"
- [ ] Category removed from list
- [ ] No errors in console

**Actual Result:** _______________________________________________

---

## 📝 Test Suite 3: Product Creation (TypeScript Types)

**File Modified**: `src/app/admin/products/create/page.tsx`
**Change**: Fixed `any` types → `ProductFormData`, `ProductImage`

### Test 3.1: Create Product Form Loads
1. Navigate to: http://localhost:3000/admin/products/create
2. Verify form appears

**Expected Result:**
- [ ] Form loads without errors
- [ ] All fields visible
- [ ] No console errors
- [ ] No TypeScript errors in console

**Actual Result:** _______________________________________________

---

### Test 3.2: Create Product with Valid Data
1. Fill in required fields:
   - **Product Name**: "Test Product Manual"
   - **SKU**: "TEST-MANUAL-001"
   - **Categories**: Select at least one
   - **Regular Price**: 99.99
   - **Stock Quantity**: 50
   - **Weight**: 1.5

2. Click **"Create Product"**

**Expected Result:**
- [ ] Form submits successfully
- [ ] Toast: "Product created successfully!"
- [ ] Redirects to `/admin/products`
- [ ] New product appears in list
- [ ] No console errors

**Actual Result:** _______________________________________________

---

### Test 3.3: Create Product with Images
1. Open create form again
2. Fill required fields (as above)
3. Go to **Images** tab
4. Upload 2-3 images

**Expected Result:**
- [ ] Images upload successfully
- [ ] Image previews appear
- [ ] Can reorder images
- [ ] Create succeeds with images
- [ ] Product shows images in list

**Actual Result:** _______________________________________________

---

## 📝 Test Suite 4: Product Editing (TypeScript Types)

**File Modified**: `src/app/admin/products/[id]/edit/page.tsx`
**Change**: Fixed `any` types → `ProductCategory`, `ProductImage`

### Test 4.1: Edit Product Form Loads
1. Go to: http://localhost:3000/admin/products
2. Click **edit icon** on any product

**Expected Result:**
- [ ] Edit form loads with product data
- [ ] All fields populated correctly
- [ ] Categories selected correctly
- [ ] Images displayed if product has them
- [ ] No console errors

**Actual Result:** _______________________________________________

---

### Test 4.2: Update Product Data
1. In edit form, change:
   - **Product Name**: Add " - Updated"
   - **Price**: Change to different value
   - **Stock**: Change quantity

2. Click **"Update Product"**

**Expected Result:**
- [ ] Toast: "Product updated successfully!"
- [ ] Redirects to `/admin/products`
- [ ] Changes visible in product list
- [ ] No console errors

**Actual Result:** _______________________________________________

---

### Test 4.3: Delete Product from Edit Page
1. Open edit form for a test product
2. Scroll down to **"Delete Product"** button
3. Click **"Delete Product"**

**Expected Result:**
- [ ] Dialog appears (not browser confirm)
- [ ] Dialog shows product name in message
- [ ] Cancel works (stays on edit page)
- [ ] Delete works (redirects, shows toast, product removed)

**Actual Result:** _______________________________________________

---

## 📝 Test Suite 5: Constants Verification

**File Modified**: `src/lib/constants/product-config.ts` (created)
**Change**: Extracted hardcoded values to constants

### Test 5.1: Pagination Limit (20 items)
1. Go to: http://localhost:3000/admin/products
2. Check product list

**Expected Result:**
- [ ] List shows maximum **20 products** per page
- [ ] If >20 products exist, pagination appears
- [ ] "Next" button works
- [ ] "Previous" button works

**Actual Result:** _______________________________________________

**Constant Verified**: `PAGINATION_LIMIT = 20`

---

### Test 5.2: Low Stock Threshold (10 items)
1. Find or create product with stock quantity < 10
2. View products list

**Expected Result:**
- [ ] Product shows yellow/warning badge for stock
- [ ] Badge shows stock quantity
- [ ] Warning icon appears (AlertTriangle)

**Actual Result:** _______________________________________________

**Constant Verified**: `LOW_STOCK_THRESHOLD = 10`

---

### Test 5.3: Image Upload Limits
1. Go to product create/edit form
2. Navigate to Images tab
3. Try uploading 6 images (limit is 5)

**Expected Result:**
- [ ] Can upload up to 5 images
- [ ] 6th image rejected or prevented
- [ ] Error message about max images

**Actual Result:** _______________________________________________

**Constant Verified**: `MAX_IMAGES = 5`

---

### Test 5.4: File Size Limit (5MB)
1. Try uploading image > 5MB
2. Attempt upload

**Expected Result:**
- [ ] File rejected
- [ ] Error message: "File too large" or similar
- [ ] Max size shown as "5MB"

**Actual Result:** _______________________________________________

**Constant Verified**: `MAX_SIZE_MB = 5`

---

### Test 5.5: Short Description Length (160 chars)
1. In product form
2. Type in **Short Description** field
3. Type exactly 160 characters

**Expected Result:**
- [ ] Character counter shows "160/160"
- [ ] Cannot type more than 160 characters
- [ ] Counter updates as you type

**Actual Result:** _______________________________________________

**Constant Verified**: `MAX_SHORT_DESC_LENGTH = 160`

---

### Test 5.6: Weight Validation (min 0.01 kg)
1. In product form
2. Try to enter weight: 0
3. Try to submit

**Expected Result:**
- [ ] Validation error appears
- [ ] Error message: "Weight must be at least 0.01 kg"
- [ ] Cannot submit with weight < 0.01

**Actual Result:** _______________________________________________

**Constant Verified**: `MIN_WEIGHT_KG = 0.01`

---

### Test 5.7: Bulk Selection Limit (100 products)
1. Go to products list
2. Try to select 100+ products using checkboxes

**Expected Result:**
- [ ] Can select up to 100 products
- [ ] Toast error: "You can select a maximum of 100 products at once"
- [ ] Selection capped at 100

**Actual Result:** _______________________________________________

**Constant Verified**: `MAX_SELECTION = 100`

---

## 📝 Test Suite 6: Import Page (TypeScript)

**File Modified**: `src/app/admin/products/import/page.tsx`
**Change**: Fixed `any` type → `CategoryData`

### Test 6.1: Import Page Loads
1. Navigate to: http://localhost:3000/admin/products/import

**Expected Result:**
- [ ] Page loads successfully
- [ ] Template download button works
- [ ] Category list download button works
- [ ] No console errors

**Actual Result:** _______________________________________________

---

### Test 6.2: Download Category List
1. Click **"Category List"** button
2. CSV file downloads

**Expected Result:**
- [ ] File downloads: `category_list.csv`
- [ ] File contains categories with proper format
- [ ] No errors in console

**Actual Result:** _______________________________________________

---

## 🔍 Cross-Browser Testing (Optional but Recommended)

Repeat critical tests (Suites 1, 2, 3) in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

**Issues Found:** _______________________________________________

---

## 📊 Test Summary

| Test Suite | Total Tests | Passed | Failed | Blocked |
|------------|-------------|--------|--------|---------|
| 1. Product Delete Dialog | 4 | ___ | ___ | ___ |
| 2. Category Delete Dialog | 3 | ___ | ___ | ___ |
| 3. Product Creation | 3 | ___ | ___ | ___ |
| 4. Product Editing | 3 | ___ | ___ | ___ |
| 5. Constants Verification | 7 | ___ | ___ | ___ |
| 6. Import Page | 2 | ___ | ___ | ___ |
| **TOTAL** | **22** | **___** | **___** | **___** |

---

## 🚨 Critical Issues Found

| Issue # | Severity | Description | Steps to Reproduce | Status |
|---------|----------|-------------|-------------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity Levels**: 🔴 Blocker | 🟡 High | 🟢 Medium | ⚪ Low

---

## ✅ Sign-Off

**All Critical Tests Passed?** [ ] Yes [ ] No

**Tester Signature**: _______________
**Date**: _______________
**Ready for Production?** [ ] Yes [ ] No [ ] With Fixes

---

## 📝 Notes

Additional observations:
_______________________________________________
_______________________________________________
_______________________________________________
