# Task 3: Admin Password Change

**Priority**: 🔴 CRITICAL
**Time Estimate**: 2 hours
**Files to Modify**: 1 API route, 1 UI component/page

---

## Overview

### Current Issue
Admin, Staff, and SuperAdmin users cannot change their own passwords. The password change API route is currently restricted to CUSTOMER role only. This creates a security and operational issue:

- **Security Risk**: Admins cannot rotate passwords after potential compromise
- **Operational Problem**: Admins must depend on SuperAdmin to change passwords
- **Best Practice Violation**: All users should be able to manage their own credentials

### What This Task Delivers
- ✅ Self-service password change for all user roles
- ✅ Admin UI integration for password management
- ✅ Secure password change flow with validation
- ✅ Audit logging for all password changes
- ✅ Testing procedures for all roles

---

## Prerequisites

**Before Starting**:
- [ ] Read CLAUDE.md coding standards
- [ ] Understand password hashing with bcrypt
- [ ] Review NextAuth.js session management
- [ ] Database backup completed
- [ ] Development environment running

**Required Knowledge**:
- Next.js 14 API routes
- NextAuth.js authentication and sessions
- Password security best practices
- bcrypt password hashing
- TypeScript and Zod validation
- React Hook Form

---

## Implementation Steps

### Step 3.1: Fix Password Change API

**File**: `src/app/api/settings/password/route.ts`
**Action**: Remove role restriction, allow all authenticated users

---

#### Current Code (Problematic)

**Location**: Around line 26 in the file

```typescript
// ❌ WRONG: Only customers can change their own password
if (session.user.role !== 'CUSTOMER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Problem**: This check prevents ADMIN, STAFF, and SUPERADMIN from changing passwords.

---

#### Updated Code (Correct)

**Replace the above code with**:

```typescript
// ✅ CORRECT: All authenticated users can change their own password
// (CUSTOMER, ADMIN, STAFF, SUPERADMIN)
if (!session?.user?.id) {
  return NextResponse.json(
    { error: 'Unauthorized - User ID required' },
    { status: 401 }
  );
}
```

**Why This Is Better**:
- **Security Maintained**: Still requires authentication (session check)
- **Inclusivity**: Works for all user roles
- **Self-Service**: Users manage their own credentials
- **Principle of Least Privilege**: Users can only change their own password (verified by session.user.id)

---

#### Complete API Route Review

**After making the change, verify the full route**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[@$!%*?&#]/, 'Password must contain special character'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);

    // ✅ NEW: All authenticated users can change password
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      // Audit log for failed attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD',
          resource: 'USER',
          resourceId: user.id,
          details: {
            action: 'password_change_failed',
            reason: 'incorrect_current_password',
            role: user.role,
          },
        },
      });

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 6. Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // 7. Audit log for successful change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD',
        resource: 'USER',
        resourceId: user.id,
        details: {
          action: 'password_change_completed',
          role: user.role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
```

**Validation Checklist**:
- [ ] Role check removed (line ~26)
- [ ] Authentication check preserved (`session?.user?.id`)
- [ ] Password validation with Zod schema
- [ ] Current password verification with bcrypt
- [ ] New password hashing with bcrypt (salt rounds: 12)
- [ ] Audit logging for both success and failure
- [ ] Error handling with try-catch
- [ ] TypeScript types explicit (no `any`)
- [ ] No hardcoded values

---

### Step 3.2: Add Admin Settings Navigation

**Purpose**: Make password change accessible from admin interface

**Two Approaches**:

---

#### Approach A: Add Link to Existing Settings Page

**File**: `src/app/admin/settings/page.tsx` (or admin navigation component)

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

**Pros**: Quick implementation, reuses existing password change form
**Cons**: Takes admin out of admin interface temporarily

---

#### Approach B: Create Dedicated Admin Password Page

**File**: `src/app/admin/settings/password/page.tsx` (NEW FILE)

**Implementation**:
```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Lock, CheckCircle } from 'lucide-react';

// Password validation schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[@$!%*?&#]/, 'Must contain special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export default function AdminPasswordChangePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeInput) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setIsSuccess(true);
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/settings');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Password Changed!</CardTitle>
            <CardDescription className="text-center">
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Redirecting to settings...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password change form
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your admin account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...register('currentPassword')}
                  className="pl-10"
                  placeholder="Enter current password"
                />
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('newPassword')}
                  className="pl-10"
                  placeholder="Enter new password"
                />
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
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

            {/* Password Requirements */}
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Pros**: Keeps admin in admin interface, consistent admin UX
**Cons**: Requires creating new page (but provides better UX)

---

**Recommendation**: Use **Approach B** (dedicated admin page) for better user experience and consistency.

**Validation Checklist**:
- [ ] Page created at `src/app/admin/settings/password/page.tsx`
- [ ] React Hook Form integrated
- [ ] Zod validation configured
- [ ] Loading states implemented
- [ ] Success state with redirect
- [ ] Error handling implemented
- [ ] Password requirements displayed
- [ ] UI matches admin theme
- [ ] Responsive design

---

### Step 3.3: Test Admin Password Change

**Comprehensive Testing Procedures**:

---

#### Test 1: Admin Role Password Change

**Steps**:
1. [ ] Sign in as user with ADMIN role
2. [ ] Navigate to password change page:
   - `/admin/settings/password` (if using Approach B)
   - OR `/settings/account#password` (if using Approach A)
3. [ ] Fill in current password
4. [ ] Enter new password (meeting requirements)
5. [ ] Confirm new password
6. [ ] Submit form
7. [ ] Verify success message appears
8. [ ] Sign out
9. [ ] Try to sign in with old password → Should fail
10. [ ] Sign in with new password → Should succeed

**Expected Result**: Admin can change password successfully

---

#### Test 2: Staff Role Password Change

**Steps**:
1. [ ] Sign in as user with STAFF role
2. [ ] Navigate to password change page
3. [ ] Change password following same steps as Test 1
4. [ ] Verify success
5. [ ] Test login with new password

**Expected Result**: Staff can change password successfully

---

#### Test 3: SuperAdmin Role Password Change

**Steps**:
1. [ ] Sign in as user with SUPERADMIN role
2. [ ] Navigate to password change page
3. [ ] Change password
4. [ ] Verify success
5. [ ] Test login with new password

**Expected Result**: SuperAdmin can change password successfully

---

#### Test 4: Validation Errors

**Test Password Requirements**:

1. [ ] **Too short password** (< 8 characters):
   - Enter: `Test1!`
   - Expected: "Password must be at least 8 characters"

2. [ ] **Missing uppercase**:
   - Enter: `test1234!`
   - Expected: "Must contain uppercase letter"

3. [ ] **Missing lowercase**:
   - Enter: `TEST1234!`
   - Expected: "Must contain lowercase letter"

4. [ ] **Missing number**:
   - Enter: `TestTest!`
   - Expected: "Must contain number"

5. [ ] **Missing special character**:
   - Enter: `TestTest123`
   - Expected: "Must contain special character"

6. [ ] **Passwords don't match**:
   - New password: `TestTest123!`
   - Confirm: `TestTest123@`
   - Expected: "Passwords do not match"

---

#### Test 5: Wrong Current Password

**Steps**:
1. [ ] Navigate to password change page
2. [ ] Enter wrong current password
3. [ ] Enter valid new password
4. [ ] Submit form
5. [ ] Verify error: "Current password is incorrect"
6. [ ] Check audit logs for failed attempt

**Expected Result**: Error message, password not changed

---

#### Test 6: Customer Role (Control Test)

**Purpose**: Verify customers can still change password

**Steps**:
1. [ ] Sign in as CUSTOMER
2. [ ] Navigate to `/settings/account`
3. [ ] Change password
4. [ ] Verify success

**Expected Result**: Customer password change still works

---

### Database Verification

**Check password was changed**:
```sql
-- Verify password update timestamp
SELECT
  id,
  email,
  role,
  "updatedAt",
  "lastLoginAt"
FROM users
WHERE email = 'admin@example.com'
ORDER BY "updatedAt" DESC;

-- Check audit logs for password change
SELECT
  id,
  "userId",
  action,
  resource,
  details,
  "createdAt"
FROM audit_logs
WHERE action = 'PASSWORD'
  AND details->>'action' = 'password_change_completed'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check for failed attempts
SELECT
  id,
  "userId",
  action,
  details,
  "createdAt"
FROM audit_logs
WHERE action = 'PASSWORD'
  AND details->>'action' = 'password_change_failed'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: "Forbidden" error for admin

**Cause**: Role check not removed from API route

**Solution**:
1. Verify changes in `src/app/api/settings/password/route.ts`
2. Ensure role check is replaced with authentication check
3. Clear Next.js cache: `rm -rf .next && npm run dev`
4. Test again

---

### Issue: Password change doesn't persist

**Cause**: Database update not committing or session issue

**Solution**:
1. Check database connection
2. Verify Prisma client is working
3. Check for transaction rollbacks
4. Verify bcrypt hash is being stored

---

### Issue: Can't find password change page

**Cause**: Navigation not updated or page not created

**Solution**:
1. Verify page file exists at correct path
2. Check admin navigation includes link
3. Verify route is not protected by middleware
4. Clear browser cache

---

## Success Criteria

### Task Complete When:
- [ ] API route role restriction removed
- [ ] Authentication check preserved
- [ ] Admin UI navigation added
- [ ] All role tests passed (ADMIN, STAFF, SUPERADMIN)
- [ ] Validation tests passed
- [ ] Customer password change still works (regression test)
- [ ] Audit logging verified in database
- [ ] No security vulnerabilities introduced

### Quality Metrics:
- **Functionality**: 100% of user roles can change password
- **Security**: Current password verified, new password validated
- **Audit**: 100% of password changes logged
- **UX**: <2 second password change completion time

---

## Next Steps

After completing this task:
1. ✅ All users can self-manage passwords
2. ➡️ Proceed to Phase 2: [06-TASK4-FAILED-LOGIN-TRACKING.md](./06-TASK4-FAILED-LOGIN-TRACKING.md)
3. Phase 1 Critical Fixes Complete!

**Related Tasks**:
- **Previous**: [04-TASK2-CSRF-PROTECTION.md](./04-TASK2-CSRF-PROTECTION.md)
- **Next**: [06-TASK4-FAILED-LOGIN-TRACKING.md](./06-TASK4-FAILED-LOGIN-TRACKING.md)
- **Testing**: [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)

---

**Task Version**: 1.0
**Last Updated**: January 2025
**Estimated Time**: 2 hours
**Difficulty**: Easy
**Prerequisites**: Understanding of API routes and bcrypt
