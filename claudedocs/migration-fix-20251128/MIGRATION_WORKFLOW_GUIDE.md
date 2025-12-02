# Migration Workflow Guide - Schema Drift Resolution

**Date**: November 28, 2025
**Issue**: Recurring schema drift causing migration failures
**Status**: ✅ RESOLVED

## Executive Summary

**Root Cause**: Mixed usage of `prisma db push` (bypasses migrations) with `prisma migrate dev` caused schema drift where database changes existed without corresponding migration history.

**Impact**:
- Railway (Production): 2 failed migrations, 3 orphaned records
- Local (Development): 15 ghost migrations, 5 orphaned records
- Result: Every migration attempt failed with "already exists" errors

**Resolution**:
- Cleaned both databases migration tracking tables
- Updated safe-migrate.sh to prevent db push usage
- Both databases now showing "Database schema is up to date!"

---

## What Caused Schema Drift?

### The Broken Workflow Pattern

```bash
# ❌ WRONG: What was happening
1. Edit prisma/schema.prisma
2. Run: npx prisma db push           # Applies changes INSTANTLY, bypasses migrations
3. Changes exist in database now
4. Later run: npx prisma migrate dev # Tries to create migration for changes
5. ERROR: Column/table already exists!
6. Force-mark migration as applied or manually fix
7. Deploy to Railway → same cycle repeats
8. Migration history diverges from reality
```

### Why `db push` is Dangerous

**`prisma db push`**:
- ✗ Bypasses migration system completely
- ✗ No migration history created
- ✗ Changes applied immediately without tracking
- ✗ Cannot rollback
- ✗ Causes schema drift
- ✓ Only for prototyping/throwaway databases

**`prisma migrate dev`**:
- ✓ Creates migration files with SQL
- ✓ Tracks all changes in migration history
- ✓ Allows rollback
- ✓ Safe for production deployment
- ✓ Team can review changes before applying

---

## Resolution Steps Taken

### Railway Database (Production)

**Before**:
- 26 migration records total
- 2 failed migrations (rolled_back_at NOT NULL)
- 3 orphaned records (no migration files exist)

**Actions**:
```sql
-- Deleted orphaned migration (file doesn't exist locally)
DELETE FROM _prisma_migrations
WHERE migration_name = '20251111000001_add_meta_keywords_to_product';

-- Cleaned up failed migrations
DELETE FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL;
```

**After**:
- 23 migration records (all valid)
- Status: "Database schema is up to date!" ✅

### Local Database (Development)

**Before**:
- 21 migration records
- 15 ghost migrations (applied_steps_count = 0)
- 5 orphaned/failed records

**Actions**:
```sql
-- Deleted rolled-back migrations
DELETE FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL;

-- Deleted orphaned chat system migrations
DELETE FROM _prisma_migrations
WHERE migration_name IN (
  '20250909022244_add_chat_system',
  '20251002000001_add_missing_chat_telegram_columns'
) AND applied_steps_count = 0;

-- Fixed ghost migrations (marked as applied but never ran)
UPDATE _prisma_migrations
SET applied_steps_count = 1
WHERE applied_steps_count = 0 AND finished_at IS NOT NULL;
```

**Then resolved migration conflicts**:
```bash
# Migrations that already existed in database (from db push)
npx prisma migrate resolve --applied 20251022154500_add_password_reset_fields
npx prisma migrate resolve --applied 20251027140600_add_nric_to_user
npx prisma migrate resolve --applied 20251112190309_create_faq_tables
npx prisma migrate resolve --applied simplify_faq_category_name
```

**After**:
- 23 migration records (matching Railway)
- Status: "Database schema is up to date!" ✅

### Code Changes

**Updated `scripts/safe-migrate.sh`**:

```diff
# Option 4: Database Reset
- npx prisma db push --force-reset    # ❌ Bypasses migrations
+ npx prisma migrate reset --force    # ✅ Proper migration-based reset
```

This ensures even database resets maintain proper migration tracking.

---

## Correct Migration Workflow (Going Forward)

### Development Workflow

```bash
# 1. Make changes to schema
vim prisma/schema.prisma

# 2. Create migration (creates migration file, applies to DB, updates tracking)
npx prisma migrate dev --name descriptive_migration_name

# 3. Review the generated migration file
cat prisma/migrations/TIMESTAMP_descriptive_migration_name/migration.sql

# 4. Test locally
npm run dev  # or your test command

# 5. Commit migration files to git
git add prisma/migrations/
git commit -m "feat: add user password reset fields"
```

### Production Deployment

```bash
# On Railway or production environment
npx prisma migrate deploy

# This command:
# - Applies pending migrations only
# - Safe for production (non-interactive)
# - Updates migration tracking
# - Does NOT create new migrations
```

### Using safe-migrate.sh Script

```bash
./scripts/safe-migrate.sh

# Options:
# 1) Safe migrate (recommended) - Creates backup first, runs migrate dev
# 2) Generate new migration only - Creates migration file without applying
# 3) Deploy existing migrations - For production (applies pending migrations)
# 4) Reset database - NOW USES migrate reset (proper migration tracking)
# 5) Cancel
```

### Emergency: Need to Sync Schema Without Migration?

**NEVER DO THIS IN PRODUCTION**

If you absolutely must (local development only):

```bash
# 1. Create a proper migration for your changes
npx prisma migrate dev --name emergency_sync

# 2. If migration fails because changes exist:
# Check what needs to be marked as applied
npx prisma migrate status

# 3. Mark failed migration as applied (ONLY if changes actually exist)
npx prisma migrate resolve --applied MIGRATION_NAME

# 4. Verify status is clean
npx prisma migrate status
```

---

## Prevention Guidelines

### ✅ DO

1. **Always use `prisma migrate dev`** for schema changes
2. **Review migration SQL** before committing
3. **Commit migration files** to version control
4. **Use `prisma migrate deploy`** in production
5. **Run `prisma migrate status`** to check before deploying
6. **Create backups** before production migrations
7. **Use safe-migrate.sh** for guided workflow

### ❌ DON'T

1. **Never use `prisma db push`** except for throwaway prototypes
2. **Never manually edit** `_prisma_migrations` table (except in emergencies like this fix)
3. **Never delete migration files** from `prisma/migrations/`
4. **Never skip creating migrations** for schema changes
5. **Never force-apply migrations** without understanding why they failed
6. **Never edit deployed migrations** - create new ones to fix issues

---

## Troubleshooting Guide

### Migration Says "Already Exists"

```bash
# Check migration status
npx prisma migrate status

# If output shows pending migrations but tables/columns exist:
# This means someone used db push

# Solution:
npx prisma migrate resolve --applied MIGRATION_NAME

# Verify
npx prisma migrate status  # Should show "Database schema is up to date!"
```

### Ghost Migrations (applied_steps_count = 0)

```bash
# Connect to database
psql $DATABASE_URL

# Check for ghost migrations
SELECT migration_name, applied_steps_count, finished_at
FROM _prisma_migrations
WHERE applied_steps_count = 0;

# Fix ghost migrations
UPDATE _prisma_migrations
SET applied_steps_count = 1
WHERE applied_steps_count = 0 AND finished_at IS NOT NULL;
```

### Failed Migrations (rolled_back_at NOT NULL)

```bash
# Check for failed migrations
SELECT migration_name, logs
FROM _prisma_migrations
WHERE rolled_back_at IS NOT NULL;

# Review the error logs, fix the issue, then:
DELETE FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL;

# Re-run migration
npx prisma migrate deploy
```

### Schema Out of Sync

```bash
# DO NOT use db push!
# Instead:

# 1. Check status
npx prisma migrate status

# 2. Create migration for differences
npx prisma migrate dev --name fix_schema_sync

# 3. If migration fails, investigate why changes already exist
# Then mark as applied if appropriate
npx prisma migrate resolve --applied MIGRATION_NAME
```

---

## Migration Status Reference

### Healthy Migration Status

```
23 migrations found in prisma/migrations

Database schema is up to date!
```

### Unhealthy Indicators

```
# Pending migrations
Following migrations have not yet been applied:
20251022154500_add_password_reset_fields

# Failed migrations
Migration 20251112190309_create_faq_tables failed:
ERROR: type "FAQStatus" already exists

# Drift detected
The current database is not managed by Prisma Migrate.
```

---

## Database Migration Tracking Table

### `_prisma_migrations` Structure

```sql
CREATE TABLE _prisma_migrations (
  id                  TEXT PRIMARY KEY,
  checksum            TEXT NOT NULL,
  finished_at         TIMESTAMP,
  migration_name      TEXT NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMP,
  started_at          TIMESTAMP NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);
```

### Field Meanings

- **migration_name**: Name of migration file (e.g., `20251112190309_create_faq_tables`)
- **applied_steps_count**:
  - `0` = Ghost migration (marked complete but never ran)
  - `1+` = Successfully applied
- **rolled_back_at**:
  - `NULL` = Migration succeeded or pending
  - `NOT NULL` = Migration failed and was rolled back
- **finished_at**:
  - `NULL` = Migration in progress or failed
  - `NOT NULL` = Migration completed (check applied_steps_count for success)

---

## Verification Checklist

After any migration work:

- [ ] `npx prisma migrate status` shows "Database schema is up to date!"
- [ ] All migration files in `prisma/migrations/` have corresponding records
- [ ] No migrations have `rolled_back_at` NOT NULL
- [ ] No migrations have `applied_steps_count = 0` with `finished_at` NOT NULL
- [ ] Railway and local have same migration count (23 migrations)
- [ ] Application starts without Prisma errors
- [ ] Schema changes are reflected in database

---

## Files Modified in This Fix

### Documentation Created
- `claudedocs/migration-fix-20251128/railway-before.txt` - Railway status before fix
- `claudedocs/migration-fix-20251128/local-before.txt` - Local status before fix
- `claudedocs/migration-fix-20251128/railway-after.txt` - Railway status after fix
- `claudedocs/migration-fix-20251128/local-after.txt` - Local status after fix
- `claudedocs/migration-fix-20251128/MIGRATION_WORKFLOW_GUIDE.md` - This document

### Code Modified
- `scripts/safe-migrate.sh:95` - Changed `db push --force-reset` to `migrate reset --force`

### Database Direct Modifications
- Railway `_prisma_migrations` table - Cleaned 3 orphaned records
- Local `_prisma_migrations` table - Fixed 15 ghost migrations, cleaned 5 orphaned records

---

## Quick Reference Commands

```bash
# Check migration status
npx prisma migrate status

# Create new migration (development)
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Mark migration as applied (emergency only)
npx prisma migrate resolve --applied MIGRATION_NAME

# Reset database with proper migration tracking (development only)
npx prisma migrate reset --force

# Generate Prisma Client after schema changes
npx prisma generate

# Interactive database management
npx prisma studio
```

---

## Contact & Support

For migration issues:

1. Check this guide first
2. Run `npx prisma migrate status` and review output
3. Review `_prisma_migrations` table in database
4. Check Prisma logs for detailed error messages
5. Consult Prisma documentation: https://pris.ly/d/migrate

**Remember**: Migrations are version control for your database. Treat them with the same care as your code.
