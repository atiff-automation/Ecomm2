# Authentication Security Implementation Plan

**Project**: JRM E-commerce Platform
**Priority**: CRITICAL Security Improvements
**Estimated Time**: 12-16 hours
**Target Completion**: 2-3 weeks

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Critical Fixes (Week 1)](#phase-1-critical-fixes-week-1)
   - [Task 1: Forgot Password Flow](#task-1-forgot-password-flow)
   - [Task 2: CSRF Protection Enforcement](#task-2-csrf-protection-enforcement)
   - [Task 3: Admin Password Change](#task-3-admin-password-change)
4. [Phase 2: Important Improvements (Week 2-3)](#phase-2-important-improvements-week-2-3)
   - [Task 4: Failed Login Tracking](#task-4-failed-login-tracking)
   - [Task 5: Admin Login Notifications](#task-5-admin-login-notifications)
5. [Testing Guide](#testing-guide)
6. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Current Critical Issues

1. **🔴 CRITICAL**: Forgot Password feature is missing - users cannot recover accounts
2. **🔴 CRITICAL**: CSRF protection exists but not enforced on most routes
3. **🔴 CRITICAL**: Admin users cannot change their own passwords

### What This Plan Delivers

✅ Complete password recovery flow for all users
✅ CSRF protection on all mutation endpoints
✅ Self-service password management for admin roles
✅ Brute force attack prevention
✅ Security audit trail
✅ Email alerts for admin access

---

## Prerequisites

### Before You Start

- [ ] Read this entire document first
- [ ] Review `CLAUDE.md` coding standards
- [ ] Ensure development environment is set up
- [ ] Database backup completed
- [ ] Email service (Resend) is configured
- [ ] Test email delivery works

### Required Knowledge

- TypeScript/Next.js 14 (App Router)
- Prisma ORM
- NextAuth.js authentication
- React Hook Form + Zod validation
- bcrypt password hashing

### Coding Standards Reminder

**CRITICAL**: Follow these standards from `CLAUDE.md`:

1. **No Hardcoding**: Use constants, environment variables, configuration files
2. **Single Source of Truth**: Every data/config has ONE authoritative source
3. **DRY Principle**: Don't Repeat Yourself - extract common functionality
4. **Type Safety**: No `any` types - use explicit TypeScript types
5. **Error Handling**: All async operations must have try-catch blocks
6. **Validation**: All user inputs validated with Zod schemas
7. **Security**: Use Prisma only (no raw SQL), sanitize inputs, hash passwords
8. **Audit Logging**: Log all security-critical operations

---

## Phase 1: Critical Fixes (Week 1)

### Task 1: Forgot Password Flow

**Priority**: 🔴 HIGHEST
**Time Estimate**: 4 hours
**Files to Create**: 5 new files, 1 database migration

---

#### Step 1.1: Database Schema Update

**File**: `prisma/schema.prisma`
**Action**: Add password reset fields to User model

```prisma
model User {
  // ... existing fields ...

  // Password Reset Fields (add these)
  passwordResetToken       String?   @unique
  passwordResetTokenExpiry DateTime?

  // ... rest of model ...
}
```

**Run Migration**:
```bash
# Create and apply migration
npx prisma migrate dev --name add_password_reset_fields

# Verify schema
npx prisma generate
```

**Validation Checklist**:
- [ ] Migration created successfully
- [ ] No errors in migration
- [ ] Prisma client regenerated
- [ ] Fields added to User model

---

#### Step 1.2: Create Password Reset Utilities

**File**: `src/lib/auth/password-reset.ts` (NEW FILE)
**Purpose**: Centralized password reset logic (Single Source of Truth)

```typescript
/**
 * Password Reset Utilities
 * SINGLE SOURCE OF TRUTH for password reset operations
 * Following CLAUDE.md: No hardcode, centralized configuration
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from './utils';

// CENTRALIZED CONFIGURATION - No hardcoding
const PASSWORD_RESET_CONFIG = {
  TOKEN_LENGTH: 32, // bytes
  TOKEN_EXPIRY_HOURS: 1, // 1 hour validity
  MAX_RESET_ATTEMPTS_PER_DAY: 3, // Prevent abuse
} as const;

export interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Generate secure password reset token
 * SYSTEMATIC approach: crypto.randomBytes for security
 */
export async function generatePasswordResetToken(
  email: string
): Promise<PasswordResetResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        status: true,
        passwordResetTokenExpiry: true,
      },
    });

    if (!user) {
      // SECURITY: Don't reveal if email exists or not (timing attack prevention)
      return {
        success: true,
        message: 'If email exists, reset link will be sent',
      };
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active. Please contact support.',
      };
    }

    // Generate secure random token
    const token = crypto
      .randomBytes(PASSWORD_RESET_CONFIG.TOKEN_LENGTH)
      .toString('hex');

    // Calculate expiry time
    const expiryDate = new Date();
    expiryDate.setHours(
      expiryDate.getHours() + PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS
    );

    // Store token in database
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
 * SYSTEMATIC validation: check existence, expiry, user status
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

    // Find user with this token
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

    // Check token expiry
    if (!user.passwordResetTokenExpiry) {
      return { valid: false, message: 'Invalid token' };
    }

    if (new Date() > user.passwordResetTokenExpiry) {
      // Token expired - clear it from database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });

      return { valid: false, message: 'Token has expired' };
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return {
        valid: false,
        message: 'Account is not active',
      };
    }

    return {
      valid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return {
      valid: false,
      message: 'Token verification failed',
    };
  }
}

/**
 * Reset password with token
 * SYSTEMATIC approach: validate token, hash password, clear token, audit log
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

    // Hash new password (using centralized utility)
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    // Audit log for security tracking
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

/**
 * Clear expired tokens (cleanup utility)
 * Run this periodically via cron or background job
 */
export async function clearExpiredResetTokens(): Promise<number> {
  try {
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

    return result.count;
  } catch (error) {
    console.error('Clear expired tokens error:', error);
    return 0;
  }
}

// Export configuration for reference
export { PASSWORD_RESET_CONFIG };
```

**Validation Checklist**:
- [ ] File created at correct path
- [ ] All imports resolve correctly
- [ ] No TypeScript errors
- [ ] Functions have proper type annotations
- [ ] Error handling in all async functions
- [ ] Audit logging implemented
- [ ] Security considerations addressed

---

#### Step 1.3: Create Zod Validation Schemas

**File**: `src/lib/validation/auth.ts` (UPDATE OR CREATE)
**Purpose**: Centralized validation schemas for auth flows

```typescript
/**
 * Authentication Validation Schemas
 * SINGLE SOURCE OF TRUTH for auth form validation
 * Following CLAUDE.md: Centralized validation, no hardcode
 */

import { z } from 'zod';

// CENTRALIZED password validation rules
const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;

// Reusable password schema
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_RULES.MIN_LENGTH,
    `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`
  )
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[@$!%*?&#]/,
    'Password must contain at least one special character (@$!%*?&#)'
  );

// Forgot Password Request Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((email) => email.toLowerCase().trim()),
});

// Reset Password Schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Export types for TypeScript
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Export rules for reference
export { PASSWORD_RULES };
```

**Validation Checklist**:
- [ ] File created/updated correctly
- [ ] Zod schemas follow password requirements
- [ ] Type exports available
- [ ] No hardcoded values in validation messages

---

#### Step 1.4: Create Email Template

**File**: `src/lib/email/templates/password-reset-email.tsx` (NEW FILE)
**Purpose**: Email template for password reset

```typescript
/**
 * Password Reset Email Template
 * React Email template for password reset notifications
 */

import React from 'react';

export interface PasswordResetEmailProps {
  resetLink: string;
  userEmail: string;
  expiryHours?: number;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  resetLink,
  userEmail,
  expiryHours = 1,
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
        <h2 style={{ color: '#1a1a1a', marginTop: 0 }}>
          Password Reset Request
        </h2>
        <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
          Hello,
        </p>
        <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
          We received a request to reset the password for your JRM E-commerce
          account: <strong>{userEmail}</strong>
        </p>
        <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
          Click the button below to reset your password:
        </p>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={resetLink}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontWeight: 'bold',
            }}
          >
            Reset Password
          </a>
        </div>
        <p style={{ color: '#4a5568', lineHeight: '1.6', fontSize: '14px' }}>
          Or copy and paste this link into your browser:
          <br />
          <a href={resetLink} style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
            {resetLink}
          </a>
        </p>
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
            <strong>⚠️ Important:</strong>
            <br />
            • This link will expire in {expiryHours} hour{expiryHours > 1 ? 's' : ''}
            <br />
            • If you didn't request this, please ignore this email
            <br />• Your password will not change until you create a new one
          </p>
        </div>
        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
        <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.6' }}>
          JRM E-commerce<br />
          Malaysian E-commerce with Membership Benefits<br />
          <a href={`${process.env.NEXT_PUBLIC_APP_URL}`} style={{ color: '#3b82f6' }}>
            Visit Website
          </a>
        </p>
      </div>
    </div>
  );
};

// Plain text version for email clients that don't support HTML
export const generatePasswordResetText = (
  resetLink: string,
  userEmail: string,
  expiryHours: number = 1
): string => {
  return `
Password Reset Request

Hello,

We received a request to reset the password for your JRM E-commerce account: ${userEmail}

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}.

If you didn't request this, please ignore this email. Your password will not change until you create a new one.

---
JRM E-commerce
Malaysian E-commerce with Membership Benefits
${process.env.NEXT_PUBLIC_APP_URL}
  `.trim();
};
```

**Validation Checklist**:
- [ ] Email template created
- [ ] Styling is inline (for email compatibility)
- [ ] Plain text version provided
- [ ] No hardcoded values (uses props)
- [ ] Expiry time displayed
- [ ] Security warnings included

---

#### Step 1.5: Create Forgot Password Page

**File**: `src/app/auth/forgot-password/page.tsx` (NEW FILE)
**Purpose**: User-facing form to request password reset

```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validation/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Always show success message (don't reveal if email exists)
      setIsSuccess(true);
      setSubmittedEmail(data.email);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still show success for security (don't reveal if email exists)
      setIsSuccess(true);
      setSubmittedEmail(data.email);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              JRM E-commerce
            </h1>
            <p className="mt-2 text-sm text-gray-600">Password Reset</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Check Your Email</CardTitle>
              <CardDescription className="text-center">
                Password reset instructions sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  If an account exists for <strong>{submittedEmail}</strong>, you
                  will receive password reset instructions at that email address.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Next steps:</strong>
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the reset link (valid for 1 hour)</li>
                    <li>Create your new password</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Didn't receive the email? Check your spam folder or try again
                  in a few minutes.
                </p>

                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/auth/signin')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsSuccess(false);
                      setSubmittedEmail('');
                    }}
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Request form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">JRM E-commerce</h1>
          <p className="mt-2 text-sm text-gray-600">
            Forgot your password? No problem.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    {...register('email')}
                    className="pl-10"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-blue-600 hover:text-blue-500 inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Remember your password?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Validation Checklist**:
- [ ] Page created at correct path
- [ ] React Hook Form integrated
- [ ] Zod validation configured
- [ ] Loading states implemented
- [ ] Success state shows generic message (security)
- [ ] Error handling implemented
- [ ] UI components from shadcn/ui used
- [ ] Responsive design
- [ ] Accessibility considerations (labels, ARIA)

---

#### Step 1.6: Create Forgot Password API Route

**File**: `src/app/api/auth/forgot-password/route.ts` (NEW FILE)
**Purpose**: Backend handler for password reset requests

```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { forgotPasswordSchema } from '@/lib/validation/auth';
import { generatePasswordResetToken } from '@/lib/auth/password-reset';
import { PasswordResetEmail, generatePasswordResetText } from '@/lib/email/templates/password-reset-email';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/utils/security';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 *
 * SECURITY CONSIDERATIONS:
 * - Rate limited to prevent abuse
 * - Always returns success (don't reveal if email exists)
 * - Token expires in 1 hour
 * - Audit logged
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientIP = getClientIP(request);
    const rateLimitResult = await rateLimit.limit(clientIP, {
      ...RATE_LIMIT_CONFIGS.passwordReset,
      key: 'forgot-password',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Generate reset token
    const result = await generatePasswordResetToken(email);

    // If token generated successfully, send email
    if (result.success && result.token) {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/${result.token}`;

      try {
        // Render email template
        const emailHtml = render(
          PasswordResetEmail({
            resetLink,
            userEmail: email,
            expiryHours: 1,
          })
        );

        const emailText = generatePasswordResetText(resetLink, email, 1);

        // Send email via Resend
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'noreply@jrm.com',
          to: email,
          subject: 'Reset Your JRM E-commerce Password',
          html: emailHtml,
          text: emailText,
        });

        console.log('✅ Password reset email sent:', email);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
        // Just log it for monitoring
      }
    }

    // SECURITY: Always return success (timing-attack prevention)
    // Don't reveal whether email exists in database
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with this email, you will receive password reset instructions.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);

    // SECURITY: Don't reveal internal errors
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
```

**Validation Checklist**:
- [ ] API route created at correct path
- [ ] Rate limiting applied
- [ ] Zod validation used
- [ ] Email sending implemented
- [ ] Error handling implemented
- [ ] Security considerations (don't reveal email existence)
- [ ] Logging implemented
- [ ] No sensitive data in logs

---

#### Step 1.7: Create Reset Password Page

**File**: `src/app/auth/reset-password/[token]/page.tsx` (NEW FILE)
**Purpose**: Form to set new password using reset token

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { passwordSchema } from '@/lib/validation/auth';

// Form schema (without token, it comes from URL)
const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [validationError, setValidationError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setValidationError('Invalid reset link');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/reset-password/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok && result.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setValidationError(
            result.message || 'This password reset link is invalid or has expired'
          );
        }
      } catch (error) {
        setIsValidToken(false);
        setValidationError('Failed to validate reset link');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setIsSuccess(true);

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin?message=password-reset-success');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              JRM E-commerce
            </h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-center">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center">
                {validationError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  This password reset link may have expired or already been used.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>What to do:</strong>
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Request a new password reset link</li>
                    <li>Reset links expire after 1 hour</li>
                    <li>Each link can only be used once</li>
                  </ul>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Request New Reset Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/auth/signin')}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              JRM E-commerce
            </h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Password Reset!</CardTitle>
              <CardDescription className="text-center">
                Your password has been successfully reset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  You can now sign in with your new password.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <p className="text-sm text-blue-800 text-center">
                    Redirecting to sign in page in 3 seconds...
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => router.push('/auth/signin')}
                >
                  Go to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">JRM E-commerce</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your new password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Password Requirements:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character (@$!%*?&#)</li>
                </ul>
              </div>

              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...register('password')}
                    className="pl-10"
                    placeholder="Enter new password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...register('confirmPassword')}
                    className="pl-10"
                    placeholder="Confirm new password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Validation Checklist**:
- [ ] Dynamic route created correctly
- [ ] Token extracted from URL params
- [ ] Token validation on page load
- [ ] Loading states for validation
- [ ] Error states for invalid token
- [ ] Success state with redirect
- [ ] Password validation with Zod
- [ ] Responsive design
- [ ] Accessibility considerations

---

#### Step 1.8: Create Reset Password API Routes

**File**: `src/app/api/auth/reset-password/verify/route.ts` (NEW FILE)
**Purpose**: Verify reset token validity

```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { verifyPasswordResetToken } from '@/lib/auth/password-reset';

/**
 * POST /api/auth/reset-password/verify
 * Verify if password reset token is valid
 *
 * Used by frontend to check token before showing password form
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Token is required',
        },
        { status: 400 }
      );
    }

    // Verify token using centralized utility
    const result = await verifyPasswordResetToken(token);

    return NextResponse.json(
      {
        valid: result.valid,
        message: result.message,
      },
      { status: result.valid ? 200 : 400 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        message: 'Failed to verify token',
      },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/auth/reset-password/route.ts` (NEW FILE)
**Purpose**: Reset password with token

```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { resetPasswordSchema } from '@/lib/validation/auth';
import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/utils/security';

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 *
 * SECURITY CONSIDERATIONS:
 * - Rate limited
 * - Token verified
 * - Password validated
 * - Audit logged
 * - Token cleared after use
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await rateLimit.limit(clientIP, {
      ...RATE_LIMIT_CONFIGS.passwordReset,
      key: 'reset-password',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Reset password using centralized utility
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while resetting password',
      },
      { status: 500 }
    );
  }
}
```

**Validation Checklist**:
- [ ] Both API routes created
- [ ] Rate limiting applied
- [ ] Validation with Zod
- [ ] Centralized utilities used
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Audit logging (in utility function)

---

#### Step 1.9: Test Forgot Password Flow

**Manual Testing Checklist**:

- [ ] **Request Reset**:
  - [ ] Visit `/auth/forgot-password`
  - [ ] Enter valid email
  - [ ] Submit form
  - [ ] See success message
  - [ ] Check email inbox
  - [ ] Verify email received with reset link

- [ ] **Invalid Email**:
  - [ ] Enter non-existent email
  - [ ] Still shows success (security feature)
  - [ ] No email sent (check logs)

- [ ] **Reset Password**:
  - [ ] Click reset link in email
  - [ ] Verify token validated
  - [ ] Enter new password
  - [ ] Enter mismatched confirm password → See error
  - [ ] Enter matching passwords → Success
  - [ ] Redirected to signin

- [ ] **Sign In**:
  - [ ] Try old password → Fails
  - [ ] Try new password → Success

- [ ] **Token Expiry**:
  - [ ] Request reset link
  - [ ] Wait 1+ hour (or manually expire in DB)
  - [ ] Try to use link → See error

- [ ] **Token Reuse**:
  - [ ] Reset password successfully
  - [ ] Try using same link again → See error

- [ ] **Rate Limiting**:
  - [ ] Request reset 4+ times quickly
  - [ ] Should get rate limit error

**Database Verification**:
```sql
-- Check password reset fields
SELECT
  email,
  "passwordResetToken",
  "passwordResetTokenExpiry",
  "updatedAt"
FROM users
WHERE email = 'test@example.com';

-- Check audit logs
SELECT * FROM audit_logs
WHERE action = 'PASSWORD_RESET'
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

### Task 2: CSRF Protection Enforcement

**Priority**: 🔴 CRITICAL
**Time Estimate**: 2-3 hours
**Files to Modify**: Multiple API routes

---

#### Step 2.1: Verify CSRF Protection Implementation

**File to Review**: `src/lib/security/csrf-protection.ts`

**Validation Checklist**:
- [ ] File exists at path
- [ ] CSRFProtection class exported
- [ ] `middleware()` method available
- [ ] Token generation works
- [ ] Token validation works

---

#### Step 2.2: Create CSRF Middleware Wrapper

**File**: `src/lib/middleware/with-csrf.ts` (NEW FILE)
**Purpose**: Reusable CSRF middleware wrapper

```typescript
/**
 * CSRF Protection Middleware Wrapper
 * DRY utility for adding CSRF to API routes
 * Following CLAUDE.md: Centralized, reusable, no duplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf-protection';

/**
 * Wrap API route handler with CSRF protection
 * Use this for all POST, PUT, DELETE, PATCH routes
 */
export function withCSRF(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for safe methods
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request);
    }

    // Apply CSRF protection
    const csrfCheck = await CSRFProtection.middleware(request);
    if (csrfCheck) {
      return csrfCheck; // CSRF validation failed
    }

    // CSRF passed, proceed to handler
    return handler(request);
  };
}

/**
 * Apply CSRF check directly in route
 * Use at the beginning of POST/PUT/DELETE handlers
 */
export async function checkCSRF(request: NextRequest): Promise<Response | null> {
  // Skip for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Apply CSRF check
  return await CSRFProtection.middleware(request);
}
```

**Validation Checklist**:
- [ ] File created correctly
- [ ] Two approaches provided (wrapper and inline)
- [ ] Safe methods skipped (GET, HEAD, OPTIONS)
- [ ] Clear documentation

---

#### Step 2.3: Add CSRF to Auth Routes

**File**: `src/app/api/auth/register/route.ts`
**Action**: Add CSRF protection

```typescript
// ADD THIS IMPORT AT TOP
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  try {
    // ADD THIS LINE FIRST - CSRF Protection
    const csrfCheck = await checkCSRF(request);
    if (csrfCheck) return csrfCheck;

    // ... rest of existing code ...
```

**Files to Update**:
- [ ] `src/app/api/auth/register/route.ts`
- [ ] `src/app/api/auth/forgot-password/route.ts`
- [ ] `src/app/api/auth/reset-password/route.ts`

---

#### Step 2.4: Add CSRF to Settings Routes

**Files to Update**:
- [ ] `src/app/api/settings/password/route.ts`
- [ ] `src/app/api/settings/account/route.ts`
- [ ] `src/app/api/settings/addresses/route.ts`
- [ ] `src/app/api/settings/addresses/[id]/route.ts`
- [ ] `src/app/api/settings/addresses/[id]/default/route.ts`
- [ ] `src/app/api/settings/preferences/route.ts`

**Pattern to Apply**:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... rest of code
}

export async function PUT(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... rest of code
}

export async function DELETE(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... rest of code
}
```

---

#### Step 2.5: Add CSRF to Admin Routes

**Find all admin routes**:
```bash
find src/app/api/admin -name "route.ts" | xargs grep -l "POST\|PUT\|DELETE"
```

**Apply CSRF to each**:
- [ ] Add import: `import { checkCSRF } from '@/lib/middleware/with-csrf';`
- [ ] Add check at start of POST/PUT/DELETE handlers
- [ ] Test each route still works

---

#### Step 2.6: Add CSRF to SuperAdmin Routes

**Find all superadmin routes**:
```bash
find src/app/api/superadmin -name "route.ts" | xargs grep -l "POST\|PUT\|DELETE"
```

**Apply CSRF to each**:
- [ ] Add import
- [ ] Add check
- [ ] Test

---

#### Step 2.7: Frontend CSRF Token Handling

**File**: `src/lib/api/fetch-with-csrf.ts` (NEW FILE)
**Purpose**: Fetch wrapper that includes CSRF token

```typescript
/**
 * Fetch with CSRF Token
 * Wrapper for API calls that need CSRF protection
 */

import { CSRFProtection } from '@/lib/security/csrf-protection';

export interface FetchWithCSRFOptions extends RequestInit {
  // Extend RequestInit with any custom options
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * Use this for all POST/PUT/DELETE/PATCH requests
 */
export async function fetchWithCSRF(
  url: string,
  options: FetchWithCSRFOptions = {}
): Promise<Response> {
  // Get CSRF token
  // In practice, you'd get this from cookie or generate on client
  // For now, let's generate fresh token
  const token = CSRFProtection.generateToken();

  // Merge headers
  const headers = new Headers(options.headers || {});
  headers.set('x-csrf-token', token);
  headers.set('Content-Type', 'application/json');

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle CSRF failure
  if (response.status === 403) {
    const data = await response.json();
    if (data.newToken) {
      // Retry with new token
      headers.set('x-csrf-token', data.newToken);
      return fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}
```

**Note**: CSRF token handling on frontend needs session integration. For now, CSRF class handles token generation. In production, implement proper session-based tokens.

---

#### Step 2.8: Test CSRF Protection

**Manual Testing Checklist**:

- [ ] **Valid CSRF Token**:
  - [ ] Submit form with valid token
  - [ ] Request succeeds

- [ ] **Missing CSRF Token**:
  - [ ] Remove token from request
  - [ ] Get 403 Forbidden

- [ ] **Invalid CSRF Token**:
  - [ ] Use fake/random token
  - [ ] Get 403 Forbidden

- [ ] **Expired CSRF Token**:
  - [ ] Use token older than 1 hour
  - [ ] Get 403 with new token

- [ ] **GET Requests**:
  - [ ] No CSRF required
  - [ ] Requests succeed

**Routes to Test**:
- [ ] `/api/auth/register`
- [ ] `/api/auth/forgot-password`
- [ ] `/api/auth/reset-password`
- [ ] `/api/settings/password`
- [ ] `/api/admin/*` (sample routes)
- [ ] `/api/superadmin/*` (sample routes)

---

### Task 3: Admin Password Change

**Priority**: 🔴 CRITICAL
**Time Estimate**: 2 hours
**Files to Modify**: 1 API route, 1 UI navigation

---

#### Step 3.1: Fix Password Change API

**File**: `src/app/api/settings/password/route.ts`
**Action**: Remove role restriction

**Find this code** (around line 26):
```typescript
// Only customers can change their own password
if (session.user.role !== 'CUSTOMER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Replace with**:
```typescript
// All authenticated users can change their own password
// (CUSTOMER, ADMIN, STAFF, SUPERADMIN)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Validation Checklist**:
- [ ] Code changed correctly
- [ ] Role check removed
- [ ] Authentication check remains
- [ ] No syntax errors

---

#### Step 3.2: Add Admin Settings Navigation

**File**: `src/app/admin/settings/page.tsx` (or settings navigation component)
**Action**: Add "Change Password" link

**Add to settings menu**:
```typescript
{
  title: 'Account Security',
  items: [
    {
      name: 'Change Password',
      href: '/settings/account#password',
      icon: Lock,
      description: 'Update your account password',
    },
  ],
}
```

**Or create dedicated admin password page**:
```typescript
// src/app/admin/settings/password/page.tsx
// Duplicate from /settings/account/page.tsx password section
// Style to match admin theme
```

---

#### Step 3.3: Test Admin Password Change

**Manual Testing Checklist**:

- [ ] **Sign in as ADMIN**:
  - [ ] Navigate to settings
  - [ ] Find "Change Password" option
  - [ ] Click to go to password form

- [ ] **Change Password**:
  - [ ] Enter current password
  - [ ] Enter new password
  - [ ] Confirm new password
  - [ ] Submit form
  - [ ] See success message

- [ ] **Sign Out and Sign In**:
  - [ ] Sign out
  - [ ] Try old password → Fails
  - [ ] Try new password → Success

- [ ] **Repeat for STAFF**:
  - [ ] Test with STAFF role

- [ ] **Repeat for SUPERADMIN**:
  - [ ] Test with SUPERADMIN role

**Database Verification**:
```sql
-- Verify password was changed
SELECT
  email,
  role,
  "updatedAt"
FROM users
WHERE role IN ('ADMIN', 'STAFF', 'SUPERADMIN')
ORDER BY "updatedAt" DESC;

-- Check audit logs
SELECT * FROM audit_logs
WHERE action = 'PASSWORD'
  AND details->>'action' = 'password_change_completed'
ORDER BY "createdAt" DESC;
```

---

## Phase 2: Important Improvements (Week 2-3)

### Task 4: Failed Login Tracking

**Priority**: 🟡 IMPORTANT
**Time Estimate**: 3 hours

---

#### Step 4.1: Database Schema Update

**File**: `prisma/schema.prisma`
**Action**: Add failed login tracking fields

```prisma
model User {
  // ... existing fields ...

  // Failed Login Tracking (add these)
  failedLoginAttempts Int       @default(0)
  lastFailedLoginAt   DateTime?
  accountLockedUntil  DateTime?

  // ... rest of model ...
}
```

**Run Migration**:
```bash
npx prisma migrate dev --name add_failed_login_tracking
npx prisma generate
```

---

#### Step 4.2: Implement Login Tracking

**File**: `src/lib/auth/config.ts`
**Action**: Add failed login tracking to authorize function

**Find the authorize function** (around line 25), update to include:

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

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
    return null;
  }

  // ADD THIS: Check if account is locked
  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const minutesLeft = Math.ceil(
      (user.accountLockedUntil.getTime() - new Date().getTime()) / (1000 * 60)
    );
    throw new Error(
      `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
    );
  }

  // Check if user account is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new Error('Account is not active. Please contact support.');
  }

  const isPasswordValid = await bcrypt.compare(
    credentials.password,
    user.password
  );

  if (!isPasswordValid) {
    // ADD THIS: Track failed login attempt
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLockAccount = newFailedAttempts >= 5;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLoginAt: new Date(),
        // Lock account for 15 minutes after 5 failed attempts
        accountLockedUntil: shouldLockAccount
          ? new Date(Date.now() + 15 * 60 * 1000)
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
        },
      },
    });

    if (shouldLockAccount) {
      throw new Error(
        'Account locked due to multiple failed login attempts. Please try again in 15 minutes.'
      );
    }

    return null;
  }

  // ADD THIS: Successful login - reset failed attempts
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

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

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

#### Step 4.3: Update Signin Page Error Handling

**File**: `src/app/auth/signin/page.tsx`
**Action**: Display account locked message

**Find the error handling** (around line 46):
```typescript
if (result?.error) {
  setError('Invalid email or password');
  setIsLoading(false);
}
```

**Update to**:
```typescript
if (result?.error) {
  // Check for account locked error
  if (result.error.includes('Account locked')) {
    setError(result.error);
  } else {
    setError('Invalid email or password');
  }
  setIsLoading(false);
}
```

---

#### Step 4.4: Test Failed Login Tracking

**Manual Testing Checklist**:

- [ ] **Failed Login Attempts**:
  - [ ] Try wrong password 1st time → Error shown
  - [ ] Try wrong password 2nd time → Error shown
  - [ ] Try wrong password 3rd time → Error shown
  - [ ] Try wrong password 4th time → Error shown
  - [ ] Try wrong password 5th time → Account locked message

- [ ] **Account Locked**:
  - [ ] Try to login with correct password → Still locked
  - [ ] Wait 15 minutes (or manually clear lock in DB)
  - [ ] Try correct password → Success

- [ ] **Successful Login Resets Counter**:
  - [ ] Fail 3 times
  - [ ] Login successfully
  - [ ] Fail again → Counter starts from 0

**Database Verification**:
```sql
-- Check failed login tracking
SELECT
  email,
  "failedLoginAttempts",
  "lastFailedLoginAt",
  "accountLockedUntil"
FROM users
WHERE email = 'test@example.com';

-- Check audit logs
SELECT * FROM audit_logs
WHERE action = 'LOGIN'
  AND details->>'success' = 'false'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

### Task 5: Admin Login Notifications

**Priority**: 🟡 IMPORTANT
**Time Estimate**: 1-2 hours

---

#### Step 5.1: Create Email Template

**File**: `src/lib/email/templates/admin-login-notification.tsx` (NEW FILE)

```typescript
/**
 * Admin Login Notification Email
 * Sent when admin/staff/superadmin logs in
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
        <h2 style={{ color: '#1a1a1a', marginTop: 0 }}>
          🔐 Admin Login Detected
        </h2>

        <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
          An admin user has logged into the JRM E-commerce admin panel.
        </p>

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
              <td style={{ padding: '8px 0', color: '#1a1a1a', fontFamily: 'monospace' }}>
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
                style={{ padding: '8px 0', color: '#6b7280', verticalAlign: 'top' }}
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
          </table>
        </div>

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
            }}
          >
            <strong>⚠️ Was this you?</strong>
            <br />
            If you did not perform this login, please contact the system
            administrator immediately and change your password.
          </p>
        </div>

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

// Plain text version
export const generateAdminLoginNotificationText = (
  props: AdminLoginNotificationProps
): string => {
  return `
Admin Login Detected

An admin user has logged into the JRM E-commerce admin panel.

User: ${props.userName}
Email: ${props.userEmail}
Role: ${props.userRole}
Time: ${props.loginTime}
IP Address: ${props.ipAddress}
${props.location ? `Location: ${props.location}\n` : ''}
Device: ${props.userAgent}

⚠️ Was this you?
If you did not perform this login, please contact the system administrator immediately and change your password.

---
JRM E-commerce Admin Panel
Security Monitoring System
  `.trim();
};
```

---

#### Step 5.2: Add Notification to Auth Config

**File**: `src/lib/auth/config.ts`
**Action**: Send email after successful admin login

**Add at the top**:
```typescript
import { Resend } from 'resend';
import { render } from '@react-email/render';
import {
  AdminLoginNotification,
  generateAdminLoginNotificationText
} from '@/lib/email/templates/admin-login-notification';

const resend = new Resend(process.env.RESEND_API_KEY);
```

**In the jwt callback** (after successful login verification), add:

```typescript
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
      try {
        const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL ||
                                  process.env.FROM_EMAIL;

        if (notificationEmail && process.env.RESEND_API_KEY) {
          const loginTime = new Date().toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            dateStyle: 'full',
            timeStyle: 'long',
          });

          const emailHtml = render(
            AdminLoginNotification({
              userName: user.name || user.email,
              userEmail: user.email,
              userRole: user.role,
              loginTime,
              ipAddress: 'IP tracking in request context',
              userAgent: 'User agent in request context',
            })
          );

          const emailText = generateAdminLoginNotificationText({
            userName: user.name || user.email,
            userEmail: user.email,
            userRole: user.role,
            loginTime,
            ipAddress: 'IP tracking in request context',
            userAgent: 'User agent in request context',
          });

          await resend.emails.send({
            from: process.env.FROM_EMAIL || 'security@jrm.com',
            to: notificationEmail,
            subject: `🔐 Admin Login: ${user.role} - ${user.email}`,
            html: emailHtml,
            text: emailText,
          });

          console.log('✅ Admin login notification sent:', user.email);
        }
      } catch (error) {
        console.error('Failed to send admin login notification:', error);
        // Don't fail login if email fails
      }
    }
  }

  // ... rest of jwt callback
}
```

---

#### Step 5.3: Add Environment Variable

**File**: `.env`
**Action**: Add admin notification email

```bash
# Admin Security Notifications
ADMIN_NOTIFICATION_EMAIL="owner@yourbusiness.com"
```

---

#### Step 5.4: Test Admin Login Notifications

**Manual Testing Checklist**:

- [ ] **Admin Login**:
  - [ ] Sign in as ADMIN
  - [ ] Check email inbox
  - [ ] Verify notification received
  - [ ] Check email content (role, time, IP)

- [ ] **Staff Login**:
  - [ ] Sign in as STAFF
  - [ ] Verify notification received

- [ ] **SuperAdmin Login**:
  - [ ] Sign in as SUPERADMIN
  - [ ] Verify notification received

- [ ] **Customer Login**:
  - [ ] Sign in as CUSTOMER
  - [ ] Verify NO notification sent

- [ ] **Email Not Configured**:
  - [ ] Disable RESEND_API_KEY temporarily
  - [ ] Sign in as admin
  - [ ] Login succeeds (doesn't fail)
  - [ ] Error logged in console

**Log Verification**:
```bash
# Check logs for notification sends
grep "Admin login notification" logs/application.log

# Check for any email errors
grep "Failed to send admin login notification" logs/application.log
```

---

## Testing Guide

### Comprehensive Testing Checklist

#### Phase 1: Critical Features

**Forgot Password Flow**:
- [ ] Request reset link
- [ ] Receive email
- [ ] Click link and verify token
- [ ] Reset password successfully
- [ ] Sign in with new password
- [ ] Test expired token
- [ ] Test reused token
- [ ] Test invalid email
- [ ] Test rate limiting

**CSRF Protection**:
- [ ] Valid token passes
- [ ] Missing token fails
- [ ] Invalid token fails
- [ ] Expired token gets new one
- [ ] GET requests bypass CSRF
- [ ] All mutation routes protected

**Admin Password Change**:
- [ ] Admin can change password
- [ ] Staff can change password
- [ ] SuperAdmin can change password
- [ ] Sign in with new password works

#### Phase 2: Important Features

**Failed Login Tracking**:
- [ ] Counter increments on failure
- [ ] Account locks after 5 failures
- [ ] Lock message shows time remaining
- [ ] Successful login resets counter
- [ ] Lock expires after 15 minutes

**Admin Login Notifications**:
- [ ] Admin login sends email
- [ ] Staff login sends email
- [ ] SuperAdmin login sends email
- [ ] Customer login doesn't send email
- [ ] Email contains correct info

### Integration Testing

**End-to-End Scenarios**:

1. **New User Journey**:
   - [ ] Sign up
   - [ ] Forget password
   - [ ] Reset password
   - [ ] Sign in successfully

2. **Admin Security Journey**:
   - [ ] Admin signs in
   - [ ] Notification received
   - [ ] Change password
   - [ ] Sign out
   - [ ] Sign in with new password
   - [ ] Notification received again

3. **Attack Scenarios**:
   - [ ] Brute force blocked after 5 attempts
   - [ ] CSRF attack blocked
   - [ ] Expired token rejected
   - [ ] Rate limiting works

### Performance Testing

**Load Testing**:
- [ ] 100 concurrent password resets
- [ ] 100 concurrent logins
- [ ] Email queue doesn't block requests
- [ ] Database handles load
- [ ] Rate limiting scales

### Security Audit

**Security Checklist**:
- [ ] No passwords in logs
- [ ] No tokens in logs
- [ ] HTTPS enforced in production
- [ ] Email links use HTTPS
- [ ] Rate limiting effective
- [ ] CSRF on all mutations
- [ ] Audit logs complete
- [ ] Token expiry works
- [ ] Account locking works
- [ ] No timing attacks possible

---

## Deployment Checklist

### Pre-Deployment

**Code Quality**:
- [ ] All TypeScript errors resolved
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] No console.errors in production code
- [ ] All TODOs addressed or documented

**Database**:
- [ ] Backup database
- [ ] Run migrations on staging
- [ ] Verify schema changes
- [ ] Test rollback procedure
- [ ] No data loss in migration

**Environment Variables**:
- [ ] `NEXTAUTH_SECRET` set (32+ chars)
- [ ] `NEXTAUTH_URL` set correctly
- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] `RESEND_API_KEY` configured
- [ ] `FROM_EMAIL` verified in Resend
- [ ] `ADMIN_NOTIFICATION_EMAIL` set
- [ ] All URLs use HTTPS in production

**Testing**:
- [ ] All manual tests passed
- [ ] Integration tests passed
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Mobile responsive

### Deployment Steps

1. **Staging Deployment**:
   ```bash
   # Merge to staging branch
   git checkout staging
   git merge feature/auth-security
   git push origin staging

   # Deploy to staging environment
   # (Railway/Vercel automatic deploy)

   # Run migrations
   npx prisma migrate deploy
   ```

2. **Staging Verification**:
   - [ ] All features work on staging
   - [ ] Emails send correctly
   - [ ] CSRF protection works
   - [ ] No errors in logs
   - [ ] Performance acceptable

3. **Production Deployment**:
   ```bash
   # Merge to main
   git checkout main
   git merge staging
   git push origin main

   # Deploy to production
   # (Railway/Vercel automatic deploy)

   # Run migrations
   npx prisma migrate deploy
   ```

4. **Production Verification**:
   - [ ] Smoke test all features
   - [ ] Monitor error logs
   - [ ] Check email delivery
   - [ ] Verify CSRF works
   - [ ] Test admin notifications
   - [ ] Monitor performance

### Post-Deployment

**Monitoring** (First 24 hours):
- [ ] Watch error rates
- [ ] Monitor email delivery
- [ ] Check login success rates
- [ ] Review audit logs
- [ ] Monitor database performance
- [ ] Check rate limiting effectiveness

**Documentation**:
- [ ] Update user documentation
- [ ] Update admin guide
- [ ] Document new features
- [ ] Update API documentation
- [ ] Update security policies

**Communication**:
- [ ] Notify team of deployment
- [ ] Inform users of new features
- [ ] Send admin training materials
- [ ] Update support docs

---

## Rollback Procedure

### If Issues Found in Production

1. **Immediate Rollback**:
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main

   # Or rollback deployment in Railway/Vercel
   ```

2. **Database Rollback** (if needed):
   ```bash
   # Rollback last migration
   npx prisma migrate resolve --rolled-back [migration_name]
   ```

3. **Verify Rollback**:
   - [ ] Application works
   - [ ] Users can login
   - [ ] No errors in logs

4. **Post-Rollback**:
   - [ ] Document issue
   - [ ] Fix in development
   - [ ] Test thoroughly
   - [ ] Redeploy when ready

---

## Maintenance Tasks

### Regular Maintenance

**Daily**:
- [ ] Monitor error logs
- [ ] Check email delivery
- [ ] Review failed login attempts
- [ ] Monitor rate limiting

**Weekly**:
- [ ] Clean up expired reset tokens
- [ ] Review audit logs
- [ ] Check for locked accounts
- [ ] Monitor performance metrics

**Monthly**:
- [ ] Security audit
- [ ] Performance review
- [ ] Update dependencies
- [ ] Review and update documentation

### Cleanup Scripts

**File**: `scripts/cleanup-expired-tokens.ts` (NEW FILE)

```typescript
/**
 * Cleanup Expired Password Reset Tokens
 * Run daily via cron or scheduled job
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredTokens() {
  try {
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
    return result.count;
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
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupExpiredTokens };
```

**Setup Cron** (Railway or system cron):
```bash
# Run daily at 2 AM
0 2 * * * cd /app && node scripts/cleanup-expired-tokens.ts
```

---

## Troubleshooting Guide

### Common Issues

#### Issue: Emails Not Sending

**Symptoms**: Reset emails not received

**Solutions**:
1. Check Resend API key is valid
2. Verify FROM_EMAIL is verified in Resend
3. Check email logs: `grep "Email sending error" logs/`
4. Test email service directly
5. Check spam folder
6. Verify RESEND_API_KEY in environment

**Test**:
```bash
# Test Resend directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "text": "Test email"
  }'
```

---

#### Issue: CSRF Token Failures

**Symptoms**: 403 errors on form submissions

**Solutions**:
1. Clear browser cookies
2. Verify CSRF middleware applied
3. Check token generation
4. Review CORS settings
5. Verify NEXTAUTH_SECRET set

**Debug**:
```typescript
// Add logging in CSRF middleware
console.log('CSRF Token:', token);
console.log('CSRF Validation:', validation);
```

---

#### Issue: Account Locked Incorrectly

**Symptoms**: Valid user cannot login

**Solutions**:
1. Check database lock status:
   ```sql
   SELECT
     email,
     "failedLoginAttempts",
     "accountLockedUntil"
   FROM users
   WHERE email = 'user@example.com';
   ```

2. Manually unlock:
   ```sql
   UPDATE users
   SET
     "failedLoginAttempts" = 0,
     "accountLockedUntil" = NULL
   WHERE email = 'user@example.com';
   ```

3. Check if clock skew (server vs client time)

---

#### Issue: Token Expired Too Quickly

**Symptoms**: Reset links expire before use

**Solutions**:
1. Check PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS
2. Increase if needed (but max 24 hours)
3. Verify server timezone
4. Check database timezone

---

#### Issue: Database Migration Fails

**Symptoms**: Error running migrations

**Solutions**:
1. Backup database first
2. Check existing schema conflicts
3. Resolve manually:
   ```bash
   npx prisma migrate resolve --applied [migration_name]
   ```
4. Reset if development:
   ```bash
   npx prisma migrate reset
   ```

---

## Success Criteria

### Definition of Done

Phase 1 complete when:
- [ ] Users can reset forgotten passwords
- [ ] CSRF protection enforced on all mutations
- [ ] Admins can change their own passwords
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Deployed to production
- [ ] Documentation updated

Phase 2 complete when:
- [ ] Failed login tracking works
- [ ] Account locking prevents brute force
- [ ] Admin login notifications sent
- [ ] All tests pass
- [ ] Monitoring in place
- [ ] Documentation complete

### Quality Metrics

**Security**:
- 0 CSRF vulnerabilities
- 100% password reset tokens expire
- 100% failed logins tracked
- 100% admin logins notified

**Performance**:
- Password reset < 2 seconds
- Email delivery < 5 seconds
- Login with tracking < 500ms
- No performance degradation

**Reliability**:
- 99.9% uptime
- 0 data loss incidents
- 100% email delivery rate
- <0.1% false positive lockouts

---

## Developer Reminders

### Coding Standards (CRITICAL)

**Always Follow**:
1. **No Hardcoding**: Use constants, environment variables
2. **Single Source of Truth**: One authoritative source for each data
3. **DRY**: Don't repeat yourself - extract common logic
4. **Type Safety**: No `any` types - use explicit TypeScript
5. **Error Handling**: All async operations have try-catch
6. **Validation**: All inputs validated with Zod
7. **Security**: Prisma only, sanitize inputs, hash passwords
8. **Audit Logging**: Log security-critical operations

**Before Committing**:
- [ ] Code follows CLAUDE.md standards
- [ ] No console.log in production code
- [ ] No hardcoded values
- [ ] All TODOs addressed
- [ ] Types are explicit
- [ ] Error handling complete
- [ ] Tests written and passing
- [ ] Documentation updated

**Git Commit Messages**:
```bash
# Good
feat: implement forgot password flow with email notifications
fix: enforce CSRF protection on all mutation endpoints
refactor: extract password validation to centralized schema

# Bad
update files
fix bug
changes
```

---

## Support & Resources

### Documentation References

- **NextAuth.js**: https://next-auth.js.org/
- **Prisma**: https://www.prisma.io/docs
- **Zod Validation**: https://zod.dev/
- **Resend Email**: https://resend.com/docs
- **React Email**: https://react.email/docs

### Internal Resources

- `CLAUDE.md` - Coding standards
- `CODING_STANDARDS.md` - Detailed standards
- `prisma/schema.prisma` - Database schema
- `src/lib/auth/` - Authentication utilities

### Getting Help

**If Stuck**:
1. Review this implementation plan
2. Check CLAUDE.md coding standards
3. Review similar existing code
4. Test in isolation
5. Ask for code review

**Reporting Issues**:
1. Describe what you were doing
2. Include error messages
3. Include relevant code
4. Include steps to reproduce
5. Include environment (dev/staging/prod)

---

## Conclusion

This implementation plan provides step-by-step instructions for implementing critical authentication security improvements for the JRM E-commerce platform.

**Remember**:
- Follow the plan in order
- Test each feature before moving on
- Follow CLAUDE.md coding standards
- Ask for help if stuck
- Document as you go

**Expected Timeline**:
- Week 1: Phase 1 (Critical fixes) - 8-10 hours
- Week 2-3: Phase 2 (Important improvements) - 4-6 hours
- Total: 12-16 hours of focused development

**Success Looks Like**:
- Users can recover forgotten passwords
- All API routes protected from CSRF
- Admins can manage their own passwords
- Brute force attacks prevented
- Admin access monitored and logged
- Professional, secure authentication system

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: After Phase 1 completion

---

Good luck with the implementation! Follow each step carefully and test thoroughly. You've got this! 💪🚀
