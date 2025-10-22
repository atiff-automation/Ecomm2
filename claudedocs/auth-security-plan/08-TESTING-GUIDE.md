# Testing Guide

**Purpose**: Comprehensive testing procedures for all authentication security features
**Phase**: Testing & Validation
**Time Estimate**: 4-6 hours for complete testing

---

## Overview

This guide provides systematic testing procedures for all authentication security implementations. Follow these tests to ensure all features work correctly before deployment.

### Test Categories

1. **Phase 1 Tests**: Critical security fixes (Tasks 1-3)
2. **Phase 2 Tests**: Important improvements (Tasks 4-5)
3. **Integration Tests**: End-to-end user journeys
4. **Performance Tests**: Speed and efficiency validation
5. **Security Tests**: Vulnerability and penetration testing

---

## Test Environment Setup

### Before Testing

**Prerequisites**:
- [ ] All code implementations complete
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Email service (Resend) working
- [ ] Development server running
- [ ] Test user accounts created

**Test Accounts Needed**:
```sql
-- Create test accounts (if not exist)
INSERT INTO users (email, password, role, firstName, lastName, status)
VALUES
  ('customer@test.com', '[hashed_password]', 'CUSTOMER', 'Test', 'Customer', 'ACTIVE'),
  ('admin@test.com', '[hashed_password]', 'ADMIN', 'Test', 'Admin', 'ACTIVE'),
  ('staff@test.com', '[hashed_password]', 'STAFF', 'Test', 'Staff', 'ACTIVE'),
  ('superadmin@test.com', '[hashed_password]', 'SUPERADMIN', 'Test', 'SuperAdmin', 'ACTIVE');
```

**Test Passwords**: Use `TestPass123!` for all test accounts (meets requirements)

---

## Phase 1: Critical Fixes Testing

### Test Suite 1: Forgot Password Flow

#### 1.1 Request Password Reset

**Test Case**: User can request password reset
- [ ] Navigate to `/auth/signin`
- [ ] Click "Forgot Password" link
- [ ] Enter valid email address
- [ ] Click "Send Reset Link"
- [ ] See success message
- [ ] Check email inbox
- [ ] Verify reset email received within 30 seconds
- [ ] Email contains valid reset link

**Expected Result**: ✅ Reset email received with valid link

---

#### 1.2 Invalid Email Handling

**Test Case**: Security - Don't reveal email existence
- [ ] Request reset for non-existent email
- [ ] See same success message (security feature)
- [ ] No email sent (check inbox)
- [ ] No error revealing email doesn't exist

**Expected Result**: ✅ Generic success message, no email sent

---

#### 1.3 Reset Password with Valid Token

**Test Case**: User can reset password with token
- [ ] Click reset link from email
- [ ] Verify token validation page loads
- [ ] Enter new password: `NewPass123!`
- [ ] Confirm password: `NewPass123!`
- [ ] Submit form
- [ ] See success message
- [ ] Redirected to signin page
- [ ] Sign in with NEW password → Success
- [ ] Try old password → Fails

**Expected Result**: ✅ Password reset successful

---

#### 1.4 Expired Token Handling

**Test Case**: Expired tokens are rejected
- [ ] Request reset link
- [ ] Wait 1+ hour (or manually expire in DB)
- [ ] Try to use reset link
- [ ] See error: "Token has expired"
- [ ] Unable to reset password
- [ ] Can request new link

**Expected Result**: ✅ Expired token rejected

---

#### 1.5 Token Reuse Prevention

**Test Case**: Tokens can only be used once
- [ ] Reset password successfully
- [ ] Try to use same reset link again
- [ ] See error: "Invalid or expired token"
- [ ] Token cleared from database

**Expected Result**: ✅ Token reuse blocked

---

#### 1.6 Rate Limiting

**Test Case**: Prevent reset request abuse
- [ ] Request reset 4 times rapidly (within 5 minutes)
- [ ] On 4th request, get rate limit error
- [ ] Wait 5 minutes
- [ ] Request succeeds again

**Expected Result**: ✅ Rate limiting active

---

### Test Suite 2: CSRF Protection

#### 2.1 Valid CSRF Token

**Test Case**: Requests with valid tokens succeed
- [ ] Login to application
- [ ] Submit protected form (e.g., profile update)
- [ ] Open DevTools → Network tab
- [ ] Verify `x-csrf-token` header present
- [ ] Request succeeds (200/201 status)
- [ ] No CSRF errors

**Expected Result**: ✅ Request successful with token

---

#### 2.2 Missing CSRF Token

**Test Case**: Requests without tokens are blocked
- [ ] Open browser console
- [ ] Execute manual fetch without CSRF token:
```javascript
fetch('/api/settings/account', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: 'data' })
}).then(r => r.json()).then(console.log);
```
- [ ] Response status: 403 Forbidden
- [ ] Error message mentions CSRF

**Expected Result**: ✅ Request blocked (403)

---

#### 2.3 Invalid CSRF Token

**Test Case**: Fake tokens are rejected
- [ ] Execute fetch with invalid token:
```javascript
fetch('/api/settings/account', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': 'fake-token-12345'
  },
  body: JSON.stringify({ test: 'data' })
}).then(r => r.json()).then(console.log);
```
- [ ] Response status: 403 Forbidden
- [ ] Error indicates invalid token

**Expected Result**: ✅ Invalid token rejected

---

#### 2.4 Safe Methods Bypass

**Test Case**: GET requests don't need CSRF
- [ ] Execute GET request without token:
```javascript
fetch('/api/settings/account')
  .then(r => r.json())
  .then(console.log);
```
- [ ] Request succeeds
- [ ] No CSRF validation

**Expected Result**: ✅ GET requests work without CSRF

---

#### 2.5 Protected Routes Coverage

**Test Case**: All mutation routes protected

Test each route:
- [ ] POST `/api/auth/register` → CSRF required
- [ ] POST `/api/auth/forgot-password` → CSRF required
- [ ] POST `/api/auth/reset-password` → CSRF required
- [ ] POST `/api/settings/password` → CSRF required
- [ ] PUT `/api/settings/account` → CSRF required
- [ ] POST `/api/admin/products` → CSRF required
- [ ] DELETE `/api/admin/products/[id]` → CSRF required

**Expected Result**: ✅ All routes protected

---

### Test Suite 3: Admin Password Change

#### 3.1 Admin Can Change Password

**Test Case**: ADMIN role can change own password
- [ ] Sign in as ADMIN
- [ ] Navigate to password change page
- [ ] Enter current password
- [ ] Enter new password: `AdminPass123!`
- [ ] Confirm password
- [ ] Submit form
- [ ] See success message
- [ ] Sign out
- [ ] Sign in with new password → Success

**Expected Result**: ✅ Admin password changed

---

#### 3.2 Staff Can Change Password

**Test Case**: STAFF role can change own password
- [ ] Repeat 3.1 with STAFF account
- [ ] Verify success

**Expected Result**: ✅ Staff password changed

---

#### 3.3 SuperAdmin Can Change Password

**Test Case**: SUPERADMIN role can change own password
- [ ] Repeat 3.1 with SUPERADMIN account
- [ ] Verify success

**Expected Result**: ✅ SuperAdmin password changed

---

#### 3.4 Customer Can Still Change Password

**Test Case**: Regression - CUSTOMER still works
- [ ] Sign in as CUSTOMER
- [ ] Navigate to `/settings/account`
- [ ] Change password
- [ ] Verify success

**Expected Result**: ✅ Customer functionality preserved

---

#### 3.5 Wrong Current Password

**Test Case**: Validation - Current password required
- [ ] Navigate to password change
- [ ] Enter WRONG current password
- [ ] Enter valid new password
- [ ] Submit
- [ ] See error: "Current password is incorrect"
- [ ] Password NOT changed

**Expected Result**: ✅ Wrong password rejected

---

## Phase 2: Important Improvements Testing

### Test Suite 4: Failed Login Tracking

#### 4.1 Failed Attempts Increment

**Test Case**: Counter increases on wrong password
- [ ] Try login with wrong password (1st time)
- [ ] Check database: `failedLoginAttempts = 1`
- [ ] Repeat 3 more times (2nd, 3rd, 4th)
- [ ] Verify counter: 1 → 2 → 3 → 4

**Expected Result**: ✅ Counter increments correctly

---

#### 4.2 Account Locks After 5 Failures

**Test Case**: Automatic account locking
- [ ] Fail login 5th time
- [ ] See error: "Account locked... 15 minutes"
- [ ] Check database:
```sql
SELECT "failedLoginAttempts", "accountLockedUntil"
FROM users WHERE email = 'test@example.com';
```
- [ ] Verify `failedLoginAttempts = 5`
- [ ] Verify `accountLockedUntil` ~15 minutes from now

**Expected Result**: ✅ Account locked

---

#### 4.3 Locked Account Rejects Correct Password

**Test Case**: Lock prevents login
- [ ] Try login with CORRECT password
- [ ] Still see "Account locked" error
- [ ] Login fails
- [ ] Check countdown shows minutes remaining

**Expected Result**: ✅ Correct password doesn't bypass lock

---

#### 4.4 Lock Auto-Expires

**Test Case**: Automatic unlock after timeout

**Option A: Wait 15 minutes**
- [ ] Note lock time
- [ ] Wait 15 minutes
- [ ] Try login with correct password
- [ ] Login succeeds

**Option B: Manual unlock for testing**
```sql
UPDATE users
SET "accountLockedUntil" = NOW() - INTERVAL '1 minute'
WHERE email = 'test@example.com';
```
- [ ] Try login
- [ ] Login succeeds

**Expected Result**: ✅ Auto-unlock works

---

#### 4.5 Successful Login Resets Counter

**Test Case**: Counter resets on success
- [ ] Fail 3 times (counter = 3)
- [ ] Login successfully
- [ ] Check database: `failedLoginAttempts = 0`
- [ ] Fail 1 time
- [ ] Check database: `failedLoginAttempts = 1` (not 4)

**Expected Result**: ✅ Counter resets

---

#### 4.6 Multiple Accounts Independent

**Test Case**: Per-user tracking
- [ ] Fail 5 times for User A → Locked
- [ ] Try User B with correct password → Success
- [ ] Check database: Only User A locked

**Expected Result**: ✅ Independent tracking

---

### Test Suite 5: Admin Login Notifications

#### 5.1 Admin Login Email

**Test Case**: Notification sent for ADMIN
- [ ] Sign in as ADMIN
- [ ] Check console: "✅ Admin login notification sent"
- [ ] Check email inbox (within 5 seconds)
- [ ] Verify email received
- [ ] Check subject: "🔐 Admin Login: ADMIN - [email]"
- [ ] Check body shows correct details

**Expected Result**: ✅ Email received

---

#### 5.2 Staff Login Email

**Test Case**: Notification sent for STAFF
- [ ] Sign in as STAFF
- [ ] Verify email received
- [ ] Check role shows "STAFF"

**Expected Result**: ✅ Email received

---

#### 5.3 SuperAdmin Login Email

**Test Case**: Notification sent for SUPERADMIN
- [ ] Sign in as SUPERADMIN
- [ ] Verify email received
- [ ] Check role shows "SUPERADMIN"

**Expected Result**: ✅ Email received

---

#### 5.4 Customer No Email

**Test Case**: Customers don't trigger emails
- [ ] Sign in as CUSTOMER
- [ ] Check console: NO notification message
- [ ] Check email: NO notification received

**Expected Result**: ✅ No email for customers

---

#### 5.5 Email Failure Doesn't Block Login

**Test Case**: Graceful email failure
- [ ] Disable RESEND_API_KEY in .env
- [ ] Restart server
- [ ] Sign in as ADMIN
- [ ] Login SUCCEEDS (not blocked)
- [ ] Console shows: "⚠️ email not configured"
- [ ] Re-enable API key

**Expected Result**: ✅ Login works without email

---

## Integration Tests

### Journey 1: New User Account Recovery

**Scenario**: User forgets password after signup

**Steps**:
1. [ ] User signs up (new account)
2. [ ] User forgets password
3. [ ] User clicks "Forgot Password"
4. [ ] User receives reset email
5. [ ] User clicks link, resets password
6. [ ] User signs in with new password
7. [ ] Success!

**Expected Result**: ✅ Complete journey works

---

### Journey 2: Admin Security Workflow

**Scenario**: Admin changes password, gets notifications

**Steps**:
1. [ ] Admin signs in → Notification sent
2. [ ] Admin navigates to password change
3. [ ] Admin changes password
4. [ ] Admin signs out
5. [ ] Admin signs in with new password → Notification sent
6. [ ] Admin receives both login notifications

**Expected Result**: ✅ Complete workflow works

---

### Journey 3: Attack and Recovery

**Scenario**: Account under attack, then recovered

**Steps**:
1. [ ] Attacker tries wrong password 5 times
2. [ ] Account locks
3. [ ] Legitimate user can't login (correct password)
4. [ ] Wait 15 minutes (or manually unlock)
5. [ ] Legitimate user logs in successfully
6. [ ] Counter resets

**Expected Result**: ✅ Protection and recovery works

---

## Performance Tests

### Test 1: Password Reset Performance

**Metrics**:
- [ ] Reset request: <2 seconds
- [ ] Email delivery: <5 seconds
- [ ] Token validation: <500ms
- [ ] Password update: <1 second

**Expected Result**: ✅ All under target times

---

### Test 2: CSRF Overhead

**Metrics**:
- [ ] CSRF validation: <10ms per request
- [ ] No noticeable delay in UI
- [ ] Token generation: <5ms

**Expected Result**: ✅ Minimal overhead

---

### Test 3: Login Performance

**Metrics**:
- [ ] Login without tracking: Baseline
- [ ] Login with tracking: <50ms slower
- [ ] Failed login processing: <100ms
- [ ] Email notification: <100ms (non-blocking)

**Expected Result**: ✅ Acceptable performance

---

## Security Tests

### Test 1: CSRF Attack Simulation

**Attack**: Try cross-site request forgery
- [ ] Create malicious form on external site
- [ ] Submit to protected API endpoint
- [ ] Verify request blocked (403)
- [ ] No data modified

**Expected Result**: ✅ CSRF attack blocked

---

### Test 2: Brute Force Attack

**Attack**: Try unlimited password attempts
- [ ] Automated script tries 100 passwords
- [ ] Account locks after 5 attempts
- [ ] Script cannot continue
- [ ] Account protected

**Expected Result**: ✅ Brute force prevented

---

### Test 3: Token Replay Attack

**Attack**: Try to reuse password reset token
- [ ] Intercept valid reset token
- [ ] Use token to reset password
- [ ] Try to use same token again
- [ ] Verify second attempt fails

**Expected Result**: ✅ Token replay prevented

---

### Test 4: Timing Attack Prevention

**Attack**: Try to determine if email exists
- [ ] Time response for valid email
- [ ] Time response for invalid email
- [ ] Compare times
- [ ] Should be similar (no information leak)

**Expected Result**: ✅ No timing differences

---

## Database Integrity Tests

### Test 1: Audit Log Completeness

```sql
-- Check all password resets logged
SELECT COUNT(*) FROM audit_logs
WHERE action = 'PASSWORD_RESET'
  AND "createdAt" > NOW() - INTERVAL '1 hour';

-- Check all failed logins logged
SELECT COUNT(*) FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
  AND "createdAt" > NOW() - INTERVAL '1 hour';

-- Check all admin logins logged
SELECT COUNT(*) FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'true'
  AND details->>'role' IN ('ADMIN', 'STAFF', 'SUPERADMIN')
  AND "createdAt" > NOW() - INTERVAL '1 hour';
```

**Expected Result**: ✅ All events logged

---

### Test 2: Data Consistency

```sql
-- No orphaned reset tokens
SELECT COUNT(*) FROM users
WHERE "passwordResetToken" IS NOT NULL
  AND "passwordResetTokenExpiry" < NOW();

-- No permanent locks
SELECT COUNT(*) FROM users
WHERE "accountLockedUntil" < NOW();

-- No negative counters
SELECT COUNT(*) FROM users
WHERE "failedLoginAttempts" < 0;
```

**Expected Result**: ✅ All counts = 0

---

## Regression Tests

### Test 1: Existing Features Still Work

- [ ] User registration works
- [ ] Customer login works
- [ ] Profile updates work
- [ ] Order placement works
- [ ] Admin panel accessible
- [ ] All existing API routes work

**Expected Result**: ✅ No regressions

---

### Test 2: No Breaking Changes

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `npm run build` succeeds
- [ ] All tests pass
- [ ] No console errors in browser

**Expected Result**: ✅ Clean build

---

## Test Results Documentation

### Test Report Template

```markdown
# Authentication Security Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]

## Summary
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Pass Rate: [Percentage]%

## Phase 1 Results
- Forgot Password: [✅/❌]
- CSRF Protection: [✅/❌]
- Admin Password Change: [✅/❌]

## Phase 2 Results
- Failed Login Tracking: [✅/❌]
- Admin Notifications: [✅/❌]

## Issues Found
[List any issues or bugs discovered]

## Recommendations
[List any recommendations or improvements]
```

---

## Next Steps

After completing all tests:
1. ✅ All features tested and validated
2. 📋 Create test report
3. 🐛 Fix any issues found
4. ✅ Re-test fixed issues
5. ➡️ Proceed to [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Estimated Time**: 4-6 hours for complete testing
