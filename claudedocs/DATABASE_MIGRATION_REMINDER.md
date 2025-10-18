# Database Migration Reminder - TrackingCache Cleanup

**⚠️ IMPORTANT: Read this before implementing new simple tracking system**

## Current State (After Cleanup - October 18, 2025)

### What Was Done
✅ **Code Cleanup Completed**:
- Deleted 47 files (17,172 lines of over-engineered tracking code)
- Removed all tracking components, services, and utilities
- Fixed all broken imports in codebase
- Committed changes to git

✅ **Schema Updated**:
- Marked `TrackingCache`, `TrackingUpdateLog`, `TrackingJobQueue` as `@deprecated`
- Added comments: "No longer used, replaced with simplified tracking approach"
- **Tables still exist in database** (intentionally kept for rollback safety)

### What Was NOT Done (Intentionally)
❌ **No Database Migration Run**:
- Tables still exist in PostgreSQL database
- Order.trackingCache relationship still exists in schema
- No `npx prisma migrate dev` executed
- This is **intentional for safety**

## Migration Timeline

### Phase 1: Now → November 17, 2025 (30-Day Safety Window)
**Status**: ⏸️ **KEEP TABLES - DO NOTHING**

**Why Wait**:
- Rollback capability if new implementation has issues
- Existing tracking_cache data preserved (if any)
- Zero risk of data loss

**What You Can Do**:
- ✅ Implement new simple tracking system
- ✅ Test new tracking thoroughly
- ✅ Deploy to production
- ✅ Monitor for any issues

**What NOT to Do**:
- ❌ Do NOT drop TrackingCache tables
- ❌ Do NOT run migrations to remove tables
- ❌ Do NOT remove schema models yet

### Phase 2: After November 17, 2025 (Post 30-Day Window)
**Status**: ⏳ **EXECUTE MIGRATION**

**Prerequisites Before Migration**:
- [ ] New simple tracking system fully implemented
- [ ] New system tested and working in production
- [ ] At least 30 days passed with no rollback needed
- [ ] Confirmed no production issues with new system

**Migration Steps**:

#### Step 1: Remove TrackingCache from Schema
```prisma
// File: prisma/schema.prisma

// 1. In Order model (around line 296), REMOVE this line:
- trackingCache            TrackingCache?

// 2. DELETE entire TrackingCache model (lines 806-843):
- /// @deprecated - No longer used, replaced with simplified tracking approach
- /// Keep table for now in case rollback needed. Can drop after 30 days.
- model TrackingCache {
-   id                     String              @id @default(cuid())
-   orderId                String              @unique
-   courierTrackingNumber  String
-   courierService         String
-   currentStatus          String
-   lastStatusUpdate       DateTime
-   trackingEvents         Json                @default("[]")
-   estimatedDelivery      DateTime?
-   actualDelivery         DateTime?
-   deliveryLocation       String?
-   lastApiUpdate          DateTime
-   nextUpdateDue          DateTime
-   updateFrequencyMinutes Int                 @default(120)
-   consecutiveFailures    Int                 @default(0)
-   isDelivered            Boolean             @default(false)
-   isFailed               Boolean             @default(false)
-   isActive               Boolean             @default(true)
-   requiresAttention      Boolean             @default(false)
-   lastApiResponse        Json?
-   apiResponseHash        String?
-   createdAt              DateTime            @default(now())
-   updatedAt              DateTime            @updatedAt
-   order                  Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
-   jobQueue               TrackingJobQueue[]
-   updateLogs             TrackingUpdateLog[]
-
-   @@unique([orderId, courierTrackingNumber])
-   @@index([orderId])
-   @@index([courierTrackingNumber])
-   @@index([nextUpdateDue])
-   @@index([isActive, isDelivered])
-   @@index([currentStatus])
-   @@index([requiresAttention])
-   @@map("tracking_cache")
- }

// 3. DELETE TrackingUpdateLog model (lines 845-869):
- /// @deprecated - Related to deprecated TrackingCache
- model TrackingUpdateLog {
-   id                String        @id @default(cuid())
-   trackingCacheId   String
-   updateType        String
-   triggeredBy       String?
-   apiCallSuccess    Boolean
-   apiResponseTimeMs Int?
-   apiStatusCode     Int?
-   apiErrorMessage   String?
-   statusChanged     Boolean       @default(false)
-   previousStatus    String?
-   newStatus         String?
-   eventsAdded       Int           @default(0)
-   startedAt         DateTime
-   completedAt       DateTime?
-   createdAt         DateTime      @default(now())
-   trackingCache     TrackingCache @relation(fields: [trackingCacheId], references: [id], onDelete: Cascade)
-
-   @@index([trackingCacheId])
-   @@index([startedAt])
-   @@index([apiCallSuccess])
-   @@index([updateType])
-   @@map("tracking_update_logs")
- }

// 4. DELETE TrackingJobQueue model (lines 871-893):
- /// @deprecated - Related to deprecated TrackingCache
- model TrackingJobQueue {
-   id              String            @id @default(cuid())
-   trackingCacheId String
-   jobType         TrackingJobType
-   priority        Int               @default(100)
-   scheduledFor    DateTime
-   attempts        Int               @default(0)
-   maxAttempts     Int               @default(3)
-   lastAttemptAt   DateTime?
-   lastError       String?
-   status          TrackingJobStatus @default(PENDING)
-   createdAt       DateTime          @default(now())
-   updatedAt       DateTime          @updatedAt
-   trackingCache   TrackingCache     @relation(fields: [trackingCacheId], references: [id], onDelete: Cascade)
-
-   @@index([scheduledFor, status])
-   @@index([trackingCacheId])
-   @@index([status])
-   @@index([priority])
-   @@index([jobType])
-   @@map("tracking_job_queue")
- }

// 5. DELETE deprecated enums (around lines 465-477):
- enum TrackingJobStatus {
-   PENDING
-   RUNNING
-   COMPLETED
-   FAILED
- }
-
- enum TrackingJobType {
-   UPDATE
-   RETRY
-   MANUAL
-   CLEANUP
- }
```

#### Step 2: Create and Run Migration
```bash
# 1. Create migration
npx prisma migrate dev --name drop_deprecated_tracking_tables

# 2. Review generated migration SQL
cat prisma/migrations/YYYYMMDDHHMMSS_drop_deprecated_tracking_tables/migration.sql

# Expected SQL:
# DROP TABLE IF EXISTS "tracking_job_queue";
# DROP TABLE IF EXISTS "tracking_update_logs";
# DROP TABLE IF EXISTS "tracking_cache";
# DROP TYPE IF EXISTS "TrackingJobStatus";
# DROP TYPE IF EXISTS "TrackingJobType";

# 3. Apply migration (already applied by migrate dev)
# Migration automatically runs on dev

# 4. For production (Railway):
npx prisma migrate deploy
```

#### Step 3: Verify Cleanup
```bash
# 1. Verify no code references TrackingCache
grep -r "TrackingCache" src/
# Should return: No matches

grep -r "TrackingUpdateLog" src/
# Should return: No matches

grep -r "TrackingJobQueue" src/
# Should return: No matches

# 2. Verify database state
psql $DATABASE_URL -c "\dt tracking*"
# Should return: No tables found

# 3. Verify Prisma client regenerated
npx prisma generate

# 4. Verify TypeScript compiles
npm run typecheck
# Should return: No errors
```

#### Step 4: Commit Migration
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: Remove deprecated TrackingCache tables

- Removed TrackingCache, TrackingUpdateLog, TrackingJobQueue models
- Removed Order.trackingCache relationship
- Removed TrackingJobStatus and TrackingJobType enums
- Applied migration to drop tables from database

Completed 30-day safety window since cleanup on 2025-10-18.
New simple tracking system verified stable in production."

git push origin main
```

## Rollback Plan (If Needed Before Migration)

If you need to rollback to old tracking system **before running migration**:

```bash
# 1. Revert to backup commit
git log --oneline  # Find: "backup: Pre-tracking cleanup state"
git revert 2386015  # Revert cleanup commit

# 2. Reinstall dependencies
npm install

# 3. Regenerate Prisma client
npx prisma generate

# 4. Restart application
npm run dev
```

**Note**: After migration (Step 2 above), rollback is **NOT possible** without database restore.

## Files to Track

### Schema File
- **File**: `prisma/schema.prisma`
- **Current Lines to Remove**:
  - Line 296: `trackingCache TrackingCache?`
  - Lines 806-893: All three deprecated models
  - Lines 465-477: Deprecated enums

### Migration Directory
- **Location**: `prisma/migrations/`
- **Expected New Migration**: `YYYYMMDDHHMMSS_drop_deprecated_tracking_tables/`

## Important Notes

1. **Backup First**: Before running migration, backup your production database
   ```bash
   # Railway backup (automatic daily backups available)
   # Or manual backup:
   pg_dump $DATABASE_URL > backup_before_tracking_migration.sql
   ```

2. **Zero Downtime**: Migration should be safe as:
   - No code references these tables anymore
   - New tracking system doesn't use these tables
   - Tables are isolated (no foreign keys from other tables)

3. **Size Check**: If tables have significant data, check size first:
   ```sql
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE tablename IN ('tracking_cache', 'tracking_update_logs', 'tracking_job_queue')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

4. **Production Timing**: Run migration during low-traffic period (even though it's safe)

## Quick Reference

| Action | When | Command |
|--------|------|---------|
| Remove from schema | After Nov 17, 2025 | Edit `prisma/schema.prisma` |
| Create migration | After schema edit | `npx prisma migrate dev --name drop_deprecated_tracking_tables` |
| Apply to production | After dev migration | `npx prisma migrate deploy` |
| Verify cleanup | After migration | `grep -r "TrackingCache" src/` |

## Checklist for Migration Day

**Pre-Migration**:
- [ ] Confirmed new tracking system working in production for 30+ days
- [ ] Backed up production database
- [ ] Reviewed migration plan with team
- [ ] Scheduled during low-traffic window

**Migration Execution**:
- [ ] Removed models from `prisma/schema.prisma`
- [ ] Ran `npx prisma migrate dev --name drop_deprecated_tracking_tables`
- [ ] Reviewed generated SQL migration file
- [ ] Verified `npm run typecheck` passes
- [ ] Tested new tracking system still works
- [ ] Applied to production: `npx prisma migrate deploy`

**Post-Migration**:
- [ ] Verified tables dropped: `psql $DATABASE_URL -c "\dt tracking*"`
- [ ] Confirmed no code references: `grep -r "TrackingCache" src/`
- [ ] Committed migration to git
- [ ] Monitored production for any issues
- [ ] Updated this document with completion date

---

**Document Created**: October 18, 2025
**Cleanup Completed**: October 18, 2025
**Migration Eligible After**: November 17, 2025 (30 days)
**Migration Executed**: ⏳ *Pending - Not yet executed*

**Last Updated**: October 18, 2025
