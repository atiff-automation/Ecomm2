# Quick Testing Guide - Before Railway Deployment

**Environment**: http://localhost:3000
**Time Required**: 15 minutes
**Purpose**: Verify critical functionality before deploying to Railway

---

## ✅ Quick Critical Path Tests

### 🧪 Test 1: Product Delete Dialog (2 min)

**URL**: http://localhost:3000/admin/products

1. Click **trash icon** on any product
2. **VERIFY**: Dialog appears (NOT browser confirm)
3. Click "Cancel" → **VERIFY**: Dialog closes, product not deleted
4. Click trash icon again → Click "Delete" → **VERIFY**: Toast appears, product deleted

**PASS/FAIL**: ___________

---

### 🧪 Test 2: Category Delete Dialog (2 min)

**URL**: http://localhost:3000/admin/categories

1. Click **three dots** menu → "Delete"
2. **VERIFY**: Dialog appears (NOT browser confirm)
3. Click "Cancel" → **VERIFY**: Works correctly
4. Delete again → Click "Delete" → **VERIFY**: Toast appears, category deleted

**PASS/FAIL**: ___________

---

### 🧪 Test 3: Create Product (3 min)

**URL**: http://localhost:3000/admin/products/create

1. Fill required fields:
   - Name: "Test Product"
   - SKU: "TEST-001"
   - Categories: Select one
   - Price: 99.99
   - Stock: 50
   - Weight: 1.5

2. Click "Create Product"
3. **VERIFY**: Success toast, redirects, product appears in list

**PASS/FAIL**: ___________

---

### 🧪 Test 4: Edit Product (2 min)

**URL**: http://localhost:3000/admin/products → Click Edit

1. Change product name (add " - EDITED")
2. Click "Update Product"
3. **VERIFY**: Success toast, changes saved

**PASS/FAIL**: ___________

---

### 🧪 Test 5: Constants Check (2 min)

**URL**: http://localhost:3000/admin/products

1. **VERIFY**: Pagination shows max 20 products
2. Find product with stock < 10 → **VERIFY**: Yellow warning badge
3. Open browser console (F12) → **VERIFY**: No errors

**PASS/FAIL**: ___________

---

### 🧪 Test 6: No Console Errors (1 min)

1. Open all pages:
   - /admin/products
   - /admin/categories
   - /admin/products/create

2. Check browser console for each
3. **VERIFY**: No red errors (warnings OK)

**PASS/FAIL**: ___________

---

## ✅ Decision Matrix

**If ALL tests PASS**:
```bash
✅ Safe to merge to main
✅ Railway will auto-deploy
✅ Production-ready
```

**If ANY test FAILS**:
```bash
❌ DO NOT merge to main
❌ Fix the issue first
❌ Re-test before deploying
```

---

## 🚀 Next Steps After Testing

### If Tests Pass:
```bash
git checkout main
git merge feat/product-admin-cleanup
git push origin main
# Railway will auto-deploy in 2-3 minutes
```

### If Tests Fail:
```bash
# Stay on feature branch
# Fix issues
# Re-test
# Only merge when all tests pass
```

---

**Start Testing Now**: http://localhost:3000/admin/products
