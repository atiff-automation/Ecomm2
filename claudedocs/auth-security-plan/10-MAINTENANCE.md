# Maintenance Guide

**Purpose**: Ongoing maintenance procedures for authentication security features
**Frequency**: Daily, Weekly, Monthly tasks
**Responsibility**: DevOps, Security Team, Engineering

---

## Overview

This guide outlines regular maintenance tasks to ensure authentication security features continue operating correctly and securely.

### Maintenance Categories

1. **Daily Tasks**: Monitoring and quick checks
2. **Weekly Tasks**: Detailed reviews and cleanup
3. **Monthly Tasks**: Comprehensive audits and updates
4. **Quarterly Tasks**: Strategic reviews and improvements

---

## Daily Maintenance

### Task 1: Monitor Error Logs

**Purpose**: Catch issues early

**Procedure**:
```bash
# Check application logs for errors
grep -i error /var/log/application.log | tail -50

# Or in cloud platform
railway logs --tail 100 | grep -i error
vercel logs --since 24h | grep -i error
```

**Look For**:
- [ ] CSRF validation failures (should be <10/day)
- [ ] Email sending failures
- [ ] Database connection errors
- [ ] Failed login spikes
- [ ] Unexpected errors

**Action**: If errors >100/day, investigate immediately

---

### Task 2: Check Email Delivery

**Purpose**: Ensure notifications working

**Procedure**:
```sql
-- Check emails sent today
SELECT
  COUNT(*) as total_emails_today,
  COUNT(*) FILTER (WHERE action = 'PASSWORD_RESET') as password_resets,
  COUNT(*) FILTER (WHERE action = 'LOGIN' AND details->>'role' IN ('ADMIN','STAFF','SUPERADMIN')) as admin_logins
FROM audit_logs
WHERE "createdAt" >= CURRENT_DATE;
```

**Check Resend Dashboard**:
- [ ] Login to Resend dashboard
- [ ] Check delivery rate (should be >95%)
- [ ] Check for bounces or spam complaints
- [ ] Verify no rate limit issues

**Action**: If delivery <90%, investigate immediately

---

### Task 3: Review Failed Login Attempts

**Purpose**: Detect potential attacks

**Procedure**:
```sql
-- Failed logins today
SELECT
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT "userId") as affected_users
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
  AND "createdAt" >= CURRENT_DATE;

-- Accounts currently locked
SELECT
  COUNT(*) as locked_accounts
FROM users
WHERE "accountLockedUntil" > NOW();

-- Suspicious patterns (same IP, multiple accounts)
SELECT
  details->>'ipAddress' as ip,
  COUNT(DISTINCT "userId") as user_count,
  COUNT(*) as attempt_count
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
  AND "createdAt" >= CURRENT_DATE
GROUP BY details->>'ipAddress'
HAVING COUNT(*) > 10
ORDER BY attempt_count DESC;
```

**Normal Thresholds**:
- Failed logins: <5% of total logins
- Locked accounts: <0.1% of active users
- Suspicious IPs: 0-2 per day

**Action**: If thresholds exceeded, investigate for attack patterns

---

## Weekly Maintenance

### Task 1: Clean Up Expired Tokens

**Purpose**: Database hygiene, prevent storage bloat

**Manual Cleanup**:
```sql
-- Check expired tokens
SELECT COUNT(*) FROM users
WHERE "passwordResetTokenExpiry" < NOW()
  AND "passwordResetToken" IS NOT NULL;

-- Clean up expired tokens
UPDATE users
SET
  "passwordResetToken" = NULL,
  "passwordResetTokenExpiry" = NULL
WHERE "passwordResetTokenExpiry" < NOW();
```

**Automated Script** (recommended):

Create file: `scripts/cleanup-expired-tokens.ts`
```typescript
/**
 * Cleanup Expired Password Reset Tokens
 * Run weekly via cron or scheduled job
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting token cleanup...');

    const result = await prisma.user.updateMany({
      where: {
        passwordResetTokenExpiry: {
          lt: new Date(),
        },
      },
      data: {
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    console.log(`✅ Cleaned up ${result.count} expired tokens`);

    // Also clean up old account locks (shouldn't normally exist)
    const lockResult = await prisma.user.updateMany({
      where: {
        accountLockedUntil: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
        },
      },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    console.log(`✅ Cleared ${lockResult.count} stale account locks`);

    return { tokens: result.count, locks: lockResult.count };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupExpiredTokens()
    .then((result) => {
      console.log('Cleanup complete:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupExpiredTokens };
```

**Setup Cron** (Linux/Mac):
```bash
# Add to crontab
crontab -e

# Run every Sunday at 2 AM
0 2 * * 0 cd /path/to/app && npx ts-node scripts/cleanup-expired-tokens.ts
```

**Or Railway/Vercel Cron**:
```yaml
# railway.yml or vercel.json
cron:
  - path: /api/cron/cleanup-tokens
    schedule: "0 2 * * 0"
```

**Validation**:
- [ ] Script runs successfully
- [ ] Tokens cleaned up
- [ ] No active tokens deleted accidentally
- [ ] Logs show cleanup count

---

### Task 2: Review Audit Logs

**Purpose**: Security compliance and monitoring

**Weekly Audit Queries**:
```sql
-- Password resets this week
SELECT
  DATE("createdAt") as date,
  COUNT(*) as reset_count
FROM audit_logs
WHERE action = 'PASSWORD_RESET'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date;

-- Admin logins this week
SELECT
  details->>'role' as role,
  COUNT(*) as login_count
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'true'
  AND details->>'role' IN ('ADMIN', 'STAFF', 'SUPERADMIN')
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY details->>'role';

-- Failed login patterns
SELECT
  DATE("createdAt") as date,
  COUNT(*) as failed_count,
  COUNT(DISTINCT "userId") as affected_users
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date;

-- Most locked accounts this week
SELECT
  u.email,
  u.role,
  COUNT(*) as lock_count
FROM audit_logs al
JOIN users u ON u.id = al."userId"
WHERE al.action = 'LOGIN'
  AND al.details->>'accountLocked' = 'true'
  AND al."createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.role
ORDER BY lock_count DESC
LIMIT 10;
```

**Analysis**:
- [ ] Password resets trending up? → Investigate usability issues
- [ ] Failed logins spiking? → Check for attacks
- [ ] Admin logins at odd hours? → Verify legitimacy
- [ ] Repeated lockouts? → Check if user needs support

---

### Task 3: Check Locked Accounts

**Purpose**: Identify users needing support

**Procedure**:
```sql
-- Currently locked accounts
SELECT
  email,
  role,
  "failedLoginAttempts",
  "accountLockedUntil",
  "lastFailedLoginAt"
FROM users
WHERE "accountLockedUntil" > NOW()
ORDER BY "accountLockedUntil" DESC;

-- Frequently locked accounts (>3 times this week)
SELECT
  u.email,
  u.role,
  COUNT(*) as lock_count,
  MAX(al."createdAt") as last_lock
FROM audit_logs al
JOIN users u ON u.id = al."userId"
WHERE al.action = 'LOGIN'
  AND al.details->>'accountLocked' = 'true'
  AND al."createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.role
HAVING COUNT(*) > 3
ORDER BY lock_count DESC;
```

**Action**:
- If user legitimately locked out multiple times:
  - Contact user to verify issue
  - Offer password reset assistance
  - Check for usability problems

---

### Task 4: Performance Metrics

**Purpose**: Ensure acceptable performance

**Metrics to Track**:
```sql
-- Average login time (from audit logs if timing captured)
SELECT
  AVG((details->>'duration')::numeric) as avg_login_ms
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'true'
  AND "createdAt" >= NOW() - INTERVAL '7 days';

-- Email delivery time (if captured)
-- Check Resend dashboard for delivery metrics
```

**Targets**:
- Login time: <500ms average
- Password reset: <2 seconds
- Email delivery: <5 seconds
- CSRF validation: <10ms overhead

**Action**: If metrics exceed targets, investigate performance issues

---

## Monthly Maintenance

### Task 1: Security Audit

**Purpose**: Comprehensive security review

**Checklist**:
- [ ] Review all security logs
- [ ] Check for suspicious patterns
- [ ] Verify CSRF protection active on all routes
- [ ] Test password reset flow end-to-end
- [ ] Verify email delivery working
- [ ] Test account locking mechanism
- [ ] Review admin login notifications
- [ ] Check for any security updates needed

**Security Metrics**:
```sql
-- Monthly security summary
SELECT
  'Total Logins' as metric,
  COUNT(*) as count
FROM audit_logs
WHERE action = 'LOGIN'
  AND "createdAt" >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT
  'Failed Logins',
  COUNT(*)
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
  AND "createdAt" >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT
  'Account Lockouts',
  COUNT(*)
FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'accountLocked' = 'true'
  AND "createdAt" >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT
  'Password Resets',
  COUNT(*)
FROM audit_logs
WHERE action = 'PASSWORD_RESET'
  AND "createdAt" >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT
  'CSRF Failures',
  COUNT(*)
FROM audit_logs
WHERE details->>'csrfValidation' = 'failed'
  AND "createdAt" >= DATE_TRUNC('month', NOW');
```

---

### Task 2: Update Dependencies

**Purpose**: Security patches and bug fixes

**Procedure**:
```bash
# Check for outdated packages
npm outdated

# Update security-critical packages
npm update bcryptjs
npm update next-auth
npm update @prisma/client
npm update zod

# Run security audit
npm audit

# Fix high/critical vulnerabilities
npm audit fix
```

**Testing After Updates**:
- [ ] Run full test suite
- [ ] Test authentication flows
- [ ] Test password reset
- [ ] Test CSRF protection
- [ ] Verify no regressions

---

### Task 3: Database Maintenance

**Purpose**: Optimize and maintain database health

**Tasks**:
```sql
-- Vacuum analyze (PostgreSQL)
VACUUM ANALYZE users;
VACUUM ANALYZE audit_logs;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**Archive Old Audit Logs** (if table growing large):
```sql
-- Archive logs older than 6 months
-- First, export to archive table or file
CREATE TABLE audit_logs_archive AS
SELECT * FROM audit_logs
WHERE "createdAt" < NOW() - INTERVAL '6 months';

-- Then delete from main table
DELETE FROM audit_logs
WHERE "createdAt" < NOW() - INTERVAL '6 months';

-- Verify
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM audit_logs_archive;
```

---

### Task 4: Documentation Review

**Purpose**: Keep documentation up-to-date

**Review**:
- [ ] Update any changed procedures
- [ ] Add new troubleshooting entries
- [ ] Update metrics and thresholds
- [ ] Document any incidents or issues
- [ ] Update runbooks if needed

---

## Quarterly Maintenance

### Task 1: Comprehensive Security Review

**Purpose**: Strategic security assessment

**Activities**:
- [ ] Review all security logs (3 months)
- [ ] Identify security trends
- [ ] Assess threat landscape changes
- [ ] Review authentication best practices
- [ ] Check for new vulnerabilities (OWASP)
- [ ] Update security policies
- [ ] Plan security improvements

---

### Task 2: Performance Review

**Purpose**: Optimize and improve performance

**Analysis**:
- [ ] Review 3-month performance trends
- [ ] Identify bottlenecks
- [ ] Optimize slow queries
- [ ] Consider caching strategies
- [ ] Evaluate infrastructure needs

---

### Task 3: User Feedback Review

**Purpose**: Improve user experience

**Gather Feedback**:
- [ ] Review support tickets related to authentication
- [ ] Analyze user complaints
- [ ] Identify common issues
- [ ] Survey users about password reset experience
- [ ] Check for usability problems

**Action Items**:
- [ ] Address common pain points
- [ ] Improve error messages
- [ ] Enhance user guidance
- [ ] Update help documentation

---

### Task 4: Disaster Recovery Test

**Purpose**: Ensure backup and recovery procedures work

**Test**:
- [ ] Restore from backup to test environment
- [ ] Verify data integrity
- [ ] Test rollback procedures
- [ ] Document recovery time
- [ ] Update disaster recovery plan

---

## Monitoring Dashboards

### Recommended Metrics Dashboard

**Authentication Metrics**:
- Total logins (last 24h, 7d, 30d)
- Failed login rate (%)
- Account lockout count
- Password reset requests
- Admin login count
- CSRF validation failures

**Performance Metrics**:
- Average login time
- P95 login time
- Email delivery time
- API response times

**Security Metrics**:
- Suspicious login patterns
- Brute force attempts blocked
- Geographic login distribution
- Device fingerprint changes

**Tools**:
- Grafana
- Datadog
- New Relic
- CloudWatch (AWS)
- Vercel Analytics

---

## Automation Opportunities

### Automated Daily Tasks

**Script**: `scripts/daily-health-check.ts`
```typescript
import { PrismaClient } from '@prisma/client';

async function dailyHealthCheck() {
  const prisma = new PrismaClient();

  try {
    // Check failed logins
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: 'LOGIN',
        details: { path: ['success'], equals: 'false' },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Check locked accounts
    const lockedAccounts = await prisma.user.count({
      where: {
        accountLockedUntil: { gt: new Date() },
      },
    });

    // Check email delivery (if tracked)
    // ... add logic

    // Alert if thresholds exceeded
    if (failedLogins > 100) {
      console.warn(`⚠️ High failed login count: ${failedLogins}`);
      // Send alert
    }

    if (lockedAccounts > 10) {
      console.warn(`⚠️ Unusual locked account count: ${lockedAccounts}`);
      // Send alert
    }

    console.log('✅ Daily health check complete');
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## Incident Response

### When Issues Detected

**Immediate Actions**:
1. Assess severity (Critical/High/Medium/Low)
2. Check if user-facing impact
3. Review recent changes
4. Check error logs
5. Notify team if critical

**Response Procedures**:
- See [11-TROUBLESHOOTING.md](./11-TROUBLESHOOTING.md) for specific issues
- Escalate to on-call if needed
- Document incident
- Implement fix
- Monitor for resolution
- Post-mortem if major incident

---

## Next Steps

- [ ] Set up daily monitoring alerts
- [ ] Configure weekly cleanup cron jobs
- [ ] Schedule monthly security reviews
- [ ] Create performance dashboard
- [ ] Document custom procedures

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Review Frequency**: Monthly
