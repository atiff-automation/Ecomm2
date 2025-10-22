# Troubleshooting Guide

**Purpose**: Common issues and solutions for authentication security features
**Usage**: Reference when problems occur
**Scope**: Phase 1 & 2 implementations

---

## How to Use This Guide

1. **Identify the problem** - Match your issue to a category below
2. **Check symptoms** - Verify you have the described symptoms
3. **Follow solutions** - Try solutions in order (easiest first)
4. **Verify fix** - Test that issue is resolved
5. **Document** - Note solution for future reference

---

## Category Index

1. [Password Reset Issues](#password-reset-issues)
2. [CSRF Protection Issues](#csrf-protection-issues)
3. [Password Change Issues](#password-change-issues)
4. [Failed Login Tracking Issues](#failed-login-tracking-issues)
5. [Email Notification Issues](#email-notification-issues)
6. [Database Issues](#database-issues)
7. [Performance Issues](#performance-issues)
8. [Environment Issues](#environment-issues)

---

## Password Reset Issues

### Issue 1: Reset Emails Not Sending

**Symptoms**:
- User requests password reset
- Success message shows
- No email received (even in spam)

**Possible Causes**:
1. RESEND_API_KEY not configured
2. FROM_EMAIL not verified in Resend
3. Email service down
4. Network/firewall blocking

**Solutions**:

**Step 1: Check Environment Variables**
```bash
# Verify variables are set
echo $RESEND_API_KEY
echo $FROM_EMAIL

# Or check in application
node -e "console.log(process.env.RESEND_API_KEY ? 'Set' : 'Not set')"
```
- [ ] If not set, add to `.env` file
- [ ] Restart application after adding

**Step 2: Verify Email Domain in Resend**
- [ ] Login to https://resend.com/dashboard
- [ ] Go to "Domains" section
- [ ] Verify FROM_EMAIL domain is listed and verified
- [ ] If not verified, follow Resend verification process

**Step 3: Test Email Service Directly**
```bash
# Test with curl
curl -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "text": "Test email"
  }'
```
- [ ] If fails, check API key validity
- [ ] Check Resend account status (not suspended)

**Step 4: Check Application Logs**
```bash
# Look for email errors
grep "Email sending error" logs/application.log
grep "Password reset email" logs/application.log
```
- [ ] If errors found, read error messages for clues
- [ ] Common errors: "Invalid API key", "Domain not verified", "Rate limit exceeded"

**Verification**:
- [ ] Request password reset
- [ ] Check console logs for success message
- [ ] Check email inbox within 30 seconds
- [ ] Check spam folder
- [ ] Verify email contains reset link

---

### Issue 2: Reset Token Expired Too Quickly

**Symptoms**:
- User receives reset email
- Clicks link within minutes
- Gets "Token has expired" error

**Possible Causes**:
1. Server time incorrect (timezone issues)
2. Token expiry too short (< 1 hour)
3. Database timezone mismatch

**Solutions**:

**Step 1: Check Server Time**
```bash
# Check current server time
date

# Check timezone
timedatectl  # Linux
# or
date +%Z  # Mac/Linux
```
- [ ] Verify time is correct
- [ ] Verify timezone is correct (should be UTC or local)

**Step 2: Check Token Expiry Configuration**
```typescript
// In src/lib/auth/password-reset.ts
const PASSWORD_RESET_CONFIG = {
  TOKEN_EXPIRY_HOURS: 1, // Should be at least 1 hour
}
```
- [ ] Verify TOKEN_EXPIRY_HOURS is 1 or more
- [ ] If changed, restart application

**Step 3: Check Database Timezone**
```sql
-- Check database timezone
SHOW timezone;

-- Check token expiry time
SELECT
  email,
  "passwordResetToken",
  "passwordResetTokenExpiry",
  NOW() as current_time,
  "passwordResetTokenExpiry" > NOW() as is_valid
FROM users
WHERE "passwordResetToken" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```
- [ ] Verify timezone is UTC
- [ ] Verify expiry time is in future
- [ ] If expiry in past but token is new, time sync issue

**Step 4: Adjust Configuration If Needed**
```typescript
// Increase expiry if needed
const PASSWORD_RESET_CONFIG = {
  TOKEN_EXPIRY_HOURS: 2, // Increase to 2 hours
}
```
- [ ] Update configuration
- [ ] Restart application
- [ ] Test again

**Verification**:
- [ ] Request new reset link
- [ ] Wait 5 minutes
- [ ] Click link
- [ ] Verify token is still valid

---

### Issue 3: Reset Link Redirects to 404

**Symptoms**:
- User clicks reset link from email
- Gets 404 or "Page not found" error

**Possible Causes**:
1. Reset password route not created
2. Dynamic route parameter incorrect
3. Build/deployment issue

**Solutions**:

**Step 1: Verify Route File Exists**
```bash
# Check file exists
ls -la src/app/auth/reset-password/[token]/page.tsx
```
- [ ] If file doesn't exist, create it (see Task 1 implementation)
- [ ] Verify file is in correct location

**Step 2: Check URL Format**
```
# Correct format:
https://yourdomain.com/auth/reset-password/abc123def456

# Incorrect formats:
https://yourdomain.com/reset-password/abc123  # Missing /auth
https://yourdomain.com/auth/reset/abc123  # Wrong path
```
- [ ] Verify email contains correct URL format
- [ ] Check NEXT_PUBLIC_APP_URL is correct in .env

**Step 3: Rebuild Application**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Or in development
npm run dev
```
- [ ] Clear cache and rebuild
- [ ] Test route manually: navigate to `/auth/reset-password/test`
- [ ] Should show "Invalid token" not 404

**Verification**:
- [ ] Request password reset
- [ ] Check email link URL format
- [ ] Click link
- [ ] Verify shows reset password page (not 404)

---

## CSRF Protection Issues

### Issue 1: All Requests Failing with 403

**Symptoms**:
- All form submissions fail
- Error: 403 Forbidden
- Console shows CSRF errors

**Possible Causes**:
1. CSRF token not being generated
2. Token not stored in cookie/meta tag
3. Token not sent with requests
4. NEXTAUTH_SECRET not set

**Solutions**:

**Step 1: Check NEXTAUTH_SECRET**
```bash
# Verify secret is set
echo $NEXTAUTH_SECRET

# Should be 32+ characters
# If not set, generate one
openssl rand -base64 32
```
- [ ] Set NEXTAUTH_SECRET in .env
- [ ] Restart application

**Step 2: Check Token Generation**
```javascript
// In browser console
document.cookie  // Check for csrf-token
document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
```
- [ ] Verify token exists in cookie or meta tag
- [ ] If not, check CSRFProtection.generateToken() is called

**Step 3: Check Request Headers**
```javascript
// In browser DevTools → Network tab
// Check any POST/PUT/DELETE request
// Headers should include:
x-csrf-token: [token value]
```
- [ ] Verify header is present
- [ ] If not, check fetchWithCSRF wrapper is used

**Step 4: Temporarily Disable CSRF (Testing Only)**
```typescript
// In with-csrf.ts (TEMPORARY - for testing)
export async function checkCSRF(request: NextRequest): Promise<Response | null> {
  console.log('⚠️ CSRF CHECK DISABLED - TESTING ONLY');
  return null; // Skip check
}
```
- [ ] If works now, issue is token generation/validation
- [ ] Re-enable immediately after identifying issue

**Verification**:
- [ ] Clear browser cache and cookies
- [ ] Refresh page
- [ ] Check token in console
- [ ] Submit form
- [ ] Verify succeeds

---

### Issue 2: Random CSRF Failures

**Symptoms**:
- CSRF failures happen intermittently
- Works sometimes, fails other times
- More common after being idle

**Possible Causes**:
1. Token expiring (usually 1 hour)
2. Session expiring
3. Cookie issues (SameSite, Secure flags)

**Solutions**:

**Step 1: Check Token Expiry**
```typescript
// In csrf-protection.ts
// Increase token validity if needed
const TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours instead of 1
```
- [ ] Update token expiry
- [ ] Restart application

**Step 2: Implement Token Refresh**
```typescript
// In fetchWithCSRF
if (response.status === 403) {
  const data = await response.json();
  if (data.newToken) {
    // Store new token and retry
    setCSRFToken(data.newToken);
    return fetch(url, { ...options, headers: updatedHeaders });
  }
}
```
- [ ] Verify automatic retry logic exists
- [ ] Test by manually expiring token

**Step 3: Check Cookie Settings**
```typescript
// Cookie should have:
// - SameSite=Lax or Strict
// - Secure=true (in production)
// - Path=/
document.cookie = `csrf-token=${token}; path=/; SameSite=Strict${isProduction ? '; Secure' : ''}`;
```
- [ ] Verify cookie attributes correct
- [ ] Check cookies not being blocked by browser

**Verification**:
- [ ] Stay on page for 1+ hour
- [ ] Submit form
- [ ] Should auto-refresh token and succeed

---

## Password Change Issues

### Issue 1: Admin Gets "Forbidden" Error

**Symptoms**:
- Admin tries to change password
- Gets 403 Forbidden error
- Feature works for customers

**Possible Causes**:
1. Role check not removed from API
2. Old code still deployed
3. Cache issue

**Solutions**:

**Step 1: Verify Code Changes**
```typescript
// In src/app/api/settings/password/route.ts
// Should NOT have this:
// if (session.user.role !== 'CUSTOMER') { return 403; }

// Should have this:
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
- [ ] Check file has correct code
- [ ] No role-based restriction

**Step 2: Clear Cache and Rebuild**
```bash
rm -rf .next
npm run build
# or
npm run dev
```
- [ ] Clear Next.js cache
- [ ] Restart development server

**Step 3: Check Deployed Version**
```bash
# Check git
git log -1 --oneline  # Verify latest changes

# Check if changes deployed
git status
```
- [ ] Verify changes committed
- [ ] Verify changes deployed to environment

**Verification**:
- [ ] Sign in as ADMIN
- [ ] Navigate to password change
- [ ] Change password
- [ ] Verify succeeds (no 403)

---

### Issue 2: "Wrong Current Password" When Password is Correct

**Symptoms**:
- User enters correct current password
- Gets "Current password is incorrect" error
- User is sure password is correct

**Possible Causes**:
1. Password was recently changed and user using old one
2. bcrypt comparison issue
3. Encoding/whitespace issue

**Solutions**:

**Step 1: Verify User's Current Password**
```sql
-- Check password hash in database
SELECT email, password FROM users WHERE email = 'user@example.com';
```
- [ ] Copy hash
- [ ] Test hash with known password:
```typescript
const bcrypt = require('bcryptjs');
bcrypt.compare('userPassword', '[hash from db]', (err, result) => {
  console.log('Match:', result);
});
```

**Step 2: Check for Whitespace**
```typescript
// In API route, add trimming
const { currentPassword } = validation.data;
const trimmedPassword = currentPassword.trim();

const isValidPassword = await bcrypt.compare(trimmedPassword, user.password);
```
- [ ] Add trim() to password input
- [ ] Re-test

**Step 3: Check Password Not Recently Changed**
```sql
-- Check recent password changes
SELECT * FROM audit_logs
WHERE "userId" = (SELECT id FROM users WHERE email = 'user@example.com')
  AND action = 'PASSWORD'
ORDER BY "createdAt" DESC
LIMIT 5;
```
- [ ] Verify no recent password changes
- [ ] If changed, user might be using old password

**Step 4: Reset Password Manually (Last Resort)**
```bash
# Generate new hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPassword123!', 12, (e, h) => console.log(h));"

# Update in database
UPDATE users
SET password = '[new_hash]'
WHERE email = 'user@example.com';
```
- [ ] Only do this if all else fails
- [ ] Communicate new password to user securely

**Verification**:
- [ ] User tries with trimmed password
- [ ] Verifies exact password (no extra spaces)
- [ ] Password change succeeds

---

## Failed Login Tracking Issues

### Issue 1: Counter Not Incrementing

**Symptoms**:
- User enters wrong password multiple times
- Counter stays at 0
- Account never locks

**Possible Causes**:
1. Database fields not added
2. Migration not applied
3. Logic not in authorize function

**Solutions**:

**Step 1: Check Database Schema**
```sql
-- Check if fields exist
\d users  -- PostgreSQL
-- or
DESCRIBE users;  -- MySQL

-- Should show:
-- failedLoginAttempts
-- lastFailedLoginAt
-- accountLockedUntil
```
- [ ] If fields missing, run migration
```bash
npx prisma migrate dev --name add_failed_login_tracking
```

**Step 2: Verify Logic in Auth Config**
```typescript
// In src/lib/auth/config.ts authorize function
// Should have:
if (!isPasswordValid) {
  const newFailedAttempts = user.failedLoginAttempts + 1;
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: newFailedAttempts, /* ... */ }
  });
}
```
- [ ] Check logic is present
- [ ] Check Prisma update is actually executing

**Step 3: Check Database After Failed Login**
```sql
SELECT email, "failedLoginAttempts", "lastFailedLoginAt"
FROM users
WHERE email = 'test@example.com';
```
- [ ] Try wrong password
- [ ] Run query immediately
- [ ] Verify count increased

**Verification**:
- [ ] Clear user's failed attempts (set to 0)
- [ ] Try wrong password 3 times
- [ ] Check database shows failedLoginAttempts = 3

---

### Issue 2: Account Locked But Lock Doesn't Expire

**Symptoms**:
- Account locked after 5 failed attempts
- 15+ minutes passed
- Still can't login

**Possible Causes**:
1. Lock expiry check not working
2. Timezone issue
3. Logic not clearing lock

**Solutions**:

**Step 1: Check Lock Expiry Time**
```sql
SELECT
  email,
  "accountLockedUntil",
  NOW() as current_time,
  "accountLockedUntil" > NOW() as still_locked,
  EXTRACT(EPOCH FROM ("accountLockedUntil" - NOW()))/60 as minutes_remaining
FROM users
WHERE email = 'test@example.com';
```
- [ ] Check if accountLockedUntil is in past
- [ ] If in past but still locked, logic issue

**Step 2: Verify Lock Check Logic**
```typescript
// In authorize function
if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
  throw new Error('Account locked...');
}
// This check should be BEFORE password check
```
- [ ] Verify logic is correct
- [ ] Verify check runs before password verification

**Step 3: Manual Unlock (Testing)**
```sql
UPDATE users
SET
  "accountLockedUntil" = NULL,
  "failedLoginAttempts" = 0
WHERE email = 'test@example.com';
```
- [ ] Manually unlock
- [ ] Try login
- [ ] Should work

**Step 4: Check for Time Sync Issues**
```bash
# Check server time
date

# Compare with database time
psql -c "SELECT NOW();"
```
- [ ] Times should match (within seconds)
- [ ] If different, time sync issue

**Verification**:
- [ ] Lock account (5 wrong passwords)
- [ ] Wait 16 minutes
- [ ] Try correct password
- [ ] Login should succeed

---

## Email Notification Issues

### Issue 1: Admin Login Emails Not Sending

**Symptoms**:
- Admin signs in
- No email notification received
- Login succeeds normally

**Possible Causes**:
1. Email configuration missing
2. Notification logic not in JWT callback
3. Email service issue

**Solutions**:

**Step 1: Check Environment Variables**
```bash
echo $ADMIN_NOTIFICATION_EMAIL
echo $RESEND_API_KEY
echo $FROM_EMAIL
```
- [ ] Verify all are set
- [ ] Add if missing

**Step 2: Check Console Logs**
```bash
# Look for notification messages
grep "Admin login notification" logs/application.log
```
- [ ] Should see: "✅ Admin login notification sent: [email]"
- [ ] If sees: "⚠️ email not configured", check env vars
- [ ] If sees: "❌ notification failed", read error details

**Step 3: Verify Logic in JWT Callback**
```typescript
// In src/lib/auth/config.ts
callbacks: {
  async jwt({ token, user }) {
    if (user && ['ADMIN', 'STAFF', 'SUPERADMIN'].includes(user.role)) {
      sendAdminLoginNotification(user).catch(/* ... */);
    }
    return token;
  }
}
```
- [ ] Check notification call exists
- [ ] Check not throwing errors

**Step 4: Test Email Service**
```bash
# Test Resend API directly
curl -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "'$FROM_EMAIL'",
    "to": "'$ADMIN_NOTIFICATION_EMAIL'",
    "subject": "Test",
    "text": "Test notification"
  }'
```
- [ ] If fails, check API key, domain verification

**Verification**:
- [ ] Sign in as ADMIN
- [ ] Check console logs
- [ ] Check email inbox (within 10 seconds)
- [ ] Verify email received

---

## Performance Issues

### Issue 1: Login Extremely Slow

**Symptoms**:
- Login takes >5 seconds
- Significant delay noticeable to users

**Possible Causes**:
1. Database query slow
2. bcrypt rounds too high
3. Email sending blocking login
4. Network latency

**Solutions**:

**Step 1: Check bcrypt Salt Rounds**
```typescript
// Should be 10-12 rounds
const hashedPassword = await bcrypt.hash(password, 12);
```
- [ ] If >12, reduce to 12
- [ ] Re-hash test user's password with 12 rounds
- [ ] Test login speed

**Step 2: Check Database Query Performance**
```sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';
```
- [ ] Check if email column is indexed
- [ ] If not indexed, add index:
```sql
CREATE INDEX idx_users_email ON users(email);
```

**Step 3: Verify Email Not Blocking**
```typescript
// Email should be fire-and-forget (no await)
sendAdminLoginNotification(user).catch(/* ... */);  // Correct
// NOT:
await sendAdminLoginNotification(user);  // Wrong - blocks login
```
- [ ] Remove await if present
- [ ] Wrap in .catch() to handle errors

**Step 4: Check Audit Log Writes**
```typescript
// Audit logs should not block
prisma.auditLog.create({ /* ... */ }).catch(console.error);
// Or move to background queue
```

**Verification**:
- [ ] Time login from submit to redirect
- [ ] Should be <500ms
- [ ] Email can take up to 5 seconds (separate)

---

## Environment Issues

### Issue 1: Features Work in Dev, Fail in Production

**Symptoms**:
- Everything works in development
- Same features fail in production

**Possible Causes**:
1. Environment variables not set in production
2. Build/deployment issue
3. Database differences

**Solutions**:

**Step 1: Check Production Environment Variables**
```bash
# In production environment
echo $NEXTAUTH_SECRET
echo $DATABASE_URL
echo $RESEND_API_KEY
# etc.
```
- [ ] Verify ALL env vars are set
- [ ] Match variable names exactly
- [ ] Check for typos

**Step 2: Check Build Output**
```bash
# Review build logs
npm run build

# Check for:
# - TypeScript errors
# - Missing dependencies
# - Build warnings
```
- [ ] Fix any build errors
- [ ] Rebuild and redeploy

**Step 3: Check Database Connection**
```bash
# Test database connectivity
npx prisma db pull
```
- [ ] Verify can connect to production database
- [ ] Check migrations are applied:
```bash
npx prisma migrate status
```

**Step 4: Check Logs for Specific Errors**
```bash
# Production logs (adjust for your platform)
railway logs --tail 100  # Railway
vercel logs --since 24h  # Vercel
heroku logs --tail       # Heroku
```
- [ ] Read error messages carefully
- [ ] Search this guide for matching issues

**Verification**:
- [ ] Test each feature in production
- [ ] Compare behavior with development
- [ ] Verify environment configuration

---

## Emergency Quick Fixes

### Quick Fix 1: Unlock User Account Immediately

```sql
UPDATE users
SET
  "accountLockedUntil" = NULL,
  "failedLoginAttempts" = 0
WHERE email = 'user@example.com';
```

### Quick Fix 2: Reset User Password

```bash
# Generate new password hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TempPassword123!', 12, (e, h) => console.log(h));"

# Update in database
UPDATE users SET password = '[hash]' WHERE email = 'user@example.com';
```

### Quick Fix 3: Clear Expired Reset Tokens

```sql
UPDATE users
SET
  "passwordResetToken" = NULL,
  "passwordResetTokenExpiry" = NULL
WHERE "passwordResetTokenExpiry" < NOW();
```

### Quick Fix 4: Disable CSRF Temporarily (Emergency Only)

```typescript
// In with-csrf.ts
export async function checkCSRF() {
  console.log('⚠️ CSRF DISABLED - EMERGENCY ONLY');
  return null;
}
```
**WARNING**: Re-enable immediately after emergency resolved!

---

## Getting Additional Help

### When to Escalate

Escalate to senior developers if:
- [ ] Issue not in this guide
- [ ] Solutions don't work after 30 minutes
- [ ] Issue affects multiple users
- [ ] Security incident suspected
- [ ] Data loss or corruption risk

### Information to Provide

When asking for help, include:
- **Exact error message** (copy-paste)
- **What you were doing** (steps to reproduce)
- **What you expected** (expected behavior)
- **What happened** (actual behavior)
- **Environment** (dev/staging/production)
- **Logs** (relevant log excerpts)
- **What you tried** (solutions attempted)

---

## Next Steps

- [ ] Bookmark this guide
- [ ] Add custom issues as encountered
- [ ] Update solutions that worked
- [ ] Share with team
- [ ] Link from runbooks

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: Engineering Team
