# Migration Management Guide

## Overview

This project uses Prisma migrations with a **fail-fast** approach for production safety. Railway deployments will stop if failed migrations are detected, requiring manual investigation and resolution.

## Why Fail Fast?

Auto-resolving failed migrations can cause:
- Silent data corruption
- Schema/code mismatches
- Lost data integrity checks
- Hidden production issues

**Philosophy**: Better to stop deployment and investigate than risk data corruption.

## Railway Deployment Flow

```
Deploy → Check migrations → Failed? → STOP ❌
                          → Success? → Continue ✅
```

## When Migration Fails

Railway will show this error:

```
❌ DEPLOYMENT STOPPED: Failed migration detected!

A previous migration failed and must be resolved manually to prevent data corruption.
```

### Step-by-Step Resolution

#### 1. **Investigate the Failure**

```bash
# Check migration status
railway run npx prisma migrate status

# Pull actual database schema
railway run npx prisma db pull
```

#### 2. **Compare Schema**

- Check `prisma/schema.prisma` (your code)
- Check pulled schema from database (reality)
- Identify the mismatch

#### 3. **Determine Action**

**Scenario A: Migration already applied (column exists)**
```bash
# The migration failed but the column was actually created
# Safe to mark as resolved

CONFIRM_MIGRATION_RESOLVE=yes railway run node scripts/fix-failed-migration.js
```

**Scenario B: Migration partially applied**
```bash
# Need to manually fix the database first
railway run psql $DATABASE_URL

# Then resolve the migration
railway run npx prisma migrate resolve --applied <migration_name>
```

**Scenario C: Migration completely failed**
```bash
# Roll back the migration
railway run npx prisma migrate resolve --rolled-back <migration_name>

# Fix the issue and create new migration
npx prisma migrate dev --name fix_issue
git push
```

## Manual Resolution Script

The `fix-failed-migration.js` script provides safety checks:

### Local Usage (Interactive)
```bash
node scripts/fix-failed-migration.js
```
- Shows migration status
- Lists failed migrations
- Asks for confirmation

### Railway Usage (Non-interactive)
```bash
# Requires explicit confirmation flag
CONFIRM_MIGRATION_RESOLVE=yes railway run node scripts/fix-failed-migration.js
```

## Best Practices

### ✅ Do:
- Investigate every failed migration
- Test migrations in development first
- Use descriptive migration names
- Check database state before resolving
- Keep migration history clean

### ❌ Don't:
- Auto-resolve without investigation
- Skip migration status checks
- Delete migrations that ran in production
- Manually edit migration files after deployment
- Use `--skip-seed` or migration flags in production

## Common Issues

### Issue: "Column already exists"

**Cause**: Migration tried to add column that's already in DB

**Fix**:
```bash
# Verify column exists
railway run psql $DATABASE_URL -c "\d products"

# If column exists, mark migration as applied
railway run npx prisma migrate resolve --applied <migration_name>
```

### Issue: "Migration file deleted locally"

**Cause**: Deleted migration file but DB still has it

**Fix**:
```bash
# Don't delete migrations that ran in production
# If already deleted, you must mark as resolved
railway run npx prisma migrate resolve --applied <migration_name>
```

### Issue: "Schema drift detected"

**Cause**: Database doesn't match schema.prisma

**Fix**:
```bash
# Pull actual schema
railway run npx prisma db pull

# Compare with schema.prisma
# Create new migration to reconcile
npx prisma migrate dev --name reconcile_schema
```

## Migration Workflow

### Development
```bash
# 1. Make schema changes
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_feature

# 3. Test locally
npm run dev

# 4. Commit and push
git add .
git commit -m "feat: add feature"
git push
```

### Production (Railway)
```bash
# Automatic via railway-start.js:
1. Check migration status
2. Fail if issues found
3. Run: npx prisma migrate deploy
4. Start application
```

## Emergency Procedures

### Rollback Last Migration
```bash
# 1. Mark as rolled back
railway run npx prisma migrate resolve --rolled-back <migration_name>

# 2. Manually revert database changes
railway run psql $DATABASE_URL
# Run DROP/ALTER statements

# 3. Remove migration locally
rm -rf prisma/migrations/<migration_name>

# 4. Push fix
git push
```

### Force Clean State
```bash
# ⚠️ DANGEROUS - Only in emergencies

# 1. Backup database first!
railway run pg_dump $DATABASE_URL > backup.sql

# 2. Reset migration table
railway run npx prisma migrate resolve --applied <migration_name>

# 3. Redeploy
git commit --allow-empty -m "trigger redeploy"
git push
```

## Monitoring

Check migration health:
```bash
# View deployment logs
railway logs

# Check migration status
railway run npx prisma migrate status

# Verify schema matches
railway run npx prisma db pull
git diff prisma/schema.prisma
```

## Support

If you encounter migration issues:
1. Check Railway logs: `railway logs`
2. Check migration status: `railway run npx prisma migrate status`
3. Review this guide
4. Investigate before resolving
5. Document resolution for future reference
