# Deployment Guide

**Purpose**: Safe deployment procedures for authentication security features
**Phase**: Deployment & Go-Live
**Time Estimate**: 2-3 hours

---

## Overview

This guide provides step-by-step procedures for deploying authentication security improvements to production safely.

### Deployment Phases

1. **Pre-Deployment**: Validation and preparation
2. **Staging Deployment**: Test in staging environment
3. **Production Deployment**: Controlled rollout to production
4. **Post-Deployment**: Monitoring and verification

---

## Pre-Deployment Checklist

### Code Quality Verification

**Build & Linting**:
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run ESLint: `npm run lint`
- [ ] Run Prettier: `npx prettier --check .`
- [ ] Build succeeds: `npm run build`
- [ ] No build warnings or errors

**Testing Complete**:
- [ ] All manual tests passed (see [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md))
- [ ] Integration tests passed
- [ ] Performance tests acceptable
- [ ] Security tests passed
- [ ] No known bugs or issues

---

### Database Preparation

**Backup Database**:
```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres ecomjrm > backup_before_auth_security_$(date +%Y%m%d).sql

# Or if using Railway
railway run pg_dump DATABASE_URL > backup_before_auth_security_$(date +%Y%m%d).sql
```

**Verification**:
- [ ] Backup file created successfully
- [ ] Backup file size is reasonable (not 0 bytes)
- [ ] Store backup in secure location
- [ ] Test restore procedure (optional but recommended)

---

### Environment Variables Check

**Required Variables** (verify in production):

```bash
# Authentication
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=[32+ character random string]

# Database
DATABASE_URL=postgresql://...

# Email Service
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**Verification**:
- [ ] All required variables set
- [ ] URLs use HTTPS (not HTTP)
- [ ] Secrets are strong (32+ characters)
- [ ] Email domain verified in Resend
- [ ] No development values in production

---

### Migration Readiness

**Check Migrations**:
```bash
# List pending migrations
npx prisma migrate status

# Preview migration in development
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

**Migration Files to Apply**:
- [ ] `add_password_reset_fields`
- [ ] `add_failed_login_tracking`

**Validation**:
- [ ] Migrations tested in development
- [ ] Migrations tested in staging (if available)
- [ ] Rollback procedure documented
- [ ] No destructive changes (data loss)

---

## Staging Deployment

### Step 1: Deploy to Staging

**Git Workflow**:
```bash
# Ensure all changes committed
git status

# Create release branch
git checkout -b release/auth-security-v1
git push origin release/auth-security-v1

# Merge to staging branch
git checkout staging
git merge release/auth-security-v1
git push origin staging
```

**Automated Deployment** (if using Railway/Vercel):
- [ ] Push triggers automatic deployment
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

**Manual Deployment** (if needed):
```bash
# SSH to staging server
ssh user@staging.yourdomain.com

# Pull latest code
cd /app
git pull origin staging

# Install dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart all
```

---

### Step 2: Run Migrations on Staging

```bash
# Connect to staging database
export DATABASE_URL="postgresql://staging..."

# Apply migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

**Validation**:
- [ ] Migrations applied successfully
- [ ] No migration errors
- [ ] Database schema updated
- [ ] Existing data preserved

---

### Step 3: Verify Staging Deployment

**Smoke Tests**:
- [ ] Application loads
- [ ] Can login as customer
- [ ] Can login as admin
- [ ] Forgot password flow works
- [ ] Email delivery works
- [ ] CSRF protection active
- [ ] Failed login tracking works
- [ ] Admin notifications sent
- [ ] No console errors
- [ ] No API errors

**Performance Check**:
- [ ] Login time <500ms
- [ ] Page load time <2 seconds
- [ ] Email delivery <5 seconds
- [ ] No memory leaks
- [ ] CPU usage normal

---

## Production Deployment

### Step 1: Schedule Deployment Window

**Best Practices**:
- [ ] Deploy during low-traffic hours
- [ ] Notify team of deployment window
- [ ] Have rollback plan ready
- [ ] Assign on-call person for monitoring

**Recommended Time**: Off-peak hours (e.g., 2-4 AM local time or Sunday morning)

---

### Step 2: Deploy to Production

**Git Workflow**:
```bash
# Merge staging to main
git checkout main
git merge staging --no-ff -m "Release: Authentication Security v1.0"
git push origin main

# Create release tag
git tag -a v1.0.0-auth-security -m "Authentication security improvements"
git push origin v1.0.0-auth-security
```

**Automated Deployment**:
- [ ] Push triggers production deployment
- [ ] Monitor deployment progress
- [ ] Check deployment logs
- [ ] Verify no errors

---

### Step 3: Run Production Migrations

**IMPORTANT**: Backup database AGAIN right before migrations

```bash
# Final backup
pg_dump DATABASE_URL > final_backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

**Validation**:
- [ ] Migrations successful
- [ ] No downtime during migration
- [ ] Schema updated correctly
- [ ] Backup available for rollback

---

### Step 4: Production Smoke Tests

**Critical Path Testing** (do immediately):
- [ ] Homepage loads
- [ ] Customer can register
- [ ] Customer can login
- [ ] Admin can login → Email received
- [ ] Password reset works
- [ ] CSRF protection active
- [ ] No critical errors in logs

**Full Feature Testing**:
- [ ] All Phase 1 features work
- [ ] All Phase 2 features work
- [ ] Existing features not broken (regression)
- [ ] Performance acceptable

---

## Post-Deployment Monitoring

### First 30 Minutes

**Monitor**:
```bash
# Watch application logs
tail -f /var/log/application.log

# Or in Railway/Vercel
railway logs --tail
# vercel logs --follow
```

**Check For**:
- [ ] No error spikes
- [ ] Login success rate >95%
- [ ] Email delivery working
- [ ] CSRF validation passing
- [ ] No database connection issues
- [ ] Memory usage normal
- [ ] CPU usage normal

---

### First 24 Hours

**Metrics to Track**:
- [ ] Total logins (should be normal)
- [ ] Failed logins (should be <5% of total)
- [ ] Password resets (track volume)
- [ ] Locked accounts (should be minimal)
- [ ] Admin login notifications (all sent)
- [ ] CSRF rejections (should be low)
- [ ] Error rates (should be <1%)

**Database Queries**:
```sql
-- Login stats (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE details->>'success' = 'true') as successful_logins,
  COUNT(*) FILTER (WHERE details->>'success' = 'false') as failed_logins,
  COUNT(*) FILTER (WHERE details->>'accountLocked' = 'true') as accounts_locked
FROM audit_logs
WHERE action = 'LOGIN'
  AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Password resets (last 24 hours)
SELECT COUNT(*) as password_resets
FROM audit_logs
WHERE action = 'PASSWORD_RESET'
  AND "createdAt" > NOW() - INTERVAL '24 hours';

-- CSRF failures (should be low)
SELECT COUNT(*) as csrf_failures
FROM audit_logs
WHERE details->>'csrfValidation' = 'failed'
  AND "createdAt" > NOW() - INTERVAL '24 hours';
```

---

### First Week

**Weekly Review**:
- [ ] Review error logs
- [ ] Check email delivery rate (should be >95%)
- [ ] Review locked account patterns
- [ ] Check for security incidents
- [ ] Gather user feedback
- [ ] Review performance metrics
- [ ] Check audit log completeness

---

## Rollback Procedure

### If Critical Issues Found

**Immediate Rollback**:
```bash
# Revert code deployment
git revert HEAD
git push origin main

# Or use platform rollback
railway rollback  # Railway
vercel rollback   # Vercel
```

---

### Database Rollback (if needed)

**Only if migrations cause issues**:

```bash
# Mark migrations as rolled back
npx prisma migrate resolve --rolled-back [migration_name]

# Restore from backup
psql DATABASE_URL < backup_before_auth_security_20250122.sql
```

**Validation After Rollback**:
- [ ] Application works
- [ ] Users can login
- [ ] No data loss
- [ ] No errors in logs

---

### Post-Rollback Actions

1. **Document Issue**:
   - What went wrong
   - When it was detected
   - Impact assessment
   - Root cause analysis

2. **Fix in Development**:
   - Identify root cause
   - Fix the issue
   - Test thoroughly
   - Re-test in staging

3. **Redeploy**:
   - Follow deployment process again
   - Monitor more closely
   - Verify fix works

---

## Communication

### Deployment Announcement

**Before Deployment**:
```
Subject: Scheduled Maintenance - Authentication Security Updates

Dear Team,

We will be deploying authentication security improvements on [Date] at [Time].

Expected downtime: 5-10 minutes (migrations)

New features:
- Password reset functionality
- Enhanced security (CSRF protection)
- Admin password self-service
- Brute force protection
- Admin login monitoring

If you experience any issues after deployment, please contact:
- [On-call person]: [Contact details]

Thank you for your patience.
```

---

**After Deployment**:
```
Subject: Deployment Complete - Authentication Security Updates

Dear Team,

Authentication security updates have been successfully deployed.

All systems are operational and performing normally.

New features are now live:
✅ Password reset via email
✅ CSRF protection on all forms
✅ Self-service password change for all roles
✅ Account locking after failed logins
✅ Admin login notifications

If you notice any issues, please report immediately.

Thank you!
```

---

## Success Criteria

### Deployment Successful When

**Technical**:
- [ ] All migrations applied successfully
- [ ] No deployment errors
- [ ] All features working in production
- [ ] Performance metrics acceptable
- [ ] Error rates normal (<1%)
- [ ] Email delivery >95%

**Functional**:
- [ ] Users can reset passwords
- [ ] CSRF protection working
- [ ] Admins can change passwords
- [ ] Account locking prevents brute force
- [ ] Admin notifications sent
- [ ] No regressions in existing features

**Operational**:
- [ ] Monitoring in place
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan tested (or ready)
- [ ] On-call support available

---

## Next Steps

After successful deployment:
1. ✅ Production deployment complete
2. 📊 Monitor for 24-48 hours
3. 📝 Update [10-MAINTENANCE.md](./10-MAINTENANCE.md) procedures
4. 🔄 Schedule first maintenance review
5. 📚 Update user documentation

---

## Emergency Contacts

**During Deployment**:
- **Technical Lead**: [Name] - [Contact]
- **DevOps**: [Name] - [Contact]
- **Database Admin**: [Name] - [Contact]
- **On-Call**: [Name] - [Contact]

**Escalation Path**:
1. On-Call Engineer
2. Technical Lead
3. CTO/Engineering Manager

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: After first production deployment
