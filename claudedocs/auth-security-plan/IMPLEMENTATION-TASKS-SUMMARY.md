# Implementation Tasks Summary

**Purpose**: Quick reference for all implementation tasks with links to detailed guides.

---

## 📁 Complete Implementation Guide

**Full detailed implementation** with all code samples, testing procedures, and troubleshooting:

👉 **[`../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md`](../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md)**

This 50+ page comprehensive guide contains:
- Complete code for all 9 files to create
- Step-by-step database migrations
- Full testing procedures
- Deployment checklists
- Troubleshooting guides

---

## Task Breakdown for LLM Access

### Phase 1: Critical Fixes (Week 1)

#### Task 1: Forgot Password Flow (4 hours)
- **What**: Complete password recovery system
- **Files**: 7 new files + 1 migration
- **Guide**: [03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)
- **Full Code**: Main plan lines 100-800

**Create**:
1. `src/lib/auth/password-reset.ts` - Utilities
2. `src/lib/validation/auth.ts` - Schemas
3. `src/lib/email/templates/password-reset-email.tsx` - Template
4. `src/app/auth/forgot-password/page.tsx` - UI
5. `src/app/api/auth/forgot-password/route.ts` - API
6. `src/app/auth/reset-password/[token]/page.tsx` - UI
7. `src/app/api/auth/reset-password/verify/route.ts` - API
8. `src/app/api/auth/reset-password/route.ts` - API

#### Task 2: CSRF Protection (3 hours)
- **What**: Enforce CSRF on all mutation routes
- **Files**: 1 new file, modify 20+ routes
- **Full Code**: Main plan lines 800-1200

**Create**:
1. `src/lib/middleware/with-csrf.ts` - Wrapper

**Modify**: Add CSRF check to:
- `src/app/api/auth/register/route.ts`
- `src/app/api/settings/**/route.ts` (6 routes)
- `src/app/api/admin/**/route.ts` (10+ routes)
- `src/app/api/superadmin/**/route.ts` (5+ routes)

**Pattern**:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... rest of code
}
```

#### Task 3: Admin Password Change (2 hours)
- **What**: Allow admin self-service password change
- **Files**: Modify 1 route, update 1 UI
- **Full Code**: Main plan lines 1200-1400

**Modify**:
1. `src/app/api/settings/password/route.ts` - Remove role restriction
2. `src/app/admin/settings/page.tsx` - Add navigation link

**Change** (line ~26 in password route):
```typescript
// FROM:
if (session.user.role !== 'CUSTOMER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// TO:
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### Phase 2: Important Improvements (Week 2-3)

#### Task 4: Failed Login Tracking (3 hours)
- **What**: Brute force protection
- **Files**: 1 migration, modify 1 file
- **Full Code**: Main plan lines 1400-1700

**Schema Change**:
```prisma
model User {
  failedLoginAttempts Int       @default(0)
  lastFailedLoginAt   DateTime?
  accountLockedUntil  DateTime?
}
```

**Modify**:
1. `src/lib/auth/config.ts` - Add tracking logic in authorize function

#### Task 5: Admin Login Notifications (2 hours)
- **What**: Email alerts for admin access
- **Files**: 1 new template, modify 1 file
- **Full Code**: Main plan lines 1700-2000

**Create**:
1. `src/lib/email/templates/admin-login-notification.tsx`

**Modify**:
1. `src/lib/auth/config.ts` - Add notification in jwt callback

---

## Testing & Deployment

### Testing Guide
**File**: [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)
**Full Guide**: Main plan lines 2000-2400

**Covers**:
- Manual testing checklists for all features
- Integration testing scenarios
- Performance testing procedures
- Security audit checklist

### Deployment
**File**: [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)
**Full Guide**: Main plan lines 2400-2800

**Covers**:
- Pre-deployment checklist
- Deployment steps (staging → production)
- Post-deployment monitoring
- Rollback procedures

### Troubleshooting
**File**: [11-TROUBLESHOOTING.md](./11-TROUBLESHOOTING.md)
**Full Guide**: Main plan lines 2800-3200

**Common Issues**:
- Emails not sending
- CSRF token failures
- Account locked incorrectly
- Token expired too quickly
- Database migration fails

---

## Quick Access Map

**Need detailed code?**
→ [`../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md`](../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md)

**Need overview?**
→ [01-OVERVIEW.md](./01-OVERVIEW.md)

**Need setup help?**
→ [02-PREREQUISITES.md](./02-PREREQUISITES.md)

**Need testing procedures?**
→ Main plan "Testing Guide" section

**Having issues?**
→ Main plan "Troubleshooting Guide" section

---

## For LLMs/AI Assistants

### Optimal File Loading Strategy

1. **For Overview**: Load [01-OVERVIEW.md](./01-OVERVIEW.md) (8KB)
2. **For Specific Task**: Load relevant task file (10-15KB each)
3. **For Full Code**: Reference main plan with line numbers
4. **For Troubleshooting**: Reference main plan troubleshooting section

### Line Number References

Main plan sections by line number:
- Lines 1-100: Overview and prerequisites
- Lines 100-800: Task 1 (Forgot Password)
- Lines 800-1200: Task 2 (CSRF Protection)
- Lines 1200-1400: Task 3 (Admin Password)
- Lines 1400-1700: Task 4 (Failed Login Tracking)
- Lines 1700-2000: Task 5 (Admin Notifications)
- Lines 2000-2400: Testing Guide
- Lines 2400-2800: Deployment Guide
- Lines 2800-3200: Troubleshooting Guide
- Lines 3200-3500: Maintenance and Reference

---

## File Size Reference

| File | Size | Best For |
|------|------|----------|
| 00-INDEX.md | 5KB | Navigation |
| 01-OVERVIEW.md | 8KB | Understanding scope |
| 02-PREREQUISITES.md | 7KB | Setup verification |
| 03-TASK1-FORGOT-PASSWORD.md | 10KB | Task 1 overview + core code |
| Main Plan | 120KB | Complete implementation |

**LLM Token Strategy**:
- Load modular files for overview/setup (~20KB total)
- Reference main plan sections as needed
- Load task-specific files during implementation

---

## Implementation Checklist

### Phase 1
- [ ] Task 1: Forgot Password (4h)
  - [ ] Database migration
  - [ ] Utilities created
  - [ ] Email template
  - [ ] UI pages
  - [ ] API routes
  - [ ] Testing complete

- [ ] Task 2: CSRF Protection (3h)
  - [ ] Middleware created
  - [ ] All routes protected
  - [ ] Testing complete

- [ ] Task 3: Admin Password (2h)
  - [ ] API fixed
  - [ ] UI updated
  - [ ] Testing complete

### Phase 2
- [ ] Task 4: Failed Login Tracking (3h)
- [ ] Task 5: Admin Notifications (2h)

### Deployment
- [ ] All tests pass
- [ ] Staging deployed
- [ ] Production deployed
- [ ] Monitoring active

---

**Last Updated**: January 2025
