# 🚨 PRODUCTION DATABASE SAFETY PROTOCOL

## CRITICAL INCIDENT REPORT

**Date**: 2025-09-04  
**Incident**: Data loss due to `npx prisma db push --force-reset`  
**Impact**: ALL database data destroyed  
**Status**: RESOLVED with safety systems implemented  

---

## 🛡️ NEW SAFETY SYSTEMS

### 1. Backup-First Policy

**NEVER** run any destructive database operation without backup:

```bash
# ✅ CORRECT - Always backup first
npm run db:backup
npm run db:migrate

# ❌ WRONG - Never do this
npx prisma db push --force-reset
```

### 2. Production-Safe Commands

Use these commands instead of raw Prisma commands:

```bash
# Safe migration with automatic backup
npm run db:migrate

# Manual backup
npm run db:backup

# Restore from backup
npm run db:restore

# Database studio (safe)
npm run db:studio
```

### 3. Migration Safety Levels

#### Development Environment
- Backup recommended before migrations
- `--force-reset` allowed only with explicit confirmation
- Data destruction requires typing "DESTROY_DATA"

#### Production Environment  
- Backup MANDATORY before any operation
- `--force-reset` completely FORBIDDEN
- All destructive operations blocked
- Double confirmation required

---

## 🔧 EMERGENCY PROCEDURES

### If Database is Corrupted

1. **DO NOT PANIC** - Don't make it worse
2. **STOP** the application immediately
3. **BACKUP** current state (even if corrupted)
4. **RESTORE** from last known good backup
5. **VERIFY** data integrity
6. **DOCUMENT** the incident

### Recovery Commands

```bash
# 1. Emergency backup of current state
npm run db:backup

# 2. List available backups
ls -la backups/

# 3. Restore from specific backup
npm run db:restore
# (Follow prompts to select backup)

# 4. Verify restoration
npm run db:studio
```

---

## 📋 MIGRATION CHECKLIST

### Before Migration
- [ ] Application is in maintenance mode
- [ ] Recent backup exists (< 1 hour old)
- [ ] Migration tested on copy of production data
- [ ] Rollback procedure planned
- [ ] Team notified

### During Migration
- [ ] Use `npm run db:migrate` (never raw commands)
- [ ] Monitor for errors
- [ ] Verify data integrity
- [ ] Check application functionality

### After Migration
- [ ] Data integrity verification
- [ ] Application smoke tests
- [ ] Performance check
- [ ] Remove maintenance mode
- [ ] Document changes

---

## 🚨 PROHIBITED COMMANDS

These commands are **FORBIDDEN** in production:

```bash
# ❌ NEVER USE THESE
npx prisma db push --force-reset
npx prisma migrate reset
dropdb [database]

# ❌ DANGEROUS WITHOUT BACKUP
npx prisma db push
npx prisma migrate dev --name [name]
```

---

## 💡 BEST PRACTICES

### 1. Environment Detection
Scripts automatically detect production environment and apply stricter safety measures.

### 2. Backup Retention
- Keep last 10 backups automatically
- Manual backups before major changes
- Daily automated backups recommended

### 3. Testing Strategy
- Test all migrations on production data copy
- Verify rollback procedures
- Document time estimates

### 4. Monitoring
- Set up database monitoring
- Alert on schema changes
- Track backup health

---

## 🎯 NEVER AGAIN

This incident taught us:

1. **Backup is not optional** - It's mandatory
2. **Raw Prisma commands are dangerous** - Use wrapper scripts
3. **Production needs special protection** - Environment-specific safety
4. **Documentation saves lives** - Clear procedures prevent panic

**Remember**: It's better to be slow and safe than fast and sorry.

---

*Last updated: 2025-09-04*  
*Next review: 2025-10-04*