# Order Database Field Migration Plan

**Project:** JRM E-commerce Platform
**Migration Type:** Schema Cleanup - Remove Unused/Redundant Fields
**Risk Level:** 🟡 MEDIUM (Non-breaking changes, but requires careful execution)
**Estimated Duration:** 2-4 hours (including testing and deployment)
**Created:** 2025-10-17
**Status:** PLANNING

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Analysis Findings](#analysis-findings)
3. [Fields to Remove](#fields-to-remove)
4. [Impact Assessment](#impact-assessment)
5. [Pre-Migration Checklist](#pre-migration-checklist)
6. [Implementation Steps](#implementation-steps)
7. [Testing & Validation](#testing--validation)
8. [Deployment to Railway](#deployment-to-railway)
9. [Rollback Procedures](#rollback-procedures)
10. [Post-Migration Verification](#post-migration-verification)
11. [Troubleshooting](#troubleshooting)

---

## 📊 Executive Summary

### Problem Statement
The Order table contains **redundant and unused fields** that cause confusion and bloat the database schema:
- **Duplicate fields** storing identical EasyParcel API data
- **Never-used fields** that were planned but never implemented
- **Empty fields** that exist only in schema, not in code

### Solution
Remove 4 unused/redundant fields from the Order table to:
- ✅ Reduce schema complexity
- ✅ Eliminate data redundancy
- ✅ Improve code maintainability
- ✅ Prevent future confusion

### Risk Mitigation
- All fields verified safe to remove (not in UI, not from API, no business logic)
- Database backup required before migration
- Rollback plan prepared
- Staged deployment (local → staging → production)

---

## 🔍 Analysis Findings

### Field Usage Audit Results

#### ✅ Fields Analyzed: 50+ Order fields
#### ❌ Unused Fields Found: 4
#### 🔄 Redundant Fields Found: 1 (duplicate)

### Detailed Analysis Summary

| Field | Status | Reason | Evidence |
|-------|--------|--------|----------|
| `selectedCourierId` | ❌ **UNUSED** | Never populated anywhere | Only in old docs, not in types |
| `deliveryInstructions` | ❌ **UNUSED** | Never populated anywhere | Only in schema.prisma |
| `estimatedDeliveryDate` | ❌ **UNUSED** | Never populated, using text version | Using `estimatedDelivery` instead |
| `airwayBillNumber` | 🔄 **DUPLICATE** | Exact duplicate of `trackingNumber` | Both set to `parcelDetails.awb` |

### EasyParcel API Integration Verification

**API Response Mapping (100% Safe to Remove):**

```typescript
// fulfill/route.ts:455-456 (CURRENT - PROBLEMATIC)
trackingNumber: parcelDetails.awb || null,      // ← Keep (Primary)
airwayBillNumber: parcelDetails.awb || null,   // ← Remove (Duplicate!)
```

**EasyParcel `payOrder` Response:**
```json
{
  "data": {
    "parcels": [{
      "awb": "TRACKING_NUMBER"  // ← Both fields use THIS value
    }]
  }
}
```

**Conclusion:** `airwayBillNumber` is a redundant copy - safe to remove.

### UI Component Verification

**Components Checked:** 15 UI files
**UI Usage of Fields to Remove:** ❌ **ZERO occurrences**

| Component | Uses Removed Fields? |
|-----------|---------------------|
| TrackingCard.tsx | ❌ No |
| OrderTable.tsx | ❌ No |
| Admin Order Details | ❌ No |
| Member Order Details | ❌ No |
| FulfillmentDialog.tsx | ❌ No |

**TypeScript Types:**
- `selectedCourierId` - ❌ Not in OrderDetailsData
- `deliveryInstructions` - ❌ Not in OrderDetailsData
- `estimatedDeliveryDate` - ❌ Not in OrderDetailsData
- `airwayBillNumber` - ✅ In OrderDetailsData (line 216) - **Must remove from types**

---

## 🗑️ Fields to Remove

### 1. `selectedCourierId` (String, Nullable)

**Why Remove:**
- Never populated in order creation
- Never populated in fulfillment
- Only found in archived documentation files
- Superseded by `selectedCourierServiceId`

**Current Usage:** None
**Impact:** Zero
**Safety:** ✅ 100% Safe

---

### 2. `deliveryInstructions` (String, Nullable)

**Why Remove:**
- Defined in schema but never used
- No form field to capture it
- No display in UI
- Not in TypeScript types

**Current Usage:** None
**Impact:** Zero
**Safety:** ✅ 100% Safe

---

### 3. `estimatedDeliveryDate` (DateTime, Nullable)

**Why Remove:**
- Never populated anywhere
- Using text version `estimatedDelivery` instead (e.g., "3 working days")
- Timestamp format unused

**Current Usage:** None
**Alternative:** `estimatedDelivery` (String) - **Keep this**
**Impact:** Zero
**Safety:** ✅ 100% Safe

---

### 4. `airwayBillNumber` (String, Nullable)

**Why Remove:**
- **Exact duplicate** of `trackingNumber`
- Both fields set to same EasyParcel value: `parcelDetails.awb`
- Not displayed in any UI component
- Causes confusion about which field to use

**Current Usage:**
- Set in `fulfill/route.ts:456` (duplicate assignment)
- In TypeScript `OrderDetailsData` (line 216)
- **NOT displayed in UI**

**Alternative:** `trackingNumber` - **Keep this**
**Impact:** Must update 2 files
**Safety:** ✅ Safe (no UI dependency)

---

## 📈 Impact Assessment

### Database Impact

**Tables Affected:** 1 (Order)
**Columns Removed:** 4
**Data Loss:** None (fields are empty or redundant)
**Performance Impact:** Negligible improvement (smaller row size)

### Code Impact

**Files to Modify:** 3

1. **prisma/schema.prisma**
   - Remove 4 field definitions from Order model

2. **src/app/api/admin/orders/[orderId]/fulfill/route.ts**
   - Remove line 456: `airwayBillNumber` assignment

3. **src/components/admin/orders/types.ts**
   - Remove line 216: `airwayBillNumber` from OrderDetailsData

**Files NOT Affected:**
- ✅ No UI components (verified)
- ✅ No API endpoints (no reads/writes to removed fields)
- ✅ No business logic (fields unused)

### Integration Impact

**EasyParcel API:** ✅ No impact (removing our duplicate, API unchanged)
**Payment Gateway:** ✅ No impact (fields not used)
**Email Notifications:** ✅ No impact (fields not in templates)
**Webhooks:** ✅ No impact (fields not in payloads)

---

## ✅ Pre-Migration Checklist

### 1. Environment Verification

- [ ] Local database is up to date
- [ ] Railway production database accessible
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Railway project linked: `railway link`
- [ ] Environment variables verified: `railway variables`

### 2. Backup Strategy

#### Local Backup
```bash
# Create local backup
pg_dump -h localhost -U postgres -d your_db > backup_local_$(date +%Y%m%d_%H%M%S).sql
```

#### Railway Production Backup
```bash
# Backup Railway database
railway run pg_dump $DATABASE_URL > backup_railway_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file
ls -lh backup_railway_*.sql
```

**Storage Location:** Store backups in `backups/` folder (gitignored)

### 3. Data Verification

#### Check Production Data
```sql
-- Connect to Railway DB
railway run psql $DATABASE_URL

-- Verify fields are empty/redundant
SELECT
  COUNT(*) as total_orders,
  COUNT("selectedCourierId") as has_selected_courier_id,
  COUNT("deliveryInstructions") as has_delivery_instructions,
  COUNT("estimatedDeliveryDate") as has_estimated_delivery_date,
  COUNT("airwayBillNumber") as has_airway_bill_number,
  COUNT("trackingNumber") as has_tracking_number
FROM "Order"
WHERE "createdAt" > NOW() - INTERVAL '30 days';

-- Check for duplicate values (should match if redundant)
SELECT
  COUNT(*) as orders_with_tracking,
  COUNT(CASE WHEN "trackingNumber" = "airwayBillNumber" THEN 1 END) as exact_duplicates,
  COUNT(CASE WHEN "trackingNumber" IS NULL AND "airwayBillNumber" IS NULL THEN 1 END) as both_null
FROM "Order"
WHERE "trackingNumber" IS NOT NULL OR "airwayBillNumber" IS NOT NULL;
```

**Expected Results:**
- `has_selected_courier_id`: 0
- `has_delivery_instructions`: 0
- `has_estimated_delivery_date`: 0
- `exact_duplicates`: Should equal `orders_with_tracking`

### 4. Team Communication

- [ ] Notify team of maintenance window
- [ ] Schedule migration during low-traffic period
- [ ] Prepare rollback communication plan
- [ ] Document all steps for team review

---

## 🛠️ Implementation Steps

### Phase 1: Code Changes (Local Development)

#### Step 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

```diff
model Order {
  id                     String   @id @default(cuid())
  orderNumber            String   @unique
  userId                 String?
  guestEmail             String?

  // ... other fields ...

  trackingNumber         String?
  trackingUrl            String?
- selectedCourierId      String?
- deliveryInstructions   String?
- estimatedDeliveryDate  DateTime?
- airwayBillNumber       String?
  airwayBillUrl          String?
  airwayBillGenerated    Boolean  @default(false)

  // ... rest of fields ...
}
```

#### Step 1.2: Update Fulfillment Route

**File:** `src/app/api/admin/orders/[orderId]/fulfill/route.ts`

**Remove line 456:**

```diff
  const updatedOrder = await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'READY_TO_SHIP',
      trackingNumber: parcelDetails.awb || null,
-     airwayBillNumber: parcelDetails.awb || null,  // ← REMOVE THIS LINE
      airwayBillUrl: parcelDetails.awb_id_link || null,
      airwayBillGenerated: !!parcelDetails.awb_id_link,
      airwayBillGeneratedAt: parcelDetails.awb_id_link ? new Date() : null,
      trackingUrl: parcelDetails.tracking_url || null,
      // ... rest of update ...
    },
  });
```

#### Step 1.3: Update TypeScript Types

**File:** `src/components/admin/orders/types.ts`

**Remove line 216:**

```diff
export interface OrderDetailsData {
  id: string;
  orderNumber: string;
  // ... other fields ...

  trackingNumber: string | null;
- airwayBillNumber: string | null;  // ← REMOVE THIS LINE
  airwayBillUrl: string | null;
  trackingUrl: string | null;

  // ... rest of fields ...
}
```

#### Step 1.4: Generate Prisma Migration

```bash
# Generate migration file
npx prisma migrate dev --name remove_unused_order_fields

# This creates: prisma/migrations/[timestamp]_remove_unused_order_fields/migration.sql
```

**Expected Migration SQL:**
```sql
-- AlterTable
ALTER TABLE "Order"
  DROP COLUMN "selectedCourierId",
  DROP COLUMN "deliveryInstructions",
  DROP COLUMN "estimatedDeliveryDate",
  DROP COLUMN "airwayBillNumber";
```

#### Step 1.5: Verify Generated Migration

```bash
# Check migration file
cat prisma/migrations/*_remove_unused_order_fields/migration.sql

# Verify it only drops the 4 fields
```

---

### Phase 2: Local Testing

#### Step 2.1: Apply Migration Locally

```bash
# Migration already applied by migrate dev
# Verify Prisma client updated
npx prisma generate

# Check migration status
npx prisma migrate status
```

#### Step 2.2: Run Local Application

```bash
# Start development server
npm run dev

# Test in browser: http://localhost:3000
```

#### Step 2.3: Test Order Fulfillment

**Test Scenario: Create and Fulfill Order**

1. **Create Test Order:**
   - Go to `/checkout`
   - Create order as guest
   - Complete payment (use test payment)

2. **Fulfill Order:**
   - Go to `/admin/orders`
   - Find test order
   - Click "Fulfill Order"
   - Select courier and pickup date
   - Verify fulfillment succeeds

3. **Verify Data:**
   ```sql
   -- Check order was fulfilled correctly
   SELECT
     "orderNumber",
     "status",
     "trackingNumber",
     "airwayBillUrl",
     "easyparcelOrderNumber"
   FROM "Order"
   WHERE "orderNumber" = 'ORD-YYYYMMDD-XXXX'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

   **Expected:**
   - `trackingNumber`: Should have value (from EasyParcel)
   - `airwayBillUrl`: Should have value
   - No errors about missing columns

#### Step 2.4: Test UI Components

**Admin UI:**
- [ ] Order list displays correctly
- [ ] Order detail page shows tracking info
- [ ] Fulfillment dialog works
- [ ] "View AWB" button works

**Customer UI:**
- [ ] Member order page displays tracking
- [ ] Order summary shows correctly
- [ ] No console errors

#### Step 2.5: Run Type Checking

```bash
# Verify TypeScript compiles
npm run typecheck

# Expected: No type errors
```

#### Step 2.6: Run Tests (if applicable)

```bash
# Run unit tests
npm run test

# Run E2E tests (if configured)
npm run test:e2e
```

---

### Phase 3: Code Review & Commit

#### Step 3.1: Review Changes

```bash
# Check all modified files
git status

# Review changes
git diff prisma/schema.prisma
git diff src/app/api/admin/orders/[orderId]/fulfill/route.ts
git diff src/components/admin/orders/types.ts
```

#### Step 3.2: Commit Changes

```bash
# Stage changes
git add prisma/schema.prisma
git add prisma/migrations/
git add src/app/api/admin/orders/[orderId]/fulfill/route.ts
git add src/components/admin/orders/types.ts

# Commit with detailed message
git commit -m "feat: Remove unused and redundant Order fields

Remove 4 unused/redundant fields from Order table:
- selectedCourierId: Never used, superseded by selectedCourierServiceId
- deliveryInstructions: Never implemented
- estimatedDeliveryDate: Never used, using estimatedDelivery text instead
- airwayBillNumber: Exact duplicate of trackingNumber

Analysis verified:
✅ No UI components use these fields
✅ No API integration dependencies
✅ No business logic impact
✅ EasyParcel integration unchanged
✅ All tests passing

Migration: prisma/migrations/[timestamp]_remove_unused_order_fields

Breaking Changes: None
Rollback: Migration can be reverted if needed"
```

---

## 🧪 Testing & Validation

### Test Matrix

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| **TC-1** | Order creation | Order creates successfully | ⬜ |
| **TC-2** | Order fulfillment | Tracking number populated correctly | ⬜ |
| **TC-3** | Admin order list | Orders display without errors | ⬜ |
| **TC-4** | Admin order detail | Tracking info shows correctly | ⬜ |
| **TC-5** | Customer order view | Tracking displays for customer | ⬜ |
| **TC-6** | AWB URL access | "View AWB" button works | ⬜ |
| **TC-7** | TypeScript compile | No type errors | ⬜ |
| **TC-8** | Database query | No missing column errors | ⬜ |

### Validation SQL Queries

#### Query 1: Verify Columns Dropped
```sql
-- Check Order table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Order'
  AND column_name IN (
    'selectedCourierId',
    'deliveryInstructions',
    'estimatedDeliveryDate',
    'airwayBillNumber',
    'trackingNumber',  -- Should exist
    'airwayBillUrl'    -- Should exist
  )
ORDER BY column_name;
```

**Expected Result:** Only `trackingNumber` and `airwayBillUrl` should exist.

#### Query 2: Verify Recent Orders
```sql
-- Check recent fulfilled orders have tracking data
SELECT
  "orderNumber",
  "status",
  "trackingNumber",
  "airwayBillUrl",
  "createdAt"
FROM "Order"
WHERE "status" IN ('READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED')
  AND "createdAt" > NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected Result:** `trackingNumber` and `airwayBillUrl` populated for fulfilled orders.

---

## 🚀 Deployment to Railway

### Pre-Deployment Checklist

- [ ] All local tests passed
- [ ] Code reviewed and approved
- [ ] Railway database backup created
- [ ] Low-traffic time window scheduled
- [ ] Team notified of deployment

### Deployment Steps

#### Step 1: Verify Railway Connection

```bash
# Login to Railway
railway login

# Link to project
railway link

# Verify connection
railway status
```

#### Step 2: Check Current Migration Status

```bash
# Check applied migrations on Railway
railway run npx prisma migrate status
```

#### Step 3: Push Code to Railway

```bash
# Push to Railway
git push railway main

# Railway automatically runs:
# 1. npm run build (includes prisma generate)
# 2. npm run db:deploy:production (runs prisma migrate deploy)
# 3. npm run start
```

**Monitor Deployment:**
```bash
# Watch Railway logs
railway logs

# Look for:
# ✅ "Migration successful"
# ✅ "Prisma Client generated"
# ✅ "Server started"
```

#### Step 4: Verify Deployment

```bash
# Check migration applied
railway run npx prisma migrate status

# Should show:
# ✅ [timestamp]_remove_unused_order_fields ... Applied
```

#### Step 5: Smoke Test Production

**Test Checklist:**
1. [ ] Visit production URL: `https://your-app.railway.app`
2. [ ] Login to admin: `/admin/orders`
3. [ ] View recent orders - should load without errors
4. [ ] Click on order detail - tracking info displays
5. [ ] Check browser console - no errors

**Production Validation Query:**
```bash
# Run on Railway database
railway run psql $DATABASE_URL -c "
SELECT COUNT(*) as total_orders,
       COUNT(\"trackingNumber\") as with_tracking,
       COUNT(\"airwayBillUrl\") as with_awb_url
FROM \"Order\"
WHERE \"status\" = 'READY_TO_SHIP'
  AND \"createdAt\" > NOW() - INTERVAL '24 hours';
"
```

---

## 🔄 Rollback Procedures

### When to Rollback

**Trigger Conditions:**
- Migration fails to apply
- Application errors after deployment
- Data inconsistency detected
- Critical functionality broken

### Rollback Methods

#### Method 1: Git Revert (Recommended)

```bash
# Revert the commit
git revert HEAD

# Push revert to Railway
git push railway main

# Railway will redeploy with previous schema
```

**Note:** This creates a new migration that adds the columns back.

#### Method 2: Manual Migration Rollback

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back [timestamp]_remove_unused_order_fields

# Create inverse migration
npx prisma migrate dev --name restore_removed_order_fields
```

**Inverse Migration SQL:**
```sql
-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "selectedCourierId" TEXT,
  ADD COLUMN "deliveryInstructions" TEXT,
  ADD COLUMN "estimatedDeliveryDate" TIMESTAMP(3),
  ADD COLUMN "airwayBillNumber" TEXT;
```

#### Method 3: Database Restore (Last Resort)

```bash
# Restore from backup
railway run psql $DATABASE_URL < backup_railway_YYYYMMDD_HHMMSS.sql
```

**⚠️ Warning:** Only use if data loss occurred. This restores entire database.

### Rollback Verification

After rollback:
```sql
-- Verify columns restored
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Order'
  AND column_name IN (
    'selectedCourierId',
    'deliveryInstructions',
    'estimatedDeliveryDate',
    'airwayBillNumber'
  );
```

**Expected:** All 4 columns should exist again.

---

## ✔️ Post-Migration Verification

### 1. Database Verification

```sql
-- Railway Production Database
railway run psql $DATABASE_URL

-- Run verification queries:

-- 1. Check columns dropped
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Order'
ORDER BY ordinal_position;

-- 2. Verify recent orders
SELECT "orderNumber", "status", "trackingNumber", "airwayBillUrl"
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 5;

-- 3. Check fulfillment still working
SELECT COUNT(*) as fulfilled_orders_24h
FROM "Order"
WHERE "status" = 'READY_TO_SHIP'
  AND "createdAt" > NOW() - INTERVAL '24 hours';
```

### 2. Application Verification

**Admin Dashboard:**
- [ ] Orders page loads
- [ ] Order details display
- [ ] Fulfillment works
- [ ] Tracking info shows

**Customer Portal:**
- [ ] Order history loads
- [ ] Order details display
- [ ] Tracking number visible

**API Endpoints:**
- [ ] GET /api/orders - Returns orders
- [ ] GET /api/admin/orders - Returns admin orders
- [ ] POST /api/admin/orders/[id]/fulfill - Fulfills order

### 3. Monitoring

**Check Logs:**
```bash
# Railway logs
railway logs --tail 100

# Look for errors related to:
# - Missing column
# - Order queries
# - Fulfillment operations
```

**Check Sentry (if configured):**
- No new errors related to Order table
- No database query errors

### 4. Performance Check

```sql
-- Check query performance (should be same or better)
EXPLAIN ANALYZE
SELECT * FROM "Order"
WHERE "status" = 'PAID'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue 1: Migration Fails - Column Still Referenced

**Error:**
```
Error: Column "airwayBillNumber" is still referenced by table/view
```

**Cause:** Code still references removed field

**Solution:**
1. Check if all code changes committed:
   ```bash
   git diff src/
   ```
2. Verify TypeScript types updated
3. Search for references:
   ```bash
   grep -r "airwayBillNumber" src/
   grep -r "selectedCourierId" src/
   ```

### Issue 2: TypeScript Type Errors

**Error:**
```
Property 'airwayBillNumber' does not exist on type 'OrderDetailsData'
```

**Cause:** TypeScript cache not updated

**Solution:**
```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

### Issue 3: Railway Deployment Fails

**Error:**
```
Migration failed to apply
```

**Cause:** Railway database out of sync

**Solution:**
```bash
# Check migration status
railway run npx prisma migrate status

# Reset migration (if safe)
railway run npx prisma migrate resolve --applied [migration_name]

# Redeploy
git push railway main --force
```

### Issue 4: UI Shows Errors After Migration

**Error:** Console shows "undefined" for removed fields

**Cause:** Client-side cache or stale data

**Solution:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Check for cached API responses

### Issue 5: Can't Access Railway Database

**Error:**
```
Connection refused
```

**Solution:**
```bash
# Get fresh DATABASE_URL
railway variables get DATABASE_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# If still fails, check Railway dashboard
railway open
```

---

## 📝 Success Criteria

### Migration Success Checklist

- [ ] All 4 fields removed from database
- [ ] No application errors in logs
- [ ] Order creation works
- [ ] Order fulfillment works
- [ ] Tracking displays correctly
- [ ] Admin UI functional
- [ ] Customer UI functional
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Performance same or improved

### Acceptance Criteria

**Must Have:**
1. ✅ Database columns dropped successfully
2. ✅ Application runs without errors
3. ✅ Order fulfillment flow works end-to-end
4. ✅ Tracking information displays correctly
5. ✅ No data loss

**Nice to Have:**
1. ✅ Improved schema clarity
2. ✅ Faster database queries (smaller row size)
3. ✅ Better code maintainability

---

## 📊 Execution Timeline

### Estimated Duration: 2-4 hours

| Phase | Task | Duration | Notes |
|-------|------|----------|-------|
| **Preparation** | Backup & verification | 30 min | Critical step |
| **Development** | Code changes | 30 min | Simple changes |
| **Local Testing** | Full test suite | 45 min | Thorough testing |
| **Code Review** | Review & approval | 15 min | Team review |
| **Deployment** | Railway deployment | 15 min | Automated |
| **Verification** | Post-deploy checks | 30 min | Ensure success |
| **Buffer** | Contingency | 30 min | For issues |

### Recommended Schedule

**Best Time:** Low-traffic period (e.g., 2 AM - 4 AM local time)

**Day 1 (Development):**
- Morning: Code changes + local testing
- Afternoon: Code review + staging deploy (if available)

**Day 2 (Production):**
- Early morning: Railway backup + deployment
- Morning: Verification + monitoring

---

## 👥 Team Responsibilities

### Developer (Primary)
- [ ] Execute code changes
- [ ] Run local tests
- [ ] Create migration
- [ ] Deploy to Railway
- [ ] Monitor deployment

### Database Admin (if separate)
- [ ] Create database backups
- [ ] Verify migration SQL
- [ ] Monitor database performance
- [ ] Execute rollback if needed

### QA Team (if available)
- [ ] Test order fulfillment
- [ ] Verify UI functionality
- [ ] Validate tracking display
- [ ] Report any issues

### DevOps (if available)
- [ ] Monitor Railway logs
- [ ] Check application health
- [ ] Verify deployment success
- [ ] Manage rollback if needed

---

## 🔗 References

### Documentation
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Railway Deployments: https://docs.railway.app/deploy/deployments
- PostgreSQL ALTER TABLE: https://www.postgresql.org/docs/current/sql-altertable.html

### Project Files
- Schema: `prisma/schema.prisma`
- Fulfillment API: `src/app/api/admin/orders/[orderId]/fulfill/route.ts`
- Types: `src/components/admin/orders/types.ts`
- Migration Analysis: `ORDER_FIELD_MIGRATION_PLAN.md` (this file)

### Migration Files
- Migration: `prisma/migrations/[timestamp]_remove_unused_order_fields/`
- Backup Location: `backups/backup_railway_YYYYMMDD_HHMMSS.sql`

---

## ✅ Final Approval

### Sign-off Required

**Developer:** _______________ Date: _______
**Tech Lead:** _______________ Date: _______
**Database Admin:** _______________ Date: _______ (if applicable)

### Pre-Execution Checklist

- [ ] All findings reviewed and understood
- [ ] Backup strategy confirmed
- [ ] Rollback plan prepared
- [ ] Team notified
- [ ] Maintenance window scheduled
- [ ] All tests passing locally
- [ ] Railway connection verified
- [ ] This document reviewed by team

---

## 📌 Quick Reference Commands

### Essential Commands

```bash
# === BACKUP ===
railway run pg_dump $DATABASE_URL > backup_railway_$(date +%Y%m%d_%H%M%S).sql

# === MIGRATION ===
npx prisma migrate dev --name remove_unused_order_fields
npx prisma generate
npm run typecheck

# === DEPLOY ===
git add . && git commit -m "feat: Remove unused Order fields"
git push railway main

# === VERIFY ===
railway run npx prisma migrate status
railway logs --tail 100

# === ROLLBACK (if needed) ===
git revert HEAD
git push railway main

# === DATABASE ACCESS ===
railway run psql $DATABASE_URL
```

---

**END OF MIGRATION PLAN**

*Last Updated: 2025-10-17*
*Version: 1.0*
*Status: Ready for Execution*
