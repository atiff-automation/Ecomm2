/**
 * Reusable Change Password Form Component
 * Used in both Admin and Member panels
 *
 * Features:
 * - CSRF protection via fetchWithCSRF
 * - Centralized validation using passwordChangeSchema
 * - Show/hide password toggles
 * - Password requirements display
 * - Success/error states
 * - Customizable success callback
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { passwordChangeSchema } from '@/lib/validation/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

interface ChangePasswordFormProps {
  /** Optional callback when password change succeeds */
  onSuccess?: () => void;
  /** Optional redirect path after successful change (default: no redirect) */
  redirectPath?: string;
  /** Optional redirect delay in milliseconds (default: 2000) */
  redirectDelay?: number;
  /** Show cancel button (default: false) */
  showCancel?: boolean;
  /** Custom cancel handler */
  onCancel?: () => void;
}

export function ChangePasswordForm({
  onSuccess,
  redirectPath,
  redirectDelay = 2000,
  showCancel = false,
  onCancel,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await fetchWithCSRF('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setIsSuccess(true);
      reset();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect if path provided
      if (redirectPath) {
        setTimeout(() => {
          router.push(redirectPath);
        }, redirectDelay);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-900 font-medium">Password Changed Successfully!</p>
          <p className="text-sm text-green-700 mt-1">
            Your password has been updated securely.
          </p>
          {redirectPath && (
            <p className="text-sm text-green-600 mt-2">Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  // Password change form
  return (
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
            type={showCurrentPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('currentPassword')}
            className="pl-10 pr-10"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
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
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('newPassword')}
            className="pl-10 pr-10"
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
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
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="pl-10 pr-10"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
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
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
