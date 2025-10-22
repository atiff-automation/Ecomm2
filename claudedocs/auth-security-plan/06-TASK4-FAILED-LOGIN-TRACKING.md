# Task 4: Failed Login Tracking

**Priority**: 🟡 IMPORTANT
**Time Estimate**: 3 hours
**Phase**: 2 - Important Improvements (Week 2-3)

---

## Overview

### Current Issue
The application currently does not track failed login attempts. This creates security vulnerabilities:

- **No Brute Force Protection**: Attackers can try unlimited password combinations
- **No Account Locking**: Compromised accounts remain accessible during attacks
- **No Audit Trail**: No visibility into suspicious login patterns
- **No Attack Detection**: Cannot identify accounts under attack

### What This Task Delivers
- ✅ Failed login attempt tracking per user
- ✅ Automatic account locking after 5 failed attempts
- ✅ Time-based lock (15 minutes) with countdown
- ✅ Automatic unlock after timeout expires
- ✅ Successful login resets failed attempt counter
- ✅ Comprehensive audit logging
- ✅ User-friendly error messages

---

## Prerequisites

**Before Starting**:
- [ ] Read CLAUDE.md coding standards
- [ ] Understand NextAuth.js authorize function
- [ ] Review bcrypt password comparison
- [ ] Database backup completed
- [ ] Development environment running

**Required Knowledge**:
- Next.js 14 and NextAuth.js
- Prisma ORM and schema migrations
- bcrypt password hashing
- Authentication security best practices
- React and form handling

---

## Implementation Steps

### Step 4.1: Database Schema Update

**File**: `prisma/schema.prisma`
**Action**: Add failed login tracking fields to User model

---

#### Schema Changes

**Add these fields to User model**:
```prisma
model User {
  // ... existing fields ...

  // Failed Login Tracking Fields (ADD THESE)
  failedLoginAttempts Int       @default(0)
  lastFailedLoginAt   DateTime?
  accountLockedUntil  DateTime?

  // ... rest of model ...
}
```

**Field Descriptions**:
- `failedLoginAttempts`: Counter for consecutive failed logins (0-5)
- `lastFailedLoginAt`: Timestamp of most recent failed login (for monitoring)
- `accountLockedUntil`: Timestamp when account lock expires (null = not locked)

---

#### Run Migration

**Commands**:
```bash
# Create migration
npx prisma migrate dev --name add_failed_login_tracking

# Verify migration created
ls prisma/migrations/

# Regenerate Prisma Client
npx prisma generate

# Verify schema in database
npx prisma studio
```

**Validation Checklist**:
- [ ] Migration file created in `prisma/migrations/`
- [ ] Migration applied successfully (no errors)
- [ ] Prisma client regenerated
- [ ] Fields visible in Prisma Studio
- [ ] All existing users have `failedLoginAttempts = 0`
- [ ] TypeScript types updated (`npx prisma generate`)

---

### Step 4.2: Implement Login Tracking Logic

**File**: `src/lib/auth/config.ts`
**Action**: Update authorize function to track failed logins

---

#### Find Authorize Function

**Location**: Around line 25 in `authOptions.providers[0].credentials.authorize`

This is the NextAuth.js function that handles credential verification.

---

#### Updated Authorize Function

**Replace or update the authorize function**:

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  // 1. Fetch user with failed login tracking fields
  const user = await prisma.user.findUnique({
    where: {
      email: credentials.email,
    },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isMember: true,
      memberSince: true,
      status: true,
      // ADD THESE FIELDS
      failedLoginAttempts: true,
      lastFailedLoginAt: true,
      accountLockedUntil: true,
    },
  });

  if (!user) {
    // User doesn't exist - don't reveal this for security
    return null;
  }

  // 2. CHECK IF ACCOUNT IS LOCKED (NEW LOGIC)
  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const minutesLeft = Math.ceil(
      (user.accountLockedUntil.getTime() - new Date().getTime()) / (1000 * 60)
    );

    throw new Error(
      `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
    );
  }

  // 3. Check if user account is active
  if (user.status !== 'ACTIVE') {
    throw new Error('Account is not active. Please contact support.');
  }

  // 4. Verify password
  const isPasswordValid = await bcrypt.compare(
    credentials.password,
    user.password
  );

  if (!isPasswordValid) {
    // PASSWORD INCORRECT - TRACK FAILED ATTEMPT (NEW LOGIC)

    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLockAccount = newFailedAttempts >= 5;

    // Update failed attempts and potentially lock account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: new Date(),
        // Lock account for 15 minutes after 5 failed attempts
        accountLockedUntil: shouldLockAccount
          ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
          : null,
      },
    });

    // Log failed attempt for security monitoring
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        details: {
          success: false,
          failedAttempts: newFailedAttempts,
          accountLocked: shouldLockAccount,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // If this was the 5th failed attempt, throw specific error
    if (shouldLockAccount) {
      throw new Error(
        'Account locked due to multiple failed login attempts. Please try again in 15 minutes.'
      );
    }

    // Return null for failed password (NextAuth expects null)
    return null;
  }

  // 5. SUCCESSFUL LOGIN - RESET FAILED ATTEMPTS (NEW LOGIC)
  if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        accountLockedUntil: null,
      },
    });
  }

  // 6. Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 7. Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: user.id,
      details: {
        success: true,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      },
    },
  });

  // 8. Return user object for NextAuth session
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    isMember: user.isMember,
    memberSince: user.memberSince,
  };
}
```

---

#### Key Logic Points

**Account Lock Check** (Step 2):
- Runs before password check
- Calculates minutes remaining
- Provides user-friendly countdown message

**Failed Login Tracking** (Step 4):
- Increments counter on wrong password
- Locks account on 5th failure
- Logs every failed attempt with details

**Auto-Reset on Success** (Step 5):
- Clears failed attempts counter
- Removes account lock
- User can login immediately after correct password

**Security Considerations**:
- Locked accounts still require correct password after unlock
- Lock duration: 15 minutes (configurable)
- All attempts logged for monitoring
- Generic error messages (don't reveal if user exists)

---

**Validation Checklist**:
- [ ] All tracking fields added to user select
- [ ] Account lock check before password verification
- [ ] Failed attempt increment logic correct
- [ ] Account locks after 5 failures
- [ ] Lock duration: 15 minutes
- [ ] Successful login resets counter
- [ ] Audit logs created for all attempts
- [ ] Error messages user-friendly
- [ ] No sensitive data in error messages

---

### Step 4.3: Update Signin Page Error Handling

**File**: `src/app/auth/signin/page.tsx`
**Action**: Display account locked messages properly

---

#### Find Error Handling Logic

**Location**: Around line 46, in the `onSubmit` function

**Current Code** (Simplified):
```typescript
if (result?.error) {
  setError('Invalid email or password');
  setIsLoading(false);
}
```

---

#### Updated Error Handling

**Replace with**:
```typescript
if (result?.error) {
  // Check for specific error types from NextAuth
  const errorMessage = result.error;

  // Account locked errors contain "Account locked"
  if (errorMessage.includes('Account locked')) {
    setError(errorMessage); // Show full message with time remaining
  } else if (errorMessage.includes('not active')) {
    setError(errorMessage); // Show account inactive message
  } else {
    // Generic error for security (don't reveal if email exists)
    setError('Invalid email or password');
  }

  setIsLoading(false);
}
```

---

#### Optional: Add Visual Indicator

**Add warning styling for account locked**:
```typescript
// In the return JSX, update error display:
{error && (
  <div
    className={`p-4 rounded ${
      error.includes('Account locked')
        ? 'bg-yellow-50 border border-yellow-200'
        : 'bg-red-50 border border-red-200'
    }`}
  >
    <p
      className={`text-sm ${
        error.includes('Account locked')
          ? 'text-yellow-800'
          : 'text-red-800'
      }`}
    >
      {error}
    </p>
  </div>
)}
```

**Why Different Colors**:
- **Red**: Invalid credentials (permanent error)
- **Yellow**: Account locked (temporary, will auto-resolve)

---

**Validation Checklist**:
- [ ] Error handling updated in signin page
- [ ] Account locked message displayed correctly
- [ ] Time remaining shown in lock message
- [ ] Visual distinction for different error types
- [ ] No sensitive information revealed
- [ ] Error messages clear and actionable

---

### Step 4.4: Test Failed Login Tracking

**Comprehensive Testing Procedures**:

---

#### Test 1: Failed Login Attempt Increments

**Purpose**: Verify counter increments on wrong password

**Steps**:
1. [ ] Go to signin page
2. [ ] Enter valid email
3. [ ] Enter wrong password (1st attempt)
4. [ ] Verify error: "Invalid email or password"
5. [ ] Check database:
   ```sql
   SELECT email, "failedLoginAttempts", "lastFailedLoginAt"
   FROM users WHERE email = 'test@example.com';
   ```
6. [ ] Verify `failedLoginAttempts = 1`
7. [ ] Repeat 3 more times (2nd, 3rd, 4th attempts)
8. [ ] Verify counter increments each time

**Expected Result**: Counter increments from 0 → 1 → 2 → 3 → 4

---

#### Test 2: Account Locks on 5th Failure

**Purpose**: Verify account locks after 5 failed attempts

**Steps**:
1. [ ] Continue from Test 1 (at 4 failed attempts)
2. [ ] Try wrong password 5th time
3. [ ] Verify error changes to: "Account locked due to multiple failed login attempts. Please try again in 15 minutes."
4. [ ] Check database:
   ```sql
   SELECT
     email,
     "failedLoginAttempts",
     "accountLockedUntil",
     "lastFailedLoginAt"
   FROM users WHERE email = 'test@example.com';
   ```
5. [ ] Verify `failedLoginAttempts = 5`
6. [ ] Verify `accountLockedUntil` is ~15 minutes from now
7. [ ] Check audit logs:
   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'LOGIN'
     AND details->>'success' = 'false'
     AND details->>'accountLocked' = 'true'
   ORDER BY "createdAt" DESC LIMIT 1;
   ```

**Expected Result**: Account locked for 15 minutes

---

#### Test 3: Locked Account Rejects Even Correct Password

**Purpose**: Verify lock prevents login even with correct credentials

**Steps**:
1. [ ] Continue from Test 2 (account is locked)
2. [ ] Enter correct email and correct password
3. [ ] Verify error: "Account locked due to multiple failed login attempts. Try again in X minutes."
4. [ ] Note: X should be countdown (14, 13, 12... minutes remaining)
5. [ ] Try multiple times with correct password
6. [ ] Verify all attempts rejected with same message

**Expected Result**: Correct password doesn't work while locked

---

#### Test 4: Lock Auto-Expires After 15 Minutes

**Purpose**: Verify automatic unlock after timeout

**Two Approaches**:

**Approach A: Wait 15 Minutes** (Realistic Test)
1. [ ] Note lock time from database
2. [ ] Wait 15 minutes
3. [ ] Try login with correct password
4. [ ] Verify login succeeds
5. [ ] Check database - lock should be cleared

**Approach B: Manual Unlock** (Fast Test for Development)
1. [ ] Manually clear lock in database:
   ```sql
   UPDATE users
   SET "accountLockedUntil" = NOW() - INTERVAL '1 minute',
       "failedLoginAttempts" = 5
   WHERE email = 'test@example.com';
   ```
2. [ ] Try login with correct password
3. [ ] Verify login succeeds
4. [ ] Check database - lock cleared and counter reset

**Expected Result**: Account accessible after lock expires

---

#### Test 5: Successful Login Resets Counter

**Purpose**: Verify counter resets to 0 on successful login

**Steps**:
1. [ ] Fail login 3 times (counter = 3)
2. [ ] Check database to confirm `failedLoginAttempts = 3`
3. [ ] Login with correct password
4. [ ] Verify login succeeds
5. [ ] Check database:
   ```sql
   SELECT email, "failedLoginAttempts", "accountLockedUntil"
   FROM users WHERE email = 'test@example.com';
   ```
6. [ ] Verify `failedLoginAttempts = 0`
7. [ ] Verify `accountLockedUntil = NULL`
8. [ ] Sign out
9. [ ] Fail login 1 time
10. [ ] Check database - counter should be 1 (not 4)

**Expected Result**: Counter resets on successful login

---

#### Test 6: Multiple Accounts Independent

**Purpose**: Verify tracking is per-user, not global

**Steps**:
1. [ ] Fail login 5 times for user A → Account A locked
2. [ ] Try login for user B with correct password → Should succeed
3. [ ] Check database for both users:
   ```sql
   SELECT email, "failedLoginAttempts", "accountLockedUntil"
   FROM users WHERE email IN ('userA@example.com', 'userB@example.com');
   ```
4. [ ] Verify only user A has lock

**Expected Result**: User A locked, User B unaffected

---

### Database Verification Queries

**Monitor failed login attempts**:
```sql
-- Current status of all users with failed attempts
SELECT
  email,
  role,
  "failedLoginAttempts",
  "lastFailedLoginAt",
  "accountLockedUntil",
  CASE
    WHEN "accountLockedUntil" IS NULL THEN 'Active'
    WHEN "accountLockedUntil" > NOW() THEN 'Locked'
    ELSE 'Lock Expired'
  END as account_status
FROM users
WHERE "failedLoginAttempts" > 0
   OR "accountLockedUntil" IS NOT NULL
ORDER BY "lastFailedLoginAt" DESC;

-- Audit trail of failed logins (last 20)
SELECT
  u.email,
  al.details->>'failedAttempts' as attempts,
  al.details->>'accountLocked' as locked,
  al."createdAt" as timestamp
FROM audit_logs al
JOIN users u ON u.id = al."userId"
WHERE al.action = 'LOGIN'
  AND al.details->>'success' = 'false'
ORDER BY al."createdAt" DESC
LIMIT 20;

-- Identify accounts under attack (>5 failed attempts in last hour)
SELECT
  u.email,
  u.role,
  COUNT(*) as failed_attempts,
  MAX(al."createdAt") as last_attempt,
  u."accountLockedUntil"
FROM audit_logs al
JOIN users u ON u.id = al."userId"
WHERE al.action = 'LOGIN'
  AND al.details->>'success' = 'false'
  AND al."createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY u.id, u.email, u.role, u."accountLockedUntil"
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

---

## Configuration Options

### Adjusting Lock Duration

**Current**: 15 minutes (hardcoded in Step 4.2)

**To make configurable**, extract to constants:

**File**: `src/lib/auth/config.ts` (top of file)
```typescript
// Failed Login Configuration
const FAILED_LOGIN_CONFIG = {
  MAX_ATTEMPTS: 5,           // Lock after this many failures
  LOCK_DURATION_MINUTES: 15, // How long to lock account
} as const;
```

**Then use in code**:
```typescript
accountLockedUntil: shouldLockAccount
  ? new Date(Date.now() + FAILED_LOGIN_CONFIG.LOCK_DURATION_MINUTES * 60 * 1000)
  : null,
```

**Benefits**:
- Single source of truth
- Easy to adjust
- Self-documenting
- Follows CLAUDE.md no-hardcode rule

---

### Environment-Based Configuration

**For different environments** (dev vs prod):

**File**: `.env`
```bash
# Failed Login Protection
FAILED_LOGIN_MAX_ATTEMPTS=5
FAILED_LOGIN_LOCK_MINUTES=15
```

**Usage**:
```typescript
const maxAttempts = parseInt(process.env.FAILED_LOGIN_MAX_ATTEMPTS || '5');
const lockMinutes = parseInt(process.env.FAILED_LOGIN_LOCK_MINUTES || '15');
```

---

## Troubleshooting

### Issue: Counter doesn't increment

**Possible Causes**:
1. Database migration not applied
2. Prisma client not regenerated
3. User select doesn't include tracking fields

**Solutions**:
1. Run: `npx prisma migrate deploy`
2. Run: `npx prisma generate`
3. Verify select statement includes: `failedLoginAttempts`, `lastFailedLoginAt`, `accountLockedUntil`
4. Restart dev server

---

### Issue: Account never locks

**Possible Causes**:
1. Lock logic not in authorize function
2. Threshold check incorrect (`>=5` vs `>5`)
3. Database update not executing

**Solutions**:
1. Verify lock logic added to authorize function
2. Check condition: `newFailedAttempts >= 5` (not `>`)
3. Add console.log before Prisma update to verify execution
4. Check for database errors in logs

---

### Issue: Lock doesn't expire

**Possible Causes**:
1. Lock check logic incorrect
2. Timezone issues
3. Database datetime not UTC

**Solutions**:
1. Verify check: `new Date() < user.accountLockedUntil`
2. Ensure all dates stored as UTC
3. Check: `console.log(new Date(), user.accountLockedUntil)`
4. Manually clear lock to test: `UPDATE users SET "accountLockedUntil" = NULL`

---

## Success Criteria

### Task Complete When:
- [ ] Database schema updated with tracking fields
- [ ] Migration applied successfully
- [ ] Authorize function updated with tracking logic
- [ ] Account locks after 5 failed attempts
- [ ] Lock auto-expires after 15 minutes
- [ ] Successful login resets counter
- [ ] Signin page displays lock messages
- [ ] All manual tests passed
- [ ] Audit logs show failed attempts
- [ ] Database queries verify tracking works

### Quality Metrics:
- **Brute Force Protection**: 100% effective (locks after 5 attempts)
- **False Lock Rate**: <0.01% (legitimate users locked accidentally)
- **Auto-Unlock**: 100% success rate after timeout
- **Performance**: <5ms overhead per login attempt

---

## Next Steps

After completing this task:
1. ✅ Brute force attacks mitigated
2. ➡️ Proceed to [07-TASK5-ADMIN-NOTIFICATIONS.md](./07-TASK5-ADMIN-NOTIFICATIONS.md)
3. Complete Phase 2 Implementation

**Related Tasks**:
- **Previous**: [05-TASK3-ADMIN-PASSWORD.md](./05-TASK3-ADMIN-PASSWORD.md)
- **Next**: [07-TASK5-ADMIN-NOTIFICATIONS.md](./07-TASK5-ADMIN-NOTIFICATIONS.md)
- **Testing**: [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)

---

**Task Version**: 1.0
**Last Updated**: January 2025
**Estimated Time**: 3 hours
**Difficulty**: Medium
**Prerequisites**: Understanding of authentication flows and Prisma
