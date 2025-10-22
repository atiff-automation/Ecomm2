# Task 5: Admin Login Notifications

**Priority**: 🟡 IMPORTANT
**Time Estimate**: 1-2 hours
**Phase**: 2 - Important Improvements (Week 2-3)

---

## Overview

### Current Issue
No notifications are sent when admin users (ADMIN, STAFF, SUPERADMIN) login to the system. This creates security and monitoring gaps:

- **No Login Audit Trail**: Cannot track when admins access the system
- **Delayed Breach Detection**: Unauthorized admin access goes unnoticed
- **No Accountability**: Difficult to verify who accessed system and when
- **Limited Forensics**: Missing critical data for security investigations

### What This Task Delivers
- ✅ Email notifications for all admin role logins
- ✅ Detailed login information (timestamp, IP, device, role)
- ✅ Beautiful HTML email template
- ✅ Plain text fallback for email clients
- ✅ Real-time security monitoring
- ✅ Configurable notification recipient
- ✅ Non-blocking implementation (doesn't slow login)

---

## Prerequisites

**Before Starting**:
- [ ] Read CLAUDE.md coding standards
- [ ] Review Resend email service documentation
- [ ] Understand NextAuth.js JWT callback
- [ ] Verify RESEND_API_KEY configured
- [ ] Test email sending works

**Required Knowledge**:
- NextAuth.js callbacks (jwt, session)
- React Email templates
- Resend API integration
- Async/await error handling
- Environment variables

**Environment Variables Required**:
- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Verified sender email
- `ADMIN_NOTIFICATION_EMAIL`: Recipient for notifications (optional)

---

## Implementation Steps

### Step 5.1: Create Email Template

**File**: `src/lib/email/templates/admin-login-notification.tsx` (NEW FILE)
**Purpose**: Professional email template for admin login alerts

---

#### Email Template Implementation

```typescript
/**
 * Admin Login Notification Email Template
 * Sent when admin/staff/superadmin logs into the system
 * Following CLAUDE.md: No hardcoded values, clear structure
 */

import React from 'react';

export interface AdminLoginNotificationProps {
  userName: string;
  userEmail: string;
  userRole: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export const AdminLoginNotification: React.FC<AdminLoginNotificationProps> = ({
  userName,
  userEmail,
  userRole,
  loginTime,
  ipAddress,
  userAgent,
  location,
}) => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <h2 style={{ color: '#1a1a1a', marginTop: 0 }}>
          🔐 Admin Login Detected
        </h2>

        <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
          An admin user has logged into the JRM E-commerce admin panel.
        </p>

        {/* Login Details Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            marginTop: '20px',
          }}
        >
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280', width: '120px' }}>
                  <strong>User:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#1a1a1a' }}>
                  {userName}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>
                  <strong>Email:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#1a1a1a' }}>
                  {userEmail}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>
                  <strong>Role:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#1a1a1a' }}>
                  <span
                    style={{
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {userRole}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>
                  <strong>Time:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#1a1a1a' }}>
                  {loginTime}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>
                  <strong>IP Address:</strong>
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#1a1a1a',
                    fontFamily: 'monospace',
                  }}
                >
                  {ipAddress}
                </td>
              </tr>
              {location && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>
                    <strong>Location:</strong>
                  </td>
                  <td style={{ padding: '8px 0', color: '#1a1a1a' }}>
                    {location}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#6b7280',
                    verticalAlign: 'top',
                  }}
                >
                  <strong>Device:</strong>
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#1a1a1a',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                  }}
                >
                  {userAgent}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Security Warning */}
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '20px',
          }}
        >
          <p
            style={{
              color: '#92400e',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            <strong>⚠️ Was this you?</strong>
            <br />
            If you did not perform this login, please contact the system
            administrator immediately and change your password.
          </p>
        </div>

        {/* Footer */}
        <hr
          style={{
            margin: '30px 0',
            border: 'none',
            borderTop: '1px solid #e5e7eb',
          }}
        />

        <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.6' }}>
          This is an automated security notification from JRM E-commerce.
          <br />
          Admin Panel Security Monitoring System
        </p>
      </div>
    </div>
  );
};

/**
 * Plain text version for email clients that don't support HTML
 */
export const generateAdminLoginNotificationText = (
  props: AdminLoginNotificationProps
): string => {
  return `
Admin Login Detected
====================

An admin user has logged into the JRM E-commerce admin panel.

Login Details:
--------------
User: ${props.userName}
Email: ${props.userEmail}
Role: ${props.userRole}
Time: ${props.loginTime}
IP Address: ${props.ipAddress}
${props.location ? `Location: ${props.location}\n` : ''}Device: ${props.userAgent}

⚠️ Was this you?
If you did not perform this login, please contact the system administrator immediately and change your password.

---
This is an automated security notification from JRM E-commerce.
Admin Panel Security Monitoring System
  `.trim();
};
```

**Validation Checklist**:
- [ ] File created at correct path
- [ ] All props have TypeScript types
- [ ] Inline CSS for email compatibility
- [ ] Professional design and layout
- [ ] Security warning included
- [ ] Plain text version provided
- [ ] No hardcoded company name (uses props)
- [ ] Responsive to different email clients

---

### Step 5.2: Add Notification to Auth Config

**File**: `src/lib/auth/config.ts`
**Action**: Send email notification after successful admin login

---

#### Add Imports at Top of File

```typescript
import { Resend } from 'resend';
import { render } from '@react-email/render';
import {
  AdminLoginNotification,
  generateAdminLoginNotificationText,
} from '@/lib/email/templates/admin-login-notification';

// Initialize Resend (add after other imports)
const resend = new Resend(process.env.RESEND_API_KEY);
```

---

#### Update JWT Callback

**Find the `jwt` callback** in `authOptions.callbacks`:

```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.role = user.role;
      token.isMember = user.isMember;
      token.memberSince = user.memberSince;

      // ADD THIS: Send notification for admin logins
      if (
        user.role === 'ADMIN' ||
        user.role === 'STAFF' ||
        user.role === 'SUPERADMIN'
      ) {
        // Send notification asynchronously (don't block login)
        sendAdminLoginNotification(user).catch((error) => {
          console.error('Failed to send admin login notification:', error);
          // Don't fail login if email fails
        });
      }
    }

    // ... rest of jwt callback
    return token;
  },
  // ... rest of callbacks
}
```

---

#### Add Notification Function

**Add this function after the authOptions definition**:

```typescript
/**
 * Send admin login notification email
 * Non-blocking - runs asynchronously
 */
async function sendAdminLoginNotification(user: {
  email: string;
  name?: string;
  role: string;
}) {
  try {
    // Get notification recipient (owner/security team)
    const notificationEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL || process.env.FROM_EMAIL;

    // Skip if no email configured
    if (!notificationEmail || !process.env.RESEND_API_KEY) {
      console.log('⚠️ Admin notification skipped - email not configured');
      return;
    }

    // Format login time (Malaysia timezone)
    const loginTime = new Date().toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // Prepare email data
    const emailProps = {
      userName: user.name || user.email,
      userEmail: user.email,
      userRole: user.role,
      loginTime,
      ipAddress: 'Not available in JWT context', // See note below
      userAgent: 'Not available in JWT context', // See note below
    };

    // Render email templates
    const emailHtml = render(
      React.createElement(AdminLoginNotification, emailProps)
    );
    const emailText = generateAdminLoginNotificationText(emailProps);

    // Send email via Resend
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'security@jrm.com',
      to: notificationEmail,
      subject: `🔐 Admin Login: ${user.role} - ${user.email}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('✅ Admin login notification sent:', user.email);
  } catch (error) {
    console.error('❌ Admin login notification failed:', error);
    // Don't throw - we don't want to fail login
  }
}
```

**Important Note**: IP address and user agent are not available in the JWT callback context. To get this information, you would need to:
1. Pass it through the authorize function
2. Store it in the token
3. OR implement a separate middleware to capture this data

For this implementation, we're focusing on basic notification. IP tracking can be added later as an enhancement.

---

**Validation Checklist**:
- [ ] Resend and React Email imports added
- [ ] Resend client initialized
- [ ] JWT callback updated with notification trigger
- [ ] Notification function created
- [ ] Email templates used correctly
- [ ] Error handling prevents login failure
- [ ] Async execution (non-blocking)
- [ ] Console logging for monitoring
- [ ] No hardcoded email addresses

---

### Step 5.3: Add Environment Variable

**File**: `.env`
**Action**: Configure notification recipient

---

#### Add Configuration

```bash
# Admin Security Notifications
# Email address to receive admin login notifications
ADMIN_NOTIFICATION_EMAIL="owner@yourbusiness.com"

# Optional: Separate security team email
# ADMIN_NOTIFICATION_EMAIL="security-team@yourbusiness.com"
```

**Notes**:
- Replace `owner@yourbusiness.com` with actual email
- Can use comma-separated list for multiple recipients: `"email1@domain.com,email2@domain.com"`
- Falls back to `FROM_EMAIL` if not set
- Must be a verified domain in Resend

---

**Validation Checklist**:
- [ ] Variable added to `.env`
- [ ] Email address is valid
- [ ] Domain is verified in Resend
- [ ] Environment variable loaded correctly
- [ ] Fallback to FROM_EMAIL works

---

### Step 5.4: Test Admin Login Notifications

**Comprehensive Testing Procedures**:

---

#### Test 1: Admin Login Notification

**Purpose**: Verify notification sent for ADMIN role

**Steps**:
1. [ ] Configure `ADMIN_NOTIFICATION_EMAIL` in `.env`
2. [ ] Restart dev server (to load env vars)
3. [ ] Sign in as user with ADMIN role
4. [ ] Check console logs for: "✅ Admin login notification sent: [email]"
5. [ ] Check email inbox (notification recipient)
6. [ ] Verify email received within 5 seconds
7. [ ] Open email and verify:
   - [ ] Subject: "🔐 Admin Login: ADMIN - [email]"
   - [ ] User name correct
   - [ ] User email correct
   - [ ] Role badge shows "ADMIN"
   - [ ] Login time correct (Malaysia timezone)
   - [ ] Professional formatting
   - [ ] Security warning present

**Expected Result**: Email received with correct details

---

#### Test 2: Staff Login Notification

**Purpose**: Verify notification sent for STAFF role

**Steps**:
1. [ ] Sign in as user with STAFF role
2. [ ] Check console for success message
3. [ ] Check email inbox
4. [ ] Verify email received
5. [ ] Check subject shows "STAFF" role
6. [ ] Verify role badge shows "STAFF"

**Expected Result**: Staff login notification sent

---

#### Test 3: SuperAdmin Login Notification

**Purpose**: Verify notification sent for SUPERADMIN role

**Steps**:
1. [ ] Sign in as user with SUPERADMIN role
2. [ ] Check console logs
3. [ ] Check email inbox
4. [ ] Verify email received
5. [ ] Check subject shows "SUPERADMIN"
6. [ ] Verify role badge shows "SUPERADMIN"

**Expected Result**: SuperAdmin login notification sent

---

#### Test 4: Customer Login (No Notification)

**Purpose**: Verify customers don't trigger notifications

**Steps**:
1. [ ] Sign in as CUSTOMER
2. [ ] Check console logs - should NOT show notification message
3. [ ] Check email inbox - should NOT receive notification
4. [ ] Verify login succeeds normally

**Expected Result**: No notification for customers

---

#### Test 5: Email Not Configured (Graceful Failure)

**Purpose**: Verify login succeeds even if email fails

**Steps**:
1. [ ] Temporarily disable email:
   ```bash
   # Comment out in .env:
   # RESEND_API_KEY=...
   ```
2. [ ] Restart dev server
3. [ ] Sign in as ADMIN
4. [ ] Check console: "⚠️ Admin notification skipped - email not configured"
5. [ ] Verify login succeeds (not blocked by email failure)
6. [ ] Re-enable RESEND_API_KEY
7. [ ] Test again - notification should work

**Expected Result**: Login works without email service

---

#### Test 6: Invalid Email Address

**Purpose**: Verify graceful handling of email errors

**Steps**:
1. [ ] Set invalid email in `.env`:
   ```bash
   ADMIN_NOTIFICATION_EMAIL="invalid-email-format"
   ```
2. [ ] Restart dev server
3. [ ] Sign in as ADMIN
4. [ ] Check console for error: "❌ Admin login notification failed:"
5. [ ] Verify login still succeeds
6. [ ] Fix email address
7. [ ] Test again

**Expected Result**: Login succeeds despite email error

---

### Email Template Testing

**Test Different Email Clients**:

1. [ ] **Gmail**: Check rendering and formatting
2. [ ] **Outlook**: Verify CSS compatibility
3. [ ] **Apple Mail**: Test inline styles
4. [ ] **Mobile (iOS)**: Check responsive layout
5. [ ] **Mobile (Android)**: Verify readability
6. [ ] **Plain text client**: Verify fallback version

**What to Check**:
- [ ] Layout renders correctly
- [ ] Colors display properly
- [ ] Fonts are readable
- [ ] Role badge visible
- [ ] Table alignment correct
- [ ] Warning box stands out
- [ ] Links work (if any added)

---

### Performance Testing

**Verify Non-Blocking Behavior**:

1. [ ] Sign in as admin
2. [ ] Measure login time (should be <500ms)
3. [ ] Email sending should NOT delay login
4. [ ] Check network tab for async email request

**Expected Result**: Login completes immediately, email sent in background

---

## Monitoring and Logs

### Console Log Messages

**Successful Notification**:
```
✅ Admin login notification sent: admin@example.com
```

**Skipped (No Config)**:
```
⚠️ Admin notification skipped - email not configured
```

**Failed Notification**:
```
❌ Admin login notification failed: [error details]
```

---

### Email Delivery Verification

**Check Resend Dashboard**:
1. Login to https://resend.com/dashboard
2. Navigate to "Emails" section
3. Find recent sent emails
4. Verify delivery status
5. Check for bounces or errors

**Resend API Check**:
```bash
# Check email delivery status via API
curl https://api.resend.com/emails/[email_id] \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY"
```

---

## Troubleshooting

### Issue: No emails received

**Possible Causes**:
1. RESEND_API_KEY not configured
2. FROM_EMAIL not verified in Resend
3. ADMIN_NOTIFICATION_EMAIL not set
4. Email in spam folder

**Solutions**:
1. Check `.env` has `RESEND_API_KEY` and `FROM_EMAIL`
2. Verify domain in Resend dashboard
3. Check `ADMIN_NOTIFICATION_EMAIL` is set
4. Check spam/junk folder
5. Whitelist sender email
6. Check Resend dashboard for delivery status

---

### Issue: Login fails when email fails

**Cause**: Email sending not wrapped in try-catch or not async

**Solution**:
1. Verify `sendAdminLoginNotification` has try-catch
2. Ensure `.catch()` on promise in JWT callback
3. Don't use `await` on notification call (should be fire-and-forget)

---

### Issue: Emails delayed

**Possible Causes**:
1. Resend rate limits
2. Network latency
3. Email queue backlog

**Solutions**:
1. Check Resend rate limits (usually 100 emails/second)
2. Monitor network speed
3. Implement email queue (Redis) for high volume

---

## Enhancements (Future)

### IP Address and User Agent Tracking

**To add real IP and device info**:

1. **Capture in Signin API**:
```typescript
// In signin route
const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';
```

2. **Pass Through Token**:
```typescript
// Store in JWT token
token.lastLoginIP = clientIP;
token.lastLoginUA = userAgent;
```

3. **Use in Notification**:
```typescript
// Access in JWT callback
ipAddress: token.lastLoginIP || 'unknown',
userAgent: token.lastLoginUA || 'unknown',
```

---

### Geolocation Lookup

**Add location based on IP**:

```typescript
// Use IP geolocation service
import { getLocationFromIP } from '@/lib/utils/geolocation';

const location = await getLocationFromIP(ipAddress);
// Returns: "Kuala Lumpur, Malaysia"
```

**Services**: ipapi.co, ip-api.com, MaxMind GeoIP

---

### Suspicious Login Detection

**Alert on unusual patterns**:
- Login from new device
- Login from new country
- Login outside business hours
- Multiple failed attempts before success

---

## Success Criteria

### Task Complete When:
- [ ] Email template created and styled
- [ ] Plain text version implemented
- [ ] Notification function added to auth config
- [ ] Environment variable configured
- [ ] Notifications sent for ADMIN, STAFF, SUPERADMIN
- [ ] No notifications for CUSTOMER
- [ ] Email delivery confirmed
- [ ] Login not blocked by email failures
- [ ] All test scenarios passed
- [ ] Performance acceptable (<100ms overhead)

### Quality Metrics:
- **Email Delivery**: >95% success rate
- **Performance**: <100ms overhead per login
- **Reliability**: Login succeeds 100% even if email fails
- **Timeliness**: Emails delivered within 5 seconds

---

## Next Steps

After completing this task:
1. ✅ Admin logins monitored and logged
2. ✅ Phase 2 Implementation Complete!
3. ➡️ Proceed to [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)
4. Begin comprehensive testing

**Related Tasks**:
- **Previous**: [06-TASK4-FAILED-LOGIN-TRACKING.md](./06-TASK4-FAILED-LOGIN-TRACKING.md)
- **Next**: [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)
- **Deployment**: [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)

---

**Task Version**: 1.0
**Last Updated**: January 2025
**Estimated Time**: 1-2 hours
**Difficulty**: Easy-Medium
**Prerequisites**: Resend account and API key
