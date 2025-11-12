# Railway Database Migration Plan - FAQ CMS Feature

**Date**: 2025-11-12
**Target Environment**: Railway Production PostgreSQL
**Database URL**: `postgresql://postgres:***@yamabiko.proxy.rlwy.net:46096/railway`

---

## 1. Current State Analysis

### Railway Production Database
- **Total Tables**: 40 existing tables
- **Last Migration Applied**: `20251111000001_add_meta_keywords_to_product` (Nov 11, 2025)
- **FAQ Tables Status**: ❌ **NONE EXIST** (Verified via SQL query)
- **Risk Level**: ✅ **LOW** - No existing FAQ data to protect

### Local Development Database
- **Prisma Schema**: Contains 2 new models (FAQCategory, FAQ)
- **Pending Migrations**: 2 files ready to apply
  1. `convert_faq_categories_to_dynamic.sql` (Standalone SQL)
  2. `simplify_faq_category_name/migration.sql` (Prisma migration)

---

## 2. Migration Files Analysis

### File 1: `convert_faq_categories_to_dynamic.sql`
**Type**: Standalone SQL file (NOT tracked by Prisma)
**Purpose**: Create FAQ tables from scratch with initial seed data
**Operations**:
- Creates `faq_categories` table with dual-language support (nameEnglish, nameMalay)
- Inserts 6 default categories with predefined IDs:
  - About Us / Tentang Kami
  - Products / Produk
  - Shipping / Penghantaran
  - Payment / Pembayaran
  - Membership / Keahlian
  - Safety / Keselamatan
- Migrates existing FAQs from enum-based categories to table-based system
- Creates indexes and foreign key constraints

**Railway Impact**: ✅ **SAFE**
- No existing `faq_categories` or `faqs` tables to conflict with
- Will create tables cleanly on empty database

### File 2: `simplify_faq_category_name/migration.sql`
**Type**: Prisma migration (Tracked in `_prisma_migrations` table)
**Purpose**: Simplify category name structure (merge nameEnglish/nameMalay to single 'name')
**Operations**:
- Adds new `name` column
- Copies data from `nameEnglish` to `name`
- Drops old columns: `nameEnglish`, `nameMalay`
- Updates constraints and indexes

**Railway Impact**: ✅ **SAFE**
- Runs AFTER File 1 creates the tables
- Cleans up dual-language structure to single-language (as per current Prisma schema)

---

## 3. Migration Execution Strategy

### ⚠️ Problem Identified
The standalone SQL file (`convert_faq_categories_to_dynamic.sql`) is **NOT tracked by Prisma**.
This means:
- ❌ `prisma migrate deploy` will NOT execute it
- ❌ It won't be recorded in `_prisma_migrations` table
- ⚠️ This will cause **schema mismatch** between Prisma and actual database

### ✅ Recommended Solution: Convert to Proper Prisma Migration

**Action Plan**:
1. Create a timestamped Prisma migration for the initial FAQ tables
2. Apply both migrations sequentially via Prisma CLI
3. Verify migration success
4. Push code to production

---

## 4. Detailed Execution Plan

### Step 1: Pre-Migration Verification ✅ COMPLETED
- [x] Inspect Railway database schema
- [x] Confirm no FAQ tables exist
- [x] Analyze local migration files
- [x] Identify migration dependencies

### Step 2: Create Proper Prisma Migration
**Action**: Convert standalone SQL to proper Prisma migration
```bash
# Create new migration with timestamp
mkdir -p prisma/migrations/20251112_create_faq_tables
cp prisma/migrations/convert_faq_categories_to_dynamic.sql \
   prisma/migrations/20251112_create_faq_tables/migration.sql
```

### Step 3: Set Railway Database URL
```bash
# Temporarily set Railway as target
export DATABASE_URL="postgresql://postgres:NAXcMyxvlPpYwurhcGMSriHywOgyQSUj@yamabiko.proxy.rlwy.net:46096/railway"
```

### Step 4: Apply Migrations to Railway
```bash
# Generate Prisma Client with Railway schema
npx prisma generate

# Apply all pending migrations
npx prisma migrate deploy

# Verify migration success
npx prisma migrate status
```

**Expected Output**:
```
✓ 20251112_create_faq_tables applied
✓ simplify_faq_category_name applied
```

### Step 5: Verify Database State
```bash
# Connect to Railway and verify tables
psql "postgresql://postgres:***@yamabiko.proxy.rlwy.net:46096/railway" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%faq%';"

# Verify data
psql "postgresql://postgres:***@yamabiko.proxy.rlwy.net:46096/railway" \
  -c "SELECT id, name FROM faq_categories ORDER BY sortOrder;"
```

**Expected Tables**:
- `faq_categories` ✅
- `faqs` ✅

**Expected Categories** (6 rows):
1. About Us
2. Products
3. Shipping
4. Payment
5. Membership
6. Safety

### Step 6: Restore Local Database URL
```bash
# Switch back to local database
export DATABASE_URL="postgresql://[local-connection-string]"
```

### Step 7: Push Code to Production
```bash
# Push merged main branch
git push origin main

# Verify deployment
```

---

## 5. Rollback Strategy

### If Migration Fails
```sql
-- Drop FAQ tables (Railway)
DROP TABLE IF EXISTS "faqs" CASCADE;
DROP TABLE IF EXISTS "faq_categories" CASCADE;
DROP TYPE IF EXISTS "FAQCategory";

-- Remove migration records
DELETE FROM "_prisma_migrations"
WHERE migration_name IN ('20251112_create_faq_tables', 'simplify_faq_category_name');
```

### If Application Errors Occur
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Re-deploy previous version
```

---

## 6. Risk Assessment

| Risk Factor | Level | Mitigation |
|------------|-------|------------|
| Data Loss | ✅ **NONE** | No existing FAQ data in production |
| Schema Mismatch | 🟡 **MEDIUM** | Convert standalone SQL to proper Prisma migration |
| Migration Failure | 🟡 **LOW** | Test migrations on staging first (if available) |
| Application Downtime | ✅ **NONE** | Tables are new, existing features unaffected |
| Foreign Key Conflicts | ✅ **NONE** | User table relations are safe (users table exists) |

**Overall Risk**: 🟢 **LOW** - This is a net-new feature with no production data

---

## 7. Success Criteria

- ✅ Railway database has `faq_categories` and `faqs` tables
- ✅ `faq_categories` table has 6 default categories
- ✅ Prisma migration history is complete and consistent
- ✅ Application can successfully query FAQ data from Railway
- ✅ Admin can create/edit/reorder FAQs without errors
- ✅ Public FAQ page displays correctly

---

## 8. Next Steps

**Immediate Actions**:
1. ⏳ Convert `convert_faq_categories_to_dynamic.sql` to proper Prisma migration
2. ⏳ Apply migrations to Railway database
3. ⏳ Verify database state
4. ⏳ Push code to production
5. ⏳ Test FAQ functionality on production

**Timeline Estimate**: 15-20 minutes

**Recommended Approach**:
- Execute migrations during low-traffic period
- Monitor application logs during deployment
- Test FAQ pages immediately after deployment

---

## 9. Migration Dependencies

```
Railway Database (Current)
    ↓
20251112_create_faq_tables (NEW)
    ├─ Creates faq_categories table (with nameEnglish/nameMalay)
    ├─ Creates faqs table
    ├─ Seeds 6 default categories
    └─ Sets up indexes and foreign keys
    ↓
simplify_faq_category_name (NEW)
    ├─ Adds 'name' column
    ├─ Migrates data from nameEnglish
    ├─ Drops nameEnglish/nameMalay columns
    └─ Updates constraints
    ↓
Railway Database (Final State)
    ✅ faq_categories (with 'name' field)
    ✅ faqs (with categoryId foreign key)
```

---

## 10. Testing Checklist

**Post-Migration Testing**:
- [ ] Railway database has correct schema
- [ ] FAQ categories list shows 6 default categories
- [ ] Can create new FAQ category
- [ ] Can edit existing FAQ category
- [ ] Can delete empty FAQ category
- [ ] Can create new FAQ
- [ ] Can edit existing FAQ
- [ ] Can drag-drop reorder FAQs
- [ ] Can drag-drop reorder categories
- [ ] Public FAQ page displays correctly
- [ ] Categories are grouped properly
- [ ] Text formatting is preserved (newlines, wrapping)

---

**Migration Plan Status**: ✅ READY TO EXECUTE
**Approval Required**: YES - User to review plan before execution
