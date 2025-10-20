# Task 1: Forgot Password Flow Implementation

**Navigation**: [← Prerequisites](./02-PREREQUISITES.md) | [Index](./00-INDEX.md) | [Next: Task 2 →](./04-TASK2-CSRF-PROTECTION.md)

---

## Overview

**Priority**: 🔴 HIGHEST - CRITICAL
**Time Estimate**: 4 hours
**Complexity**: Medium
**Files to Create**: 5 new files, 1 database migration

### What This Task Delivers

✅ Complete password recovery system
✅ Email-based reset links with secure tokens
✅ Token expiry and validation
✅ User-friendly UI for both request and reset
✅ Audit logging and security measures

### Implementation Steps

1. Database Schema Update (15 min)
2. Password Reset Utilities (30 min)
3. Zod Validation Schemas (15 min)
4. Email Template (30 min)
5. Forgot Password Page (45 min)
6. Forgot Password API (30 min)
7. Reset Password Page (45 min)
8. Reset Password APIs (30 min)
9. Testing (30 min)

---

## Step 1: Database Schema Update

### Update Prisma Schema

**File**: `prisma/schema.prisma`

**Add to User model**:
```prisma
model User {
  // ... existing fields ...

  // Password Reset Fields
  passwordResetToken       String?   @unique
  passwordResetTokenExpiry DateTime?

  // ... rest of model ...
}
```

### Run Migration

```bash
npx prisma migrate dev --name add_password_reset_fields
npx prisma generate
```

### Validation Checklist
- [ ] Migration created successfully
- [ ] No errors in migration output
- [ ] Prisma client regenerated
- [ ] Can see new fields in Prisma Studio

---

## Step 2: Password Reset Utilities

### Create Utility File

**File**: `src/lib/auth/password-reset.ts` (NEW)

**Purpose**: Centralized password reset logic (Single Source of Truth)

```typescript
/**
 * Password Reset Utilities
 * SINGLE SOURCE OF TRUTH for password reset operations
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from './utils';

// CENTRALIZED CONFIGURATION
const PASSWORD_RESET_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_EXPIRY_HOURS: 1,
  MAX_RESET_ATTEMPTS_PER_DAY: 3,
} as const;

export interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Generate secure password reset token
 */
export async function generatePasswordResetToken(
  email: string
): Promise<PasswordResetResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      // SECURITY: Don't reveal if email exists
      return {
        success: true,
        message: 'If email exists, reset link will be sent',
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active',
      };
    }

    // Generate secure random token
    const token = crypto
      .randomBytes(PASSWORD_RESET_CONFIG.TOKEN_LENGTH)
      .toString('hex');

    // Calculate expiry
    const expiryDate = new Date();
    expiryDate.setHours(
      expiryDate.getHours() + PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS
    );

    // Store in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpiry: expiryDate,
      },
    });

    return {
      success: true,
      message: 'Password reset token generated',
      token,
    };
  } catch (error) {
    console.error('Generate reset token error:', error);
    return {
      success: false,
      message: 'Failed to generate reset token',
    };
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  message?: string;
}> {
  try {
    if (!token) {
      return { valid: false, message: 'Token is required' };
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        email: true,
        status: true,
        passwordResetTokenExpiry: true,
      },
    });

    if (!user) {
      return { valid: false, message: 'Invalid or expired token' };
    }

    // Check expiry
    if (!user.passwordResetTokenExpiry || new Date() > user.passwordResetTokenExpiry) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });
      return { valid: false, message: 'Token has expired' };
    }

    // Check status
    if (user.status !== 'ACTIVE') {
      return { valid: false, message: 'Account is not active' };
    }

    return {
      valid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return { valid: false, message: 'Token verification failed' };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Verify token
    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        message: verification.message || 'Invalid token',
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear token
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: verification.userId,
        action: 'PASSWORD_RESET',
        resource: 'USER',
        resourceId: verification.userId,
        details: {
          method: 'forgot_password_flow',
          email: verification.email,
        },
      },
    });

    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: 'Failed to reset password',
    };
  }
}

export { PASSWORD_RESET_CONFIG };
```

### Validation Checklist
- [ ] File created at correct path
- [ ] All imports resolve
- [ ] No TypeScript errors
- [ ] Functions have proper error handling
- [ ] Security: Don't reveal email existence
- [ ] Audit logging included

---

## Step 3: Validation Schemas

### Create/Update Validation File

**File**: `src/lib/validation/auth.ts` (UPDATE or CREATE)

```typescript
/**
 * Authentication Validation Schemas
 */

import { z } from 'zod';

// Password rules
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[@$!%*?&#]/, 'Must contain special character');

// Forgot Password Request
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email')
    .transform((email) => email.toLowerCase().trim()),
});

// Reset Password
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

### Validation Checklist
- [ ] Schemas follow password requirements
- [ ] Types exported
- [ ] No hardcoded messages

---

## Step 4-9: Detailed Implementation

**Note**: Due to file length limits, see the comprehensive implementation guide for:
- Step 4: Email Template Creation
- Step 5: Forgot Password Page (UI)
- Step 6: Forgot Password API
- Step 7: Reset Password Page (UI)
- Step 8: Reset Password APIs
- Step 9: Complete Testing

**Full implementation with all code is in**:
`claudedocs/AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md` (lines 100-800)

---

## Quick Implementation Summary

### Files to Create

1. `src/lib/auth/password-reset.ts` - Core utilities
2. `src/lib/validation/auth.ts` - Validation schemas
3. `src/lib/email/templates/password-reset-email.tsx` - Email template
4. `src/app/auth/forgot-password/page.tsx` - Request form page
5. `src/app/api/auth/forgot-password/route.ts` - Request API
6. `src/app/auth/reset-password/[token]/page.tsx` - Reset form page
7. `src/app/api/auth/reset-password/verify/route.ts` - Token verify API
8. `src/app/api/auth/reset-password/route.ts` - Reset API

### Testing Checklist

- [ ] Request reset → Email received
- [ ] Click link → Token validated
- [ ] Enter new password → Success
- [ ] Sign in with new password → Works
- [ ] Expired token → Error shown
- [ ] Reused token → Error shown
- [ ] Invalid email → Generic success (security)
- [ ] Rate limiting works

---

## Common Issues & Solutions

### Email Not Received
- Check Resend API key
- Verify FROM_EMAIL domain
- Check spam folder
- Review logs for errors

### Token Expired Immediately
- Check server timezone
- Verify TOKEN_EXPIRY_HOURS setting
- Database timezone configuration

### TypeScript Errors
- Run `npx prisma generate`
- Restart TypeScript server
- Check all imports

---

## Next Steps

After completing Task 1:
1. Test thoroughly using checklist
2. Commit changes with good message
3. Move to [04-TASK2-CSRF-PROTECTION.md](./04-TASK2-CSRF-PROTECTION.md)

---

**Navigation**: [← Prerequisites](./02-PREREQUISITES.md) | [Index](./00-INDEX.md) | [Next: Task 2 →](./04-TASK2-CSRF-PROTECTION.md)

**Full Details**: See `claudedocs/AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md` Step 1.1 through 1.9
