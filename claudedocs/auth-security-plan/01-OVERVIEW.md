# Authentication Security Implementation - Overview

**Navigation**: [← Back to Index](./00-INDEX.md) | [Next: Prerequisites →](./02-PREREQUISITES.md)

---

## Current Critical Issues

### 🔴 Issue 1: Forgot Password Feature Missing

**Current State**:
- Link exists in signin page: `/auth/forgot-password`
- **BUT**: No page or API exists at that route
- Users who forget password are completely stuck
- Email service (Resend) configured but no password reset flow

**Impact**:
- Customers locked out permanently
- Admins must contact SuperAdmin for password reset
- Unprofessional user experience
- Production blocker

**Risk Level**: 🔴 CRITICAL - BLOCKING PRODUCTION

---

### 🔴 Issue 2: CSRF Protection Not Enforced

**Current State**:
- Comprehensive CSRF implementation exists in `src/lib/security/csrf-protection.ts`
- **BUT**: Only 1 API route uses it (`/api/settings/notifications`)
- All login, signup, password change routes have NO CSRF protection

**Impact**:
- Vulnerable to Cross-Site Request Forgery attacks
- Attackers can perform actions on behalf of logged-in users
- Security compliance risk

**Risk Level**: 🔴 CRITICAL - SECURITY VULNERABILITY

---

### 🔴 Issue 3: Admin Cannot Change Own Password

**Current State**:
- Only CUSTOMER role can change password
- ADMIN/STAFF blocked from password change (hardcoded check)
- Must ask SuperAdmin to reset via emergency process

**Impact**:
- Admins cannot manage their own security
- Creates dependency on SuperAdmin
- Slows down password updates
- Poor security practice

**Risk Level**: 🔴 CRITICAL - OPERATIONAL ISSUE

---

## What This Plan Delivers

### ✅ After Phase 1 (Week 1)

**Complete Password Recovery**:
- Users can request password reset via email
- Secure token-based reset flow (1-hour expiry)
- Email notifications with reset links
- Token validation and expiry handling
- Audit logging of all password changes

**CSRF Protection Everywhere**:
- All POST/PUT/DELETE routes protected
- Token generation and validation
- Frontend integration
- Security compliance achieved

**Admin Self-Service**:
- Admins can change their own passwords
- Staff and SuperAdmin included
- No dependency on SuperAdmin
- Proper audit logging

### ✅ After Phase 2 (Week 2-3)

**Brute Force Prevention**:
- Failed login attempt tracking
- Account locking after 5 failures
- 15-minute lockout period
- Automatic unlock after timeout

**Security Monitoring**:
- Email notifications for admin logins
- IP address and device tracking
- Real-time security awareness
- Audit trail for compliance

---

## Success Criteria

### Phase 1 Complete When:

- [ ] Users can reset forgotten passwords end-to-end
- [ ] CSRF protection enforced on all mutation routes
- [ ] Admins can change their own passwords
- [ ] All manual tests pass
- [ ] Code follows CLAUDE.md standards
- [ ] Deployed to production
- [ ] Documentation updated

### Phase 2 Complete When:

- [ ] Failed login tracking prevents brute force
- [ ] Account locking works correctly
- [ ] Admin login notifications sent reliably
- [ ] All tests pass
- [ ] Monitoring operational
- [ ] Team trained on new features

---

## Project Standards (CRITICAL)

### CLAUDE.md Compliance Requirements

**🔴 MANDATORY - Must Follow**:

1. **No Hardcoding**
   - Use constants, environment variables, configuration files
   - Never hardcode URLs, thresholds, or business logic
   - Example: `PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS` not `1`

2. **Single Source of Truth**
   - Every piece of data has ONE authoritative source
   - No duplication across files
   - Centralized utilities and configurations

3. **DRY Principle** (Don't Repeat Yourself)
   - Extract common functionality
   - Reusable components and utilities
   - No copy-paste code

4. **Type Safety**
   - No `any` types - use explicit TypeScript types
   - Export type definitions
   - Use Zod for runtime validation

5. **Error Handling**
   - All async operations MUST have try-catch
   - Meaningful error messages
   - Log errors appropriately
   - Never expose sensitive data in errors

6. **Input Validation**
   - All user inputs validated with Zod schemas
   - Sanitize inputs before database operations
   - Validate on both frontend and backend

7. **Security First**
   - Use Prisma ORM only (no raw SQL)
   - Hash passwords with bcrypt (12 rounds)
   - Sanitize all user inputs
   - Rate limiting on sensitive operations

8. **Audit Logging**
   - Log all security-critical operations
   - Include: user ID, action, timestamp, IP
   - Store in audit_logs table
   - Never log passwords or tokens

### Code Quality Checklist

**Before Every Commit**:
- [ ] Follows CLAUDE.md standards above
- [ ] No `console.log` in production code
- [ ] No hardcoded values
- [ ] All TODOs addressed or documented
- [ ] Types are explicit (no `any`)
- [ ] Error handling complete
- [ ] Tests written and passing
- [ ] Documentation updated

---

## Technology Stack

### Required Technologies

**Backend**:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- bcrypt

**Frontend**:
- React 18
- React Hook Form
- Zod validation
- shadcn/ui components
- Tailwind CSS

**Services**:
- Resend (Email delivery)
- Uptime monitoring (optional)

---

## File Organization

### New Files to Create (9 files)

**Phase 1**:
```
src/lib/auth/password-reset.ts                    # Utilities
src/lib/validation/auth.ts                        # Schemas
src/lib/email/templates/password-reset-email.tsx  # Template
src/lib/middleware/with-csrf.ts                   # Middleware

src/app/auth/forgot-password/page.tsx             # UI
src/app/auth/reset-password/[token]/page.tsx      # UI

src/app/api/auth/forgot-password/route.ts         # API
src/app/api/auth/reset-password/route.ts          # API
src/app/api/auth/reset-password/verify/route.ts   # API
```

**Phase 2**:
```
src/lib/email/templates/admin-login-notification.tsx  # Template
scripts/cleanup-expired-tokens.ts                     # Maintenance
```

### Files to Modify (20+ files)

**Database**:
- `prisma/schema.prisma` (2 migrations)

**Auth System**:
- `src/lib/auth/config.ts` (failed login tracking, notifications)
- `src/app/api/settings/password/route.ts` (remove role restriction)

**CSRF Protection** (apply to all):
- `src/app/api/auth/register/route.ts`
- `src/app/api/settings/**/route.ts` (6 routes)
- `src/app/api/admin/**/route.ts` (10+ routes)
- `src/app/api/superadmin/**/route.ts` (5+ routes)

---

## Time Estimates

### Realistic Timeline

**Phase 1: Critical Fixes** (Week 1):
| Task | Time | Complexity |
|------|------|------------|
| Forgot Password Flow | 4 hours | Medium |
| CSRF Enforcement | 3 hours | Low-Medium |
| Admin Password Change | 2 hours | Low |
| Testing & Documentation | 1 hour | Low |
| **Total** | **8-10 hours** | |

**Phase 2: Improvements** (Week 2-3):
| Task | Time | Complexity |
|------|------|------------|
| Failed Login Tracking | 3 hours | Medium |
| Admin Notifications | 2 hours | Low |
| Testing & Monitoring | 1 hour | Low |
| **Total** | **4-6 hours** | |

**Grand Total**: 12-16 hours of focused development

---

## Risk Assessment

### Low Risk

✅ **Admin Password Change**:
- Simple code change
- Well-tested existing logic
- Easy to test
- Quick rollback if needed

### Medium Risk

⚠️ **CSRF Protection**:
- Affects many routes
- Requires frontend integration
- Potential for breaking changes
- Mitigation: Test thoroughly, deploy gradually

⚠️ **Failed Login Tracking**:
- Database schema change
- Logic in critical auth path
- Risk of false positives
- Mitigation: Conservative thresholds, manual unlock

### Medium-High Risk

⚠️⚠️ **Forgot Password Flow**:
- New critical feature
- Email delivery dependency
- Token security critical
- Multiple failure points
- Mitigation: Comprehensive testing, monitoring, rollback plan

---

## Dependencies

### External Services

**Required**:
- Resend API (email delivery)
- PostgreSQL database
- NextAuth session management

**Optional**:
- Email monitoring service
- Error tracking (Sentry)
- Uptime monitoring

### Environment Variables

**New Required**:
```bash
ADMIN_NOTIFICATION_EMAIL="owner@yourbusiness.com"
```

**Existing Required**:
```bash
NEXTAUTH_SECRET="32-char-minimum-secret"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
RESEND_API_KEY="re_your_key"
FROM_EMAIL="noreply@yourdomain.com"
DATABASE_URL="postgresql://..."
```

---

## Testing Strategy

### Testing Pyramid

**Unit Tests** (if applicable):
- Password validation logic
- Token generation/verification
- CSRF token validation

**Integration Tests** (manual for MVP):
- Forgot password flow end-to-end
- CSRF protection on all routes
- Admin password change
- Failed login tracking
- Email notifications

**E2E Tests** (manual):
- User journey: signup → forget → reset → login
- Admin journey: login → notification → password change
- Attack scenarios: brute force, CSRF attempts

---

## Rollback Strategy

### Quick Rollback Procedure

**If critical issues found**:

1. **Immediate**: Revert deployment
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database**: Rollback migrations if needed
   ```bash
   npx prisma migrate resolve --rolled-back [migration_name]
   ```

3. **Verify**: Ensure old functionality works

4. **Communicate**: Notify team and users

**Recovery Time Objective**: < 5 minutes

---

## Communication Plan

### Stakeholders

**Internal**:
- Development team
- System administrators
- Customer support

**External**:
- Admin users
- Customers (for password reset)

### Notifications

**Before Deployment**:
- Team notified of maintenance window
- Admins informed of new features
- Support docs prepared

**After Deployment**:
- Team notified of go-live
- Admin training materials sent
- User documentation updated
- Monitor for first 24 hours

---

## Metrics & Monitoring

### Key Metrics to Track

**Security**:
- Failed login attempts (daily)
- Account lockouts (daily)
- Password reset requests (daily)
- CSRF rejections (daily)
- Admin login locations (review weekly)

**Performance**:
- Password reset email delivery time
- API response times
- Database query performance
- Email queue length

**User Experience**:
- Password reset success rate
- Time to complete reset flow
- Failed reset attempts
- User feedback/support tickets

---

## Next Steps

1. **Read Prerequisites**: [02-PREREQUISITES.md](./02-PREREQUISITES.md)
2. **Start Phase 1**: [03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)
3. **Keep Reference**: Bookmark [11-TROUBLESHOOTING.md](./11-TROUBLESHOOTING.md)

---

**Navigation**: [← Back to Index](./00-INDEX.md) | [Next: Prerequisites →](./02-PREREQUISITES.md)
